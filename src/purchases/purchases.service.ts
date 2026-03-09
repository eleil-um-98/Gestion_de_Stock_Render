import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { toLocalDate, getStartOfDayLima, getEndOfDayLima } from '../utils/date.util';

@Injectable()
export class PurchasesService {
    constructor(private readonly prisma: PrismaService) { }

    async createPurchase(dto: CreatePurchaseDto, userId: number) {
        return this.prisma.$transaction(async (tx) => {
            const supplier = await tx.supplier.findUnique({
                where: { id: dto.supplierId },
            });
            if (!supplier) {
                throw new NotFoundException(
                    `Supplier with ID ${dto.supplierId} not found`,
                );
            }

            let total = 0;
            const purchaseDetailsInput: any[] = [];

            for (const item of dto.details) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new NotFoundException(
                        `Product with ID ${item.productId} not found`,
                    );
                }

                const subtotal = item.unitCost * item.quantity;
                total += subtotal;

                purchaseDetailsInput.push({
                    productId: product.id,
                    quantity: item.quantity,
                    unitCost: item.unitCost,
                    subtotal: subtotal,
                });

                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: {
                            increment: item.quantity,
                        },
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        type: 'IN',
                        quantity: item.quantity,
                        productId: product.id,
                    },
                });
            }

            const purchase = await tx.purchase.create({
                data: {
                    invoiceNumber: dto.invoiceNumber,
                    supplierId: dto.supplierId,
                    userId,
                    total,
                    details: {
                        create: purchaseDetailsInput,
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

            return {
                id: purchase.id,
                invoiceNumber: purchase.invoiceNumber,
                supplierId: purchase.supplierId,
                userId: purchase.userId,
                total: purchase.total,
                details: purchase.details,
                createdAt: toLocalDate(purchase.createdAt),
            };
        });
    }

    async findAll(startDate?: string, endDate?: string) {
        const where: any = {};

        if (startDate && endDate) {
            where.createdAt = {
                gte: getStartOfDayLima(startDate),
                lte: getEndOfDayLima(endDate),
            };
        } else if (startDate) {
            where.createdAt = {
                gte: getStartOfDayLima(startDate),
                lte: getEndOfDayLima(startDate),
            };
        } else if (endDate) {
            where.createdAt = {
                gte: getStartOfDayLima(endDate),
                lte: getEndOfDayLima(endDate),
            };
        }

        const purchases = await this.prisma.purchase.findMany({
            where,
            include: {
                supplier: true,
                details: {
                    include: {
                        product: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return purchases.map((p) => ({
            id: p.id,
            invoiceNumber: p.invoiceNumber,
            supplierId: p.supplierId,
            supplier: p.supplier,
            total: p.total,
            details: p.details,
            createdAt: toLocalDate(p.createdAt),
        }));
    }

    async findOne(id: number) {
        const p = await this.prisma.purchase.findUnique({
            where: { id },
            include: {
                supplier: true,
                details: {
                    include: {
                        product: {
                            select: { name: true },
                        },
                    },
                },
            },
        });

        if (!p) {
            throw new NotFoundException(`Purchase with ID ${id} not found`);
        }

        return {
            id: p.id,
            invoiceNumber: p.invoiceNumber,
            supplierId: p.supplierId,
            supplier: p.supplier,
            total: p.total,
            details: p.details,
            createdAt: toLocalDate(p.createdAt),
        };
    }
}
