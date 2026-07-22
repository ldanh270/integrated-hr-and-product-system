import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { IFamilyMemberItem, IEmployeeWizardFormData } from "@/types/employee-wizard.types"
import { ChevronDown, ChevronUp, PlusCircle, Trash2 } from "lucide-react"

interface FamilyTabProps {
  formData: IEmployeeWizardFormData
  updateField: <K extends keyof IEmployeeWizardFormData>(
    field: K,
    value: IEmployeeWizardFormData[K]
  ) => void
  addFamilyMember: () => void
  updateFamilyMember: (id: string, field: keyof IFamilyMemberItem, value: string | boolean) => void
  removeFamilyMember: (id: string) => void
}

export function FamilyTab({
  formData,
  updateField,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
}: FamilyTabProps) {
  const [openFamilyInfo, setOpenFamilyInfo] = useState(true)
  const [openMembers, setOpenMembers] = useState(true)

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Thông tin gia đình ────────────────────────────────────────── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenFamilyInfo(!openFamilyInfo)}
          className="w-full px-6 py-4 flex items-center justify-between bg-muted/20 border-b border-border text-left font-semibold text-sm text-foreground"
        >
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {openFamilyInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            Thông tin gia đình
          </div>
        </button>

        {openFamilyInfo && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Mã hộ gia đình</Label>
              <Input
                placeholder="Nhập mã"
                value={formData.familyCode}
                onChange={(e) => updateField("familyCode", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Họ và tên chủ hộ</Label>
              <Input
                placeholder="Nhập họ và tên"
                value={formData.headFullName}
                onChange={(e) => updateField("headFullName", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Số điện thoại</Label>
              <Input
                placeholder="Nhập số điện thoại"
                value={formData.headPhone}
                onChange={(e) => updateField("headPhone", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Số CCCD/ĐDCN</Label>
              <Input
                placeholder="Nhập số điện thoại"
                value={formData.headNationalId}
                onChange={(e) => updateField("headNationalId", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Địa chỉ hộ khẩu</Label>
              <Input
                placeholder="Vd: k73/67 Nút Thành"
                value={formData.householdAddress}
                onChange={(e) => updateField("householdAddress", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tỉnh/Thành phố</Label>
              <Input
                placeholder="Chọn Tỉnh/Thành phố"
                value={formData.householdProvince}
                onChange={(e) => updateField("householdProvince", e.target.value)}
                className="rounded-full"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phường/Xã</Label>
              <Input
                placeholder="Chọn Xã/Phường"
                value={formData.householdDistrict}
                onChange={(e) => updateField("householdDistrict", e.target.value)}
                className="rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Thành viên gia đình ────────────────────────────────────────── */}
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between bg-muted/20 border-b border-border">
          <button
            type="button"
            onClick={() => setOpenMembers(!openMembers)}
            className="flex items-center gap-2 font-semibold text-sm text-foreground"
          >
            <span className="text-muted-foreground">
              {openMembers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            Thành viên gia đình
          </button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addFamilyMember}
            className="text-primary hover:text-primary/90 text-xs font-medium gap-1"
          >
            <PlusCircle size={15} /> Thêm thành viên
          </Button>
        </div>

        {openMembers && (
          <div className="p-6 overflow-x-auto">
            {formData.familyMembers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground italic mb-2">Chưa có thành viên gia đình nào được thêm</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFamilyMember}
                  className="rounded-full text-xs"
                >
                  + Thêm dòng thành viên
                </Button>
              </div>
            ) : (
              <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs">CMND/CCCD/Hộ chiếu</TableHead>
                    <TableHead className="text-xs w-28">Giới tính</TableHead>
                    <TableHead className="text-xs w-36">Ngày sinh</TableHead>
                    <TableHead className="text-xs w-28">Quốc tịch</TableHead>
                    <TableHead className="text-xs w-28">Dân tộc</TableHead>
                    <TableHead className="text-xs">Quan hệ</TableHead>
                    <TableHead className="text-xs">Địa chỉ khai sinh</TableHead>
                    <TableHead className="text-xs w-24 text-center">Người phụ thuộc</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.familyMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="p-2">
                        <Input
                          placeholder="Vui lòng nhập..."
                          value={member.nationalId}
                          onChange={(e) => updateFamilyMember(member.id, "nationalId", e.target.value)}
                          className="rounded-full text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Select
                          value={member.gender}
                          onValueChange={(val) => updateFamilyMember(member.id, "gender", val)}
                        >
                          <SelectTrigger className="rounded-full text-xs h-8">
                            <SelectValue placeholder="Chọn" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Nam</SelectItem>
                            <SelectItem value="female">Nữ</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          type="date"
                          value={member.dateOfBirth}
                          onChange={(e) => updateFamilyMember(member.id, "dateOfBirth", e.target.value)}
                          className="rounded-full text-xs h-8"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          placeholder="Việt Nam"
                          value={member.nationality}
                          onChange={(e) => updateFamilyMember(member.id, "nationality", e.target.value)}
                          className="rounded-full text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          placeholder="Kinh"
                          value={member.ethnicity}
                          onChange={(e) => updateFamilyMember(member.id, "ethnicity", e.target.value)}
                          className="rounded-full text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          placeholder="Nhập mô tả quan hệ..."
                          value={member.relationship}
                          onChange={(e) => updateFamilyMember(member.id, "relationship", e.target.value)}
                          className="rounded-full text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          placeholder="Nhập địa chỉ..."
                          value={member.birthAddress}
                          onChange={(e) => updateFamilyMember(member.id, "birthAddress", e.target.value)}
                          className="rounded-full text-xs"
                        />
                      </TableCell>
                      <TableCell className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={member.isDependent}
                          onChange={(e) =>
                            updateFamilyMember(member.id, "isDependent", e.target.checked)
                          }
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className="p-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFamilyMember(member.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
