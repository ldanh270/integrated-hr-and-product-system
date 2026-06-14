import App from "@/App.tsx"
import { Providers } from "@/components/Providers.tsx"
import { ErrorBoundary } from "@/components/ErrorBoundary.tsx"

import { StrictMode } from "react"

import { createRoot } from "react-dom/client"

import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Providers>
        <App />
      </Providers>
    </ErrorBoundary>
  </StrictMode>,
)
