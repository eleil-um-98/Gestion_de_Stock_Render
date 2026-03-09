import { IsString, IsNotEmpty, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;
}
