import { AppDrawer } from "@/components/common/app-drawer"
import type { IPartTimeWeeklyAvailability } from "@/types/part-time-availability.types"

import { AdminPartTimeAvailabilityAssignPanel } from "./admin-part-time-availability-assign-panel"

interface AdminPartTimeAvailabilityAssignDrawerProps {
  availability: IPartTimeWeeklyAvailability | null
  weekStart: Date
  weekStartKey: string
  isOpen: boolean
  onClose: () => void
}

export function AdminPartTimeAvailabilityAssignDrawer({
  availability,
  weekStart,
  weekStartKey,
  isOpen,
  onClose,
}: AdminPartTimeAvailabilityAssignDrawerProps) {
  if (!availability) return null

  return (
    <AppDrawer isOpen={isOpen} onClose={onClose} widthClassName="w-full sm:max-w-[72vw]">
      <AdminPartTimeAvailabilityAssignPanel
        availability={availability}
        weekStart={weekStart}
        weekStartKey={weekStartKey}
        // Close drawer after successful assign so admin sees refreshed roster.
        onAssigned={onClose}
      />
    </AppDrawer>
  )
}
