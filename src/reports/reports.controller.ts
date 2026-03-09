import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GetLowStockDto } from './dto/get-low-stock.dto';
import { GetMovementHistoryDto } from './dto/get-movement-history.dto';
import { GetInventoryValuationDto } from './dto/get-inventory-valuation.dto';
import { GetProductPerformanceDto } from './dto/get-product-performance.dto';
import { GetNetProfitDto } from './dto/get-net-profit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('low-stock')
    @Roles('ADMIN', 'ALMACENISTA')
    async getLowStock(
        @Query() query: GetLowStockDto,
    ) {
        return this.reportsService.getLowStock(query);
    }

    @Get('movements')
    @Roles('ADMIN', 'ALMACENISTA')
    async getMovementHistory(
        @Query() query: GetMovementHistoryDto,
    ) {
        return this.reportsService.getMovementHistory(query);
    }

    @Get('daily-movements')
    @Roles('ADMIN', 'ALMACENISTA')
    async getDailyMovements() {
        return this.reportsService.getDailyMovements();
    }

    @Get('valuation')
    @Roles('ADMIN')
    async getInventoryValuation(
        @Query() query: GetInventoryValuationDto,
    ) {
        return this.reportsService.getInventoryValuation(query);
    }

    @Get('performance')
    @Roles('ADMIN')
    async getProductPerformance(
        @Query() query: GetProductPerformanceDto,
    ) {
        return this.reportsService.getProductPerformance(query);
    }

    @Get('net-profit')
    @Roles('ADMIN')
    async getNetProfit(
        @Query() query: GetNetProfitDto,
    ) {
        return this.reportsService.getNetProfit(query);
    }
}
