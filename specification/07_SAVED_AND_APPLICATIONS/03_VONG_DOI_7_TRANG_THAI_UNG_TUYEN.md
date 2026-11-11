# Tính Năng: Vòng Đời 7 Trạng Thái Ứng Tuyển & Kiểm Toán Lịch Sử (Application Lifecycle)

> **Mã SRS:** `FR-APP-05`, `FR-APP-08`, `FR-APP-09`, `FR-APP-10`  
> **Trạng thái:** ![Đã có Schema](https://img.shields.io/badge/-ĐÃ%20CÓ%20SCHEMA%20CSDL-blue)  
> **Thuộc cụm:** `07_SAVED_AND_APPLICATIONS`  
> **Tác nhân:** Sinh viên (Student), Hệ thống (System)

---

## 1. Mô Hình Dữ Liệu Chi Tiết Trong `Application.ts`
- **Tệp nguồn:** [`src/models/Application.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/Application.ts)
```typescript
export type ApplicationStatusId =
  | "SAVED"         // Cơ hội đã lưu
  | "PREPARING"     // Đang chuẩn bị hồ sơ
  | "SUBMITTED"     // Đã nộp hồ sơ
  | "INTERVIEWING"   // Đang phỏng vấn
  | "ACCEPTED"      // Đã nhận được học bổng / công việc
  | "REJECTED"      // Bị từ chối
  | "WITHDRAWN";    // Sinh viên chủ động rút đơn

export interface IApplicationRecord {
  studentId: string;
  opportunityId: string | IOpportunity;
  status: ApplicationStatusId;
  notes?: string;
  history: Array<{
    status: ApplicationStatusId;
    updatedAt: Date;
    note?: string;
  }>;
}
```

### 1.2 Bảo Vệ Quyền Sở Hữu Dữ Liệu (`FR-APP-08`)
- Chỉ chính sinh viên sở hữu hồ sơ ứng tuyển mới có quyền xem và cập nhật trạng thái hồ sơ của mình.
- Dù cơ hội gốc bên ngoài có bị đóng đơn (`CLOSED`), bản ghi theo dõi ứng tuyển của sinh viên vẫn được bảo lưu nguyên vẹn để làm bằng chứng học tập.
