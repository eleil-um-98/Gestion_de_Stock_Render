import { IsEnum, IsInt, IsNotEmpty, IsNumber, Min } from 'class-validator';

export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateStockMovementDto {
    @IsInt()
    @Min(1)
    productId: number;

    @IsEnum(MovementType)
    @IsNotEmpty()
    type: MovementType;

    @IsNumber()
    quantity: number;
}
