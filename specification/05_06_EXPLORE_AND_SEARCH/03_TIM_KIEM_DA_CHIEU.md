# Tính Năng: Tìm Kiếm Cơ Hội Đa Chiều (Multi-faceted Search)

> **Mã SRS:** `FR-SRCH-01` đến `FR-SRCH-07`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

- **Ô Tìm kiếm tập trung:** Xuất hiện tại cả thanh Topbar và đầu trang `/explore`.
- **Cơ chế tìm kiếm phía Server (`GET /api/opportunities?search=...`):**
  - Sử dụng biểu thức chính quy (Regex Indexing) không phân biệt hoa thường (`$options: "i"`).
  - Tìm kiếm đồng thời trên các trường:
    - Tiêu đề cơ hội (`title`)
    - Mô tả tóm tắt (`description`)
    - Yêu cầu ứng tuyển (`requirements`)
    - Đơn vị tổ chức / Nhà tài trợ (`sourceName`)
- **Kết hợp bộ lọc đồng thời (Compound Filtering):** Sinh viên có thể vừa tìm từ khóa *"IELTS"*, vừa chọn chuyên mục *"HỌC BỔNG"*, vừa chọn phạm vi *"QUỐC TẾ"*.
