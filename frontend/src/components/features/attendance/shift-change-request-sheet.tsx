import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useShifts } from "@/hooks/attendance/use-shifts"
import { useSubmitShiftChangeRequest } from "@/hooks/attendance/use-shift-change-requests"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"

import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Loader2, MessageSquare, Repeat } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  reason: z.string().min(5, "Lý do phải từ 5 ký tự").max(500),
  startDate: z.string().min(1, "Vui lòng chọn ngày"),
  employeeShiftId: z.string().min(1, "Chọn ca hiện tại"),
  swapWithEmployeeId: z.string().min(1, "Chọn nhân viên đổi ca"),
  swapWithShiftId: z.string().min(1, "Chọn ca cần đổi"),
})

type FormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ShiftChangeRequestSheet({ open, onOpenChange }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      startDate: "",
      employeeShiftId: "",
      swapWithEmployeeId: "",
      swapWithShiftId: "",
    },
  })

  const { data: shifts } = useShifts()
  const { data: employeeData } = useEmployees({ page: 1, limit: 100 })
  const mutation = useSubmitShiftChangeRequest()

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-popover rounded-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Gửi yêu cầu đổi ca làm việc</DialogTitle>
          <DialogDescription>
            Đề xuất thay đổi ca làm việc với đồng nghiệp. Yêu cầu cần được cấp trên phê duyệt.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Left Column: Date & Current Shift */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                  <Calendar size={16} />
                  <span>Thời gian</span>
                </div>

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày muốn đổi ca <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" className="h-11 rounded-2xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employeeShiftId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ca hiện tại của bạn <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-2xl border-border h-11 bg-muted/30 shadow-none">
                            <SelectValue placeholder="-- Chọn ca của bạn --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-xl">
                          {shifts?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column: Swap Partner & Target Shift */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                  <Repeat size={16} />
                  <span>Thông tin đối ứng</span>
                </div>

                <FormField
                  control={form.control}
                  name="swapWithEmployeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Đổi với nhân viên <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-2xl border-border h-11 bg-muted/30 shadow-none">
                            <SelectValue placeholder="-- Chọn đồng nghiệp --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-xl">
                          {employeeData?.data.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="swapWithShiftId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ca muốn đổi sang <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-2xl border-border h-11 bg-muted/30 shadow-none">
                            <SelectValue placeholder="-- Chọn ca cần đổi --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-xl">
                          {shifts?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
                <MessageSquare size={16} />
                <span>Lý do gửi yêu cầu</span>
              </div>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="VD: Cần giải quyết việc gia đình, đổi ca để đi khám bệnh..."
                        className="resize-none min-h-24 rounded-2xl p-4 bg-muted/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-md" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi yêu cầu
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
