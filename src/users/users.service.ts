import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({ where: { username } });
    }

    async findById(id: number) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async create(dto: CreateUserDto) {
        const existing = await this.findByUsername(dto.username);
        if (existing) {
            throw new ConflictException('Username is already taken');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                username: dto.username,
                password: hashedPassword,
                role: dto.role,
            },
        });

        const { password, ...result } = user;
        return result;
    }

    async findAll(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    username: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count(),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async update(id: number, dto: UpdateUserDto) {
        await this.findById(id);

        const data: any = { ...dto };
        if (dto.password) {
            data.password = await bcrypt.hash(dto.password, 10);
        }

        if (dto.username) {
            const existing = await this.findByUsername(dto.username);
            if (existing && existing.id !== id) {
                throw new ConflictException('Username is already taken');
            }
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data,
        });

        const { password, ...result } = updatedUser;
        return result;
    }

    async remove(id: number) {
        await this.findById(id);

        const deletedUser = await this.prisma.user.delete({
            where: { id },
        });

        const { password, ...result } = deletedUser;
        return result;
    }
}
