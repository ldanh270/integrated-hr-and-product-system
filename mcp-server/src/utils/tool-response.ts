export const buildSuccess = (data: unknown) => {
  const structuredContent = { data, error: null, meta: null }
  return {
    content: [
      {
        type: "text" as const,
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
    structuredContent,
    isError: false,
  }
}

export const buildError = (message: string, errorDetails?: unknown) => {
  const errorObj = {
    error: { code: "MCP_TOOL_ERROR", message },
    ...(errorDetails !== undefined && { details: errorDetails }),
  }
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(errorObj, null, 2),
      },
    ],
    structuredContent: { data: null, error: errorObj.error, meta: errorDetails ?? null },
    isError: true,
  }
}
