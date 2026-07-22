import { BioTab } from "@/components/features/employees/wizard/BioTab"
import { FamilyTab } from "@/components/features/employees/wizard/FamilyTab"
import { JobTab } from "@/components/features/employees/wizard/JobTab"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useEmployeeCreateWizard } from "@/hooks/employees/useEmployeeCreateWizard"
import { routerNavigate } from "@/lib/router-navigator"
import { HelpCircle } from "lucide-react"

export default function EmployeeCreatePage() {
  const {
    activeTab,
    setActiveTab,
    formData,
    updateField,

    addEducation,
    updateEducation,
    removeEducation,

    addExperience,
    updateExperience,
    removeExperience,

    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,

    isConfirmModalOpen,
    setIsConfirmModalOpen,
    handleNextTab,
    handleFinalSubmit,
    isSubmitting,
  } = useEmployeeCreateWizard()

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      {/* Header Breadcrumb */}
      <div className="px-8 py-4 border-b border-border bg-card/40 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="cursor-pointer hover:text-foreground" onClick={() => routerNavigate("/hrm/employees")}>
            Hồ sơ nhân sự
          </span>
          <span>&gt;</span>
          <span className="font-medium text-foreground">Tạo mới hồ sơ nhân sự</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Tab Bar Navigation */}
        <div className="border border-border rounded-xl bg-card overflow-hidden p-1 flex items-center gap-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("bio")}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-lg transition-all text-center ${
              activeTab === "bio"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Sơ yếu lý lịch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("job")}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-lg transition-all text-center ${
              activeTab === "job"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Công việc
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("family")}
            className={`flex-1 py-3 px-6 text-sm font-medium rounded-lg transition-all text-center ${
              activeTab === "family"
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Thành viên gia đình
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "bio" && (
          <BioTab
            formData={formData}
            updateField={updateField}
            addEducation={addEducation}
            updateEducation={updateEducation}
            removeEducation={removeEducation}
            addExperience={addExperience}
            updateExperience={updateExperience}
            removeExperience={removeExperience}
          />
        )}

        {activeTab === "job" && <JobTab formData={formData} updateField={updateField} />}

        {activeTab === "family" && (
          <FamilyTab
            formData={formData}
            updateField={updateField}
            addFamilyMember={addFamilyMember}
            updateFamilyMember={updateFamilyMember}
            removeFamilyMember={removeFamilyMember}
          />
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-0 border-t border-border bg-card/90 backdrop-blur px-8 py-4 flex items-center justify-end gap-3 z-10 shadow-md">
        <Button
          type="button"
          variant="outline"
          onClick={() => routerNavigate("/hrm/employees")}
          className="rounded-full px-6"
        >
          Huỷ bỏ
        </Button>
        <Button
          type="button"
          onClick={handleNextTab}
          className="rounded-full px-6 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {activeTab === "family" ? "Lưu" : "Tiếp tục"}
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-[420px] rounded-xl text-center">
          <DialogHeader className="items-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
              <HelpCircle size={28} />
            </div>
            <DialogTitle className="text-center font-bold text-lg">Xác nhận</DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground pt-1">
              Xác nhận tạo mới nhân sự
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              className="rounded-full min-w-24"
              disabled={isSubmitting}
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={handleFinalSubmit}
              className="rounded-full min-w-24 bg-primary text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Đồng ý"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
