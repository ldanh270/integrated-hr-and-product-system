/**
 * Global Footer component
 */
export default function Footer() {
  return (
    <footer className="border-t py-8 md:py-0 bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row max-w-7xl px-8">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; 2026 HRM System. All rights reserved. Built for modern enterprises.
        </p>
        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>
      </div>
    </footer>
  )
}
