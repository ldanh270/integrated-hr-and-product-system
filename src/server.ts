import "dotenv/config";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { mcpServer, registerTools } from "./mcp.js";
import { logger } from "./utils/logger.js";

// Register all tools before starting the server
registerTools();

const startSSEServer = () => {
	const app = express();
	const PORT = process.env.PORT || 3001;

	let transport: SSEServerTransport | null = null;

	app.get("/sse", async (req, res) => {
		const clientIp = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "unknown";
		logger.info(`SSE connection request from ${clientIp}`);

		// Close the existing transport/connection before creating a new one.
		// The MCP Server is a singleton and does not allow re-connecting without
		// closing first.
		if (transport) {
			logger.warn("Previous SSE transport still active — closing before reconnecting");
			await transport.close();
			transport = null;
		}

		try {
			transport = new SSEServerTransport("/message", res);
			await mcpServer.server.connect(transport);
			logger.success("SSE transport connected successfully");
		} catch (err) {
			logger.error("Failed to connect SSE transport:", err);
			return;
		}

		// Clean up when client disconnects
		req.on("close", async () => {
			logger.info("SSE client disconnected — cleaning up transport");
			await transport?.close();
			transport = null;
		});
	});

	app.post("/message", async (req, res) => {
		if (!transport) {
			logger.warn("POST /message received but no active SSE transport");
			res.status(400).json({ error: "SSE connection not established" });
			return;
		}
		logger.debug(`POST /message received`);
		await transport.handlePostMessage(req, res);
	});

	app.listen(PORT, () => {
		logger.info(`HRP MCP Server running on port ${PORT}`);
		logger.info(`SSE endpoint : http://localhost:${PORT}/sse`);
		logger.info(`Message endpoint: http://localhost:${PORT}/message`);
		logger.info(`STDIO mode   : pass --stdio flag`);
		logger.info(`Verbose debug: set DEBUG=true in .env`);
	});
};

const startStdioServer = async () => {
	const transport = new StdioServerTransport();
	await mcpServer.server.connect(transport);
	// In STDIO mode, ALL LOGS must use console.error to avoid breaking the JSON-RPC stream in stdout
	// logger automatically handles this when --stdio is present
	logger.info("HRP MCP Server running in STDIO mode");
};

// Check if running in STDIO mode
if (process.argv.includes("--stdio")) {
	startStdioServer().catch((err) => logger.error("STDIO server crashed:", err));
} else {
	startSSEServer();
}
