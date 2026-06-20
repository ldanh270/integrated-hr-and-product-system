import "dotenv/config";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { mcpServer, registerTools } from "./mcp.js";

// Register all tools before starting the server
registerTools();

const startSSEServer = () => {
	const app = express();
	const PORT = process.env.PORT || 3001;

	let transport: SSEServerTransport | null = null;

	app.get("/sse", async (req, res) => {
		console.log("Received SSE connection request");
		transport = new SSEServerTransport("/message", res);
		await mcpServer.server.connect(transport);

		// Clean up when client disconnects
		req.on("close", () => {
			console.log("Client disconnected from SSE");
			transport = null;
		});
	});

	app.post("/message", async (req, res) => {
		if (!transport) {
			res.status(400).json({ error: "SSE connection not established" });
			return;
		}
		await transport.handlePostMessage(req, res);
	});

	app.listen(PORT, () => {
		console.log(`HRP MCP Server is running on port ${PORT}`);
		console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
		console.log(`To run in STDIO mode, pass the --stdio flag`);
	});
};

const startStdioServer = async () => {
	const transport = new StdioServerTransport();
	await mcpServer.server.connect(transport);
	// In STDIO mode, ALL LOGS must use console.error to avoid breaking the JSON-RPC stream in stdout
	console.error("HRP MCP Server is running in STDIO mode");
};

// Check if running in STDIO mode
if (process.argv.includes("--stdio")) {
	startStdioServer().catch(console.error);
} else {
	startSSEServer();
}
