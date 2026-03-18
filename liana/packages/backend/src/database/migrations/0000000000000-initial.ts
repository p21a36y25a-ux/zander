import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial0000000000000 implements MigrationInterface {
  name = 'Initial0000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` varchar(36) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`password_hash\` varchar(255) NOT NULL,
        \`role\` enum ('employee', 'manager', 'hr_admin', 'system_admin') NOT NULL DEFAULT 'employee',
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`departments\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        UNIQUE INDEX \`IDX_departments_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`leave_types\` (
        \`id\` varchar(36) NOT NULL,
        \`code\` enum ('vacation', 'sick', 'personal') NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`paid\` tinyint NOT NULL DEFAULT 1,
        UNIQUE INDEX \`IDX_leave_types_code\` (\`code\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`payroll_periods\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`startDate\` date NOT NULL,
        \`endDate\` date NOT NULL,
        \`status\` enum ('draft', 'processed', 'paid') NOT NULL DEFAULT 'draft',
        UNIQUE INDEX \`IDX_payroll_periods_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`municipalities\` (
        \`id\` varchar(36) NOT NULL,
        \`name\` varchar(255) NOT NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_municipalities_name\` (\`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`employees\` (
        \`id\` varchar(36) NOT NULL,
        \`employee_number\` varchar(255) NOT NULL,
        \`firstName\` varchar(255) NOT NULL,
        \`lastName\` varchar(255) NOT NULL,
        \`photoUrl\` varchar(255) NULL,
        \`hourlyRateEur\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`hireDate\` date NOT NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`userId\` varchar(36) NOT NULL,
        \`departmentId\` varchar(36) NULL,
        UNIQUE INDEX \`IDX_employees_employee_number\` (\`employee_number\`),
        UNIQUE INDEX \`IDX_employees_userId\` (\`userId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_employees_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_employees_departmentId\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`punches\` (
        \`id\` varchar(36) NOT NULL,
        \`employeeId\` varchar(36) NOT NULL,
        \`type\` enum ('check_in', 'check_out') NOT NULL,
        \`punchedAt\` datetime NOT NULL,
        \`photoBlob\` longblob NULL,
        \`photoUrl\` varchar(255) NULL,
        \`latitude\` decimal(10,7) NULL,
        \`longitude\` decimal(10,7) NULL,
        \`source\` varchar(255) NOT NULL DEFAULT 'web',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_punches_employeeId\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`attendance\` (
        \`id\` varchar(36) NOT NULL,
        \`employeeId\` varchar(36) NOT NULL,
        \`date\` date NOT NULL,
        \`checkInAt\` datetime NULL,
        \`checkOutAt\` datetime NULL,
        \`workedMinutes\` int NOT NULL DEFAULT 0,
        \`lateMinutes\` int NOT NULL DEFAULT 0,
        \`earlyDepartureMinutes\` int NOT NULL DEFAULT 0,
        \`status\` enum ('present', 'absent', 'late', 'on_leave') NOT NULL DEFAULT 'absent',
        \`leaveRequestId\` varchar(255) NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_attendance_employeeId\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`leave_requests\` (
        \`id\` varchar(36) NOT NULL,
        \`employeeId\` varchar(36) NOT NULL,
        \`leaveTypeId\` varchar(36) NOT NULL,
        \`startDate\` date NOT NULL,
        \`endDate\` date NOT NULL,
        \`totalDays\` int NOT NULL,
        \`status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        \`reason\` text NULL,
        \`managerComment\` text NULL,
        \`hrComment\` text NULL,
        \`requestedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_leave_requests_employeeId\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_leave_requests_leaveTypeId\` FOREIGN KEY (\`leaveTypeId\`) REFERENCES \`leave_types\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`payroll_records\` (
        \`id\` varchar(36) NOT NULL,
        \`payrollPeriodId\` varchar(36) NOT NULL,
        \`employeeId\` varchar(36) NOT NULL,
        \`hourlyRateEur\` decimal(10,2) NOT NULL,
        \`totalHours\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`regularHours\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`overtimeHours\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`premiumHours\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`grossAmount\` decimal(10,2) NOT NULL DEFAULT '0.00',
        \`currency\` varchar(255) NOT NULL DEFAULT 'EUR',
        \`calculatedAt\` datetime NOT NULL,
        \`paidAt\` datetime NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_payroll_records_payrollPeriodId\` FOREIGN KEY (\`payrollPeriodId\`) REFERENCES \`payroll_periods\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_payroll_records_employeeId\` FOREIGN KEY (\`employeeId\`) REFERENCES \`employees\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`notification_logs\` (
        \`id\` varchar(36) NOT NULL,
        \`channel\` varchar(255) NOT NULL,
        \`recipient\` varchar(255) NOT NULL,
        \`subject\` varchar(255) NOT NULL,
        \`body\` text NOT NULL,
        \`status\` varchar(255) NOT NULL DEFAULT 'queued',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`audit_logs\` (
        \`id\` varchar(36) NOT NULL,
        \`actorUserId\` varchar(255) NULL,
        \`action\` varchar(255) NOT NULL,
        \`entityType\` varchar(255) NOT NULL,
        \`entityId\` varchar(255) NULL,
        \`payload\` json NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`admin_subcategory_entries\` (
        \`id\` varchar(36) NOT NULL,
        \`subcategory\` varchar(255) NOT NULL,
        \`data\` text NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`leave_types\` (\`id\`, \`code\`, \`name\`, \`paid\`) VALUES
      (UUID(), 'vacation', 'Vacation Leave', 1),
      (UUID(), 'sick', 'Sick Leave', 1),
      (UUID(), 'personal', 'Personal Leave', 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `admin_subcategory_entries`');
    await queryRunner.query('DROP TABLE IF EXISTS `audit_logs`');
    await queryRunner.query('DROP TABLE IF EXISTS `notification_logs`');
    await queryRunner.query('DROP TABLE IF EXISTS `payroll_records`');
    await queryRunner.query('DROP TABLE IF EXISTS `leave_requests`');
    await queryRunner.query('DROP TABLE IF EXISTS `attendance`');
    await queryRunner.query('DROP TABLE IF EXISTS `punches`');
    await queryRunner.query('DROP TABLE IF EXISTS `employees`');
    await queryRunner.query('DROP TABLE IF EXISTS `municipalities`');
    await queryRunner.query('DROP TABLE IF EXISTS `payroll_periods`');
    await queryRunner.query('DROP TABLE IF EXISTS `leave_types`');
    await queryRunner.query('DROP TABLE IF EXISTS `departments`');
    await queryRunner.query('DROP TABLE IF EXISTS `users`');
  }
}
