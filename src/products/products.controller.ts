import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {

    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @Roles('ADMIN', 'VENDEDOR', 'ALMACENISTA')
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.productsService.findAll(page ? +page : 1, limit ? +limit : 10);
    }

    @Post()
    @Roles('ADMIN', 'ALMACENISTA')
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    @Get(':id')
    @Roles('ADMIN', 'VENDEDOR', 'ALMACENISTA')
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(+id);
    }

    @Patch(':id')
    @Roles('ADMIN', 'ALMACENISTA')
    update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
        return this.productsService.update(+id, updateProductDto);
    }

    @Delete(':id')
    @Roles('ADMIN', 'ALMACENISTA')
    remove(@Param('id') id: string) {
        return this.productsService.remove(+id);
    }


}
