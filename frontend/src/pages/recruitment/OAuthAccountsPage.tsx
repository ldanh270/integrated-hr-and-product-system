import { PageHeader } from "@/components/common"
import { StatusPill } from "@/components/common/status-pill"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { POSTING_CHANNELS } from "@/config/entities/recruitment.config"
import {
  useDeleteOAuthAccount,
  useOAuthAccounts,
} from "@/hooks/recruitment/use-recruitment-queries"
import apiClient from "@/lib/api-client"

import { useEffect, useState } from "react"

import { Settings } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

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
      const response = await apiClient.get<{ data: { authUrl: string } }>(
        "/recruitment/oauth/google/connect",
        {
          params: { channel, name: "Default" },
        },
      )
      window.location.assign(response.data.data.authUrl)
    } catch {
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
            <Card key={i} className="animate-pulse rounded-xl">
              <CardHeader>
                <div className="h-4 bg-muted rounded-full w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {POSTING_CHANNELS.map((channel) => {
            const account = getAccount(channel.value)
            return (
              <Card key={channel.value} className="rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">{channel.label}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
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
                    <StatusPill
                      label={account?.refreshToken ? "Đã kết nối" : "Chưa kết nối"}
                      variant={account?.refreshToken ? "success" : "warning"}
                    />
                    <div className="flex gap-2">
                      {channel.value === "google_form" && (
                        <>
                          {account ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full text-xs"
                              onClick={() => handleDisconnect(channel.value)}
                              disabled={deleteMutation.isPending}
                            >
                              Ngắt kết nối
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="rounded-full text-xs"
                              onClick={() => handleConnect(channel.value)}
                              disabled={connectingChannel === channel.value}
                            >
                              {connectingChannel === channel.value ? "Đang kết nối..." : "Kết nối"}
                            </Button>
                          )}
                        </>
                      )}
                      {channel.value !== "google_form" && (
                        <span className="text-xs text-muted-foreground px-2 py-1 font-medium">Sắp có</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/40 p-5">
        <h3 className="font-semibold text-sm mb-2">Hướng dẫn kết nối Google Form</h3>
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>Click nút "Kết nối" bên trên</li>
          <li>Đăng nhập tài khoản Google của bạn</li>
          <li>Cho phép ứng dụng truy cập Google Forms</li>
          <li>Sau khi xác thực thành công, bạn sẽ được chuyển về trang này</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          <strong>Lưu ý:</strong> Cần có{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">GOOGLE_OAUTH_CLIENT_ID</code> và{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">GOOGLE_OAUTH_CLIENT_SECRET</code> trong file .env
          phía server.
        </p>
      </div>
    </div>
  )
}

