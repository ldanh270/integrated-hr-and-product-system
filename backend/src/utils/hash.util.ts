import bcrypt from "bcryptjs"

/**
 * HashUtil provides static methods for secure password hashing and comparison using bcrypt
 */
export class HashUtil {
  /**
   * Hashes a plain text password with a salt (rounds: 10)
   */
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  /**
   * Compares a plain text password with a stored hash
   * Returns true if they match, false otherwise
   */
  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
