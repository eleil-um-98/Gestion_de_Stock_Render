import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min, IsString } from 'class-validator';

export class GetNetProfitDto {
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
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Type(() => String)
    @IsString()
    productName?: string;
}
