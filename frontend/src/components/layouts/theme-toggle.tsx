import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "@/hooks/use-theme"

import { Moon, Sun } from "lucide-react"

/**
 * ThemeToggle — Single button to switch between light and dark mode.
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            className="text-muted-foreground"
          >
            {isDark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isDark ? "Chế độ sáng" : "Chế độ tối"}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
