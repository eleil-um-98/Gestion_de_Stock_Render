import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                skip,
                take: limit
            }),
            this.prisma.product.count()
        ])

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            }
        }
    }

    async create(createProductDto: CreateProductDto) {
        return this.prisma.product.create({
            data: createProductDto,
        });
    }

    async findOne(id: number) {
        return this.prisma.product.findUnique({
            where: { id }
        });
    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        return this.prisma.product.update({
            where: { id },
            data: updateProductDto
        });
    }

    async remove(id: number) {
        return this.prisma.product.delete({
            where: { id }
        });
    }
}

