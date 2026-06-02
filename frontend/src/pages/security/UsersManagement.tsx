import { AlertCircle } from "lucide-react"

export default function UsersManagement() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6 min-h-100">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <AlertCircle className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Người dùng - Đang phát triển</h2>
          <p className="text-muted-foreground max-w-125">
            Tính năng quản lý tài khoản người dùng đang trong quá trình phát triển.
          </p>
        </div>
      </div>
    </div>
  )
}
