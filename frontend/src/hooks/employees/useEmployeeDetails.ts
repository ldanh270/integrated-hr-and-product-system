import { ROLE } from "@/config/entities/employee.config"
import { ROUTES } from "@/config/routes.config"
import { useAuthStore } from "@/store/auth-store"

import { useState } from "react"

import { useNavigate, useParams } from "react-router-dom"

import { useEmployee } from "./queries/useEmployeeQuery"

export const useEmployeeDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: employee, isLoading, error } = useEmployee(id!)
  const user = useAuthStore((state) => state.user)

  const isAdminOrManager =
    user?.role === ROLE.ADMIN ||
    user?.role === ROLE.HR_MANAGER ||
    user?.role === ROLE.GENERAL_MANAGER

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
