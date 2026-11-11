# Cụm Module 07: Cơ Hội Đã Lưu & Theo Dõi Tiến Trình Ứng Tuyển (Saved Opportunities & Application Tracking)

> **Mã Module:** `07_SAVED_AND_APPLICATIONS`  
> **Căn cứ SRS:** Mục 4.7 (`FR-APP-01` đến `FR-APP-10`)  
> **Trạng thái cụm:** ![Đã có API & Model](https://img.shields.io/badge/-ĐÃ%20CÓ%20API%20%26%20MODEL-blue)

---

## Danh Mục Các Tính Năng Con Trong Cụm

| Mã File | Tên Tính Năng Chi Tiết | Trạng Thái | Mô Tả & Endpoint |
|---|---|:---:|---|
| [`01_BOOKMARK_LUU_CO_HOI.md`](./01_BOOKMARK_LUU_CO_HOI.md) | Bookmark lưu trữ cơ hội & bài viết | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Thao tác 1 chạm, API `GET/POST/DELETE /api/saved`, model `SavedOpportunity`. |
| [`02_THEO_DOI_TIEN_TRINH_UNG_TUYEN_KANBAN.md`](./02_THEO_DOI_TIEN_TRINH_UNG_TUYEN_KANBAN.md) | Bảng theo dõi ứng tuyển dạng Kanban | ![Kế hoạch](https://img.shields.io/badge/-PLANNED-amber) | Giao diện `/applications`, kéo thả 5 cột trạng thái, ghi chú cá nhân. |
| [`03_VONG_DOI_7_TRANG_THAI_UNG_TUYEN.md`](./03_VONG_DOI_7_TRANG_THAI_UNG_TUYEN.md) | Vòng đời 7 trạng thái & Lịch sử kiểm toán | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Model `Application.ts` với mảng history bảo toàn vết thời gian chuyển cột. |
