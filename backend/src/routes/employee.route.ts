import { EmployeeController } from "@/controllers/employee.controller.ts"
import Employee from "@/entities/Employee.ts"
import { MongoEmployeeRepository } from "@/repositories/employee.repository.ts"
import { EmployeeService } from "@/services/employee.service.ts"

import express from "express"

const employeeRoutes = express.Router()

const repository = new MongoEmployeeRepository(Employee as any)
const service = new EmployeeService(repository)
const controller = new EmployeeController(service)

employeeRoutes.get("/", controller.list)

export default employeeRoutes
