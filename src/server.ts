import "dotenv/config";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpServer, registerTools } from "./mcp.js";

const app = express();
const PORT = process.env.PORT || 3001;

let transport: SSEServerTransport | null = null;

// Register all tools before starting the server
registerTools();

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
});
