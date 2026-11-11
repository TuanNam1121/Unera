# Cụm Module 02: Quản Lý Hồ Sơ Cá Nhân Sinh Viên (Student Profile Management)

> **Mã Module:** `02_STUDENT_PROFILE`  
> **Căn cứ SRS:** Mục 4.2 (`FR-PRO-01` đến `FR-PRO-06`)  
> **Trạng thái cụm:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)

---

## Danh Mục Các Tính Năng Con Trong Cụm

| Mã File | Tên Tính Năng Chi Tiết | Trạng Thái | Mô Tả & Endpoint |
|---|---|:---:|---|
| [`01_THONG_TIN_CA_NHAN.md`](./01_THONG_TIN_CA_NHAN.md) | Quản lý thông tin học vấn & cá nhân | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Tab 1, Họ tên, Trường, Ngành, Năm học, Bio. `GET/PUT /api/profile`. |
| [`02_MUC_TIEU_PHAT_TRIEN.md`](./02_MUC_TIEU_PHAT_TRIEN.md) | Thiết lập mục tiêu & Đồng bộ lộ trình | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Tab 2, 5 hướng đi chiến lược. `PUT /api/profile/goals` auto sinh Lộ trình. |
| [`03_KY_NANG_VA_THANH_TICH.md`](./03_KY_NANG_VA_THANH_TICH.md) | Quản lý thẻ kỹ năng & Thành tích | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Tab 3 & Tab 4, danh sách kỹ năng mềm/cứng và giải thưởng học thuật. |
| [`04_TONG_QUAN_HO_SO_VA_BAO_MAT_IDOR.md`](./04_TONG_QUAN_HO_SO_VA_BAO_MAT_IDOR.md) | Tổng quan hồ sơ & Chống IDOR | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Bảo mật server-side, chỉ truy vấn theo token phiên, cấm truyền id ngoài. |
