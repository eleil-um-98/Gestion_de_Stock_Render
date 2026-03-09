import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Request,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDEDOR', 'ADMIN')
@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    create(@Body() createSaleDto: CreateSaleDto, @Request() req: any) {
        return this.salesService.createSale(createSaleDto, req.user.id);
    }

    @Get()
    findAll() {
        return this.salesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.salesService.findOne(id);
    }
}
