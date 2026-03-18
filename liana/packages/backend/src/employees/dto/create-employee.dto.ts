import { IsDateString, IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  employeeNumber!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsNumber()
  @Min(0)
  hourlyRateEur!: number;

  @IsDateString()
  hireDate!: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
