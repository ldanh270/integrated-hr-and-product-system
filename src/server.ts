#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { mcpServer, registerTools } from './mcp.js';

// Register all tools before starting the server
registerTools();

const startSSEServer = () => {
  const app = express();
  const PORT = process.env.PORT || 3001;

  app.post('/mcp', async (req, res) => {
    console.log('Received MCP connection request');
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await mcpServer.server.connect(transport);
    
    req.on('close', () => {
      console.log('Client disconnected from MCP stream');
    });

    await transport.handleRequest(req, res, req.body);
  });

  app.listen(PORT, () => {
    console.log(`HRP MCP Server is running on port ${PORT}`);
    console.log(`HTTP Stream endpoint: http://localhost:${PORT}/mcp`);
    console.log(`To run in STDIO mode, pass the --stdio flag`);
  });
};

const startStdioServer = async () => {
  const transport = new StdioServerTransport();
  await mcpServer.server.connect(transport);
  // In STDIO mode, ALL LOGS must use console.error to avoid breaking the JSON-RPC stream in stdout
  console.error('HRP MCP Server is running in STDIO mode');
};

// Check if running in STDIO mode
if (process.argv.includes('--stdio')) {
  startStdioServer().catch(console.error);
} else {
  startSSEServer();
}
