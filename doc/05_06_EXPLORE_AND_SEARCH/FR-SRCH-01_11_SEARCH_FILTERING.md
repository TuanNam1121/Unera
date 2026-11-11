# Đặc Tả Tính Năng: Tìm Kiếm Từ Khóa, Bộ Lọc Kết Hợp & Phân Trang

> **Mã tính năng:** `FR-SRCH-01` đến `FR-SRCH-11`  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Visitor, Student, Admin  

---

## 1. Nghiệp Vụ Tìm Kiếm & Bộ Lọc

1. **Tìm kiếm theo từ khóa (FR-SRCH-01):**
   - Hỗ trợ tìm kiếm toàn văn (Text Search) trên trường `title` và `description`.
   - Tìm kiếm không phân biệt chữ hoa, chữ thường và hỗ trợ tiếng Việt có dấu/không dấu cơ bản.
2. **Bộ lọc đa tiêu chí kết hợp (Combined Filters - FR-SRCH-02 đến FR-SRCH-07, 11):**
   - Lọc theo Danh mục (`category`).
   - Lọc theo Phạm vi địa lý (`isDomestic`: Trong nước / Quốc tế).
   - Lọc theo Khối ngành (`major/discipline`).
   - Lọc theo Hạn nộp đơn (`deadline`: Đang mở đơn / Sắp hết hạn trong 7 ngày).
   - **Tất cả các bộ lọc có thể kết hợp đồng thời trong cùng một truy vấn.**
3. **Sắp xếp & Phân trang (Sorting & Pagination - FR-SRCH-08, 09):**
   - Sắp xếp: Ưu tiên hạn nộp gần nhất (`deadline: 1`) hoặc bài đăng mới nhất (`createdAt: -1`).
   - Phân trang: Mặc định `12` cơ hội / trang. Trả về metadata: `page`, `limit`, `total`, `totalPages`.
4. **Trạng thái kết quả rỗng (Empty Results - FR-SRCH-10):**
   - Khi không có bản ghi phù hợp, hiển thị giao diện thân thiện kèm gợi ý thử lại từ khóa hoặc xóa bộ lọc.

