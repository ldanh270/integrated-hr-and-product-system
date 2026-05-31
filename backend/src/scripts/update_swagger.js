const fs = require('fs')
const path = require('path')

const swaggerPath = path.join(__dirname, '..', '..', 'swagger.yaml')
let content = fs.readFileSync(swaggerPath, 'utf8')

const newPaths = `
  # ─── ATTENDANCE MODULE ──────────────────────────────
  /api/shifts:
    get:
      tags: [Shifts]
      summary: List all working shifts
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: List of shifts
    post:
      tags: [Shifts]
      summary: Create a working shift
      security: [{ bearerAuth: [] }]
      responses:
        '201':
          description: Shift created

  /api/shifts/{id}:
    get:
      tags: [Shifts]
      summary: Get shift by ID
      security: [{ bearerAuth: [] }]
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Shift data
    patch:
      tags: [Shifts]
      summary: Update shift
      security: [{ bearerAuth: [] }]
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Shift updated

  /api/schedules/employee/{employeeId}:
    get:
      tags: [Schedules]
      summary: Get employee schedule for a date
      security: [{ bearerAuth: [] }]
      parameters:
        - in: path
          name: employeeId
          required: true
          schema: { type: string }
        - in: query
          name: date
          schema: { type: string, format: date }
      responses:
        '200':
          description: Schedule data

  /api/schedules/assign:
    post:
      tags: [Schedules]
      summary: Assign weekly schedule to employee
      security: [{ bearerAuth: [] }]
      responses:
        '201':
          description: Schedule assigned

  /api/schedules/override:
    post:
      tags: [Schedules]
      summary: Override shift for a specific date
      security: [{ bearerAuth: [] }]
      responses:
        '201':
          description: Shift overridden

  /api/attendance:
    get:
      tags: [Attendance]
      summary: Query attendance records
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: List of attendance records

  /api/attendance/check-in:
    post:
      tags: [Attendance]
      summary: Check in
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: Checked in successfully

  /api/attendance/check-out:
    post:
      tags: [Attendance]
      summary: Check out
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: Checked out successfully

  /api/applications:
    post:
      tags: [Applications]
      summary: Submit a leave/overtime application
      security: [{ bearerAuth: [] }]
      responses:
        '201':
          description: Application submitted

  /api/applications/employee/{employeeId}:
    get:
      tags: [Applications]
      summary: Get employee applications
      security: [{ bearerAuth: [] }]
      parameters:
        - in: path
          name: employeeId
          required: true
          schema: { type: string }
      responses:
        '200':
          description: List of applications

  /api/applications/{id}/approve:
    patch:
      tags: [Applications]
      summary: Approve or reject application
      security: [{ bearerAuth: [] }]
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Application processed

  /api/holidays:
    post:
      tags: [Holidays]
      summary: Create a holiday
      security: [{ bearerAuth: [] }]
      responses:
        '201':
          description: Holiday created

  /api/holidays/check:
    get:
      tags: [Holidays]
      summary: Check if date is a holiday
      security: [{ bearerAuth: [] }]
      parameters:
        - in: query
          name: date
          schema: { type: string, format: date }
      responses:
        '200':
          description: True if holiday
`

// Insert newPaths right before "components:"
content = content.replace(/^components:/m, newPaths + '\ncomponents:')

fs.writeFileSync(swaggerPath, content, 'utf8')
console.log('Swagger updated successfully.')
