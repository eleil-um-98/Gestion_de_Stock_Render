import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    Query,
    Patch,
    Delete,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Roles } from '../auth/roles.decorator';

@Controller('suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) { }

    @Post()
    @Roles('ADMIN', 'ALMACENISTA')
    create(@Body() createSupplierDto: CreateSupplierDto) {
        return this.suppliersService.create(createSupplierDto);
    }

    @Get()
    @Roles('ADMIN', 'ALMACENISTA')
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.suppliersService.findAll(page ? +page : 1, limit ? +limit : 10);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.suppliersService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN', 'ALMACENISTA')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateSupplierDto: UpdateSupplierDto) {
        return this.suppliersService.update(id, updateSupplierDto);
    }

    @Delete(':id')
    @Roles('ADMIN', 'ALMACENISTA')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.suppliersService.remove(id);
    }
}
