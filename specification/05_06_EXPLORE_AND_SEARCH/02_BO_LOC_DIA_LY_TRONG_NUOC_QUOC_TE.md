# Tính Năng: Phân Loại Phạm Vi Địa Lý Trong Nước & Quốc Tế (Domestic & International Filter)

> **Mã SRS:** `FR-OPP-03`, `FR-OPP-04`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

- **Mô hình CSDL:** Bảng `Opportunity` có trường boolean: `isDomestic: boolean`.
- **Giao diện người dùng (`/explore`):**
  - Cung cấp nút lọc chuyển đổi: *Tất cả*, *Trong nước* (`isDomestic=true`), *Quốc tế* (`isDomestic=false`).
  - Thẻ cơ hội quốc tế hiển thị cờ/badge định vị quốc gia (Mỹ, Anh, Đức, Nhật Bản, Toàn cầu...).
  - Thẻ trong nước hiển thị địa điểm tỉnh thành (Hà Nội, TP.HCM, Trực tuyến/Hybrid).
- **API `GET /api/opportunities?isDomestic=true`:** Tự động lọc các cơ hội diễn ra tại Việt Nam.
