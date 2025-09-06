module.exports = class InitialSchema1757154266662 {
  name = 'InitialSchema1757154266662'

  async up(queryRunner) {
    // Make sure operations are idempotent; ignore failures for missing objects.
    try { await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT IF EXISTS "fk_pm_project"`); } catch (e) {}
    try { await queryRunner.query(`ALTER TABLE "project_members" DROP CONSTRAINT IF EXISTS "fk_pm_user"`); } catch (e) {}
    try { await queryRunner.query(`DROP INDEX IF EXISTS "public"."idx_holidays_date_name"`); } catch (e) {}
  }

  async down(queryRunner) {
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_holidays_date_name" ON "holidays" ((date)) `);
    await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "fk_pm_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "project_members" ADD CONSTRAINT "fk_pm_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }
}


