import fs from "fs"
import path from "path"

const docPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\eed27bb6-aff7-48f5-a8d8-dbffd9ee7244\\advisor_defense_guide.doc"

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Cẩm nang bảo vệ đồ án</title>
<style>
  body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333333;
    margin: 40px;
  }
  h1 {
    color: #1e3a8a;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 10px;
    font-size: 24px;
    text-transform: uppercase;
    text-align: center;
  }
  h2 {
    color: #2563eb;
    font-size: 18px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 5px;
    margin-top: 30px;
  }
  h3 {
    color: #4b5563;
    font-size: 14px;
    margin-top: 20px;
  }
  p, li {
    font-size: 13px;
  }
  ul {
    padding-left: 20px;
  }
  li {
    margin-bottom: 8px;
  }
  .highlight-box {
    background-color: #f3f4f6;
    border-left: 5px solid #2563eb;
    padding: 15px;
    margin: 20px 0;
    font-size: 13px;
    border-radius: 4px;
  }
  .highlight-title {
    font-weight: bold;
    color: #1e3a8a;
    margin-bottom: 5px;
  }
  .formula-box {
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 15px;
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    color: #1e40af;
    margin: 20px 0;
    border-radius: 6px;
  }
  .question-box {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 8px;
  }
  .question-title {
    font-weight: bold;
    color: #0f172a;
    margin-bottom: 8px;
    font-size: 13px;
  }
  .answer-text {
    color: #334155;
    font-style: italic;
    border-left: 3px solid #cbd5e1;
    padding-left: 12px;
  }
  .step-table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  .step-table th, .step-table td {
    border: 1px solid #cbd5e1;
    padding: 10px;
    font-size: 12px;
    text-align: left;
  }
  .step-table th {
    background-color: #f1f5f9;
    color: #1e293b;
  }
</style>
</head>
<body>

<h1>CẨM NANG BẢO VỆ DỰ ÁN TRƯỚC GIẢNG VIÊN</h1>
<p style="text-align: center; font-style: italic; color: #6b7280; font-size: 14px;">
  Tính năng: Đề xuất Giao việc & Cân bằng tải thông minh (TaskEstimateAI)
</p>

<h2>1. LUỒNG ĐI CỦA DỮ LIỆU (DATA FLOW)</h2>
<p>Khi người dùng bấm nút <strong>"AI Gợi ý"</strong> trên giao diện, dữ liệu sẽ chạy qua luồng xử lý sau:</p>

<table class="step-table">
  <thead>
    <tr>
      <th style="width: 80px;">Bước</th>
      <th style="width: 200px;">Thành phần tác động</th>
      <th>Mô tả hoạt động chi tiết</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Bước 1</strong></td>
      <td>Frontend (React)</td>
      <td>Người dùng click nút "AI gợi ý" cạnh ô Assignee. Client gọi API <code>GET /api/task-estimate-ai/tasks/:id/suggestions</code>.</td>
    </tr>
    <tr>
      <td><strong>Bước 2</strong></td>
      <td>Backend (Express) & DB</td>
      <td>Backend truy vấn Prisma lấy dữ liệu: chi tiết công việc cần giao, danh sách các task đang làm (in_progress) và lịch xin nghỉ phép của tất cả thành viên trong dự án.</td>
    </tr>
    <tr>
      <td><strong>Bước 3</strong></td>
      <td>Backend tính toán</td>
      <td>Backend tự động tính toán <strong>Workload Score</strong> (Điểm bận rộn) và <strong>Availability Score</strong> (Điểm khả dụng thời gian) bằng code TypeScript.</td>
    </tr>
    <tr>
      <td><strong>Bước 4</strong></td>
      <td>Gọi Gemini API</td>
      <td>Backend gửi thông tin task và lịch sử công việc của các nhân sự sang mô hình <strong>Gemini 2.5 Flash</strong> để nhờ AI chấm điểm kỹ năng (<strong>Skill Match Score</strong>) và viết lý do bằng tiếng Việt dạng JSON.</td>
    </tr>
    <tr>
      <td><strong>Bước 5</strong></td>
      <td>Gộp điểm & Trả về</td>
      <td>Backend gộp tất cả điểm số theo công thức thuật toán, sắp xếp giảm dần và trả về JSON cho Frontend hiển thị lên Web.</td>
    </tr>
  </tbody>
</table>

<h2>2. THUẬT TOÁN CHẤM ĐIỂM (THE HYBRID ALGORITHM)</h2>
<div class="highlight-box">
  <div class="highlight-title">💡 ĐIỂM MẤU CHỐT GHI ĐIỂM VỚI GIẢNG VIÊN:</div>
  Đây là thuật toán <strong>Kết hợp Lai (Hybrid)</strong>. Hệ thống không phụ thuộc 100% vào AI. Backend tự tính các chỉ số cứng (thời gian thực tế, lịch nghỉ phép) để đảm bảo chính xác tuyệt đối, còn AI (Gemini) chỉ đọc hiểu ngữ nghĩa để chấm điểm kỹ năng và sinh câu giải thích tiếng Việt tự nhiên.
</div>

<p>Công thức tính điểm tương thích cuối cùng (S_final) của một nhân sự:</p>
<div class="formula-box">
  S_final = H_avail * ( 0.7 * S_skill + 0.3 * S_workload )
</div>

<ul>
  <li><strong>Hệ số khả dụng nghỉ phép (H_avail):</strong> Không trùng lịch nghỉ phép = 1.0; Trùng lịch nghỉ phép = 0.0 (Loại ngay lập tức).</li>
  <li><strong>Điểm bận rộn (S_workload - Backend tự tính):</strong> Đang làm 0 task = 100đ; 1 task = 85đ; 2 task = 60đ; 3 task = 30đ; >=4 task = 0đ (Quá tải).</li>
  <li><strong>Điểm kỹ năng (S_skill - Gemini chấm):</strong> AI so khớp nội dung task mới với chức vụ và danh sách 5 task gần nhất đã hoàn thành của nhân sự để cho điểm từ 0 đến 100.</li>
</ul>

<h2>3. BỘ CÂU HỎI HỘI ĐỒNG THƯỜNG HỎI & CÁCH TRẢ LỜI</h2>

<div class="question-box">
  <div class="question-title">Câu hỏi 1: Làm sao hệ thống biết được năng lực của từng nhân viên để AI giao việc cho đúng trình độ?</div>
  <div class="answer-text">
    "Dạ thưa Thầy/Cô, hệ thống sử dụng cơ chế học động dựa trên lịch sử thực tế (Dynamic Learning). Khi nhân sự hoàn thành các task trong dự án, hệ thống sẽ tự động lưu lại các techstack và mô tả công việc của task đó gắn liền với tài khoản của họ. AI sẽ đọc lịch sử hoàn thành công việc thực tế này kết hợp với Chức vụ (Position) hiện tại của họ để đánh giá năng lực thời gian thực, chứ Manager không cần phải nhập tay đánh giá thủ công."
  </div>
</div>

<div class="question-box">
  <div class="question-title">Câu hỏi 2: Ước lượng thời gian (estimatedTime) do nhân viên tự nhập và có thể sửa đổi, làm sao tin cậy để AI tính toán độ khó?</div>
  <div class="answer-text">
    "Dạ thưa Thầy/Cô, để tránh việc nhân viên khai vống thời gian để đối phó, hệ thống có một trường ẩn dưới cơ sở dữ liệu gọi là aiBaselineTime (Thời gian ước lượng gốc của AI). Con số này do AI tự động phân tích và gán cố định ngay khi task được tạo dựa trên lịch sử các task tương đồng trước đó của công ty. Nhân viên không thể nhìn thấy hay chỉnh sửa trường này. Mọi phép tính toán hiệu suất cá nhân của nhân sự đều đối chiếu với thời gian gốc này nên hoàn toàn khách quan."
  </div>
</div>

<div class="question-box">
  <div class="question-title">Câu hỏi 3: Tại sao em lại tách phần xử lý AI ra làm Service riêng chứ không code chung với CRUD của Task?</div>
  <div class="answer-text">
    "Dạ, em áp dụng nguyên lý thiết kế SOLID (Single Responsibility Principle - Nguyên lý đơn nhiệm). Việc quản lý công việc (CRUD Task) và việc kết nối xử lý AI là hai nghiệp vụ hoàn toàn khác nhau. Việc tách riêng TaskEstimateAiService giúp mã nguồn dễ bảo trì, dễ viết test độc lập, và sau này nếu cần đổi từ Google Gemini sang OpenAI GPT-4o, em chỉ cần chỉnh sửa duy nhất 1 file service này mà không làm ảnh hưởng đến các tính năng khác của hệ thống."
  </div>
</div>

<div class="question-box">
  <div class="question-title">Câu hỏi 4: Nếu API Key của Gemini bị hết hạn hoặc không có mạng internet, hệ thống của em có bị sập không?</div>
  <div class="answer-text">
    "Dạ không ạ. Hệ thống được thiết kế với cơ chế phòng vệ Graceful Fallback. Khi API của Gemini gặp sự cố hoặc thiếu API Key, Backend sẽ tự động phát hiện lỗi và chuyển sang chế độ dự phòng: tự động lấy điểm số mặc định an toàn kết hợp với điểm số bận rộn do backend tự tính toán để trả về cho Frontend, đảm bảo ứng dụng vẫn hoạt động bình thường mà không bị crash."
  </div>
</div>

</body>
</html>
`

const charCodes = []
for (let i = 0; i < htmlContent.length; i++) {
  charCodes.push(htmlContent.charCodeAt(i))
}
fs.writeFileSync(docPath, Buffer.from(charCodes))
console.log("Exported Word document successfully to:", docPath)
