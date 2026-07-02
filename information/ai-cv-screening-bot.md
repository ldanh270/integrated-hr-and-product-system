# 🤖 AI Bot Sàng Lọc CV — Luồng Hệ Thống Chi Tiết

> Tài liệu mô tả kiến trúc, luồng xử lý và các module cốt lõi của hệ thống AI tự động quét và sàng lọc CV ứng viên.

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Luồng xử lý chi tiết](#3-luồng-xử-lý-chi-tiết)
4. [Module 01 — Thu thập & xử lý file](#module-01--thu-thập--xử-lý-file)
5. [Module 02 — AI Parse CV](#module-02--ai-parse-cv)
6. [Module 03 — Matching & Scoring Engine](#module-03--matching--scoring-engine)
7. [Module 04 — AI Phân tích sâu (LLM Layer)](#module-04--ai-phân-tích-sâu-llm-layer)
8. [Module 05 — Ranking & Filtering](#module-05--ranking--filtering)
9. [Module 06 — Output & Thông báo](#module-06--output--thông-báo)
10. [JD Analyzer — Module phụ trợ](#jd-analyzer--module-phụ-trợ)
11. [Feedback Loop & Cải thiện liên tục](#feedback-loop--cải-thiện-liên-tục)
12. [Tech Stack gợi ý](#tech-stack-gợi-ý)
13. [Thứ tự xây dựng khuyến nghị](#thứ-tự-xây-dựng-khuyến-nghị)
14. [Các rủi ro & lưu ý](#các-rủi-ro--lưu-ý)

---

## 1. Tổng quan hệ thống

Hệ thống AI sàng lọc CV là một pipeline tự động giúp bộ phận HR:

- **Thu thập** CV từ nhiều nguồn (email, form, ATS, job boards)
- **Trích xuất** thông tin có cấu trúc từ CV ở mọi định dạng
- **So khớp và chấm điểm** CV với yêu cầu Job Description (JD)
- **Phân tích sâu** bằng LLM để có nhận xét chất lượng
- **Xếp hạng và lọc** ứng viên theo ngưỡng phù hợp
- **Thông báo và tích hợp** kết quả vào hệ thống HR hiện có

**Mục tiêu:**

| Chỉ số | Mục tiêu |
|--------|----------|
| Thời gian sàng lọc mỗi CV | < 30 giây |
| Tỷ lệ giảm tải công việc HR | 60–80% |
| Độ chính xác shortlist | ≥ 85% so với HR manual |
| Hỗ trợ định dạng file | PDF, DOCX, DOC, JPG, PNG |

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                    NGUỒN ĐẦU VÀO                        │
│  Email/Gmail  │  Upload Form  │  ATS/HRMS  │  Job boards│
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         MODULE 01: Thu thập & Xử lý file                │
│         PDF / DOCX / Image → Plain text (OCR)           │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         MODULE 02: AI Parse CV                          │
│  NLP Entity Extraction │ Skill Classification │ Exp Calc │
└───────────────────────┬─────────────────────────────────┘
                        │                    ▲
                        ▼                    │
┌─────────────────────────────────────────────────────────┐
│         MODULE 03: Matching & Scoring Engine            │◄── JD Analyzer
│         Semantic Similarity │ Weighted Scoring          │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         MODULE 04: AI Phân tích sâu — LLM Layer         │
│  Nhận xét chất lượng │ Red flags │ Câu hỏi phỏng vấn   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         MODULE 05: Ranking & Filtering                  │
│         Pass │ Needs Review │ Fail                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│         MODULE 06: Output & Thông báo                   │
│  Dashboard │ Email HR │ Push ATS │ Slack/Teams          │
└───────────┬───────────────┬──────────────┬──────────────┘
            │               │              │
            ▼               ▼              ▼
     Shortlist          Auto-schedule   Feedback loop
     Dashboard          phỏng vấn       HR → Model
```

---

## 3. Luồng xử lý chi tiết

```
CV đầu vào
    │
    ├─ Validate file (size, format, virus scan)
    │
    ├─ [Module 01] Convert → Plain text
    │       ├─ PDF parser (pdfplumber / pymupdf)
    │       ├─ DOCX parser (python-docx)
    │       └─ Image OCR (Tesseract / Google Vision)
    │
    ├─ [Module 02] Parse & Structured extraction
    │       ├─ Họ tên, SĐT, email, địa chỉ
    │       ├─ Học vấn (trường, ngành, năm tốt nghiệp)
    │       ├─ Kinh nghiệm làm việc (công ty, vị trí, thời gian)
    │       ├─ Kỹ năng (hard skills, soft skills, ngôn ngữ)
    │       ├─ Chứng chỉ, giải thưởng, dự án
    │       └─ Output: JSON chuẩn hoá
    │
    ├─ [JD Analyzer] Song song parse Job Description
    │       ├─ Yêu cầu bắt buộc (must-have)
    │       ├─ Yêu cầu ưu tiên (nice-to-have)
    │       └─ Mức lương, địa điểm, hình thức làm việc
    │
    ├─ [Module 03] Matching & Scoring
    │       ├─ Embedding CV + JD → Vector similarity score
    │       ├─ Rule-based matching (số năm KN, bằng cấp tối thiểu)
    │       └─ Tổng hợp điểm có trọng số → Total score (0–100)
    │
    ├─ [Module 04] LLM deep analysis
    │       ├─ Tóm tắt profile ứng viên (3–5 câu)
    │       ├─ Điểm nổi bật so với JD
    │       ├─ Red flags (khoảng trống, nhảy việc, mâu thuẫn)
    │       └─ Gợi ý 3–5 câu hỏi phỏng vấn
    │
    ├─ [Module 05] Ranking & Filtering
    │       ├─ Score ≥ 75: Pass → Shortlist
    │       ├─ Score 50–74: Needs Review → HR xem thêm
    │       └─ Score < 50: Fail → Lưu trữ
    │
    └─ [Module 06] Output
            ├─ Cập nhật dashboard
            ├─ Gửi email thông báo HR
            ├─ Push vào ATS/HRMS
            └─ Trigger auto-schedule (nếu Pass)
```

---

## Module 01 — Thu thập & Xử lý file

### Mục đích
Gom CV từ nhiều nguồn khác nhau, chuẩn hoá tất cả về text thuần để các module sau xử lý đồng nhất.

### Các nguồn đầu vào

| Nguồn | Phương thức | Ghi chú |
|-------|------------|---------|
| Email / Gmail | IMAP polling / Gmail API | Tự động tải attachment |
| Upload Form | REST API (multipart/form-data) | Hỗ trợ upload trực tiếp |
| ATS / HRMS | Webhook hoặc API pull | Đồng bộ định kỳ |
| Job boards | Crawl / Official API | VietnamWorks, LinkedIn, TopCV |

### Xử lý file

```python
# Ví dụ pipeline xử lý file
def process_cv_file(file_path: str) -> str:
    ext = get_extension(file_path)

    if ext == ".pdf":
        text = extract_pdf(file_path)       # pdfplumber
    elif ext in [".docx", ".doc"]:
        text = extract_docx(file_path)      # python-docx
    elif ext in [".jpg", ".png"]:
        text = ocr_image(file_path)         # Tesseract / Google Vision
    else:
        raise UnsupportedFormatError(ext)

    return clean_text(text)                 # Loại bỏ ký tự thừa, normalize
```

### Lưu ý kỹ thuật
- Giới hạn file size tối đa (khuyến nghị: 10MB)
- Virus scan trước khi xử lý
- Lưu file gốc vào object storage (S3 / GCS) trước khi xử lý
- Timeout xử lý OCR: tối đa 30 giây/file

---

## Module 02 — AI Parse CV

### Mục đích
Trích xuất thông tin có cấu trúc từ text CV thô, chuyển thành JSON chuẩn để so khớp.

### Các trường thông tin cần trích xuất

```json
{
  "personal": {
    "full_name": "Nguyễn Văn A",
    "email": "nva@email.com",
    "phone": "0901234567",
    "location": "Hà Nội",
    "linkedin": "linkedin.com/in/nguyenvana"
  },
  "education": [
    {
      "school": "Đại học Bách Khoa HN",
      "major": "Công nghệ thông tin",
      "degree": "Cử nhân",
      "gpa": 3.4,
      "graduation_year": 2020
    }
  ],
  "experience": [
    {
      "company": "Công ty XYZ",
      "title": "Backend Developer",
      "start_date": "2020-07",
      "end_date": "2023-12",
      "duration_months": 41,
      "description": "...",
      "technologies": ["Python", "Django", "PostgreSQL"]
    }
  ],
  "skills": {
    "hard_skills": ["Python", "React", "AWS", "Docker"],
    "soft_skills": ["Teamwork", "Problem solving"],
    "languages": [{"lang": "English", "level": "B2"}]
  },
  "certifications": ["AWS Solutions Architect", "PMP"],
  "total_experience_years": 3.5
}
```

### Phương pháp trích xuất

| Phương pháp | Dùng khi | Độ chính xác |
|------------|---------|-------------|
| Regex + Rule-based | Trường định dạng cố định (email, SĐT, ngày) | Cao, nhanh |
| NLP (spaCy, NLTK) | Entity extraction (tên người, tổ chức) | Trung bình |
| LLM (Claude / GPT) | Thông tin phi cấu trúc, mô tả công việc | Cao, chậm hơn |

### Prompt mẫu cho LLM parser

```
Bạn là hệ thống trích xuất thông tin CV chuyên nghiệp.
Đọc CV sau và trả về JSON theo schema được cung cấp.
Chỉ trả về JSON, không có text thêm.
Nếu không tìm thấy thông tin, dùng null.

CV:
{cv_text}

Schema:
{json_schema}
```

---

## Module 03 — Matching & Scoring Engine

### Mục đích
So khớp thông tin CV đã parse với yêu cầu JD, tính điểm phù hợp tổng thể.

### Cấu trúc điểm số

```
Total Score (0–100) = Weighted Sum của các tiêu chí

┌──────────────────────────────┬────────────┐
│ Tiêu chí                     │ Trọng số   │
├──────────────────────────────┼────────────┤
│ Số năm kinh nghiệm           │ 25%        │
│ Kỹ năng kỹ thuật (must-have) │ 30%        │
│ Kỹ năng ưu tiên (nice-have)  │ 15%        │
│ Học vấn & bằng cấp           │ 15%        │
│ Semantic similarity (tổng)   │ 15%        │
└──────────────────────────────┴────────────┘
```

> Trọng số này có thể cấu hình theo từng vị trí tuyển dụng.

### Semantic Similarity

```python
# Dùng embedding để so khớp ngữ nghĩa
from openai import OpenAI

def compute_similarity(cv_text: str, jd_text: str) -> float:
    client = OpenAI()
    cv_embedding = client.embeddings.create(
        input=cv_text, model="text-embedding-3-small"
    ).data[0].embedding

    jd_embedding = client.embeddings.create(
        input=jd_text, model="text-embedding-3-small"
    ).data[0].embedding

    return cosine_similarity(cv_embedding, jd_embedding)
```

**Lợi ích của semantic matching:**
- Bắt được từ đồng nghĩa: "React" ↔ "ReactJS", "Lập trình viên" ↔ "Developer"
- Không bỏ sót ứng viên dùng từ khác nhưng cùng nghĩa
- Đánh giá được mức độ liên quan của kinh nghiệm ngành

### Rule-based Matching (Hard filters)

```python
def hard_filter(cv: dict, jd_requirements: dict) -> bool:
    # Lọc cứng trước khi chấm điểm
    if cv["total_experience_years"] < jd_requirements["min_experience"]:
        return False  # Fail ngay

    required_skills = set(jd_requirements["must_have_skills"])
    cv_skills = set(cv["skills"]["hard_skills"])
    match_rate = len(required_skills & cv_skills) / len(required_skills)

    if match_rate < 0.5:  # Thiếu hơn 50% kỹ năng bắt buộc
        return False

    return True
```

---

## Module 04 — AI Phân tích sâu (LLM Layer)

### Mục đích
Dùng LLM để tạo nhận xét chất lượng, giúp HR hiểu nhanh điểm mạnh/yếu của ứng viên mà không cần đọc toàn bộ CV.

### Output cần sinh ra

```json
{
  "summary": "Ứng viên có 4 năm kinh nghiệm Backend với Python và Django...",
  "strengths": [
    "Kinh nghiệm thực tế với hệ thống high-traffic (100k DAU)",
    "Đã từng lead team 3–5 người"
  ],
  "red_flags": [
    "Khoảng trống công việc 8 tháng (2022) chưa được giải thích",
    "Nhảy việc 3 lần trong 2 năm gần nhất"
  ],
  "fit_assessment": "Phù hợp tốt với yêu cầu kỹ thuật, cần xác minh thêm lý do nhảy việc",
  "interview_questions": [
    "Bạn đã xử lý bottleneck trong hệ thống high-traffic như thế nào?",
    "Lý do bạn rời công ty ABC vào tháng 6/2022?",
    "Kinh nghiệm lead team của bạn trong dự án X cụ thể là gì?"
  ]
}
```

### Prompt engineering

```
System:
Bạn là chuyên gia tuyển dụng cấp cao với 10 năm kinh nghiệm.
Phân tích CV ứng viên và Job Description, đưa ra đánh giá khách quan.
Luôn trả lời bằng JSON theo schema được cung cấp.
Không bịa thông tin — chỉ dựa trên dữ liệu có trong CV.

User:
Job Description: {jd_text}
CV đã parse: {cv_json}
Điểm matching: {score}/100

Hãy phân tích và trả về JSON theo schema sau:
{output_schema}
```

### Chi phí & tối ưu

| Chiến lược | Mô tả |
|-----------|-------|
| Chỉ chạy LLM cho Pass candidates | Tiết kiệm 50–70% chi phí |
| Cache kết quả theo CV hash | Không phân tích lại CV trùng |
| Dùng model nhỏ hơn cho tóm tắt | claude-haiku hoặc gpt-4o-mini |

---

## Module 05 — Ranking & Filtering

### Mục đích
Sắp xếp và phân loại ứng viên để HR làm việc theo thứ tự ưu tiên.

### Logic phân nhóm

```python
def classify_candidate(score: float, hard_filter_passed: bool) -> str:
    if not hard_filter_passed:
        return "FAIL"          # Không đủ yêu cầu tối thiểu

    if score >= 75:
        return "PASS"          # Vào shortlist, ưu tiên liên hệ
    elif score >= 50:
        return "NEEDS_REVIEW"  # HR xem xét thêm
    else:
        return "FAIL"          # Lưu trữ, không tiến tiếp
```

### Dashboard phân loại

```
Tổng CV nhận: 200
├── PASS (≥ 75đ):         42 ứng viên  [21%]  ← Shortlist ngay
├── NEEDS REVIEW (50–74): 68 ứng viên  [34%]  ← HR xem thêm
└── FAIL (< 50):          90 ứng viên  [45%]  ← Lưu trữ
```

### Cấu hình ngưỡng linh hoạt

HR có thể điều chỉnh ngưỡng theo từng vị trí:
- Vị trí khan hiếm nhân lực → hạ ngưỡng PASS xuống 65
- Vị trí cạnh tranh cao → nâng ngưỡng PASS lên 80
- Lọc bổ sung: theo địa điểm, mức lương kỳ vọng, ngày sẵn sàng nhận việc

---

## Module 06 — Output & Thông báo

### Dashboard HR

Các thông tin hiển thị cho mỗi ứng viên:

| Trường | Mô tả |
|--------|-------|
| Tên & thông tin liên hệ | Trực tiếp từ CV parse |
| Điểm tổng | 0–100 kèm breakdown theo tiêu chí |
| Nhóm | PASS / NEEDS REVIEW / FAIL |
| AI Summary | Tóm tắt 3–5 câu |
| Strengths & Red flags | Bullet points |
| Câu hỏi phỏng vấn gợi ý | 3–5 câu |
| Link CV gốc | Download trực tiếp |

### Tích hợp với hệ thống khác

```yaml
integrations:
  ats:
    - Workday
    - Greenhouse
    - BambooHR
    method: REST API / Webhook
    trigger: on_candidate_classified

  notification:
    - Email (SMTP / SendGrid)
    - Slack (Bot API)
    - Microsoft Teams (Incoming Webhook)
    trigger: on_new_pass_candidate

  calendar:
    - Google Calendar
    - Outlook
    method: auto-create interview slot
    trigger: on_hr_approve_candidate
```

### Auto-schedule phỏng vấn (tuỳ chọn)

Khi HR approve một ứng viên PASS:
1. Hệ thống kiểm tra lịch trống của interviewer
2. Tạo meeting link (Zoom / Google Meet)
3. Gửi email xác nhận cho ứng viên và interviewer
4. Tạo calendar event với đầy đủ thông tin

---

## JD Analyzer — Module phụ trợ

### Mục đích
Parse và chuẩn hoá Job Description để dùng trong Matching Engine.

### Output cần trích xuất từ JD

```json
{
  "position_title": "Senior Backend Developer",
  "must_have": {
    "experience_years": 3,
    "skills": ["Python", "PostgreSQL", "REST API", "Docker"],
    "education": "Cử nhân CNTT trở lên"
  },
  "nice_to_have": {
    "skills": ["Kubernetes", "Redis", "AWS"],
    "certifications": ["AWS Solutions Architect"]
  },
  "other": {
    "location": "Hà Nội (có thể remote)",
    "salary_range": "25–40 triệu",
    "work_type": "Full-time"
  }
}
```

---

## Feedback Loop & Cải thiện liên tục

### Cơ chế học từ HR

```
HR review kết quả sàng lọc
    │
    ├─ Agree (ứng viên PASS → thực sự tốt)   → Positive signal
    ├─ Disagree (ứng viên FAIL → thực ra tốt) → Negative signal
    └─ Add notes (lý do cụ thể)               → Training data
         │
         ▼
    Lưu vào database feedback
         │
         ▼
    Định kỳ (hàng tuần/tháng):
    - Phân tích pattern sai lệch
    - Điều chỉnh trọng số scoring
    - Fine-tune model (nếu đủ data)
    - Cập nhật hard filter rules
```

### Metrics theo dõi chất lượng

| Metric | Mục tiêu | Cảnh báo nếu |
|--------|----------|-------------|
| Precision (PASS candidates) | ≥ 85% | < 75% |
| Recall (không bỏ sót good candidates) | ≥ 90% | < 80% |
| False positive rate | ≤ 15% | > 25% |
| Avg processing time / CV | ≤ 30s | > 60s |
| HR override rate | ≤ 20% | > 35% |

---

## Tech Stack gợi ý

### Backend & AI

```
Language:       Python 3.11+
Framework:      FastAPI (async, hiệu năng cao)
Task Queue:     Celery + Redis (xử lý bất đồng bộ)
LLM:            Claude claude-sonnet-4-6 (phân tích sâu) / Haiku (tóm tắt nhanh)
Embedding:      OpenAI text-embedding-3-small / Cohere embed
Vector DB:      pgvector (PostgreSQL) hoặc Pinecone
OCR:            Tesseract / Google Cloud Vision
PDF parse:      pdfplumber, pymupdf
DOCX parse:     python-docx
```

### Infrastructure

```
Database:       PostgreSQL (structured data) + Redis (cache, queue)
Object Storage: AWS S3 / Google Cloud Storage (lưu file CV gốc)
Deployment:     Docker + Kubernetes (hoặc đơn giản hơn: Railway / Render)
Monitoring:     Prometheus + Grafana / Datadog
Logging:        ELK Stack / CloudWatch
```

### Frontend (Dashboard HR)

```
Framework:      Next.js / React
UI Library:     Shadcn/UI, Tailwind CSS
Charts:         Recharts / Chart.js
Auth:           NextAuth.js / Clerk
```

### Sơ đồ infrastructure

```
Internet
    │
    ├── API Gateway (rate limiting, auth)
    │       │
    │       ├── CV Ingestion Service  → S3 (raw files)
    │       │       └── Queue (Redis)
    │       │               │
    │       │               ├── File Processor Worker
    │       │               ├── CV Parser Worker (LLM)
    │       │               ├── Matching Worker
    │       │               └── Analysis Worker (LLM)
    │       │
    │       └── HR Dashboard API  ← PostgreSQL + pgvector
    │
    └── Notification Service → Email / Slack / Teams
```

---

## Thứ tự xây dựng khuyến nghị

### Phase 1 — MVP (4–6 tuần)
- [ ] Module 01: File ingestion (PDF/DOCX) + text extraction
- [ ] Module 02: CV parsing cơ bản với LLM
- [ ] JD Analyzer: Parse JD thủ công
- [ ] Module 03: Keyword matching đơn giản (chưa cần embedding)
- [ ] Module 05: Ranking & phân nhóm
- [ ] Output: CSV export cho HR

### Phase 2 — Nâng cấp (4–6 tuần)
- [ ] Module 01: Thêm OCR cho ảnh scan
- [ ] Module 03: Semantic matching với embedding
- [ ] Module 04: LLM deep analysis (summary, red flags, câu hỏi)
- [ ] Module 06: Dashboard web cơ bản
- [ ] Tích hợp email notification

### Phase 3 — Production (4–8 tuần)
- [ ] Feedback loop & analytics
- [ ] Tích hợp ATS/HRMS
- [ ] Auto-schedule phỏng vấn
- [ ] Fine-tuning model theo feedback
- [ ] Multi-tenant (nhiều công ty sử dụng)
- [ ] API cho bên thứ ba

---

## Các rủi ro & Lưu ý

### Bias trong AI

> **Quan trọng:** LLM có thể vô tình phân biệt đối xử dựa trên tên, giới tính, trường học. Cần ẩn các thông tin nhạy cảm trước khi đưa vào scoring nếu không cần thiết.

Giải pháp:
- Anonymize CV trước khi scoring (ẩn họ tên, ảnh, ngày sinh)
- Audit định kỳ để phát hiện bias theo nhóm nhân khẩu học
- Cho phép HR override và ghi lại lý do

### Bảo mật dữ liệu

- Mã hoá CV khi lưu trữ (at-rest encryption)
- Không lưu CV quá thời hạn quy định (GDPR, nghị định 13/2023)
- Audit log mọi thao tác truy cập CV
- Phân quyền chặt chẽ: HR chỉ thấy CV của vị trí mình phụ trách

### Chất lượng OCR

- CV scan chất lượng thấp → OCR sai → Parse sai → Score sai
- Giải pháp: Confidence score cho OCR, flag CV cần review thủ công nếu confidence < 80%

### Chi phí LLM

- Ước tính: ~$0.01–0.05 / CV (tuỳ model và độ dài CV)
- 1.000 CV/tháng ≈ $10–50/tháng
- Tối ưu bằng cách chỉ chạy LLM deep analysis cho PASS candidates

---

*Tài liệu này được tạo để làm blueprint cho việc xây dựng hệ thống AI sàng lọc CV. Các thông số và ngưỡng điểm cần được điều chỉnh dựa trên đặc thù từng doanh nghiệp.*
