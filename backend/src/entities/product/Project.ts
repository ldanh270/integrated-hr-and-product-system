import { PROJECT_STATUSES } from "@/configs/entities.config.ts"

import mongoose, { Document, InferSchemaType, Model } from "mongoose"

const projectMemberSubSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    removedAt: {
      type: Date,
      default: null, // null mean member is active, set date when removed from project
    },
  },
  { _id: false },
)

type ProjectMemberType = InferSchemaType<typeof projectMemberSubSchema>

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    // List of technologies used in the project (e.g. ["React", "Node.js", "MongoDB"])
    techStack: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: "planning",
      required: true,
    },

    startDate: {
      type: Date,
    },

    expectedEndDate: {
      type: Date,
    },

    actualEndDate: {
      type: Date,
      default: null,
    },

    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Members of the project (array of employee references with join/leave timestamps)
    members: {
      type: [projectMemberSubSchema],
      default: [],
      validate: {
        validator: function (val: ProjectMemberType[]) {
          return val.length <= 200
        },
        message: "Project members array cannot exceed 200 entries to prevent document bloating.",
      },
    },
  },
  { timestamps: true },
)

// Indexing for performance optimization
projectSchema.index({ status: 1 })

// Optimize queries that filter projects by team leader and status
projectSchema.index({ teamLeaderId: 1, status: 1 })

projectSchema.index({ "members.employeeId": 1 }, { name: "idx_project_members" })

const Project = mongoose.model("Project", projectSchema)

export default Project

// Export types for reuse in Services/Controllers
export type ProjectType = InferSchemaType<typeof projectSchema>
export type ProjectDocument = Document & ProjectType
export type ProjectModel = Model<ProjectDocument>
