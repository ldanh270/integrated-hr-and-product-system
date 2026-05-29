import { TASK_PRIORITIES, TASK_STATUSES } from "@/configs/constants/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "medium",
      required: true,
    },

    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "todo",
      required: true,
    },

    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null, // Unassigned
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

// Kanban board: load tasks theo project + status
taskSchema.index({ projectId: 1, status: 1 })

// My tasks: tasks được assign cho một employee
taskSchema.index({ assigneeId: 1, status: 1 }, { sparse: true })

// Tìm task quá hạn
taskSchema.index(
  { dueDate: 1, status: 1 },
  {
    name: "idx_overdue_tasks",
    partialFilterExpression: {
      status: { $nin: ["done", "cancelled"] },
      dueDate: { $exists: true },
    },
  },
)

// Pre-save hook: tự động set completedAt khi status = "done"
taskSchema.pre<TaskDocument>("save", async function () {
  if (this.isModified("status")) {
    if (this.status === "done" && this.completedAt == null) {
      this.completedAt = new Date()
    } else if (this.status !== "done") {
      this.completedAt = null // Reset nếu reopen task
    }
  }
})

const Task = mongoose.model("Task", taskSchema)

export default Task

// Xuất type để tái sử dụng trong các Service/Controller
export type TaskType = InferSchemaType<typeof taskSchema>
export type TaskDocument = Document & TaskType
export type TaskModel = Model<TaskDocument>
