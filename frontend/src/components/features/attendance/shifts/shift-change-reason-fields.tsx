import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Textarea } from "@/components/ui/textarea"

import { MessageSquare } from "lucide-react"
import type { Control } from "react-hook-form"

import type { ShiftChangeFormValues } from "./shift-change-form-schema"

interface ShiftChangeReasonFieldsProps {
  control: Control<ShiftChangeFormValues>
}

export function ShiftChangeReasonFields({ control }: ShiftChangeReasonFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
        <MessageSquare size={16} />
        <span>Reason Details</span>
      </div>
      <FormField
        control={control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Reason for Request <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g., Personal business, swapping to visit doctor..."
                className="resize-none min-h-24 rounded-2xl p-4 bg-muted/20"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
