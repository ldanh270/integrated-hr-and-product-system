import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAuthTools } from "./tools/auth.tools.js";
import { registerAttendanceTools } from "./tools/attendance.tools.js";
import { registerProjectTools } from "./tools/project.tools.js";
import { registerPayrollTools } from "./tools/payroll.tools.js";
import { registerApplicationTools } from "./tools/application.tools.js";

// Initialize MCP Server
export const mcpServer = new McpServer({
	name: "HRP-MCP-Server",
	version: "1.0.0",
});

// Function to register all tools
export const registerTools = () => {
	registerAuthTools();
	registerAttendanceTools();
	registerProjectTools();
	registerPayrollTools();
	registerApplicationTools();
};
