import { consumeOAuthState, createOAuthState } from "@/utils/oauth-state.util"

describe("OAuth state", () => {
  const originalSecret = process.env.OAUTH_STATE_SECRET

  beforeEach(() => {
    process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret"
  })

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.OAUTH_STATE_SECRET
    else process.env.OAUTH_STATE_SECRET = originalSecret
  })

  it("signs and consumes a state once", () => {
    const state = createOAuthState({ userId: "employee-1", channel: "google_form", name: "Forms" }, 1000)

    expect(consumeOAuthState(state, 2000)).toEqual(expect.objectContaining({
      userId: "employee-1",
      channel: "google_form",
      name: "Forms",
    }))
    expect(() => consumeOAuthState(state, 3000)).toThrow("already been consumed")
  })

  it("rejects tampered or expired state", () => {
    const state = createOAuthState({ userId: "employee-1", channel: "google_form", name: "Forms" }, 1000)
    const [payload, signature] = state.split(".")

    expect(() => consumeOAuthState(`${payload}x.${signature}`, 2000)).toThrow("signature")
    expect(() => consumeOAuthState(createOAuthState({ userId: "employee-1", channel: "google_form", name: "Forms" }, 1000), 601001)).toThrow("Expired")
  })
})
