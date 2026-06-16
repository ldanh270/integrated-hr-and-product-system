import { APP_TYPE_META } from "@/components/features/attendance/applications/application-type-meta.config"

interface SubmitApplicationTypePickerProps {
  onSelect: (type: string) => void
}

export function SubmitApplicationTypePicker({ onSelect }: SubmitApplicationTypePickerProps) {
  return (
    <div className="p-5 grid grid-cols-2 gap-3">
      {Object.entries(APP_TYPE_META).map(([type, m]) => {
        const Icon = m.icon
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left hover:shadow-md transition-all ${m.border} ${m.bg}`}
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${m.color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${m.color}`}>{m.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.hint}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
