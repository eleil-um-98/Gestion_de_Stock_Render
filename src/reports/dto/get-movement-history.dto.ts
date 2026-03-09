import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min, IsString } from 'class-validator';
import { MovementType } from '@prisma/client';

export class GetMovementHistoryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @Type(() => String)
    @IsString()
    productName?: string;

    @IsOptional()
    @IsEnum(MovementType)
    type?: MovementType;

    @IsOptional()
    @Type(() => String)
    @IsString()
    startDate?: string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    endDate?: string;
}
