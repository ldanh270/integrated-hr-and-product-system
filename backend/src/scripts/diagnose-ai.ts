import { aiClient } from "../utils/ai-client.util.ts"

async function runDiagnostics() {
  console.log("==================================================")
  console.log("           AI CONFIGURATION DIAGNOSTICS           ")
  console.log("==================================================")

  const apiKey = process.env.AI_API_KEY || ""
  const baseURL = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1"
  const model = process.env.AI_MODEL || "google/gemini-2.5-flash"

  console.log(`AI_API_KEY:          ${process.env.AI_API_KEY ? "CONFIGURED (starts with " + process.env.AI_API_KEY.slice(0, 8) + ")" : "NOT SET"}`)
  console.log(`AI_BASE_URL:         ${process.env.AI_BASE_URL || "NOT SET"}`)
  console.log(`AI_MODEL:            ${process.env.AI_MODEL || "NOT SET"}`)
  console.log("--------------------------------------------------")
  console.log(`GEMINI_API_KEY:      ${process.env.GEMINI_API_KEY ? "CONFIGURED" : "NOT SET"}`)
  console.log("--------------------------------------------------")
  console.log("               RESOLVED AI CONFIG                 ")
  console.log("--------------------------------------------------")
  console.log(`API KEY:             ${apiKey ? apiKey.slice(0, 8) + "..." : "NOT SET"}`)
  console.log(`BASE URL:            ${baseURL}`)
  console.log(`MODEL:               ${model}`)
  console.log("==================================================")

  const testUrl = `${baseURL}/chat/completions`
  console.log(`1. Testing connection to Resolved AI Server (${testUrl})...`)

  try {
    const testResponse = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.SERVER_URL || "http://localhost:5000",
        "X-Title": "Integrated HR and Product System (Diagnostics)",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
      }),
    })

    if (testResponse.ok) {
      console.log("✅ Success! Resolved AI Server is ONLINE and responded correctly.")
      const data = (await testResponse.json()) as Record<string, unknown>
      console.log("Response snippet:", JSON.stringify(data))
    } else {
      const errBody = await testResponse.text()
      console.log(`❌ Failed! Resolved AI Server responded with HTTP status ${testResponse.status}`)
      console.log("Error details from server:", errBody)
    }
  } catch (err) {
    const error = err as Error
    console.log(`❌ Failed to connect to Resolved AI Server. Reason: ${error.message}`)
    console.log(
      "👉 Tip: Đảm bảo cấu hình trong file .env chính xác, hoặc nếu dùng AI cục bộ, hãy khởi chạy server.",
    )
  }

  console.log("--------------------------------------------------")
  console.log("2. Testing connection to Google Gemini API (Fallback)...")
  try {
    const geminiKey = process.env.GEMINI_API_KEY
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "hi" }] }],
      }),
    })

    if (response.ok) {
      console.log("✅ Success! Google Gemini API is ONLINE and responded correctly.")
    } else {
      console.log(`❌ Failed! Google Gemini responded with HTTP status ${response.status}`)
      if (response.status === 429) {
        console.log(
          "👉 Tip: Bạn đã bị dính Rate Limit (gọi quá nhiều lần). Hãy dán lại GEMINI_API_KEY chính chủ vào file .env.",
        )
      }
    }
  } catch (err) {
    const error = err as Error
    console.log(`❌ Failed to connect to Google Gemini API. Reason: ${error.message}`)
  }
  console.log("==================================================")
}

void runDiagnostics()
