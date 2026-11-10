# Đặc Tả Tính Năng: Danh Sách, Chi Tiết & Vòng Đời Trạng Thái Cơ Hội

> **Mã tính năng:** `FR-EXP-02`, `FR-EXP-03`, `FR-EXP-04`  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Visitor, Student, Admin  

---

## 1. Vòng Đời Trạng Thái Cơ Hội (Opportunity Lifecycle - FR-EXP-04)

Cơ hội có 4 trạng thái chuyển đổi nghiêm ngặt:
- **`DRAFT` (Bản nháp):** Admin đang tạo hoặc chỉnh sửa nội dung, chưa sẵn sàng công bố. Chỉ có Admin xem được.
- **`PUBLISHED` (Đã xuất bản):** Thông tin đã được kiểm duyệt, hiển thị công khai cho Sinh viên và Khách vãng lai trên trang Khám phá (`/explore`) và Trang chủ.
- **`CLOSED` (Đã đóng đơn):** Đã hết hạn nộp đơn hoặc đơn vị tuyển dụng thông báo đủ chỉ tiêu. Vẫn có thể xem lại để đối chiếu thông tin nhưng gắn nhãn "Đã đóng đơn", không cho phép thêm vào lịch mới.
- **`ARCHIVED` (Lưu trữ):** Đã hoàn tất và được chuyển vào kho lưu trữ nội bộ. Ẩn khỏi danh sách khám phá công khai.

---

## 2. Chi Tiết Cơ Hội (Opportunity Detail - FR-EXP-03)

Trang chi tiết cơ hội (`/explore/[id]`) cung cấp đầy đủ:
- Tên cơ hội, Danh mục, Nhãn tài trợ (nếu có).
- Hạn chót nộp đơn (kèm đồng hồ đếm ngược số ngày còn lại).
- Phạm vi địa lý: Trong nước hay Quốc tế, địa điểm làm việc cụ thể.
- Mô tả chi tiết, Đối tượng & Điều kiện tham gia, Yêu cầu hồ sơ, Quyền lợi.
- **Hành động cốt lõi cho Sinh viên:**
  - Nút **"Thêm vào lịch"** (Add to Calendar): Kích hoạt theo dõi hạn chót 7, 3, 1 ngày.
  - Nút **"Lưu cơ hội"** (Bookmark): Lưu vào danh sách quan tâm cá nhân.
  - Nút **"Chuyển trạng thái ứng tuyển"**: Tạo hoặc cập nhật thẻ theo dõi trên bảng Kanban cá nhân.
