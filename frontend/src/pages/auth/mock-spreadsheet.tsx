import { AlignLeft, Database, FileText, Filter, Folder, Play, Search, Settings } from "lucide-react"

/**
 * Render a high-quality, crisp vector SVG collaborator avatar.
 */
const CollaboratorAvatar = () => (
  <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-background bg-indigo-100 shadow-md transition-all hover:scale-110">
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#e0e7ff" />
      <circle cx="50" cy="40" r="30" fill="#1e1b4b" />
      <rect x="25" y="40" width="50" height="40" fill="#1e1b4b" />
      <circle cx="50" cy="45" r="22" fill="#fed7aa" />
      <path d="M28,40 Q50,25 72,40 Q50,42 28,40 Z" fill="#1e1b4b" />
      <circle cx="43" cy="45" r="2" fill="#1e293b" />
      <circle cx="57" cy="45" r="2" fill="#1e293b" />
      <circle cx="38" cy="49" r="3" fill="#fca5a5" opacity="0.6" />
      <circle cx="62" cy="49" r="3" fill="#fca5a5" opacity="0.6" />
      <path
        d="M47,52 Q50,55 53,52"
        fill="none"
        stroke="#e11d48"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M42,65 L58,65 L68,90 L32,90 Z" fill="#4f46e5" />
    </svg>
  </div>
)

/**
 * Render a high-quality vector SVG sidebar user avatar.
 */
const UserAvatar = () => (
  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-indigo-400 bg-blue-100 shadow transition-all hover:scale-110">
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <rect width="100" height="100" fill="#dbeafe" />
      <circle cx="50" cy="48" r="24" fill="#ffedd5" />
      <path d="M25,35 Q50,15 75,35 Q78,25 70,20 Q50,5 30,20 Q22,25 25,35 Z" fill="#172554" />
      <rect
        x="34"
        y="42"
        width="12"
        height="8"
        rx="2"
        fill="none"
        stroke="#172554"
        strokeWidth="3"
      />
      <rect
        x="54"
        y="42"
        width="12"
        height="8"
        rx="2"
        fill="none"
        stroke="#172554"
        strokeWidth="3"
      />
      <line x1="46" y1="46" x2="54" y2="46" stroke="#172554" strokeWidth="3" />
      <circle cx="40" cy="46" r="1.5" fill="#172554" />
      <circle cx="60" cy="46" r="1.5" fill="#172554" />
      <path
        d="M47,56 Q50,59 53,56"
        fill="none"
        stroke="#172554"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M38,70 L62,70 L72,95 L28,95 Z" fill="#2563eb" />
    </svg>
  </div>
)

/**
 * MockSpreadsheetCard component
 * Implements a premium preview UI representing the application's interface.
 * Features realistic layout elements, hover state animations, and clean markup.
 */
export default function MockSpreadsheetCard() {
  const tableRows = Array.from({ length: 7 })

  return (
    <div className="relative w-full max-w-xl animate-float">
      {/* Top overlapping collaborator profile */}
      <div className="absolute -top-5 right-28 z-10">
        <CollaboratorAvatar />
      </div>

      <div className="flex overflow-hidden rounded-xl border border-border/40 bg-card text-card-foreground shadow-2xl backdrop-blur-sm">
        {/* Mock App Sidebar */}
        <div className="flex w-16 flex-col items-center justify-between bg-primary/95 py-5 text-primary-foreground/80 dark:bg-primary/90">
          <div className="flex flex-col items-center gap-6">
            {/* Logo */}
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white font-bold">
              Q
            </div>
            {/* Sidebar Navigation */}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/25 text-white"
              aria-label="Folder tab"
            >
              <Folder size={18} />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 hover:text-white"
              aria-label="Play tab"
            >
              <Play size={18} />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 hover:text-white"
              aria-label="Database tab"
            >
              <Database size={18} />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button
              className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 hover:text-white"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            <UserAvatar />
          </div>
        </div>

        {/* Mock App Content */}
        <div className="flex-1 bg-background p-5 text-foreground">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                <FileText size={16} />
              </div>
              <span className="font-semibold text-sm">Example File</span>
            </div>

            {/* Top Toolbar actions */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-12 rounded bg-secondary/80 animate-pulse" />
              <div className="h-6 w-16 rounded bg-secondary/80 animate-pulse" />
              <div className="h-6 w-8 rounded bg-secondary/80 animate-pulse" />
            </div>
          </div>

          {/* Sub Toolbar */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 text-muted-foreground" size={14} />
              <div className="h-8 w-full rounded-full border border-border bg-secondary/20 pl-9" />
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Filter"
            >
              <Filter size={14} />
            </button>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-lg border border-border/80">
            <div className="grid grid-cols-12 bg-secondary/40 border-b border-border/80 py-2 px-3 text-xs font-semibold text-muted-foreground">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3 flex items-center gap-1">
                <AlignLeft size={10} /> Type
              </div>
              <div className="col-span-4 text-center">Value A</div>
              <div className="col-span-4 text-center">Value B</div>
            </div>

            {/* Table Rows (Skeleton styling) */}
            <div className="divide-y divide-border/60">
              {tableRows.map((_, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center py-2.5 px-3 text-xs text-muted-foreground hover:bg-secondary/20"
                >
                  <div className="col-span-1 text-center font-mono font-medium">{idx + 1}</div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${idx % 2 === 0 ? "bg-emerald-500" : "bg-blue-500"}`}
                    />
                    <div className="h-3 w-12 rounded bg-secondary/80 animate-pulse" />
                  </div>
                  <div className="col-span-4 px-2">
                    <div className="mx-auto h-3 w-16 rounded bg-secondary/60 animate-pulse" />
                  </div>
                  <div className="col-span-4 px-2">
                    <div className="mx-auto h-3 w-20 rounded bg-secondary/50 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
