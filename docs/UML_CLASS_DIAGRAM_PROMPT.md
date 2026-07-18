# UML Class Diagram Generator Prompt

Hãy tự đọc và phân tích source code hiện tại trong workspace để tạo UML Class Diagram bằng Mermaid.

## Mục tiêu

- Tạo class diagram thể hiện các class, interface, thuộc tính, constructor, method và quan hệ thực tế trong source code.
- Kết quả phải đủ chi tiết để mô tả cấu trúc của từng chức năng/module, nhưng không làm sơ đồ quá rối.

## Phạm vi phân tích

Chỉ đọc các file source code liên quan trực tiếp đến chức năng/module sau:

> **[ĐIỀN TÊN MODULE HOẶC CHỨC NĂNG CẦN VẼ]**

Tự tìm các file liên quan trong workspace, bao gồm khi phù hợp:

- controller
- route
- service
- repository/dao
- model/entity
- interface
- abstract class
- DTO
- schema
- middleware
- utility/helper được sử dụng trực tiếp

Theo dõi import và dependency để tìm đủ các class liên quan.

Không quét hoặc đưa vào sơ đồ các phần không liên quan.

Bỏ qua:

- `node_modules`
- `dist`
- `build`
- `coverage`
- generated files
- migration files
- test mocks
- file cấu hình không ảnh hưởng trực tiếp đến cấu trúc class

Không sửa source code.

Không tạo file mới.

Chỉ phân tích và trả kết quả trong chat.

## Quy trình phân tích

Trước khi tạo sơ đồ:

1. Xác định entry point của chức năng/module.
2. Liệt kê các file thực sự liên quan.
3. Đọc implementation, import, constructor injection, field type, method parameter và return type.
4. Chỉ đưa một thành phần vào sơ đồ khi có bằng chứng rõ ràng trong source code.
5. Không suy đoán class, method hoặc quan hệ không tồn tại.

## Quy tắc chọn thành phần

- Bao gồm class và interface trực tiếp tham gia vào luồng xử lý.
- Bao gồm DTO hoặc model quan trọng được truyền giữa các layer.
- Không đưa mọi type nhỏ vào sơ đồ nếu chúng chỉ làm sơ đồ rối.
- Không đưa local variable vào class diagram.
- Không đưa nội dung bên trong method.
- Có thể bỏ qua getter/setter đơn giản.
- Phải giữ các business method quan trọng.
- Với framework function hoặc plain exported function không thuộc class:
  - Không tự biến chúng thành class.
  - Chỉ đưa vào khi cần thiết và phải biểu diễn bằng một class/module hợp lý có căn cứ từ cấu trúc code.
- Nếu project không tổ chức theo class, hãy nói rõ phần nào không thể biểu diễn chính xác bằng UML class diagram.

## Quy tắc lấy thông tin class

- Giữ nguyên chính xác tên class/interface trong source code.
- Liệt kê field/property theo dạng:

```text
visibility name: Type
```

- Liệt kê method theo dạng:

```text
visibility methodName(paramName: Type): ReturnType
```

- Liệt kê constructor khi constructor có dependency hoặc logic quan trọng.
- Giữ nguyên tên method, parameter và kiểu dữ liệu.
- Với generic type trong Mermaid, dùng dấu `~` thay cho `< >`.

Ví dụ:

```text
Promise<User> → Promise~User~
Array<Role> → Array~Role~
PaginatedResult<Employee> → PaginatedResult~Employee~
```

Ký hiệu visibility:

```text
+ public
- private
# protected
~ package/default
```

## Quy tắc xác định quan hệ

Kế thừa:

```text
Child --|> Parent
```

Implementation:

```text
Class ..|> Interface
```

Một class giữ class khác trong field hoặc constructor dependency:

```text
ClassA --> ClassB
```

Một class chỉ dùng class khác trong tham số, kiểu trả về hoặc gọi tạm thời:

```text
ClassA ..> ClassB
```

Aggregation:

```text
Whole o-- Part
```

Composition:

```text
Whole *-- Part
```

Chỉ dùng aggregation hoặc composition khi source code thể hiện rõ quan hệ sở hữu và vòng đời.

## Quy tắc tránh sai quan hệ

- Không coi mọi import là dependency.
- Không coi primitive type là class.
- Không tạo quan hệ chỉ vì hai class cùng nằm trong một module.
- Không tạo nhiều đường quan hệ trùng nhau giữa cùng hai class nếu không cần thiết.
- Ưu tiên quan hệ mạnh nhất có bằng chứng rõ trong code.
- Không tự gắn nhãn quan hệ nếu code không thể hiện rõ ý nghĩa.
- Không suy luận composition chỉ từ việc một class có field kiểu class khác.

## Yêu cầu về độ chi tiết

- Nếu module nhỏ, tạo một sơ đồ đầy đủ.
- Nếu module lớn, chia thành nhiều sơ đồ theo từng chức năng hoặc luồng nghiệp vụ.
- Mỗi sơ đồ nên tập trung vào một use case cụ thể.
- Không nhồi toàn bộ project vào một sơ đồ.

Ưu tiên chia theo cấu trúc thực tế của project, ví dụ:

- Authentication
- Authorization
- Role management
- Employee management
- Payroll
- Attendance
- Project
- Task

## Yêu cầu đầu ra

Trước tiên, trả về phần `Phạm vi đã phân tích`, gồm:

- Tên chức năng/module.
- Danh sách file đã đọc.
- Các file bị loại và lý do ngắn gọn.

Sau đó trả về code Mermaid hoàn chỉnh.

Không:

- Dùng ảnh.
- Tạo file `.mmd`.
- Tạo file `.drawio`.
- Thay đổi source code.
- Bỏ dấu visibility.
- Viết pseudo-code.

## Cấu trúc Mermaid bắt buộc

````text
```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "background": "#ffffff",
    "primaryColor": "#ffffff",
    "primaryTextColor": "#000000",
    "primaryBorderColor": "#000000",
    "lineColor": "#000000",
    "fontFamily": "Arial",
    "fontSize": "14px"
  }
}}%%

classDiagram
    direction LR

    ...

    classDef uml fill:#ffffff,stroke:#000000,stroke-width:1px,color:#000000

    class ClassName1 uml
    class ClassName2 uml
```
````

## Style bắt buộc

- Nền sơ đồ màu trắng.
- Nền tất cả class màu trắng.
- Viền class màu đen.
- Chữ màu đen.
- Đường nối và đầu mũi tên màu đen.
- Viền class dày `1px`.
- Font Arial, kích thước `14px`.
- Dùng theme `base`.
- Áp dụng `classDef uml` cho toàn bộ class và interface.

## Kiểm tra trước khi trả kết quả

- Mỗi class trong quan hệ phải được khai báo.
- Không có tên class bị sai.
- Không có method tự tạo.
- Không có relation chỉ dựa trên suy đoán.
- Mermaid phải hợp lệ và có thể dán trực tiếp vào:
  - Draw.io
  - `Insert`
  - `Advanced`
  - `Mermaid`
- Không dùng cú pháp Mermaid không được Draw.io hỗ trợ phổ biến.
- Nếu có phần chưa xác định rõ từ source code, ghi riêng dưới nhãn `[Chưa xác minh]` và không đưa phần đó vào sơ đồ.

## Chức năng cần phân tích

Bắt đầu bằng việc tự tìm các file liên quan đến:

> **[ĐIỀN TÊN CHỨC NĂNG/MODULE]**

Sau khi đọc đủ source code, hãy tạo kết quả cuối cùng.
