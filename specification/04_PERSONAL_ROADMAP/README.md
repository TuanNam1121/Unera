# Cụm Module 04: Lộ Trình Phát Triển Cá Nhân Hóa (Personal Roadmap)

> **Mã Module:** `04_PERSONAL_ROADMAP`  
> **Căn cứ SRS:** Mục 4.4 (`FR-RM-01` đến `FR-RM-16`)  
> **Trạng thái cụm:** ![Hoàn thành MVP](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20(MVP)-emerald)

---

## Danh Mục Các Tính Năng Con Trong Cụm

| Mã File | Tên Tính Năng Chi Tiết | Trạng Thái | Mô Tả & Endpoint |
|---|---|:---:|---|
| [`01_RANG_BUOC_DUY_NHAT_1_ACTIVE_ROADMAP.md`](./01_RANG_BUOC_DUY_NHAT_1_ACTIVE_ROADMAP.md) | Bất biến duy nhất 1 Active Roadmap | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Ràng buộc BR-07, lưu trữ lộ trình cũ `ARCHIVED` trước khi tạo mới. |
| [`02_CAU_TRUC_4_NAM_HOC_KY_COT_MOC.md`](./02_CAU_TRUC_4_NAM_HOC_KY_COT_MOC.md) | Cấu trúc 4 Năm, Học kỳ & Cột mốc | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Giao diện `/roadmap`, tab 4 năm, lưới 2 học kỳ, danh sách cột mốc. |
| [`03_TICK_HOAN_THANH_VA_CONG_THUC_TIEN_DO.md`](./03_TICK_HOAN_THANH_VA_CONG_THUC_TIEN_DO.md) | Tick hoàn thành & Công thức tiến độ | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Cập nhật lạc quan (Optimistic UI), hook `pre("save")` tự tính % tiến độ. |
| [`04_DONG_BO_WIDGET_TRANG_CHU.md`](./04_DONG_BO_WIDGET_TRANG_CHU.md) | Đồng bộ Lộ trình lên Trang chủ Dashboard | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Component `HomeRoadmapCard.tsx` hiển thị tiến độ và task tiếp theo. |
| [`05_LICH_SU_LUU_TRU_SNAPSHOT.md`](./05_LICH_SU_LUU_TRU_SNAPSHOT.md) | Lưu trữ bản sao lộ trình cũ (Snapshot) | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Giữ dấu vết chuyển dịch mục tiêu của sinh viên trong MongoDB. |
