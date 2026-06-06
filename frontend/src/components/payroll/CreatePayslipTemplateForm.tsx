
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form-ui"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import {
  createPayslipTemplateSchema,
  type CreatePayslipTemplateFormData,
} from "@/schemas/payroll.schema"
import {
  useCreatePayslipTemplate,
} from "@/hooks/payroll/use-payslip-templates"
import { useSalaryComponents as useComponentsFetcher } from "@/hooks/payroll/use-salary-components"
import { toast } from "sonner"

interface CreatePayslipTemplateFormProps {
  onSuccess?: () => void
}

export function CreatePayslipTemplateForm({ onSuccess }: CreatePayslipTemplateFormProps) {
  const { data: salaryComponents, isLoading: isComponentsLoading } = useComponentsFetcher()
  const { mutateAsync: createTemplate, isPending } = useCreatePayslipTemplate()

  const form = useForm<CreatePayslipTemplateFormData>({
    resolver: zodResolver(createPayslipTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      components: [{ componentId: "", overrideFormula: "" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  })

  const onSubmit = async (data: CreatePayslipTemplateFormData) => {
    try {
      const payload = {
        ...data,
        components: data.components.map(c => ({
          componentId: c.componentId,
          overrideFormula: c.overrideFormula?.trim() || undefined
        }))
      }
      await createTemplate(payload)
      toast.success("Payslip template created successfully.")
      form.reset()
      onSuccess?.()
    } catch {
      toast.error("Failed to create template. Please try again.")
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto rounded-xl">
      <CardHeader>
        <CardTitle>Create Payslip Template</CardTitle>
        <CardDescription>
          Design a new template by selecting salary components and defining formula overrides.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Standard Full-time 2024" {...field} className="rounded-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description about this template" {...field} className="rounded-lg resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Salary Components</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => append({ componentId: "", overrideFormula: "" })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Component
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                  No components added yet.
                </p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`components.${index}.componentId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Component</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="rounded-full">
                                  <SelectValue placeholder="Select a component" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isComponentsLoading ? (
                                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : (
                                  salaryComponents?.map((comp) => (
                                    <SelectItem key={comp.id} value={comp.id}>
                                      {comp.name} ({comp.type})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`components.${index}.overrideFormula`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Override Formula (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. baseSalary * 0.1" {...field} className="rounded-full" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-8 text-destructive hover:bg-destructive/10 rounded-full"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {form.formState.errors.components?.root && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.components.root.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="rounded-full px-8" disabled={isPending}>
                {isPending ? "Creating..." : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
