# Tính Năng: Minh Bạch Nội Dung Được Tài Trợ (Sponsored Content Transparency)

> **Mã SRS:** `FR-NEWS-06`, `FR-NEWS-07`, `FR-EXP-10`  
> **Trạng thái:** ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `13_14_COMMUNITY_AND_NEWS`, `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Ban Biên Tập (Admin), Sinh viên (Student)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 Nhãn "Được Tài Trợ" Minh Bạch (FR-NEWS-06, FR-EXP-10)
- Theo đúng quy chuẩn đạo đức thông tin và yêu cầu của SRS 1.0, mọi bài viết hoặc cơ hội do đối tác doanh nghiệp/trung tâm du học tài trợ bắt buộc phải được gắn nhãn công khai:
  - Hiển thị huy hiệu màu hổ phách/vàng: `<Badge>ĐƯỢC TÀI TRỢ</Badge>`.
  - Hiển thị thông tin đơn vị đồng hành: Tên nhà tài trợ (`sponsorName`), logo nhà tài trợ (`sponsorLogoUrl`), đường dẫn website đối tác (`targetUrl`).

### 1.2 Triển Khai Trong Mã Nguồn
- Schema CSDL: [`src/models/NewsArticle.ts`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/models/NewsArticle.ts):
  ```typescript
  isSponsored: { type: Boolean, default: false, index: true },
  sponsorInfo: {
    sponsorName: { type: String, default: "" },
    sponsorLogoUrl: { type: String, default: "" },
    targetUrl: { type: String, default: "" },
  }
  ```
- Hiển thị tại giao diện bài viết: [`src/app/news/[slug]/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/news/[slug]/page.tsx).

### 1.3 Quản Lý Cấu Hình Tài Trợ (FR-NEWS-07)
- Tại trang Admin CMS [`src/app/admin/news/new/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/admin/news/new/page.tsx), khi bật toggle "Nội dung tài trợ", giao diện sẽ mở ra các ô nhập tên doanh nghiệp đối tác và link kiểm định.
