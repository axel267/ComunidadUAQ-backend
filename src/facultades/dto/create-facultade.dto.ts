import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class CreateFacultadeDto {
    @IsString()
    @IsNotEmpty()
    nombre: string

    @IsString()
    @IsOptional()
    abreviatura: string
}
