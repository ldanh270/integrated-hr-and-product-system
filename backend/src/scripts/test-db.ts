import { Client } from "pg"
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env") })

async function main() {
  const connectionString = process.env.DATABASE_URL
  console.log("Connecting to:", connectionString?.replace(/:([^@]+)@/, ":****@"))

  const { parse } = require("pg-connection-string")
  const config = parse(connectionString || "")
  config.ssl = {
    rejectUnauthorized: false
  }

  const client = new Client(config)

  try {
    await client.connect()
    console.log("SUCCESS: Connected to database successfully!")
    const res = await client.query("SELECT version()")
    console.log("Version:", res.rows[0].version)
    await client.end()
  } catch (err) {
    console.error("FAILURE: Could not connect to database:")
    console.error(err)
  }
}

main()
