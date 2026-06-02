import { cn } from "@/lib/utils"

interface EmptyStateProps {
  message?: string
  className?: string
}

/**
 * EmptyState — Animated SVG illustration + caption for empty data views.
 * Replaces the inline EmptyStateIllustration pattern in work-schedule and similar.
 */
export function EmptyState({ message = "Không tìm thấy kết quả", className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
      <svg
        className="mx-auto h-16 w-16 text-muted-foreground/30 animate-pulse"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="20" cy="30" r="4" fill="#ef4444" opacity="0.6" />
        <polygon points="80,20 85,25 80,30 75,25" fill="#3b82f6" opacity="0.5" />
        <path
          d="M50,10 L54,18 L62,20 L56,26 L58,34 L50,30 L42,34 L44,26 L38,20 L46,18 Z"
          fill="#eab308"
          opacity="0.4"
        />
        <rect
          x="35"
          y="30"
          width="30"
          height="40"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <line
          x1="42"
          y1="42"
          x2="58"
          y2="42"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="42"
          y1="50"
          x2="54"
          y2="50"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="42"
          y1="58"
          x2="50"
          y2="58"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-2 text-xs font-semibold text-muted-foreground/60">{message}</p>
    </div>
  )
}
