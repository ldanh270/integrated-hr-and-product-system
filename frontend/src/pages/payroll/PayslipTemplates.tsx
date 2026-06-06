import { CreatePayslipTemplateForm } from "@/components/payroll/CreatePayslipTemplateForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { usePayslipTemplates } from "@/hooks/payroll/use-payslip-templates"

import { useState } from "react"

import { Plus } from "lucide-react"

export default function PayslipTemplates() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { data: templates, isLoading } = usePayslipTemplates()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Payslip Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your salary structures and component combinations.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-transparent shadow-none">
            <DialogHeader className="sr-only">
              <DialogTitle>Create New Payslip Template</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new payslip template.
              </DialogDescription>
            </DialogHeader>
            {/* The form has its own Card inside, so we render it transparently here */}
            <div className="bg-background rounded-xl">
              <CreatePayslipTemplateForm onSuccess={() => setIsDialogOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p>Loading templates...</p>
        ) : templates?.length === 0 ? (
          <p className="text-muted-foreground col-span-full py-8 text-center border rounded-xl border-dashed">
            No templates found. Create one to get started.
          </p>
        ) : (
          templates?.map((template) => (
            <div
              key={template.id}
              className="p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <h3 className="text-lg font-semibold">{template.name}</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4 line-clamp-2">
                {template.description || "No description provided."}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                  {template.components.length} Components
                </span>
                <span className={template.isActive ? "text-green-600" : "text-muted-foreground"}>
                  {template.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
