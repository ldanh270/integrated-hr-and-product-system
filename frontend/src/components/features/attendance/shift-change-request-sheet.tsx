import { FormActionFooter } from "@/components/common/form-action-footer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { cn } from "@/lib/utils"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Check, ChevronsUpDown, MessageSquare, Repeat, Search } from "lucide-react"
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

/**
 * Component hiển thị dialog để gửi yêu cầu đổi ca làm việc với đồng nghiệp.
 * @param props - Các thuộc tính của component bao gồm trạng thái open và hàm onOpenChange.
 */
export function ShiftChangeRequestDialog({ open, onOpenChange }: Props) {
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false)

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

  /**
   * useShifts - Hook lấy danh sách các ca làm việc có sẵn.
   * Calls API: shiftsApi.getAll
   */
  const { data: shifts } = useShifts()

  /**
   * useEmployees - Hook lấy danh sách nhân viên với tính năng tìm kiếm.
   * Limit được đặt là 10 để tối ưu hiệu năng, kết hợp với tìm kiếm từ server.
   * Calls API: employeeApi.list
   */
  const { data: employeeData, isLoading: isLoadingEmployees } = useEmployees({ 
    page: 1, 
    limit: 10,
    search: employeeSearch 
  })
  
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Đổi với nhân viên <span className="text-destructive">*</span></FormLabel>
                      <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between rounded-2xl border-border h-11 bg-muted/30 shadow-none font-normal px-3",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? employeeData?.data.find((emp) => emp.id === field.value)?.fullName || "Nhân viên đã chọn"
                                : "-- Chọn đồng nghiệp --"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Tìm tên nhân viên..."
                              value={employeeSearch}
                              onChange={(e) => { setEmployeeSearch(e.target.value) }}
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto p-1">
                            {isLoadingEmployees ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">Đang tải...</div>
                            ) : employeeData?.data.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">Không tìm thấy nhân viên.</div>
                            ) : (
                              employeeData?.data.map((emp) => (
                                <div
                                  key={emp.id}
                                  className={cn(
                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    field.value === emp.id && "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() => {
                                    form.setValue("swapWithEmployeeId", emp.id);
                                    setEmployeePopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === emp.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {emp.fullName} ({emp.username})
                                </div>
                              ))
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
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
                <span>Chi tiết lý do</span>
              </div>
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lý do gửi yêu cầu <span className="text-destructive">*</span></FormLabel>
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

            <FormActionFooter 
              onCancel={() => { onOpenChange(false); }}
              submitLabel="Gửi yêu cầu"
              isPending={mutation.isPending}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ShiftChangeRequestDialog
