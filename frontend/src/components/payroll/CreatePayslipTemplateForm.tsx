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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useCreatePayslipTemplate } from "@/hooks/payroll/use-payslip-templates"
import {
  type CreatePayslipTemplateFormData,
  createPayslipTemplateSchema,
} from "@/schemas/payroll.schema"
import type { ISalaryComponent } from "@/types/payroll.types"

import { useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft, Plus } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"

import { SalaryComponentSelectModal } from "./SalaryComponentSelectModal"

// Extend the form data to hold the local UI state for columns shown in the mockup
interface ExtendedFormData extends CreatePayslipTemplateFormData {
  components: Array<{
    componentId: string
    overrideFormula?: string
    // UI Only properties
    _name?: string
    _code?: string
    _displayName?: string
    _isDisplayed?: boolean
  }>
}

interface CreatePayslipTemplateFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreatePayslipTemplateForm({ onSuccess, onCancel }: CreatePayslipTemplateFormProps) {
  const { mutateAsync: createTemplate, isPending } = useCreatePayslipTemplate()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const form = useForm<ExtendedFormData>({
    resolver: zodResolver(createPayslipTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      components: [],
    },
  })

  const { fields, append } = useFieldArray({
    control: form.control,
    name: "components",
  })

  const existingComponentIds = fields.map((f) => f.componentId)

  const handleSelectComponents = (selectedComps: ISalaryComponent[]) => {
    selectedComps.forEach((comp) => {
      append({
        componentId: comp.id,
        overrideFormula: comp.formula,
        _name: comp.name,
        _displayName: comp.name,
        _isDisplayed: true,
      })
    })
  }

  const onSubmit = async (data: ExtendedFormData) => {
    try {
      // Strip UI-only properties before sending to API
      const payload = {
        name: data.name,
        description: data.description,
        components: data.components.map((c) => ({
          componentId: c.componentId,
          overrideFormula: c.overrideFormula?.trim() || undefined,
        })),
      }
      await createTemplate(payload)
      toast.success("Tạo mẫu bảng lương thành công.")
      form.reset()
      onSuccess?.()
    } catch {
      toast.error("Lỗi khi tạo mẫu bảng lương. Vui lòng thử lại.")
    }
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#FBFBFA]">
      {/* Header Bar */}
      <div className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 bg-white border-b border-[#EAEAEA]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="rounded-full hover:bg-[#F7F6F3]"
        >
          <ChevronLeft className="w-5 h-5 text-[#111111]" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight text-[#111111]">
          Tạo mới mẫu bảng lương
        </h1>
      </div>

      <div className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <Form {...form}>
          <form
            id="create-template-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Section 1: Thông tin mẫu bảng lương */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-none">
              <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#FBFBFA]">
                <h2 className="font-semibold text-[#111111]">Thông tin mẫu bảng lương</h2>
              </div>
              <div className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#111111]">
                        Tên bảng lương mẫu <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tên mẫu bảng lương"
                          {...field}
                          className="rounded-full border-[#EAEAEA] shadow-none"
                        />
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
                      <FormLabel className="text-[#111111]">Mô tả</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập mô tả"
                          {...field}
                          className="rounded-xl border-[#EAEAEA] shadow-none min-h-[100px] resize-y"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 2: Thành phần lương */}
            <div className="bg-white border border-[#EAEAEA] rounded-xl overflow-hidden shadow-none">
              <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#FBFBFA] flex items-center justify-between">
                <h2 className="font-semibold text-[#111111]">Thành phần lương</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#787774]">Sao chép mẫu lương đã có</span>
                  <Select>
                    <SelectTrigger className="w-50 rounded-full border-[#EAEAEA] shadow-none bg-white">
                      <SelectValue placeholder="Chọn mẫu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Chưa có mẫu nào
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6">
                <div className="border border-[#EAEAEA] rounded-xl overflow-hidden bg-white mb-4">
                  <Table>
                    <TableHeader className="bg-[#FBFBFA]">
                      <TableRow className="border-b border-[#EAEAEA] hover:bg-transparent">
                        <TableHead className="font-semibold text-[#111111]">
                          Tên thành phần
                        </TableHead>
                        <TableHead className="font-semibold text-[#111111]">
                          Tên cột hiển thị
                        </TableHead>
                        <TableHead className="font-semibold text-[#111111]">Giá trị tính</TableHead>
                        <TableHead className="text-center font-semibold text-[#111111]">
                          Hiển thị
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-full border-[#EAEAEA] text-[#111111] hover:bg-[#F7F6F3] shadow-none px-6"
                              onClick={() => setIsModalOpen(true)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Thêm thành phần
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        fields.map((field, index) => (
                          <TableRow
                            key={field.id}
                            className="border-b border-[#EAEAEA] hover:bg-[#F7F6F3]"
                          >
                            <TableCell>
                              <Input
                                disabled
                                value={field._name}
                                className="bg-transparent border-none shadow-none text-[#111111] px-0 disabled:opacity-100"
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`components.${index}._displayName`}
                                render={({ field: inputField }) => (
                                  <Input
                                    {...inputField}
                                    className="rounded-full border-[#EAEAEA] shadow-none h-8 text-[#111111]"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`components.${index}.overrideFormula`}
                                render={({ field: inputField }) => (
                                  <Input
                                    {...inputField}
                                    className="rounded-full border-[#EAEAEA] shadow-none h-8 font-mono text-sm text-[#111111]"
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <FormField
                                control={form.control}
                                name={`components.${index}._isDisplayed`}
                                render={({ field: inputField }) => (
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-[#EAEAEA] cursor-pointer accent-[#111111]"
                                    checked={inputField.value}
                                    onChange={inputField.onChange}
                                  />
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {fields.length > 0 && (
                  <div className="flex justify-center mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-[#EAEAEA] text-[#111111] hover:bg-[#F7F6F3] shadow-none px-6"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm thành phần
                    </Button>
                  </div>
                )}
                {form.formState.errors.components?.root && (
                  <p className="text-sm font-medium text-destructive mt-2 text-center">
                    {form.formState.errors.components.root.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        </Form>
      </div>

      {/* Footer Bar */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-[#EAEAEA]">
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-none px-8"
          onClick={onCancel}
        >
          Huỷ bỏ
        </Button>
        <Button
          type="submit"
          form="create-template-form"
          className="rounded-full bg-[#111111] text-white hover:bg-[#333333] shadow-none px-10"
          disabled={isPending}
        >
          {isPending ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>

      <SalaryComponentSelectModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        existingComponentIds={existingComponentIds}
        onSelect={handleSelectComponents}
      />
    </div>
  )
}
