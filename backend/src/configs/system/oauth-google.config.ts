import { z } from "zod"

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/forms.responses.readonly",
]

export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

const schema = z.object({
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  SERVER_URL: z.string().default("http://localhost:5000"),
})

const env = schema.parse(process.env)

export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return null
  }
  return {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: `${env.SERVER_URL}/api/recruitment/oauth/google/callback`,
  }
}

export function buildGoogleAuthUrl(state: string): string {
  const config = getGoogleOAuthConfig()
  if (!config) throw new Error("Google OAuth chưa được cấu hình")

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleCode(code: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const config = getGoogleOAuthConfig()
  if (!config) throw new Error("Google OAuth chưa được cấu hình")

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google OAuth token exchange failed: ${error}`)
  }

  const body = (await response.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? "",
    expiresIn: body.expires_in,
  }
}
