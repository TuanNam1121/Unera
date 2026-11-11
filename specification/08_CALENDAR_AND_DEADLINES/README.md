# Cụm Module 08: Lịch Hoạt Động & Theo Dõi Hạn Chót (Calendar & Opportunity Tracking)

> **Mã Module:** `08_CALENDAR_AND_DEADLINES`  
> **Căn cứ SRS:** Mục 4.8 (`FR-CAL-01` đến `FR-CAL-11`)  
> **Trạng thái cụm:** ![Đã có API & Widget](https://img.shields.io/badge/-ĐÃ%20CÓ%20API%20%26%20WIDGET-blue)

---

## Danh Mục Các Tính Năng Con Trong Cụm

| Mã File | Tên Tính Năng Chi Tiết | Trạng Thái | Mô Tả & Endpoint |
|---|---|:---:|---|
| [`01_THEM_VAO_LICH_TRACKING.md`](./01_THEM_VAO_LICH_TRACKING.md) | Thao tác Thêm vào lịch tracking | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Nút bấm tường minh theo UI-06, API `POST /api/calendar`, `CalendarEntry`. |
| [`02_WIDGET_HAN_SAP_TOI_DASHBOARD.md`](./02_WIDGET_HAN_SAP_TOI_DASHBOARD.md) | Widget Hạn sắp tới trên Dashboard | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Khối hiển thị deadline đếm ngược (còn 3 ngày, 5 ngày) trên trang chủ `/`. |
| [`03_GIAO_DIEN_LICH_THANG_TOAN_TRANG.md`](./03_GIAO_DIEN_LICH_THANG_TOAN_TRANG.md) | Giao diện Lịch toàn trang dạng lưới | ![Kế hoạch](https://img.shields.io/badge/-PLANNED-amber) | Tuyến đường `/calendar`, Month Grid View & Agenda Timeline View. |
| [`04_NHAC_HAN_TU_DONG_EMAIL_INAPP.md`](./04_NHAC_HAN_TU_DONG_EMAIL_INAPP.md) | Nhắc hạn tự động qua Email & In-App | ![Kế hoạch](https://img.shields.io/badge/-PLANNED-amber) | Quét mốc 7, 3, 1 ngày, chống gửi trùng lặp `remindersSent: [7, 3, 1]`. |
