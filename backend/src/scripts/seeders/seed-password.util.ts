export function getSeedPassword(envName: string): string {
  const password = process.env[envName]

  if (!password) {
    throw new Error(`Missing required seed password environment variable: ${envName}`)
  }

  return password
}
