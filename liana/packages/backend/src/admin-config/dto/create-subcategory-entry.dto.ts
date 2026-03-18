import { IsObject, IsString, MinLength } from 'class-validator';

export class CreateSubcategoryEntryDto {
  @IsString()
  @MinLength(2)
  subcategory!: string;

  @IsObject()
  data!: Record<string, string>;
}
