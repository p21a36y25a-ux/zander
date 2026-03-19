import { IsOptional, IsString } from 'class-validator';

export class UploadSignedLeaveDocumentDto {
  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsString()
  base64Data!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
