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
	@IsEnum(UserRole)
	role?: UserRole;
}
