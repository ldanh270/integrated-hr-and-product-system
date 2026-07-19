import { Button } from "@/components/ui/button"
import { AUTH_MESSAGES } from "@/config/messages/auth.message"

import { ShieldAlert } from "lucide-react"

/** Blocks protected content without destroying a valid session during transient auth outages. */
export function AuthorizationUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <section className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center text-card-foreground">
        <ShieldAlert className="mx-auto h-10 w-10 text-warning" aria-hidden="true" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">{AUTH_MESSAGES.AUTHORIZATION_UNAVAILABLE.TITLE}</h1>
          <p className="text-sm text-muted-foreground">
            {AUTH_MESSAGES.AUTHORIZATION_UNAVAILABLE.DESCRIPTION}
          </p>
        </div>
        <Button type="button" className="rounded-full" onClick={onRetry}>
          {AUTH_MESSAGES.AUTHORIZATION_UNAVAILABLE.RETRY}
        </Button>
      </section>
    </main>
  )
}
