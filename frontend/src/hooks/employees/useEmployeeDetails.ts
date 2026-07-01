import { ROLE } from "@/config/entities/employee.config"
import { usePermission } from "@/hooks/use-permission"
import { ROUTES } from "@/config/routes.config"

import { useState } from "react"

import { useNavigate, useParams } from "react-router-dom"

import { useEmployee } from "./queries/useEmployeeQuery"

export const useEmployeeDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: employee, isLoading, error } = useEmployee(id!)
  const { hasRole, roles } = usePermission()

  const isAdminOrManager =
    roles.length > 0 &&
    [ROLE.ADMIN, ROLE.HR_MANAGER, ROLE.GENERAL_MANAGER].some((role) => hasRole(role))

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const handleBackToList = () => {
    navigate(ROUTES.HRM.EMPLOYEES)
  }

  return {
    employee,
    isLoading,
    error,
    isAdminOrManager,
    isEditModalOpen,
    setIsEditModalOpen,
    handleBackToList,
  }
}
