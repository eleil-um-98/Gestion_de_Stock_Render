import {
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
    IsInt,
    Min,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSaleDetailDto {
    @IsInt()
    @Min(1)
    productId: number;

    @IsInt()
    @Min(1)
    quantity: number;

}

export class CreateSaleDto {
    @IsString()
    @IsOptional()
    customerName?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSaleDetailDto)
    details: CreateSaleDetailDto[];
}
