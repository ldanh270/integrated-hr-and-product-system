export const FILTER_DEFINITIONS = {
  status: { label: "Trạng thái", type: "status", group: "" },
  tracker: { label: "Kiểu vấn đề", type: "tracker", group: "" },
  priority: { label: "Mức ưu tiên", type: "priority", group: "" },
  author: { label: "Tác giả", type: "employee", group: "" },
  assignee: { label: "Phân công cho", type: "employee", group: "" },
  target_version: { label: "Phiên bản", type: "version", group: "" },
  subject: { label: "Chủ đề", type: "text", group: "" },
  progress: { label: "Tiến độ", type: "progress", group: "" },
  updated_by: { label: "Cập nhật bởi", type: "employee", group: "" },
  last_updated_by: { label: "Cập nhật lần cuối bởi", type: "employee", group: "" },
  subproject: { label: "Dự án con", type: "text", group: "" },
  issue: { label: "Vấn đề", type: "text", group: "" },
  
  // Group: Văn bản
  txt_subject: { label: "Chủ đề", type: "text", group: "Văn bản" },
  txt_desc: { label: "Mô tả", type: "text", group: "Văn bản" },
  txt_notes: { label: "Ghi chú", type: "text", group: "Văn bản" },
  txt_any: { label: "Any searchable text", type: "text", group: "Văn bản" },

  // Group: Ngày
  date_created: { label: "Tạo", type: "date", group: "Ngày" },
  date_updated: { label: "Cập nhật", type: "date", group: "Ngày" },
  date_closed: { label: "Đã đóng", type: "date", group: "Ngày" },
  date_start: { label: "Bắt đầu", type: "date", group: "Ngày" },
  date_due: { label: "Hết hạn", type: "date", group: "Ngày" },

  // Group: Theo dõi thời gian
  time_est: { label: "Thời gian ước lượng", type: "number", group: "Theo dõi thời gian" },
  time_spent: { label: "Thời gian", type: "number", group: "Theo dõi thời gian" },

  // Group: Tập tin
  file_name: { label: "Tập tin", type: "text", group: "Tập tin" },
  file_desc: { label: "File description", type: "text", group: "Tập tin" },

  // Group: Tác giả
  author_group: { label: "Của tác giả : Nhóm", type: "text", group: "Tác giả" },
  author_role: { label: "Của tác giả : Quyền", type: "text", group: "Tác giả" },

  // Group: Phân công cho
  assignee_group: { label: "Nhóm thụ hưởng", type: "text", group: "Phân công cho" },
  assignee_role: { label: "Quyền thụ hưởng", type: "text", group: "Phân công cho" },

  // Group: Phiên bản
  ver_date: { label: "Phiên bản mục tiêu của Ngày", type: "date", group: "Phiên bản" },
  ver_status: { label: "Phiên bản mục tiêu của Trạng thái", type: "text", group: "Phiên bản" },

  // Group: Dự án
  proj_status: { label: "Của dự án : Trạng thái", type: "text", group: "Dự án" },

  // Group: Mối quan hệ
  rel_related: { label: "liên quan", type: "relation", group: "Mối quan hệ" },
  rel_duplicate: { label: "trùng với", type: "relation", group: "Mối quan hệ" },
  rel_duplicated_by: { label: "bị trùng bởi", type: "relation", group: "Mối quan hệ" },
  rel_blocks: { label: "chặn", type: "relation", group: "Mối quan hệ" },
  rel_blocked_by: { label: "chặn bởi", type: "relation", group: "Mối quan hệ" },
  rel_precedes: { label: "đi trước", type: "relation", group: "Mối quan hệ" },
  rel_follows: { label: "đi sau", type: "relation", group: "Mối quan hệ" },
  rel_copied_to: { label: "Sao chép đến", type: "relation", group: "Mối quan hệ" },
  rel_copied_from: { label: "Sao chép từ", type: "relation", group: "Mối quan hệ" },
  rel_parent: { label: "Tác vụ cha", type: "relation", group: "Mối quan hệ" },
  rel_child: { label: "Tác vụ con", type: "relation", group: "Mối quan hệ" },
} as const
