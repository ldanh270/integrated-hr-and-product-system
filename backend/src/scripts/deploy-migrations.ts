import { Client } from "pg"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"

dotenv.config()


const migrationsDir = path.resolve(process.cwd(), "prisma/migrations")

async function main() {
  const connectionString = process.env.DATABASE_URL
  console.log("Connecting to PostgreSQL to run migrations...")

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: true
    }
  })

  try {
    await client.connect()
    console.log("Connected successfully.")

    // Create _prisma_migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY NOT NULL,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)

    // Get all migration directories
    const items = fs.readdirSync(migrationsDir)
    const migrationDirs = items
      .filter((item) => fs.statSync(path.join(migrationsDir, item)).isDirectory())
      .sort() // chronological order because of timestamp prefix

    for (const dir of migrationDirs) {
      // Check if migration already applied
      const checkRes = await client.query(
        'SELECT id FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL',
        [dir]
      )

      if (checkRes.rows.length > 0) {
        console.log(`[Already Applied] ${dir}`)
        continue
      }

      console.log(`[Applying] ${dir}...`)
      const sqlPath = path.join(migrationsDir, dir, "migration.sql")
      if (!fs.existsSync(sqlPath)) {
        console.log(`Warning: no migration.sql in ${dir}`)
        continue
      }

      const sql = fs.readFileSync(sqlPath, "utf-8")

      // Start transaction for each migration
      await client.query("BEGIN")
      try {
        // Run SQL migration
        await client.query(sql)

        // Record migration
        const migrationId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const checksum = Math.random().toString(16).substring(2, 10)
        await client.query(
          'INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at) VALUES ($1, $2, now(), $3, now())',
          [migrationId, checksum, dir]
        )

        await client.query("COMMIT")
        console.log(`[✓ Success] ${dir}`)
      } catch (err) {
        await client.query("ROLLBACK")
        console.error(`[✗ Failed] ${dir}`)
        throw err
      }
    }

    console.log("All migrations deployed successfully via pg driver!")
  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await client.end()
  }
}

main()
