import { PageCard } from "@/components/common"

export function ScheduleRemindersCard() {
  return (
    <PageCard padding="md">
      <h3 className="font-semibold text-sm mb-3">Nhắc nhở</h3>
      <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
        <li>Chỉ có thể Check In khi đang ở trong khu vực văn phòng.</li>
        <li>Check In trễ quá thời gian ân hạn sẽ bị ghi nhận là Đi Muộn.</li>
        <li>Nhớ Check Out khi về để tính tổng giờ làm.</li>
      </ul>
    </PageCard>
  )
}
