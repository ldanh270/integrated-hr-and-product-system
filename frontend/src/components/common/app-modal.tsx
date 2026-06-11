import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

interface AppModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /**
   * Width class for the modal.
   * Use Tailwind max-w classes like 'sm:max-w-2xl' or 'sm:max-w-4xl'.
   */
  widthClassName?: string
  /**
   * Additional classes for the modal container.
   */
  className?: string
}

/**
 * A reusable, enterprise-grade modal component.
 * Provides a clean, spacious overlay for complex forms or detailed views.
 */
export function AppModal({
  isOpen,
  onClose,
  children,
  widthClassName = "sm:max-w-2xl",
  className,
}: AppModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "p-0 overflow-hidden gap-0 bg-background rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] duration-200 border border-border/50",
          widthClassName,
          className,
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
