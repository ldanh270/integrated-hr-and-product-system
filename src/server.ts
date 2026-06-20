import "dotenv/config";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { mcpServer, registerTools } from "./mcp.js";
import { logger } from "./utils/logger.js";
import path from "path";
import { fileURLToPath } from "url";
import { authService } from "./services/auth.service.js";
import { sessionManager } from "./session/session.manager.js";
import { loginStore } from "./auth/login-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register all tools before starting the server
registerTools();

const mountAuthRoutes = (app: express.Express) => {
	// 1. Serve the login page
	app.get("/auth/login", (req, res) => {
		const loginId = req.query.id as string;
		if (!loginId || !loginStore.get(loginId)) {
			res.status(400).send("Invalid or expired login ID. Please try again from the AI assistant.");
			return;
		}
		res.sendFile(path.join(__dirname, "auth", "login-page.html"));
	});

	// 2. Handle form submission
	app.post("/auth/submit", express.json(), async (req, res) => {
		const { loginId, username, password } = req.body;

		if (!loginId || !username || !password) {
			res.status(400).json({ error: "Missing required fields" });
			return;
		}

		const loginReq = loginStore.get(loginId);
		if (!loginReq) {
			res.status(400).json({ error: "Login request expired or invalid. Please try again." });
			return;
		}

		try {
			// Call HRP backend to authenticate
			const { data, cookies } = await authService.login({ username, password });
			logger.debug("HRP API Login Result:", data);

			// Extract token properly based on actual backend response structure.
			// Sometimes backends return `accessToken` instead of `token`.
			const token = data.data?.token || (data.data as any)?.accessToken || (data as any).token || (data as any).accessToken;

			if (!token && (!cookies || cookies.length === 0)) {
				logger.error("Token and cookies are missing in the HRP API response!", data);
			}

			// Save session
			const sessionId = sessionManager.create({
				jwt: token || "", // Fallback to empty if not provided in body
				role: data.data?.employee?.role || "unknown",
				employeeId: data.data?.employee?.id || "unknown",
				cookies: cookies
			});

			// Update login store
			loginStore.setCompleted(loginId, sessionId);

			res.json({ success: true });
		} catch (error: any) {
			logger.error(`Login failed for ${username}:`, error.message);
			loginStore.setFailed(loginId, error.message);
			res.status(401).json({ error: "Invalid credentials or server error" });
		}
	});
};

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

	mountAuthRoutes(app);

	app.listen(PORT, () => {
		logger.info(`HRP MCP Server running on port ${PORT}`);
		logger.info(`SSE endpoint : http://localhost:${PORT}/sse`);
		logger.info(`Message endpoint: http://localhost:${PORT}/message`);
		logger.info(`STDIO mode   : pass --stdio flag`);
		logger.info(`Verbose debug: set DEBUG=true in .env`);
	});
};

const startStdioServer = async () => {
	const app = express();
	const PORT = process.env.PORT || 3001;

	mountAuthRoutes(app);

	app.listen(PORT, () => {
		logger.info(`Browser Auth routes running on port ${PORT} (STDIO Mode)`);
	});

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
