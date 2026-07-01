# Luồng nghiệp vụ tuyển dụng (Recruitment Process)

| | |
|---|---|
| **Phiên bản** | 1.0 |
| **Ngày tạo** | 23/06/2026 |
| **Trạng thái** | Draft — thiết kế mới, chưa triển khai |
| **Phạm vi** | Từ mở Job Requisition đến khi Candidate chính thức trở thành Employee |

---

## 1. Tổng quan luồng

Quy trình tuyển dụng gồm 8 giai đoạn chính, theo thứ tự:

0. Job Requisition & Phê duyệt
1. Tạo JD & Đăng tuyển đa kênh
2. Nộp CV & Tạo Candidate/Application
3. Screening (Kanban + AI)
4. Interview & Evaluation (multi-round)
5. Offer & Negotiation
6. Background Check
7. Convert Candidate → Employee

---

## 2. Sơ đồ tổng thể (text-based flow)

```
[Job Requisition] 
      |
      v
  <Duyệt requisition?> --No--> [Đóng/lưu hồ sơ]
      |Yes
      v
[Tạo JD] --> [Đăng đa kênh: LinkedIn, GG Form, website...]
      |
      v
[Candidate nộp CV] --> [Tạo/match Candidate + tạo Application]
      |
      v
[Screening: Kanban + AI scoring] 
      |
      +--Reject--> [Gửi mail từ chối] --> [Đóng Application]
      |
      v Shortlist
[Interview Round 1..N] (vòng lặp)
      |  |
      |  +--Fail tại round bất kỳ--> [Reject] --> [Gửi mail từ chối]
      |
      v Pass hết các round
<Quyết định cuối — Hiring Manager> --No--> [Reject] --> [Gửi mail từ chối]
      |Yes
      v
[Soạn & duyệt Offer] --> [Gửi Offer cho Candidate]
      |
      v
<Candidate phản hồi?>
      |        |              |
   Decline  Negotiate        Accept
      |        |              |
      v        v (vòng lại    v
[Đóng hồ sơ]  duyệt offer)  [Background Check]
                                  |
                          +-------+-------+
                          |       |       |
                        Pass   Cần làm   Fail
                          |     rõ        nghiêm trọng
                          |       |       |
                          |   (giải trình |
                          |    rồi review |
                          |    lại)       |
                          v               v
                  [Onboarding] -- Day 1 --> [Convert Candidate -> Employee]
                                            
                                  [Offer Rescinded] (trạng thái riêng, lưu lịch sử)
```

---

## 3. Danh sách Actor (vai trò)

| Actor | Vai trò trong luồng |
|---|---|
| **Hiring Manager (HM)** | Đề xuất requisition, duyệt JD, ra quyết định cuối cùng chọn candidate, duyệt mức lương offer |
| **Recruiter / HR** | Tạo JD, đăng tuyển, quản lý pipeline Kanban, lên lịch interview, soạn offer, theo dõi background check |
| **Hệ thống (System/AI)** | Tự động tạo Candidate/Application từ CV nộp vào, AI scoring khi screening, tự động gửi email theo trạng thái, tự động convert Candidate → Employee tại Day 1 |
| **Interviewer** | Tham gia phỏng vấn, điền scorecard đánh giá trên hệ thống |
| **Candidate / Ứng viên** | Nộp CV, tham gia phỏng vấn, phản hồi offer (Accept/Negotiate/Decline), cung cấp thông tin cho background check |
| **Bộ phận pháp lý / Compliance** (tùy quy mô công ty) | Review trước khi rescind offer, tư vấn các case background check nhạy cảm |
| **Đơn vị Background Check** (nội bộ HR hoặc bên thứ 3 outsource) | Thực hiện xác minh thông tin candidate |

---

## 4. Mô tả chi tiết từng giai đoạn

### Giai đoạn 0 — Job Requisition & Phê duyệt

**Mục đích:** Đảm bảo mọi JD được đăng tuyển đều gắn với một nhu cầu nhân sự đã được phê duyệt (ngân sách, headcount), tránh tuyển tự do không kiểm soát.

**Input:** Đề xuất từ Hiring Manager (lý do tuyển: thay thế, mở rộng; số lượng; ngân sách lương; deadline mong muốn).

**Luồng xử lý:**
1. HM tạo Job Requisition trên hệ thống.
2. Hệ thống route đến người duyệt (có thể là cấp trên của HM, hoặc HRBP, tùy cấu trúc công ty).
3. Người duyệt **Approve** hoặc **Reject**.
   - Approve → requisition chuyển trạng thái `Open`, có thể tạo JD.
   - Reject → requisition đóng, lưu lại lý do.

**Output:** 1 Job Requisition ở trạng thái `Open`, có `Requisition ID` duy nhất.

**Business rule:**
- Mỗi JD phải gắn với đúng 1 Requisition ID (1 Requisition có thể có nhiều JD nếu đăng nhiều kênh, nhưng vẫn là 1 nhu cầu tuyển dụng).
- Requisition có số lượng cần tuyển (`headcount_needed`). Khi số Candidate đã `Hired` cho Requisition này = `headcount_needed`, hệ thống tự động đề xuất đóng Requisition (không tự động đóng cứng, vì có thể cần tuyển thêm dự phòng).

---

### Giai đoạn 1 — Tạo JD & Đăng tuyển đa kênh

**Mục đích:** Công khai vị trí tuyển dụng để thu hút ứng viên.

**Luồng xử lý:**
1. Recruiter/HR tạo JD dựa trên Requisition đã duyệt.
2. JD có thể được đăng đồng thời lên nhiều kênh: LinkedIn, Google Form, website công ty, headhunter, referral nội bộ...
3. Mỗi kênh đăng tuyển cần được gắn 1 mã **Source** (nguồn) để tracking hiệu quả từng kênh.

**Business rule:**
- 1 JD có thể có N điểm đăng (channel links), nhưng tất cả candidate ứng tuyển từ các kênh này đều thuộc về cùng 1 JD / Requisition.
- Source phải được gắn vào Application ngay từ lúc tạo, không gắn được nữa sau khi candidate đã vào pipeline (để đảm bảo số liệu báo cáo nguồn tuyển chính xác).

---

### Giai đoạn 2 — Nộp CV & Tạo Candidate / Application

**Mục đích:** Ghi nhận ứng viên vào hệ thống khi họ nộp CV.

**Mô hình dữ liệu — 2 entity tách biệt:**
- **Candidate**: đại diện cho 1 con người (xác định bằng email hoặc số điện thoại là khóa định danh chính). Một Candidate chỉ tồn tại 1 lần trong hệ thống dù họ ứng tuyển bao nhiêu lần.
- **Application**: đại diện cho 1 lượt ứng tuyển của 1 Candidate vào 1 JD/Requisition cụ thể. Một Candidate có thể có nhiều Application (ứng tuyển nhiều vị trí, hoặc ứng tuyển lại sau khi bị reject).

**Luồng xử lý:**
1. Ứng viên nộp CV qua kênh bất kỳ.
2. Hệ thống kiểm tra email/SĐT đã tồn tại trong bảng Candidate chưa.
   - Nếu chưa → tạo Candidate mới + tạo Application mới, trạng thái `New`.
   - Nếu đã tồn tại → match vào Candidate đã có, chỉ tạo Application mới gắn với JD hiện tại.
3. Hệ thống parse CV (nếu hỗ trợ), validate định dạng file và các field bắt buộc tối thiểu (họ tên, liên hệ).

**Business rule:**
- Không cho phép 1 Candidate có 2 Application đang `Active` (chưa đóng) cho cùng 1 Requisition — tránh ứng tuyển trùng vào cùng vị trí.
- Candidate có thể ứng tuyển lại vào vị trí đã từng bị reject, nhưng nên có khoảng cách thời gian tối thiểu (ví dụ 6 tháng) — **business cần quyết định rule này**.

---

### Giai đoạn 3 — Screening (Kanban + AI + Email tự động)

**Mục đích:** Lọc ứng viên phù hợp để đưa vào vòng phỏng vấn.

**Luồng xử lý:**
1. Application mới xuất hiện ở cột đầu của bảng Kanban (ví dụ: cột `New Applications`).
2. (Tùy chọn) AI tự động chấm điểm độ phù hợp dựa trên CV vs JD, gắn score hoặc tag gợi ý cho Recruiter — **không tự động loại candidate**, chỉ hỗ trợ ra quyết định.
3. Recruiter kéo-thả Application giữa các cột Kanban (ví dụ: `New` → `Reviewing` → `Shortlisted` → `Rejected`).
4. Mỗi lần đổi cột, hệ thống tự động gửi email tương ứng đến Candidate theo mapping đã định nghĩa trước.

**Business rule:**
- Cần có **bảng mapping cố định** giữa từng cột Kanban và (a) loại email gửi đi, (b) có gửi email hay không. Ví dụ cột `Reviewing` có thể không cần gửi email, nhưng cột `Rejected` và `Shortlisted` thì có.
- Vì hành động kéo-thả là tức thời và dễ nhầm, hệ thống nên có **bước xác nhận (confirm dialog)** trước khi gửi email tự động, đặc biệt với các cột có tính chất "không thể hoàn tác về mặt cảm xúc" như `Rejected`.
- AI screening (nếu áp dụng) cần ghi log lại tiêu chí chấm điểm để có thể giải trình khi cần (audit trail), tránh rủi ro thiên vị (bias) không kiểm soát được.

**Output:** Application chuyển sang trạng thái `Shortlisted` (tiếp tục sang Interview) hoặc `Rejected` (đóng Application, lưu lý do).

---

### Giai đoạn 4 — Interview & Evaluation (multi-round)

**Mục đích:** Đánh giá năng lực, sự phù hợp của candidate qua nhiều vòng phỏng vấn.

**Luồng xử lý (vòng lặp cho mỗi round):**
1. Recruiter (hoặc hệ thống tự động theo template round đã định nghĩa cho Job Family) tạo lịch phỏng vấn cho round hiện tại.
2. Gán 1 hoặc nhiều Interviewer cho round này.
3. Sau buổi phỏng vấn, từng Interviewer điền **scorecard đánh giá** trực tiếp trên hệ thống (điểm số theo tiêu chí + nhận xét + kết luận Pass/Fail/Borderline).
4. Hệ thống tổng hợp kết quả của round:
   - Nếu nhiều Interviewer trong cùng round có ý kiến khác nhau, cần **cơ chế tổng hợp rõ ràng** — ví dụ: cần đồng thuận (consensus) hoặc tính điểm trung bình có trọng số. **Business cần quyết định cơ chế này.**
5. Nếu round **Fail** → chuyển Application sang `Rejected`, gửi mail từ chối, dừng vòng lặp.
6. Nếu round **Pass** → kiểm tra còn round tiếp theo trong quy trình của Job Family này không:
   - Còn → quay lại bước 1 cho round kế tiếp.
   - Hết (đã pass round cuối) → thoát vòng lặp, chuyển sang bước quyết định cuối.

**Bước quyết định cuối (sau khi pass hết các round):**
- Hiring Manager xem tổng hợp toàn bộ scorecard của tất cả round và đưa ra quyết định cuối cùng: **Select** (chọn) hoặc **Reject** (không chọn, dù đã pass từng round riêng lẻ — đây là quyền quyết định tổng thể của HM).

**Business rule:**
- Cần định nghĩa trước **số round và loại round** theo từng Job Family/Level (ví dụ vị trí Senior cần thêm round phỏng vấn với Director, vị trí Junior có thể bỏ qua 1 round).
- Cần làm rõ: round sau có bắt buộc phải đợi round trước Pass mới được tạo lịch không, hay có thể overlap (đặt lịch round 2 trước khi có kết quả round 1, để tiết kiệm thời gian)? **Business cần quyết định.**
- Lưu toàn bộ lịch sử scorecard của mọi round, mọi interviewer — không cho sửa sau khi đã submit (chỉ cho thêm ghi chú bổ sung) để đảm bảo tính minh bạch.

---

### Giai đoạn 5 — Offer & Negotiation

**Mục đích:** Chính thức đề xuất công việc cho candidate và đạt được thỏa thuận trước khi candidate gia nhập.

**Luồng xử lý:**
1. Recruiter soạn Offer (lương, vị trí, ngày bắt đầu dự kiến, các phúc lợi) dựa trên quyết định của Hiring Manager.
2. Offer cần được **duyệt** (thường là cấp quản lý cao hơn HM hoặc bộ phận C&B) trước khi gửi cho candidate — đảm bảo đúng khung lương, đúng chính sách công ty.
3. Gửi Offer cho Candidate.
4. Candidate phản hồi theo 1 trong 3 hướng:
   - **Accept**: chuyển sang Background Check.
   - **Negotiate**: candidate đề xuất điều chỉnh (lương, ngày bắt đầu...) → quay lại bước duyệt offer với điều khoản mới (tạo phiên bản offer mới, lưu lại lịch sử các phiên bản để tránh nhầm lẫn).
   - **Decline**: đóng Application, lưu lý do từ chối (rất hữu ích cho phân tích benchmark lương sau này).

**Business rule:**
- Offer cần có **versioning** (offer v1, v2...) nếu có đàm phán nhiều lần — không ghi đè trực tiếp lên offer cũ.
- Cần giới hạn số lần đàm phán tối đa hoặc thời hạn phản hồi offer (ví dụ: candidate phải phản hồi trong 5 ngày làm việc) để tránh giữ vị trí treo vô thời hạn — **business cần quyết định con số cụ thể**.
- Offer đã gửi nhưng chưa phản hồi sau thời hạn → hệ thống nhắc Recruiter follow-up, không tự động huỷ.

---

### Giai đoạn 6 — Background Check

**Mục đích:** Xác minh thông tin candidate trước khi chính thức tuyển dụng, giảm rủi ro pháp lý và rủi ro nhân sự cho công ty.

**Các nhóm kiểm tra (checklist nên được định nghĩa động theo Job Family/Level, không áp dụng cứng 1 bộ check cho mọi vị trí):**

| Nhóm | Nội dung kiểm tra | Áp dụng cho |
|---|---|---|
| A — Cơ bản | Xác minh CMND/CCCD, bằng cấp, lịch sử công việc, reference check | Hầu hết vị trí |
| B — Pháp lý/Lý lịch | Lý lịch tư pháp, kiểm tra tín dụng (CIC) | Vị trí tài chính, ngân hàng, giáo dục, một số ngành có quy định riêng |
| C — Chuyên môn | Xác minh chứng chỉ hành nghề, xác minh bằng cấp với nơi cấp | Vị trí yêu cầu chứng chỉ (kế toán, kiểm toán, y tế, luật) |
| D — Đặc thù cấp cao/nhạy cảm | Drug test, kiểm tra xung đột lợi ích, kiểm tra uy tín | Vị trí lãnh đạo, vị trí có quyền quyết định mua hàng/đầu tư |

**Luồng xử lý:**
1. Hệ thống khởi tạo checklist BGC dựa trên Job Family/Level của vị trí, ngay sau khi Candidate Accept Offer.
2. Thực hiện các mục kiểm tra (do HR nội bộ thực hiện hoặc outsource cho đơn vị thứ 3 — **business cần xác nhận mô hình vận hành**).
3. HR review tổng hợp kết quả, phân loại theo 3 nhánh:
   - **Pass** → tiếp tục onboarding, chờ đến ngày Day 1 để convert sang Employee.
   - **Cần làm rõ** (sai lệch nhỏ, chưa xác minh được do bên thứ 3 chưa phản hồi): candidate được yêu cầu giải trình, sau đó HR review lại — không tự động reject.
   - **Fail nghiêm trọng** (gian dối thông tin, có án tích liên quan trực tiếp công việc): chuyển sang trạng thái **Offer Rescinded** (xem lưu ý quan trọng dưới đây), kèm bước review của bộ phận pháp lý trước khi chính thức rút offer.

**Lưu ý quan trọng — không dùng trạng thái "Rejected" cho trường hợp này:**
- Candidate đã từng được gửi offer và Accept — về bản chất và pháp lý, đây khác hoàn toàn với một candidate bị reject trong giai đoạn sàng lọc/phỏng vấn (chưa từng có cam kết chính thức nào).
- Cần trạng thái riêng: **`Offer Rescinded`**, lưu đầy đủ lịch sử: ngày gửi offer, ngày accept, ngày rescind, lý do rescind, người phê duyệt việc rescind.
- Lý do: nếu candidate đã nghỉ việc ở công ty cũ dựa trên offer đã nhận, việc rút offer có thể phát sinh tranh chấp pháp lý — cần dữ liệu đầy đủ để công ty có thể giải trình khi cần.

**Business rule:**
- Nếu đến ngày Day 1 dự kiến mà Background Check chưa hoàn tất, cần quy trình rõ ràng: cho onboard tạm có điều kiện (conditional hire) hay dời ngày Day 1? **Business cần quyết định.**

---

### Giai đoạn 7 — Convert Candidate → Employee

**Mục đích:** Chính thức ghi nhận candidate là nhân viên trong hệ thống HRM.

**Thời điểm convert:** Đúng vào **ngày Day 1 (ngày candidate chính thức đi làm)**, không phải lúc Accept Offer hay lúc Pass Background Check — vì giữa các mốc này có thể cách nhau vài tuần đến vài tháng, và candidate vẫn có thể rút lui (withdraw) trong khoảng thời gian đó.

**Luồng xử lý:**
1. Sau khi Background Check Pass, Application chuyển trạng thái `Pending Onboarding`, lưu ngày Day 1 dự kiến.
2. Hệ thống tự động trigger việc convert sang Employee **đúng vào ngày Day 1**.
3. Mapping dữ liệu từ Candidate/Application sang Employee record — đây là 2 schema khác nhau, cần xác định rõ field nào map sang field nào (ví dụ: CV/scorecard không cần mang sang Employee, nhưng thông tin cá nhân, mức lương final, ngày bắt đầu thì cần).

**Business rule:**
- Nếu Candidate **withdraw** (rút lui) sau khi Accept Offer nhưng trước ngày Day 1 → cần trạng thái riêng `Candidate Withdrew`, khác với `Offer Rescinded` (chủ động từ phía công ty) và `Rejected` (do công ty không chọn).
- Cần xác nhận: Candidate ID và Employee ID là 2 ID khác nhau hay giữ nguyên 1 ID xuyên suốt? (Ảnh hưởng đến thiết kế database và các hệ thống liên quan như payroll). **Business cần quyết định.**

---

## 5. Bảng tổng hợp trạng thái Application (Status Lifecycle)

| Trạng thái | Ý nghĩa | Có thể quay lại được không |
|---|---|---|
| `New` | Vừa nộp CV | — |
| `Reviewing` | Đang được Recruiter/AI xem xét | — |
| `Shortlisted` | Qua screening, chuẩn bị phỏng vấn | — |
| `Interviewing` | Đang trong 1 trong các round phỏng vấn | Có (round N → round N+1) |
| `Final Review` | Đã pass hết các round, chờ HM quyết định | — |
| `Offer Sent` | Offer đã gửi, chờ phản hồi | Có thể quay lại `Offer Sent` (v2) nếu Negotiate |
| `Offer Accepted` | Candidate đã đồng ý offer | — |
| `Background Check` | Đang xác minh thông tin | Có thể quay lại nếu cần làm rõ |
| `Pending Onboarding` | Đã pass BGC, chờ đến ngày Day 1 | — |
| `Hired` (= Employee) | Đã chính thức là nhân viên tại Day 1 | Trạng thái cuối |
| `Rejected` | Bị từ chối ở bất kỳ giai đoạn nào trước Offer | Trạng thái cuối (có thể ứng tuyển lại sau với Application mới) |
| `Offer Declined` | Candidate tự chối offer | Trạng thái cuối |
| `Offer Rescinded` | Công ty rút lại offer đã accept (do BGC fail nghiêm trọng) | Trạng thái cuối |
| `Candidate Withdrew` | Candidate tự rút lui sau khi accept, trước Day 1 | Trạng thái cuối |

---

## 6. Danh sách câu hỏi nghiệp vụ cần Business xác nhận

1. Khoảng thời gian tối thiểu candidate được ứng tuyển lại vào vị trí đã bị reject là bao lâu?
2. Cơ chế tổng hợp kết quả khi nhiều Interviewer trong cùng 1 round đánh giá khác nhau (đồng thuận hay điểm trung bình có trọng số)?
3. Các round phỏng vấn có bắt buộc tuần tự hay được phép đặt lịch song song (overlap)?
4. Số lần đàm phán offer tối đa và thời hạn candidate phải phản hồi offer là bao nhiêu ngày?
5. Background Check do HR nội bộ thực hiện hay outsource cho bên thứ 3?
6. Nếu đến ngày Day 1 mà Background Check chưa xong: cho onboard tạm có điều kiện hay dời ngày Day 1?
7. Candidate ID và Employee ID dùng chung 1 mã xuyên suốt hay tách 2 mã riêng?

---

## 7. Phụ lục — Sơ đồ tham khảo

Tài liệu này đi kèm 3 sơ đồ trực quan:
- Sơ đồ tổng thể end-to-end (8 giai đoạn chính).
- Sơ đồ chi tiết vòng lặp Multi-round Interview & Offer/Negotiation.
- Sơ đồ chi tiết luồng Background Check với 3 nhánh kết quả.
