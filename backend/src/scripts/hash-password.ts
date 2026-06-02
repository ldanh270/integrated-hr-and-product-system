import { HashUtil } from "../utils/hash.util.ts"

/**
 * Utility script to hash a password for manual database insertion.
 * Usage: bun run src/scripts/hash-password.ts <password>
 */
const hashPassword = async () => {
  const password = process.argv[2]

  if (!password) {
    console.error("Usage: bun run hash-password.ts <password>")
    process.exit(1)
  }

  try {
    const hash = await HashUtil.hash(password)
    console.log("\n--------------------------------------------------")
    console.log("Password to hash:", password)
    console.log("Generated Hash  :", hash)
    console.log("--------------------------------------------------\n")
    console.log(
      "You can now copy this hash and paste it into the 'passwordHash' field in your database.",
    )
  } catch (error) {
    console.error("Error hashing password:", error)
    process.exit(1)
  }
}

hashPassword()
