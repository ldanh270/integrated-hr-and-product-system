import { useAuthStore } from "@/store/auth-store.ts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx"

/**
 * Dashboard page
 * Main landing page for authenticated users
 */
export default function Dashboard() {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="container max-w-7xl px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Here is what's happening in your organization today.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:scale-[1.02] transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">124</div>
            <p className="text-xs text-success mt-1 font-medium">+4 from last month</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Active Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Ongoing right now</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-xs text-warning mt-1 font-medium">Needs your attention</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] transition-all">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Recruitment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Active job postings</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
