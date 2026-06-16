import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { IWorkingShift } from "@/types/attendance.types"

import { Repeat } from "lucide-react"
import type { Control, UseFormSetValue } from "react-hook-form"

import { EmployeeComboboxField } from "./employee-combobox-field"
import type { ShiftChangeFormValues } from "./shift-change-form-schema"

interface ShiftChangeSwapFieldsProps {
  control: Control<ShiftChangeFormValues>
  setValue: UseFormSetValue<ShiftChangeFormValues>
  shifts: IWorkingShift[] | undefined
}

export function ShiftChangeSwapFields({ control, setValue, shifts }: ShiftChangeSwapFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
        <Repeat size={16} />
        <span>Swap Details</span>
      </div>

      <EmployeeComboboxField control={control} setValue={setValue} />

      <FormField
        control={control}
        name="swapWithShiftId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Target Shift <span className="text-destructive">*</span>
            </FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="rounded-2xl border-border h-11 bg-muted/30 shadow-none">
                  <SelectValue placeholder="-- Select target shift --" />
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
