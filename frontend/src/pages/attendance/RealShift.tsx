import { ROUTES } from "@/config/routes.config"

import { Navigate } from "react-router-dom"

export default function RealShift() {
  return <Navigate to={ROUTES.ATTENDANCE.MY_SCHEDULE} replace />
}
