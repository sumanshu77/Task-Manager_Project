import { MigrationInterface, QueryRunner } from "typeorm";

export class AttendanceSchema1756240105425 implements MigrationInterface {
    name = 'AttendanceSchema1756240105425'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tasks" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "description" text, "status" character varying(50) NOT NULL, "priority" character varying(50) NOT NULL, "assignee_id" integer, "assignee_name" character varying(255), "due_date" TIMESTAMP, "github_link" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "date" date NOT NULL, "check_in" TIME, "check_out" TIME, "break_start" TIME, "break_end" TIME, "status" character varying(50) NOT NULL DEFAULT 'present', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
    }

}
