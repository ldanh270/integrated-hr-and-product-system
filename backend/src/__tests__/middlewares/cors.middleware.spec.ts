import { cors } from "@/middlewares/cors.middleware"

describe("cors middleware", () => {
  const originalOrigins = process.env.CORS_ALLOWED_ORIGINS

  afterEach(() => {
    if (originalOrigins === undefined) delete process.env.CORS_ALLOWED_ORIGINS
    else process.env.CORS_ALLOWED_ORIGINS = originalOrigins
  })

  it("allows configured origins and handles preflight", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://hr.example.com"
    const response = {
      setHeader: jest.fn(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    cors(
      { method: "OPTIONS", headers: { origin: "https://hr.example.com" } } as never,
      response as never,
      next,
    )

    expect(response.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "https://hr.example.com")
    expect(response.sendStatus).toHaveBeenCalledWith(204)
    expect(next).not.toHaveBeenCalled()
  })

  it("rejects unconfigured origins before routing", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://hr.example.com"
    const response = {
      setHeader: jest.fn(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
    const next = jest.fn()

    cors(
      { method: "POST", headers: { origin: "https://evil.example.com" } } as never,
      response as never,
      next,
    )

    expect(response.status).toHaveBeenCalledWith(403)
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: "ORIGIN_NOT_ALLOWED" }),
    }))
    expect(next).not.toHaveBeenCalled()
  })
})
