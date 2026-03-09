import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ALMACENISTA', 'ADMIN')
@Controller('purchases')
export class PurchasesController {
    constructor(private readonly purchasesService: PurchasesService) { }

    @Post()
    create(@Body() createPurchaseDto: CreatePurchaseDto, @Request() req: any) {
        return this.purchasesService.createPurchase(createPurchaseDto, req.user.id);
    }

    @Get()
    findAll(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.purchasesService.findAll(startDate, endDate);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.purchasesService.findOne(id);
    }
}
