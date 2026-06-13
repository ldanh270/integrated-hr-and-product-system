export function ApplicationSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-3.5 bg-slate-100 rounded w-32" />
          <div className="h-3 bg-slate-100 rounded w-48" />
        </div>
      </div>
    </div>
  )
}
