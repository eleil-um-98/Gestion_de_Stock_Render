import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@Injectable()
export class StockService {
    constructor(private prisma: PrismaService) { }

    async createMovement(data: CreateStockMovementDto) {
        return this.prisma.$transaction(async (tx) => {

            if (data.type === 'OUT') {
                const updated = await tx.product.updateMany({
                    where: {
                        id: data.productId,
                        stock: {
                            gte: data.quantity,
                        },
                    },
                    data: {
                        stock: {
                            decrement: data.quantity,
                        },
                    },
                });

                if (updated.count === 0) {
                    throw new Error('No hay suficiente stock');
                }

            } else if (data.type === 'IN') {
                await tx.product.update({
                    where: { id: data.productId },
                    data: {
                        stock: {
                            increment: data.quantity,
                        },
                    },
                });
            } else if (data.type === 'ADJUSTMENT') {
                if (data.quantity < 0) {
                    const absQuantity = Math.abs(data.quantity);
                    const updated = await tx.product.updateMany({
                        where: {
                            id: data.productId,
                            stock: {
                                gte: absQuantity,
                            },
                        },
                        data: {
                            stock: {
                                decrement: absQuantity,
                            },
                        },
                    });

                    if (updated.count === 0) {
                        throw new Error('No hay suficiente stock para realizar el ajuste negativo');
                    }
                } else if (data.quantity > 0) {
                    await tx.product.update({
                        where: { id: data.productId },
                        data: {
                            stock: {
                                increment: data.quantity,
                            },
                        },
                    });
                }
            }

            return tx.stockMovement.create({
                data,
            });
        });
    }

    async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.stockMovement.findMany({
                include: {
                    product: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.stockMovement.count(),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            }
        }
    }

}
