export interface AiMessage {
  role: "system" | "user" | "assistant"
  content: string
}

async function callGeminiFallback(prompt: string, isJson: boolean): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey || geminiKey === "your_gemini_api_key") {
    throw new Error("No Gemini API Key available for fallback.")
  }

  console.log("Fallback triggered: Calling Google Gemini API...")
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`

  const body: any = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  }

  if (isJson) {
    body.generationConfig = {
      responseMimeType: "application/json",
    }
  }

  // 30 seconds timeout for fallback Gemini request
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Gemini API error! Status: ${response.status}`)
    }

    const data = (await response.json()) as any
    return data.candidates[0].content.parts[0].text.trim()
  } catch (err: any) {
    clearTimeout(timeoutId)
    throw err
  }
}

export const aiClient = {
  generateJson: async <T>(prompt: string, systemPrompt?: string): Promise<T> => {
    const apiKey = process.env.TEST_GEN_API_KEY || "sk-699f7164d83e9af9-isjba0-8d59f1a0"
    const baseURL = process.env.TEST_GEN_BASE_URL || "http://localhost:20128/v1"
    const model = process.env.TEST_GEN_MODEL || "anti"

    const messages: AiMessage[] = []
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    let responseText = ""

    // Set 35 seconds timeout for local AI server request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    try {
      console.log(`Calling local AI server at ${baseURL}...`)
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${body}`)
      }

      const resData = (await response.json()) as any
      responseText = resData.choices[0].message.content.trim()
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.warn("Local AI JSON call failed, trying fallback to Google Gemini...", err.message)
      try {
        responseText = await callGeminiFallback(prompt, true)
      } catch (fallbackErr: any) {
        console.error("All AI endpoints failed.", fallbackErr.message)
        throw new Error("Không thể kết nối đến cả AI cục bộ và Gemini API.")
      }
    }

    // Clean markdown codeblocks if AI wraps JSON in ```json ... ```
    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "")
    }

    return JSON.parse(responseText.trim()) as T
  },

  generateText: async (prompt: string, systemPrompt?: string): Promise<string> => {
    const apiKey = process.env.TEST_GEN_API_KEY || "sk-699f7164d83e9af9-isjba0-8d59f1a0"
    const baseURL = process.env.TEST_GEN_BASE_URL || "http://localhost:20128/v1"
    const model = process.env.TEST_GEN_MODEL || "anti"

    const messages: AiMessage[] = []
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    let responseText = ""

    // Set 35 seconds timeout for local AI server request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    try {
      console.log(`Calling local AI server at ${baseURL}...`)
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}. Details: ${body}`)
      }

      const resData = (await response.json()) as any
      responseText = resData.choices[0].message.content.trim()
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.warn("Local AI text call failed, trying fallback to Google Gemini...", err.message)
      try {
        responseText = await callGeminiFallback(prompt, false)
      } catch (fallbackErr: any) {
        console.error("All AI endpoints failed.", fallbackErr.message)
        throw new Error("Không thể kết nối đến cả AI cục bộ và Gemini API.")
      }
    }

    return responseText
  },
}
