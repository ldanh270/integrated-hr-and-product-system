import Footer from "@/components/layouts/Footer.tsx"
import Header from "@/components/layouts/Header.tsx"
import type { ReactNode } from "react"

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
