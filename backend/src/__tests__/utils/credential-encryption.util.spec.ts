import { decryptCredential, encryptCredential } from "@/utils/credential-encryption.util"

describe("OAuth credential encryption", () => {
  const originalKey = process.env.OAUTH_CREDENTIAL_ENCRYPTION_KEY

  beforeEach(() => {
    process.env.OAUTH_CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64")
  })

  afterAll(() => {
    if (originalKey === undefined) delete process.env.OAUTH_CREDENTIAL_ENCRYPTION_KEY
    else process.env.OAUTH_CREDENTIAL_ENCRYPTION_KEY = originalKey
  })

  it("encrypts credentials with a non-deterministic authenticated envelope", () => {
    const first = encryptCredential("refresh-token")
    const second = encryptCredential("refresh-token")

    expect(first).toMatch(/^enc:v1:/)
    expect(first).not.toBe(second)
    expect(decryptCredential(first)).toBe("refresh-token")
  })

  it("reads legacy plaintext values so existing accounts remain usable", () => {
    expect(decryptCredential("legacy-secret")).toBe("legacy-secret")
  })
})
