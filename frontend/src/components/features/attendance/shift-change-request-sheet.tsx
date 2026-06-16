import { FormActionFooter } from "@/components/common/form-action-footer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form } from "@/components/ui/form-ui"
import { Separator } from "@/components/ui/separator"
import { useShifts } from "@/hooks/attendance/use-shifts"
import { useSubmitShiftChangeRequest } from "@/hooks/attendance/use-shift-change-requests"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  DEFAULT_SHIFT_CHANGE_FORM_VALUES,
  shiftChangeFormSchema,
  type ShiftChangeFormValues,
} from "./shifts/shift-change-form-schema"
import { ShiftChangeReasonFields } from "./shifts/shift-change-reason-fields"
import { ShiftChangeScheduleFields } from "./shifts/shift-change-schedule-fields"
import { ShiftChangeSwapFields } from "./shifts/shift-change-swap-fields"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShiftChangeRequestDialog({ open, onOpenChange }: Props) {
  const form = useForm<ShiftChangeFormValues>({
    resolver: zodResolver(shiftChangeFormSchema),
    defaultValues: DEFAULT_SHIFT_CHANGE_FORM_VALUES,
  })

  const { data: shifts } = useShifts()
  const mutation = useSubmitShiftChangeRequest()

  const onSubmit = (values: ShiftChangeFormValues) => {
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
          <DialogTitle className="text-xl">Submit Shift Change Request</DialogTitle>
          <DialogDescription>
            Propose a shift change with a colleague. Requests require manager approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <ShiftChangeScheduleFields control={form.control} shifts={shifts} />
              <ShiftChangeSwapFields control={form.control} setValue={form.setValue} shifts={shifts} />
            </div>

            <Separator />

            <ShiftChangeReasonFields control={form.control} />

            <FormActionFooter
              onCancel={() => {
                onOpenChange(false)
              }}
              submitLabel="Submit Request"
              isPending={mutation.isPending}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default ShiftChangeRequestDialog
