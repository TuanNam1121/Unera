# Cụm Tính Năng 07: Lưu Cơ Hội & Theo Dõi Ứng Tuyển (Saved Opportunities & Application Tracking)

> **Mã Module:** `SAVED_APP`  
> **Căn cứ SRS:** Mục 4.7 (FR-APP-01 đến FR-APP-10)  
> **Tác nhân:** Sinh viên (Student)  
> **Trọng tâm bất biến:** Phân biệt rạch ròi giữa "Lưu cơ hội" (Bookmark) và "Thêm vào lịch" (Calendar Entry).

---

## 1. Phân Định Miền Nghiệp Vụ Cốt Lõi (Domain Distinction)

Theo mục 5 của `PROJECT_CONTEXT.md` và SRS 1.0, tuyệt đối **không được gộp chung** khái niệm **Lưu cơ hội** và **Theo dõi hạn chót vào lịch**:

| Khái niệm | Hành Động Kích Hoạt | Bản Ghi CSDL | Tác Động Lịch | Kích Hoạt Nhắc Hạn 7/3/1 Ngày? |
|---|---|---|:---:|:---:|
| **Cơ hội Đã Lưu (Saved Opportunity)** | Sinh viên bấm nút Lưu (Bookmark / Icon lá cờ) | `saved_opportunities` | ❌ Không đưa vào lịch | ❌ **KHÔNG** kích hoạt thông báo |
| **Bản Ghi Lịch (Calendar Entry)** | Sinh viên bấm nút **"Thêm vào lịch"** tường minh | `calendar_entries` | ✅ Hiển thị trong lịch cá nhân | ✅ **CÓ** kích hoạt nhắc hẹn |
| **Theo Dõi Ứng Tuyển (Application Record)** | Sinh viên tạo thẻ theo dõi tiến độ nộp đơn | `applications` | Tùy chọn liên kết | Không suy diễn trạng thái nộp đơn từ lịch |

- Sinh viên có thể Lưu một cơ hội mà không cần Thêm vào lịch.
- Sinh viên có thể Thêm vào lịch mà không cần Lưu cơ hội.
- Việc xóa khỏi danh sách lưu không tự động xóa khỏi lịch và ngược lại (FR-CAL-14).

---

## 2. Mô Hình Dữ Liệu `saved_opportunities` & `applications`

### 2.1 Collection `saved_opportunities`
```typescript
interface ISavedOpportunity {
  _id: ObjectId;
  studentId: string;           // ID sinh viên sở hữu
  opportunityId: ObjectId;     // Tham chiếu đến Opportunity
  createdAt: Date;
}
// Unique compound index: { studentId: 1, opportunityId: 1 }
```

### 2.2 Collection `applications`
```typescript
interface IApplicationRecord {
  _id: ObjectId;
  studentId: string;
  opportunityId: ObjectId;
  status: "INTERESTED" | "PREPARING" | "APPLIED" | "INTERVIEWING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  notes?: string;
  history: {
    status: string;
    updatedAt: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
// Unique compound index: { studentId: 1, opportunityId: 1 }
```

---

## 3. Danh Mục Các Tính Năng Chi Tiết

| Mã Tính Năng | Tên Tính Năng | File Đặc Tả |
|---|---|---|
| **FR-APP-01 đến 03** | Lưu & Bỏ lưu Cơ hội (Bookmark độc lập) | [`FR-APP-01_03_SAVE_OPPORTUNITY.md`](./FR-APP-01_03_SAVE_OPPORTUNITY.md) |
| **FR-APP-04 & 07** | Quản lý Hồ sơ ứng tuyển, Ghi chú & Lịch sử tiến độ | [`FR-APP-04_07_APPLICATION_TRACKER.md`](./FR-APP-04_07_APPLICATION_TRACKER.md) |
| **FR-APP-05** | 7 Trạng thái ứng tuyển chuẩn hóa | [`FR-APP-05_APPLICATION_STATUSES.md`](./FR-APP-05_APPLICATION_STATUSES.md) |
| **FR-APP-08 đến 10** | Bảo vệ quyền sở hữu, Giới hạn xác thực ngoài & Tách biệt Lịch | [`FR-APP-08_10_RECORD_OWNERSHIP.md`](./FR-APP-08_10_RECORD_OWNERSHIP.md) |
