import { LeaveRequestStatus } from '@liana/shared';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ReviewLeaveRequestDto {
  @IsEnum(LeaveRequestStatus)
  status!: LeaveRequestStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
