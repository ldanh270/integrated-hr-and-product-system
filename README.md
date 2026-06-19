# HRP MCP Server

HRP MCP Server is a Model Context Protocol (MCP) server that connects your AI assistants (like Claude Desktop or Cursor) to the internal HRP backend system. It exposes over 70 tools covering Authentication, Attendance, Projects & Tasks, Payroll, and Applications.

## Features

- **Authentication:** Login, logout, change password, forgot password.
- **Attendance & Shifts:** Check-in, check-out, smart scan, view schedules, shift swaps.
- **Projects & Tasks:** Manage projects, add/remove team members, manage tasks, log spent time.
- **Payroll:** Manage salary components, variables, payslip templates, configure employee salary, generate payrolls, approve/reject payrolls, and view payslips.
- **Applications:** Create and manage applications for leave, overtime, work from home, shift swaps, business trips, late/early arrivals, and regime.

## Installation & Configuration

### Option 1: Self-hosted (Clone & Run)

1. Clone this repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env` and configure your API URL:
   ```env
   HRP_API_BASE_URL=http://localhost:5000
   ```
4. Build the project:
   ```bash
   pnpm build
   ```
5. Configure your MCP Client (e.g., Claude Desktop or Cursor) by adding the following to your `mcpServers` config:
   ```json
   {
     "mcpServers": {
       "hrp": {
         "command": "node",
         "args": ["/absolute/path/to/hrp-mcp-server/dist/server.js", "--stdio"]
       }
     }
   }
   ```

### Option 2: Run via `npx` (If published to npm)

If this package is published to an npm registry (public or private), you can use it directly without cloning:

```json
{
  "mcpServers": {
    "hrp": {
      "command": "npx",
      "args": ["-y", "@yourorg/hrp-mcp-server", "--stdio"],
      "env": {
        "HRP_API_BASE_URL": "http://localhost:5000"
      }
    }
  }
}
```

## How to Use

Once connected, your AI assistant will have access to tools starting with the prefixes:
- `auth_*`
- `attendance_*`, `shift_*`, `schedule_*`
- `project_*`, `task_*`, `category_*`, `spent_time_*`
- `salary_component_*`, `salary_variable_*`, `payslip_template_*`, `salary_config_*`, `payroll_*`
- `application_*`

**Important Note:** Every tool requires a `sessionId`. To get started, you must first ask the AI to log in using the `auth_login` tool with your credentials. The AI will then automatically pass the returned `sessionId` to subsequent tool calls.

## Development

- Start in dev mode (watch): `pnpm dev`
- Build the server: `pnpm build`
- Start built server: `pnpm start` (Runs the HTTP streamable server by default)
- Start in STDIO mode: `node dist/server.js --stdio`