# Cụm Module 05 & 06: Khám Phá Cơ Hội & Tìm Kiếm Đa Chiều (Explore & Search)

> **Mã Module:** `05_06_EXPLORE_AND_SEARCH`  
> **Căn cứ SRS:** Mục 4.5 & 4.6 (`FR-OPP-01..14`, `FR-SRCH-01..07`)  
> **Trạng thái cụm:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20(MVP)-emerald)

---

## Danh Mục Các Tính Năng Con Trong Cụm

| Mã File | Tên Tính Năng Chi Tiết | Trạng Thái | Mô Tả & Endpoint |
|---|---|:---:|---|
| [`01_DANH_MUC_7_LINH_VUC_CO_HOI.md`](./01_DANH_MUC_7_LINH_VUC_CO_HOI.md) | Phân loại 7 danh mục cơ hội | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Học bổng, Du học, Thực tập, Cuộc thi, NCKH, Workshop, Chương trình SV. |
| [`02_BO_LOC_DIA_LY_TRONG_NUOC_QUOC_TE.md`](./02_BO_LOC_DIA_LY_TRONG_NUOC_QUOC_TE.md) | Bộ lọc phạm vi địa lý | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Lọc Trong nước (`isDomestic=true`) và Quốc tế (`isDomestic=false`). |
| [`03_TIM_KIEM_DA_CHIEU.md`](./03_TIM_KIEM_DA_CHIEU.md) | Tìm kiếm realtime đa chiều | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Tìm kiếm trên Tiêu đề, Mô tả, Yêu cầu, Đơn vị tổ chức. |
| [`04_KHOA_LAC_QUAN_OPTIMISTIC_LOCKING.md`](./04_KHOA_LAC_QUAN_OPTIMISTIC_LOCKING.md) | Khóa lạc quan chống xung đột sửa đổi | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Cơ chế `version` number, trả về 409 Conflict nếu có Admin khác sửa trước. |
| [`05_ADMIN_CMS_QUAN_LY_CO_HOI.md`](./05_ADMIN_CMS_QUAN_LY_CO_HOI.md) | Admin CMS Quản trị & Đăng cơ hội | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Giao diện `/admin/opportunities` và form `/admin/opportunities/new`. |
