import {
    IsString,
    IsArray,
    ValidateNested,
    IsInt,
    Min,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseDetailDto {
    @IsInt()
    @Min(1)
    productId: number;

    @IsInt()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitCost: number;
}

export class CreatePurchaseDto {
    @IsString()
    invoiceNumber: string;

    @IsInt()
    @Min(1)
    supplierId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseDetailDto)
    details: CreatePurchaseDetailDto[];
}
