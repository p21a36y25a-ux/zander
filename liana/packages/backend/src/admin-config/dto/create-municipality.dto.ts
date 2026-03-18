import { IsString, MinLength } from 'class-validator';

export class CreateMunicipalityDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
