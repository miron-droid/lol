import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMasterDataTables1710000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "drivers" (
        "id"        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "firstName" varchar(100) NOT NULL,
        "lastName"  varchar(100) NOT NULL,
        "phone"     varchar(30),
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "units" (
        "id"         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "unitNumber" varchar(50) NOT NULL UNIQUE,
        "vin"        varchar(50),
        "make"       varchar(50),
        "year"       smallint,
        "createdAt"  timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "brokerages" (
        "id"        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "name"      varchar(255) NOT NULL,
        "mcNumber"  varchar(20),
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "brokerages"');
    await queryRunner.query('DROP TABLE IF EXISTS "units"');
    await queryRunner.query('DROP TABLE IF EXISTS "drivers"');
  }
}
