import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PunchType } from '../../common/entities';

export class CreatePunchDto {
  @IsString()
  employeeId!: string;

  @IsEnum(PunchType)
  type!: PunchType;

  @IsOptional()
  @IsString()
  photoBase64?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
