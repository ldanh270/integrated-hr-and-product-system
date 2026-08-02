import { serve } from "bun";

const PORT = 3000;

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (url.pathname === "/v1/chat/completions" && req.method === "POST") {
      let requestedModel = "openai/gpt-4o-mini";
      let isTaskGeneration = false;

      try {
        const body = await req.json();
        if (body.model) {
          requestedModel = body.model;
        }
        
        // Kiểm tra xem backend có đang yêu cầu phân rã task hay không
        const promptStr = JSON.stringify(body.messages || []);
        if (promptStr.includes("phân rã") || promptStr.includes("Task") || promptStr.includes("Tracker")) {
          isTaskGeneration = true;
        }

        console.log(`📩 Nhận request mới từ client (Model: ${requestedModel}, IsTaskGen: ${isTaskGeneration})`);
      } catch (e) {
        // Ignore JSON parse error
      }

      // Nếu backend gọi API phân rã task -> Trả về mảng JSON hợp lệ cho Backend parse
      const taskJsonContent = JSON.stringify([
        {
          title: "Thiết kế cơ sở dữ liệu và API Backend",
          description: "Xây dựng schema cơ sở dữ liệu và các endpoint RESTful API cho tính năng của dự án.",
          tracker: "feature",
          priority: "high",
          estimatedTime: 16
        },
        {
          title: "Phát triển Giao diện người dùng React",
          description: "Xây dựng các UI component và tích hợp API kết nối với hệ thống.",
          tracker: "task",
          priority: "medium",
          estimatedTime: 12
        },
        {
          title: "Kiểm thử tự động và Viết tài liệu kỹ thuật",
          description: "Thực hiện unit test, integration test và cập nhật tài liệu cho dự án.",
          tracker: "test",
          priority: "medium",
          estimatedTime: 8
        }
      ]);

      const content = isTaskGeneration 
        ? taskJsonContent 
        : `Xin chào! Bạn đang gọi thành công qua 9Router với model: ${requestedModel}`;

      return Response.json(
        {
          id: "chatcmpl-demo9router123",
          object: "chat.completion",
          created: Math.floor(Date.now() / 1000),
          model: requestedModel,
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: content,
              },
              finish_reason: "stop",
            },
          ],
        },
        { headers }
      );
    }

    return new Response(
      "🚀 Server 9Router Test đang chạy thành công!\n\nEndpoint API: POST /v1/chat/completions",
      { status: 200, headers }
    );
  },
});

console.log(`\n==================================================`);
console.log(`🚀 Server 9Router Demo đang chạy tại: http://localhost:${PORT}`);
console.log(`👉 Endpoint OpenAI: http://localhost:${PORT}/v1/chat/completions`);
console.log(`==================================================\n`);
