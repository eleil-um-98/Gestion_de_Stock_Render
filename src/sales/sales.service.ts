import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
    constructor(private readonly prisma: PrismaService) { }

    async createSale(dto: CreateSaleDto, userId: number) {
        return this.prisma.$transaction(async (tx) => {
            let total = 0;
            const saleDetailsInput: any[] = [];

            for (const item of dto.details) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new NotFoundException(`Product with ID ${item.productId} not found`);
                }

                if (product.stock < item.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
                    );
                }

                const subtotal = product.price * item.quantity;
                total += subtotal;

                saleDetailsInput.push({
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    subtotal: subtotal,
                });

                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        type: 'OUT',
                        quantity: item.quantity,
                        productId: product.id,
                    },
                });
            }

            const lastSale = await tx.sale.findFirst({
                orderBy: { id: 'desc' },
            });

            const nextId = lastSale ? lastSale.id + 1 : 1;
            const invoiceNumber = `BOL-${nextId.toString().padStart(3, '0')}`;
            const sale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    customerName: dto.customerName,
                    userId,
                    total,
                    details: {
                        create: saleDetailsInput,
                    },
                },
                include: {
                    details: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });

            return sale;
        });
    }

    async findAll() {
        return this.prisma.sale.findMany({
            include: {
                details: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number) {
        const sale = await this.prisma.sale.findUnique({
            where: { id },
            include: {
                details: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!sale) {
            throw new NotFoundException(`Sale with ID ${id} not found`);
        }

        return sale;
    }
}
