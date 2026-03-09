import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetLowStockDto } from './dto/get-low-stock.dto';
import { GetMovementHistoryDto } from './dto/get-movement-history.dto';
import { GetInventoryValuationDto } from './dto/get-inventory-valuation.dto';
import { GetNetProfitDto } from './dto/get-net-profit.dto';
import { getStartOfDayLima, getEndOfDayLima, toLocalDate } from '../utils/date.util';

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        lastPage: number;
    };
}

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getLowStock(query: GetLowStockDto): Promise<PaginatedResult<any>> {
        const { page = 1, limit = 10, threshold = 15 } = query;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where: {
                    stock: {
                        lte: threshold,
                    },
                },
                orderBy: {
                    stock: 'asc',
                },
                skip,
                take: limit,
            }),
            this.prisma.product.count({
                where: {
                    stock: {
                        lte: threshold,
                    },
                },
            }),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async getMovementHistory(query: GetMovementHistoryDto): Promise<PaginatedResult<any>> {
        const { page = 1, limit = 10, productName, type } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (productName) {
            where.product = {
                name: {
                    contains: productName,
                    mode: 'insensitive',
                }
            };
        }
        if (type) {
            where.type = type;
        }

        if (query.startDate && query.endDate) {
            where.createdAt = {
                gte: getStartOfDayLima(query.startDate),
                lte: getEndOfDayLima(query.endDate),
            };
        } else if (query.startDate) {
            where.createdAt = {
                gte: getStartOfDayLima(query.startDate),
                lte: getEndOfDayLima(query.startDate),
            };
        } else if (query.endDate) {
            where.createdAt = {
                gte: getStartOfDayLima(query.endDate),
                lte: getEndOfDayLima(query.endDate),
            };
        }

        const [data, total] = await Promise.all([
            this.prisma.stockMovement.findMany({
                where,
                include: {
                    product: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.stockMovement.count({ where }),
        ]);

        return {
            data: data.map(item => ({
                ...item,
                createdAt: toLocalDate(item.createdAt),
            })),
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async getDailyMovements(): Promise<{ total: number }> {
        const todayStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Lima',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());

        const startOfDay = getStartOfDayLima(todayStr);
        const endOfDay = getEndOfDayLima(todayStr);

        const total = await this.prisma.stockMovement.count({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        return { total };
    }

    async getInventoryValuation(query: GetInventoryValuationDto): Promise<any> {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const [products, totalProducts] = await Promise.all([
            this.prisma.product.findMany({
                skip,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            this.prisma.product.count(),
        ]);

        const allProducts = await this.prisma.product.findMany({
            select: { stock: true, price: true },
            where: { stock: { gt: 0 } },
        });

        const totalValuation = allProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);

        const data = products.map(product => ({
            ...product,
            valuation: product.stock * product.price,
        }));

        return {
            data,
            meta: {
                total: totalProducts,
                page,
                lastPage: Math.ceil(totalProducts / limit),
                totalValuation,
            },
        };
    }

    async getProductPerformance(query: import('./dto/get-product-performance.dto').GetProductPerformanceDto): Promise<PaginatedResult<any>> {
        const { startDate, endDate, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter.gte = getStartOfDayLima(startDate);
            dateFilter.lte = getEndOfDayLima(endDate);
        } else if (startDate) {
            dateFilter.gte = getStartOfDayLima(startDate);
            dateFilter.lte = getEndOfDayLima(startDate);
        } else if (endDate) {
            dateFilter.gte = getStartOfDayLima(endDate);
            dateFilter.lte = getEndOfDayLima(endDate);
        }

        const createdAtFilter = Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

        const groupedMovements = await this.prisma.stockMovement.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: {
                type: 'OUT',
                ...(createdAtFilter && { createdAt: createdAtFilter }),
            },
            orderBy: {
                _sum: { quantity: 'desc' }
            },
            skip,
            take: limit
        });

        const totalGrouped = await this.prisma.stockMovement.groupBy({
            by: ['productId'],
            where: {
                type: 'OUT',
                ...(createdAtFilter && { createdAt: createdAtFilter }),
            },
        });
        const total = totalGrouped.length;

        const productIds = groupedMovements.map(m => m.productId);
        const productsDetails = await this.prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        const data = groupedMovements.map(movement => {
            const product = productsDetails.find(p => p.id === movement.productId);
            if (!product) {
                return null;
            }
            const soldQuantity = Math.abs(movement._sum.quantity || 0);

            return {
                id: product.id,
                name: product.name,
                stockCurrent: product.stock,
                soldQuantity: soldQuantity,
                estimatedRevenue: soldQuantity * product.price,
                price: product.price,
            };
        }).filter(item => item !== null);

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }
    async getNetProfit(query: GetNetProfitDto): Promise<PaginatedResult<any>> {
        const { startDate, endDate, page = 1, limit = 10, productName } = query;
        const skip = (page - 1) * limit;

        const dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter.gte = getStartOfDayLima(startDate);
            dateFilter.lte = getEndOfDayLima(endDate);
        } else if (startDate) {
            dateFilter.gte = getStartOfDayLima(startDate);
            dateFilter.lte = getEndOfDayLima(startDate);
        } else if (endDate) {
            dateFilter.gte = getStartOfDayLima(endDate);
            dateFilter.lte = getEndOfDayLima(endDate);
        }

        const createdAtFilter = Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

        const salesDataHist = await this.prisma.saleDetail.groupBy({
            by: ['productId'],
            _sum: { subtotal: true },
        });

        const purchasesDataHist = await this.prisma.purchaseDetail.groupBy({
            by: ['productId'],
            _sum: { subtotal: true },
        });

        const salesDataPeriod = await this.prisma.saleDetail.groupBy({
            by: ['productId'],
            _sum: { subtotal: true },
            where: {
                sale: {
                    ...(createdAtFilter && { createdAt: createdAtFilter }),
                }
            }
        });

        const productWhere: any = {};
        if (productName) {
            productWhere.name = {
                contains: productName,
                mode: 'insensitive',
            };
        }

        const allProducts = await this.prisma.product.findMany({
            where: productWhere,
            select: { id: true, name: true }
        });

        const profitList = allProducts.map(product => {
            const histSales = salesDataHist.find(s => s.productId === product.id)?._sum.subtotal || 0;
            const histPurchases = purchasesDataHist.find(p => p.productId === product.id)?._sum.subtotal || 0;
            const periodSales = salesDataPeriod.find(s => s.productId === product.id)?._sum.subtotal || 0;

            const netProfit = histSales - histPurchases;

            return {
                productId: product.id,
                productName: product.name,
                totalSalesForDate: periodSales,
                totalSales: histSales,
                totalPurchases: histPurchases,
                netProfit: netProfit
            };
        });

        profitList.sort((a, b) => b.netProfit - a.netProfit);

        const total = profitList.length;
        const paginatedData = profitList.slice(skip, skip + limit);

        return {
            data: paginatedData,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit) || 1,
            },
        };
    }
}
