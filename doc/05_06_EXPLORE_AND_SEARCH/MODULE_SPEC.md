# Cụm Tính Năng 05 & 06: Khám Phá, Quản Lý & Tìm Kiếm Cơ Hội (Explore, Opportunities & Search)

> **Mã Module:** `EXPLORE_SEARCH`  
> **Căn cứ SRS:** Mục 4.5 (FR-EXP-01 đến 15) và Mục 4.6 (FR-SRCH-01 đến 11)  
> **Tác nhân:** Visitor, Student, Admin  
> **Trọng tâm kỹ thuật:** 7 Danh mục cơ hội, Curation bởi Admin, Kiểm soát cập nhật đồng thời (Optimistic Locking), Tìm kiếm & Bộ lọc kết hợp.

---

## 1. Tổng Quan Nghiệp Vụ Cụm Tính Năng

Cơ hội là tài nguyên nội dung giá trị cốt lõi trên nền tảng UNERA:
1. **7 Danh mục cơ hội chuẩn (FR-EXP-01):**
   - Học bổng & Du học (`study_abroad`)
   - Việc làm theo khối ngành (`career_discipline`)
   - Tập đoàn đa quốc gia (`multinational`)
   - Nghiên cứu khoa học (`scientific_research`)
   - Quản trị viên tập sự MT (`management_trainee`)
   - Cuộc thi sinh viên (`competitions`)
   - Chương trình Đại sứ sinh viên (`ambassador_programs`)
2. **Cơ chế biên tập độc quyền bởi Admin (Admin Curation - FR-EXP-05, 13 & BR-13):**
   - **Chỉ có tài khoản Admin mới có quyền tạo, sửa, xuất bản, đóng hoặc lưu trữ cơ hội.**
   - Doanh nghiệp, tổ chức và sinh viên không có quyền tự đăng bài cơ hội lên hệ thống.
   - Cơ hội phải lưu trữ thông tin nguồn gốc minh bạch (`sourceName`, `sourceUrl`) và ngày thẩm định (`verificationDate`).
3. **Kiểm soát cập nhật đồng thời (Optimistic Locking - FR-EXP-14, FR-ADM-16, 17, 18):**
   - Trường số nguyên `version` tự động tăng sau mỗi lần cập nhật thành công.
   - Nếu Admin B cập nhật cơ hội trong khi Admin A đang mở form sửa phiên bản cũ, hệ thống phát hiện xung đột phiên bản, từ chối ghi đè dữ liệu và cảnh báo Admin A kèm nút nạp lại dữ liệu mới nhất.
4. **Nhãn tài trợ minh bạch (Sponsored Content - FR-EXP-10 & BR-36):**
   - Cơ hội được tài trợ phải được gắn nhãn hiển thị rõ ràng cho người dùng.
5. **Cơ chế Hạn chót linh hoạt (Optional Deadline - FR-EXP-11 & BR-15):**
   - Cho phép cơ hội không cố định hạn chót (ví dụ: tuyển dụng liên tục). Các cơ hội này hiển thị bình thường nhưng không kích hoạt thông báo nhắc hẹn 7/3/1 ngày.

---

## 2. Mô Hình Dữ Liệu `opportunities`

Tham chiếu [`src/models/Opportunity.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Opportunity.ts):

```typescript
interface IOpportunity {
  _id: ObjectId;
  title: string;                 // Tiêu đề (Full-text index)
  description: string;           // Mô tả (Full-text index)
  category: OpportunityCategoryId; // 7 danh mục chuẩn (Index)
  eligibility?: string;          // Đối tượng & Điều kiện tham gia
  requirements?: string;         // Yêu cầu hồ sơ & Năng lực
  benefits?: string;             // Quyền lợi & Học bổng/Mức lương
  applicationInstructions?: string; // Hướng dẫn nộp đơn
  openingDate?: Date;            // Ngày mở đơn
  deadline?: Date | null;        // Hạn chót nộp đơn (null nếu không cố định) (Index)
  location?: string;             // Địa điểm (Hà Nội, TP.HCM, Trực tuyến...)
  isDomestic: boolean;           // true: Trong nước, false: Quốc tế (Index)
  sourceName?: string;           // Tên đơn vị / Nguồn đăng tải
  sourceUrl?: string;            // Link gốc
  verificationDate?: Date;       // Ngày Admin kiểm duyệt thông tin
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED"; // Vòng đời (Index)
  isSponsored: boolean;          // true: Được tài trợ (Index)
  version: number;               // Khóa phiên bản phục vụ Optimistic Locking
  updatedByAdminId?: string;     // ID Admin cập nhật gần nhất
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Danh Mục Các Tính Năng Chi Tiết

| Mã Tính Năng | Tên Tính Năng | File Đặc Tả |
|---|---|---|
| **FR-EXP-01** | 7 Danh mục cơ hội chuẩn hóa | [`FR-EXP-01_CATEGORIES.md`](./FR-EXP-01_CATEGORIES.md) |
| **FR-EXP-02 đến 04** | Danh sách, Chi tiết & Vòng đời trạng thái | [`FR-EXP-02_04_LISTING_STATUS.md`](./FR-EXP-02_04_LISTING_STATUS.md) |
| **FR-EXP-05 đến 09** | Quản trị viên thẩm định & Gắn nguồn gốc | [`FR-EXP-05_09_ADMIN_CURATION.md`](./FR-EXP-05_09_ADMIN_CURATION.md) |
| **FR-EXP-10** | Nhãn cơ hội được tài trợ (Sponsored Label) | [`FR-EXP-10_SPONSORED_LABEL.md`](./FR-EXP-10_SPONSORED_LABEL.md) |
| **FR-EXP-11 & 12** | Cơ hội không hạn chót & Xử lý hết hạn | [`FR-EXP-11_12_DEADLINES_EXPIRY.md`](./FR-EXP-11_12_DEADLINES_EXPIRY.md) |
| **FR-EXP-14 & 15** | Kiểm soát cập nhật đồng thời (Optimistic Locking) | [`FR-EXP-14_15_OPTIMISTIC_LOCKING.md`](./FR-EXP-14_15_OPTIMISTIC_LOCKING.md) |
| **FR-SRCH-01 đến 11** | Tìm kiếm từ khóa, Bộ lọc kết hợp & Phân trang | [`FR-SRCH-01_11_SEARCH_FILTERING.md`](./FR-SRCH-01_11_SEARCH_FILTERING.md) |
