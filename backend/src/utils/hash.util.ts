import bcrypt from "bcryptjs"

export class HashUtil {
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }
}
