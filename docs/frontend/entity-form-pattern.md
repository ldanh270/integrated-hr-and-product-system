# Blueprint: Frontend Entity Form Pattern (Full-Page CRUD)

> **Mục đích:** Tài liệu này là **nguyên tắc chung (blueprint)** hướng dẫn AI Agents và Lập trình viên cách triển khai giao diện CRUD (Thêm/Sửa/Xóa) cho các Entity phức tạp ở Frontend.
> Bất cứ khi nào User yêu cầu "Áp dụng style của trang Salary Components" hoặc "Làm form CRUD full-page", hãy tuân thủ TUYỆT ĐỐI các quy tắc trong file này.

---

## 1. Nguyên lý Thiết kế cốt lõi

- **KHÔNG dùng Popup (Dialog/Sheet)** cho các Form dài và phức tạp.
- **SỬ DỤNG View-State Switching** (thay thế nguyên nội dung trang bằng Form) để có trải nghiệm toàn màn hình (Full-page experience).
- **Tuân thủ S.O.L.I.D:**
  - Giao diện Form và layout được tách rời (SRP, OCP).
  - Mọi logic xử lý dữ liệu (useForm, validation, mutations) phải được tách ra một custom hook riêng.

---

## 2. Kiến trúc Component Cần Có

Khi implement tính năng quản lý một Entity mới (VD: `Department`, `Employee`, `Project`), bạn cần tạo ra **3 file** theo cấu trúc sau:

### File 1: Hook Logic (`use-[entity]-form.ts`)

Tất cả logic về state, Zod schema, API call đều nằm ở đây. Không viết hàm mutate hay logic validate trực tiếp vào file giao diện.

```typescript
// hooks/feature-name/use-entity-form.ts
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  /* schema definitions */
})

export function useEntityForm({ initialData, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      initialData ||
      {
        /* default empty values */
      },
  })

  const onSubmit = async (values) => {
    // Xử lý API (Create hoặc Update dựa vào initialData)
    // Gọi onSuccess() khi hoàn tất
  }

  return { form, isPending, onSubmit: form.handleSubmit(onSubmit) }
}
```

### File 2: Component UI Form (`[entity]-form-page.tsx`)

Hiển thị form, bọc bên trong `<EntityFormPage>`. Bố cục chia thành từng khối chức năng riêng biệt.

```typescript
// components/features/feature-name/entity-form-page.tsx
import { EntityFormPage } from "@/components/common/entity-form-page";
import { useEntityForm } from "@/hooks/feature-name/use-entity-form";
import { Form, FormField, FormItem, FormControl, Input } from "@/components/ui/form-ui";

export function EntityFormPage({ initialData, isReadOnly, onSuccess, onCancel, onEdit }) {
  const { form, isPending, onSubmit } = useEntityForm({ initialData, onSuccess });

  return (
    <EntityFormPage
      title={initialData ? "Sửa Entity" : "Tạo mới Entity"}
      isReadOnly={isReadOnly}
      isPending={isPending}
      isDirty={form.formState.isDirty}
      formId="entity-form"  // ID này phải match với id của thẻ <form> bên dưới
      onBack={onCancel}
      onSubmit={onSubmit}
      onEdit={onEdit}
    >
      <Form {...form}>
        <form id="entity-form" onSubmit={onSubmit} className="space-y-6">
          {/* Card Section 1 */}
          <div className="bg-background border border-border rounded-xl overflow-hidden shadow-none">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h2 className="font-semibold text-foreground">Tiêu đề Card 1</h2>
            </div>
            <div className="p-6 space-y-6">
               {/* Đặt các FormField vào đây */}
            </div>
          </div>

          {/* Card Section 2... */}
        </form>
      </Form>
    </EntityFormPage>
  );
}
```

### File 3: Trang chính (`[Entity]Management.tsx`)

Áp dụng **View-State Pattern** để ẩn màn hình danh sách và hiện Form.

```typescript
// pages/feature-name/EntityManagement.tsx
import { useState } from "react";
import { EntityFormPage } from "@/components/features/feature-name/entity-form-page";
// ... (imports khác)

export default function EntityManagement() {
  // Quản lý trạng thái màn hình hiện tại
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedItem, setSelectedItem] = useState<IEntity | null>(null);

  const handleCloseForm = () => {
    setView("list");
    setSelectedItem(null);
  };

  // Render Full-page Form nếu không ở chế độ "list"
  if (view !== "list") {
    return (
      <EntityFormPage
        initialData={selectedItem}
        onCancel={handleCloseForm}
        onSuccess={handleCloseForm}
      />
    );
  }

  // Render Danh sách (Table/List) mặc định
  return (
    <div className="container px-6 py-6">
      <PageHeader
        title="Quản lý Entity"
        actions={<Button onClick={() => setView("create")}>Tạo mới</Button>}
      />
      {/* ... Table UI */}
    </div>
  );
}
```

---

## 3. Các Micro-Interactions Bắt Buộc

Để giao diện đạt chuẩn cao cấp (Premium UX), Lập trình viên/Agent phải tuân thủ các quy định nhỏ sau:

1. **Pill Rule (Quy tắc Bo tròn):** Toàn bộ các thẻ `<Input>`, `<SelectTrigger>`, `<Button>` trong form đều bắt buộc phải thêm class `rounded-full`.
2. **Card Rule:** Khối chứa các section trong Form phải dùng `rounded-xl`.
3. **Smart Interaction (Clickable Helpers):** Nếu field cần nhập chuỗi phức tạp (như công thức, mã số), hãy hiển thị danh sách Gợi ý dưới dạng tag (chips) để User có thể bấm vào và insert tự động, tránh gõ tay. Ví dụ: `rounded-full border bg-muted hover:bg-accent text-xs font-mono cursor-pointer`.
4. **Tránh Overlay Rác:** Tuyệt đối không dùng Modal/Sheet cho Form nào tốn quá 1/3 chiều cao màn hình hoặc có chứa cấu trúc Grid/Table bên trong.
