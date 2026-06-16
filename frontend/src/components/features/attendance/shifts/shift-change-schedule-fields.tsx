import {
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
import type { IWorkingShift } from "@/types/attendance.types"

import { Calendar } from "lucide-react"
import type { Control } from "react-hook-form"

import type { ShiftChangeFormValues } from "./shift-change-form-schema"

interface ShiftChangeScheduleFieldsProps {
  control: Control<ShiftChangeFormValues>
  shifts: IWorkingShift[] | undefined
}

export function ShiftChangeScheduleFields({ control, shifts }: ShiftChangeScheduleFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
        <Calendar size={16} />
        <span>Schedule</span>
      </div>

      <FormField
        control={control}
        name="startDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Shift Date <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input type="date" className="h-11 rounded-2xl" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="employeeShiftId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Your Current Shift <span className="text-destructive">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="rounded-2xl border-border h-11 bg-muted/30 shadow-none">
                  <SelectValue placeholder="-- Select your shift --" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="border-border rounded-xl">
                {shifts?.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
