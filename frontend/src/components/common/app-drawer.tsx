import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"

import { ReactNode } from "react"

import { X } from "lucide-react"

interface AppDrawerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /**
   * Width of the drawer. Defaults to 40vw for a wide, spacious panel.
   */
  widthClassName?: string
}

/**
 * A reusable drawer component for viewing details across the application.
 * Features a left-aligned close button and customizable width.
 */
export function AppDrawer({
  isOpen,
  onClose,
  children,
  widthClassName = "w-full sm:max-w-[40vw]",
}: AppDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        showCloseButton={false}
        className={`${widthClassName} p-0 border-l border-border bg-background overflow-hidden flex flex-col`}
      >
        {/* Custom Header with Left-aligned Close Button */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="secondary"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:bg-muted"
            aria-label="Close"
          >
            <X size={16} className="text-muted-foreground" />
          </Button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
