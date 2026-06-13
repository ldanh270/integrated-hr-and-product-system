import { Button } from "@/components/ui/button"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useShifts } from "@/hooks/attendance/use-shifts"
import { useSubmitShiftChangeRequest } from "@/hooks/attendance/use-shift-change-requests"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

/**
 * formSchema — Zod validation schema for shift change requests.
 */
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
 * ShiftChangeRequestSheet — Side sheet form for employees to request a shift swap with a colleague.
 * Replaces manual ID inputs with searchable Select/Combobox components.
 */
export default function ShiftChangeRequestSheet({ open, onOpenChange }: Props) {
  /**
   * useForm — Initializes react-hook-form with Zod validation.
   * Manages form state and error tracking.
   */
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
   * useShifts — Custom hook to fetch all available working shifts.
   * Calls API: shiftsApi.getAll
   */
  const { data: shifts } = useShifts()
  /**
   * useEmployees — Custom hook to fetch a list of employees for the swap.
   * Calls API: employeeApi.list
   */
  const { data: employeeData } = useEmployees({ page: 1, limit: 100 })
  /**
   * useSubmitShiftChangeRequest — Mutation hook to submit the swap request to Backend.
   * Calls API: shiftChangeRequestsApi.submit
   */
  const mutation = useSubmitShiftChangeRequest()

  /**
   * onSubmit — Handler for form submission.
   * Calls the mutation and resets the form upon successful submission.
   * @param {FormValues} values — The validated form data.
   */
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values, {
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto flex flex-col h-full bg-background border-l">
        <SheetHeader className="mb-6">
          <SheetTitle>Gửi yêu cầu đổi ca</SheetTitle>
          <SheetDescription>Điền thông tin để gửi yêu cầu đổi ca làm việc.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col space-y-6">
            <div className="flex-1 space-y-5">
              {/* Date selection for the swap */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Ngày đổi ca <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4 border-t">
                <p className="font-semibold text-sm text-primary uppercase tracking-wider">
                  Thông tin đổi ca
                </p>

                {/* Current Shift selection */}
                <FormField
                  control={form.control}
                  name="employeeShiftId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Ca hiện tại của bạn <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-border h-11 bg-card shadow-none">
                            <SelectValue placeholder="-- Chọn ca của bạn --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-md shadow-sm">
                          {shifts?.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="cursor-pointer">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Employee selection for the swap */}
                <FormField
                  control={form.control}
                  name="swapWithEmployeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nhân viên đổi ca cùng <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-border h-11 bg-card shadow-none">
                            <SelectValue placeholder="-- Chọn đồng nghiệp --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-md shadow-sm">
                          {employeeData?.data.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id} className="cursor-pointer">
                              {emp.fullName} ({emp.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Shift selection for the swap */}
                <FormField
                  control={form.control}
                  name="swapWithShiftId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Ca bạn muốn đổi sang <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-border h-11 bg-card shadow-none">
                            <SelectValue placeholder="-- Chọn ca cần đổi --" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="border-border rounded-md shadow-sm">
                          {shifts?.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="cursor-pointer">
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Justification for the swap request */}
              <div className="pt-4 border-t">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Lý do <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nêu lý do muốn đổi ca..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <SheetFooter className="pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi yêu cầu
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
