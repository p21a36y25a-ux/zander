import { IsOptional, IsString } from 'class-validator';

export class UpdatePunchPhotoDto {
  @IsOptional()
  @IsString()
  photoBase64?: string;
}