import { useEffect, useState } from "react"
import { Settings } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { PageHeader } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOAuthAccounts, useDeleteOAuthAccount } from "@/hooks/recruitment/use-recruitment-queries"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

export default function OAuthAccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: accounts = [], isLoading } = useOAuthAccounts()
  const deleteMutation = useDeleteOAuthAccount()
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null)

  // Handle OAuth callback params
  useEffect(() => {
    const error = searchParams.get("error")
    const success = searchParams.get("success")
    if (error) {
      toast.error(`Kết nối thất bại: ${error}`)
      setSearchParams({})
    } else if (success === "connected") {
      toast.success("Kết nối tài khoản Google thành công!")
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const handleConnect = async (channel: string) => {
    if (channel !== "google_form") {
      toast.info("Chỉ hỗ trợ Google Form hiện tại")
      return
    }
    setConnectingChannel(channel)
    try {
      const response = await apiClient.get<{ data: { authUrl: string } }>("/recruitment/oauth/google/connect", {
        params: { channel, name: "Default" },
      })
      window.location.href = response.data.data.authUrl
    } catch (err) {
      toast.error("Không thể khởi tạo OAuth. Vui lòng kiểm tra cấu hình server.")
      setConnectingChannel(null)
    }
  }

  const handleDisconnect = (channel: string) => {
    if (confirm("Bạn có chắc muốn ngắt kết nối tài khoản này?")) {
      deleteMutation.mutate(channel)
    }
  }

  const getAccount = (channel: string) => accounts.find((a) => a.channel === channel)

  return (
    <div className="container flex flex-col gap-6 px-3 py-4 sm:px-6 sm:py-6">
      <PageHeader
        title="Tài khoản OAuth"
        description="Kết nối tài khoản OAuth để đăng bài tuyển dụng lên các kênh (Google Form, LinkedIn, Facebook, v.v.)"
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-4 bg-muted rounded w-1/2" /></CardHeader>
              <CardContent><div className="h-8 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {POSTING_CHANNELS.map((channel) => {
            const account = getAccount(channel.value)
            return (
              <Card key={channel.value}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{channel.label}</CardTitle>
                      <CardDescription>
                        {account?.name
                          ? `Đã kết nối: ${account.name}`
                          : channel.value === "google_form"
                            ? "Chưa kết nối"
                            : "Sắp ra mắt"}
                      </CardDescription>
                    </div>
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <StatusBadge connected={!!account?.refreshToken} />
                    <div className="flex gap-2">
                      {channel.value === "google_form" && (
                        <>
                          {account ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDisconnect(channel.value)}
                              disabled={deleteMutation.isPending}
                            >
                              Ngắt kết nối
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleConnect(channel.value)}
                              disabled={connectingChannel === channel.value}
                            >
                              {connectingChannel === channel.value ? "Đang kết nối..." : "Kết nối"}
                            </Button>
                          )}
                        </>
                      )}
                      {channel.value !== "google_form" && (
                        <span className="text-xs text-muted-foreground px-2 py-1">Sắp có</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="font-medium mb-2">Hướng dẫn kết nối Google Form</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Click nút "Kết nối" bên trên</li>
          <li>Đăng nhập tài khoản Google của bạn</li>
          <li>Cho phép ứng dụng truy cập Google Forms</li>
          <li>Sau khi xác thực thành công, bạn sẽ được chuyển về trang này</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-3">
          <strong>Lưu ý:</strong> Cần có <code className="bg-muted px-1 rounded">GOOGLE_OAUTH_CLIENT_ID</code> và{" "}
          <code className="bg-muted px-1 rounded">GOOGLE_OAUTH_CLIENT_SECRET</code> trong file .env phía server.
        </p>
      </div>
    </div>
  )
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        connected
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      }`}
    >
      {connected ? "Đã kết nối" : "Chưa kết nối"}
    </span>
  )
}
