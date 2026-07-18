import { aiClient } from "../utils/ai-client.util.ts"

async function runDiagnostics() {
  console.log("==================================================")
  console.log("           AI CONFIGURATION DIAGNOSTICS           ")
  console.log("==================================================")
  console.log(
    `TEST_GEN_API_KEY:  ${process.env.TEST_GEN_API_KEY ? "CONFIGURED (starts with " + process.env.TEST_GEN_API_KEY.slice(0, 5) + ")" : "NOT SET (will use default)"}`,
  )
  console.log(
    `TEST_GEN_BASE_URL: ${process.env.TEST_GEN_BASE_URL || "NOT SET (will use http://localhost:20128/v1)"}`,
  )
  console.log(`TEST_GEN_MODEL:    ${process.env.TEST_GEN_MODEL || "NOT SET (will use anti)"}`)
  console.log(
    `GEMINI_API_KEY:    ${process.env.GEMINI_API_KEY ? "CONFIGURED" : "NOT SET (will use hardcoded default)"}`,
  )
  console.log("--------------------------------------------------")

  const testUrl = `${process.env.TEST_GEN_BASE_URL || "http://localhost:20128/v1"}/chat/completions`
  console.log(`1. Testing connection to Local AI Server (${testUrl})...`)

  try {
    const testResponse = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TEST_GEN_API_KEY || "sk-699f7164d83e9af9-isjba0-8d59f1a0"}`,
      },
      body: JSON.stringify({
        model: process.env.TEST_GEN_MODEL || "anti",
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 5,
      }),
    })

    if (testResponse.ok) {
      console.log("✅ Success! Local AI Server is ONLINE and responded correctly.")
      const data = await testResponse.json()
      console.log("Response snippet:", JSON.stringify(data))
    } else {
      const errBody = await testResponse.text()
      console.log(`❌ Failed! Local AI Server responded with HTTP status ${testResponse.status}`)
      console.log("Error details from server:", errBody)
    }
  } catch (err: any) {
    console.log(`❌ Failed to connect to Local AI Server. Reason: ${err.message}`)
    console.log(
      "👉 Tip: Đảm bảo phần mềm AI cục bộ (LM Studio, Ollama, v.v.) đang CHẠY và lắng nghe đúng cổng cấu hình.",
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
  } catch (err: any) {
    console.log(`❌ Failed to connect to Google Gemini API. Reason: ${err.message}`)
  }
  console.log("==================================================")
}

runDiagnostics()
