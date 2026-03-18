import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial0000000000000 implements MigrationInterface {
  name = 'Initial0000000000000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Initial migration placeholder. Generate full migration with:
    // npm run migration:generate -- -n initial_schema
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // no-op
  }
}
