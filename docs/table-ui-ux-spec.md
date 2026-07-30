# Quản lý Bảng Dữ Liệu (Data Table UI/UX Standard)

> **Tài liệu Chuẩn hóa UI/UX Bảng Dữ Liệu cho Toàn bộ Hệ thống HRM**  
> Dựa trên thiết kế và cấu trúc của trang **Yêu cầu tuyển dụng (`/recruitment/requisitions`)**.

---

## 1. Tổng quan Kiến trúc Giao diện (Layout Structure)

Mỗi trang hiển thị bảng dữ liệu (Data Table) trong hệ thống đều tuân thủ cấu trúc phân cấp từ ngoài vào trong như sau:

```
Container (p-4 sm:p-6, gap-6)
├── PageHeader (Tiêu đề, Mô tả, Button Hành động chính dạng rounded-full)
└── PageCard (Rounded-xl, Padding="none", overflow-hidden)
    ├── Status Tab Navigation (Thanh tab chuyển đổi trạng thái)
    ├── DataTableToolbar (Thanh công cụ Tìm kiếm + Bộ lọc)
    ├── Table (Cấu trúc bảng dữ liệu responsive)
    └── AppPagination (Thanh phân trang chuẩn ở footer)
```

---

## 2. Chi tiết từng Thành phần (Component Details & Code Snippets)

### 2.1. Khung chứa chính (PageCard Container)
Sử dụng `<PageCard padding="sm" className="p-0 overflow-hidden">` làm container bao bọc toàn bộ Tab, Toolbar, Table và Pagination.

- **Thuộc tính:** `p-0` loại bỏ padding viền ngoài card để Tab và Toolbar tràn viền hoàn toàn.
- **Bo góc:** `rounded-xl` chuẩn container.

---

### 2.2. Thanh Chuyển Tab Trạng Thái (Status Tab Navigation)
Được đặt ở đầu Card, hỗ trợ cuộn ngang (`overflow-x-auto hide-scrollbar`) khi có nhiều tab.

```tsx
<nav
  aria-label="Lọc theo trạng thái"
  className="flex items-center gap-6 overflow-x-auto border-b border-border px-6 hide-scrollbar bg-background"
>
  {TAB_DEFINITIONS.map((tab) => {
    const isActive = activeTab === tab.id
    const count = tabCounts[tab.id] || 0
    return (
      <button
        key={tab.id}
        onClick={() => {
          setActiveTab(tab.id)
          setPage(1)
        }}
        className={`relative flex items-center gap-2 py-4 font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {tab.label}
        <span
          className={`inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] font-bold px-1.5 border ${
            isActive
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-background border-border text-muted-foreground"
          }`}
        >
          {count}
        </span>
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full" />
        )}
      </button>
    )
  })}
</nav>
```

---

### 2.3. Thanh Tìm kiếm & Bộ Lọc (DataTableToolbar)
Sử dụng component `<DataTableToolbar />` dùng chung. **KHÔNG bọc thêm div xám bên ngoài** để tránh lỗi lặp ô bóng mờ.

```tsx
<DataTableToolbar
  searchQuery={keyword}
  onSearchChange={(value) => {
    setKeyword(value)
    setPage(1)
  }}
  searchPlaceholder="Tìm theo mã, tên, phòng ban..."
  actions={
    <div className="flex items-center gap-2">
      {/* Bộ lọc Dropdown */}
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        <Select
          value={filterValue}
          onValueChange={(val) => {
            setFilterValue(val)
            setPage(1)
          }}
        >
          <SelectTrigger size="sm" className="w-[170px] h-9 text-xs bg-background rounded-full">
            <SelectValue placeholder="Lọc thuộc tính" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="OPTION_1">Tùy chọn 1</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Nút Xóa Lọc (Reset) */}
      {hasActiveFilters && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-3 text-xs gap-1.5 rounded-full text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Xóa lọc
            </Button>
          </TooltipTrigger>
          <TooltipContent>Đặt lại tất cả bộ lọc</TooltipContent>
        </Tooltip>
      )}
    </div>
  }
/>
```

---

### 2.4. Bảng Dữ Liệu (Table & Row Styling)
Bảng sử dụng `<div className="overflow-x-auto">` (KHÔNG dùng `border-b` ở div này để tránh kẻ 2 đường viền ở footer).

#### 📐 Quy định Cột & Responsive
- **Cột Mã / ID:** `w-28 font-mono text-xs text-primary font-medium` (Link bấm được).
- **Cột Tiêu đề chính / Tên:** `min-w-56` (Cho phép hiển thị thông tin kèm phụ đề text-muted-foreground bên dưới).
- **Các cột bổ trợ (Phòng ban, Ngân sách, Hạn chót...):** Gán width rõ ràng (`w-36`, `w-44`) và dùng ẩn responsive (`hidden md:table-cell`, `hidden lg:table-cell`).
- **Cột Trạng thái:** `w-36` sử dụng `<StatusPill />`.
- **Cột Thao tác:** `w-36 text-right` chứa các icon button dạng `rounded-full`.

```tsx
<div className="overflow-x-auto">
  <Table>
    <TableHeader className="bg-muted/40">
      <TableRow>
        <TableHead className="w-28 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Mã</TableHead>
        <TableHead className="min-w-56 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Tên / Vị trí</TableHead>
        <TableHead className="hidden lg:table-cell w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Phòng ban</TableHead>
        <TableHead className="hidden md:table-cell w-44 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Người phụ trách</TableHead>
        <TableHead className="w-36 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Trạng thái</TableHead>
        <TableHead className="w-36 px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Thao tác</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {isLoading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell colSpan={6} className="p-3">
              <Skeleton className="h-12 w-full rounded-lg" />
            </TableCell>
          </TableRow>
        ))
      ) : items.length === 0 ? (
        <TableRow>
          <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
            {hasActiveFilters ? "Không tìm thấy dữ liệu phù hợp với bộ lọc" : "Chưa có dữ liệu nào"}
          </TableCell>
        </TableRow>
      ) : (
        items.map((item) => (
          <TableRow
            key={item.id}
            onClick={() => handleViewDetails(item.id)}
            className="cursor-pointer transition-colors duration-100 hover:bg-muted/25"
          >
            {/* Mã */}
            <TableCell className="px-4 py-3 font-mono text-xs font-medium text-primary">
              {item.code}
            </TableCell>

            {/* Tên chính & Mô tả phụ */}
            <TableCell className="px-4 py-3">
              <div className="font-medium text-foreground">{item.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.subText}</div>
            </TableCell>

            {/* Cột ẩn responsive */}
            <TableCell className="hidden lg:table-cell px-4 py-3 text-sm">
              {item.department}
            </TableCell>
            <TableCell className="hidden md:table-cell px-4 py-3 text-sm">
              {item.assignee}
            </TableCell>

            {/* Trạng thái */}
            <TableCell className="px-4 py-3">
              <StatusPill label={item.statusLabel} variant={item.statusVariant} />
            </TableCell>

            {/* Thao tác */}
            <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Xem chi tiết</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>
```

---

### 2.5. Thanh Phân Trang Footer (AppPagination)
Thẻ `<AppPagination>` được đặt **trực tiếp** trong `<PageCard>`, **KHÔNG bọc div wrapper**.

```tsx
<AppPagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  totalItems={totalItems}
  itemsPerPage={pageSize}
  onItemsPerPageChange={(value) => {
    setPageSize(value)
    setPage(1)
  }}
/>
```

#### Quy chuẩn UI của `AppPagination`:
- **Đường viền:** Duy nhất 1 đường `border-t border-border` phía trên ngăn cách với Table.
- **Nền:** Trong suốt/trắng hòa nhập với Card (`bg-background`).
- **Nút chọn số bản ghi (SelectTrigger):** Sử dụng `size="sm"` (`w-16 h-7.5 rounded-full text-xs font-medium px-2.5 shadow-none`).
- **Độ cao:** Padding `px-6 py-2.5`, font chữ `text-xs`.

---

## 3. Checklist Kiểm Tra Chuẩn UI/UX (DoD Checklist)

| STT | Quy chuẩn | Yêu cầu kiểm tra |
| --- | --- | --- |
| 1 | **Pill Rule** | Tất cả Button, Input tìm kiếm, SelectTrigger, Badge, TooltipIcon dùng `rounded-full`. |
| 2 | **No Double Borders** | Không có 2 đường line kẻ song song giữa Bảng và Phân trang. |
| 3 | **No Double Backgrounds** | Không bọc `DataTableToolbar` hay `AppPagination` trong các div `bg-muted/20` dầy cộp. |
| 4 | **Select Size** | Ô chọn số trang `AppPagination` dùng `size="sm" w-16 h-7.5 text-xs`. |
| 5 | **Responsive Widths** | Cột chính có `min-w-*`, cột phụ dùng `hidden md:table-cell` / `hidden lg:table-cell`. |
| 6 | **State Handling** | Đầy đủ Skeleton khi `isLoading`, Empty State thông báo chuẩn khi lọc không ra kết quả. |
