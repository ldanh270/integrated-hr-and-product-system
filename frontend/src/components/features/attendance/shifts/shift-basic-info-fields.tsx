import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

import { Clock, Info } from "lucide-react"
import type { Control } from "react-hook-form"

import type { ShiftFormValues } from "./shift-form-schema"

interface ShiftBasicInfoFieldsProps {
  control: Control<ShiftFormValues>
}

export function ShiftBasicInfoFields({ control }: ShiftBasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
        <Info size={16} />
        <span>Basic Information</span>
      </div>

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Shift Name <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="e.g., Morning Shift, Office Hours..." className="h-11" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                Start Time <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="time" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                End Time <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input type="time" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <FormField
          control={control}
          name="gracePeriodMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grace Period (minutes)</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={120} className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border/50 h-11">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="!mt-0 cursor-pointer">Activate Shift</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
