import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useEmployees } from "@/hooks/employees/queries/useEmployeeQuery"
import { cn } from "@/lib/utils"

import { useState } from "react"

import { Check, ChevronsUpDown, Search } from "lucide-react"
import type { Control } from "react-hook-form"
import type { UseFormSetValue } from "react-hook-form"

import type { ShiftChangeFormValues } from "./shift-change-form-schema"

interface EmployeeComboboxFieldProps {
  control: Control<ShiftChangeFormValues>
  setValue: UseFormSetValue<ShiftChangeFormValues>
}

export function EmployeeComboboxField({ control, setValue }: EmployeeComboboxFieldProps) {
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false)
  const { data: employeeData, isLoading: isLoadingEmployees } = useEmployees({
    page: 1,
    limit: 10,
    search: employeeSearch,
  })

  return (
    <FormField
      control={control}
      name="swapWithEmployeeId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>
            Swap with Colleague <span className="text-destructive">*</span>
          </FormLabel>
          <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between rounded-2xl border-border h-11 bg-muted/30 shadow-none font-normal px-3",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {field.value
                    ? employeeData?.data.find((employee) => employee.id === field.value)?.fullName ||
                      "Selected Employee"
                    : "-- Select colleague --"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search employee name..."
                  value={employeeSearch}
                  onChange={(event) => {
                    setEmployeeSearch(event.target.value)
                  }}
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {isLoadingEmployees ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                ) : employeeData?.data.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No employee found.</div>
                ) : (
                  employeeData?.data.map((employee) => (
                    <div
                      key={employee.id}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                        field.value === employee.id && "bg-accent text-accent-foreground",
                      )}
                      onClick={() => {
                        setValue("swapWithEmployeeId", employee.id)
                        setEmployeePopoverOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          field.value === employee.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {employee.fullName} ({employee.username})
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
  )
}
