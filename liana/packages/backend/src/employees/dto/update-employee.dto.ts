import {
	IsDateString,
	IsEmail,
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';
import { UserRole } from '@liana/shared';

export class UpdateEmployeeDto {
	@IsOptional()
	@IsString()
	employeeNumber?: string;

	@IsOptional()
	@IsString()
	firstName?: string;

	@IsOptional()
	@IsString()
	lastName?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	hourlyRateEur?: number;

	@IsOptional()
	@IsDateString()
	hireDate?: string;

	@IsOptional()
	@IsString()
	departmentId?: string;

	@IsOptional()
	@IsString()
	birthDate?: string;

	@IsOptional()
	@IsString()
	country?: string;

	@IsOptional()
	@IsString()
	personalId?: string;

	@IsOptional()
	@IsString()
	address?: string;

	@IsOptional()
	@IsString()
	municipality?: string;

	@IsOptional()
	@IsString()
	tel?: string;

	@IsOptional()
	@IsString()
	maritalStatus?: string;

	@IsOptional()
	@IsString()
	education?: string;

	@IsOptional()
	@IsString()
	position?: string;

	@IsOptional()
	@IsString()
	emergencyContact?: string;

	@IsOptional()
	@IsString()
	familyConnection?: string;

	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole;

	@IsOptional()
	@IsString()
	branchName?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	annualLeaveEntitlement?: number;

	@IsOptional()
	@IsNumber()
	@Min(0)
	annualLeaveRemaining?: number;
}
