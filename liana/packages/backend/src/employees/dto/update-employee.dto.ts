import {
	IsDateString,
	IsEmail,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from 'class-validator';

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
}
