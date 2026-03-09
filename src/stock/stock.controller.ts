import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ALMACENISTA')
@Controller('stock')
export class StockController {

    constructor(private readonly stockService: StockService) { }

    @Post()
    create(@Body() createStockMovementDto: CreateStockMovementDto) {
        return this.stockService.createMovement(createStockMovementDto);
    }

    @Get()
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.stockService.findAll(page ? +page : 1, limit ? +limit : 10);
    }

}
