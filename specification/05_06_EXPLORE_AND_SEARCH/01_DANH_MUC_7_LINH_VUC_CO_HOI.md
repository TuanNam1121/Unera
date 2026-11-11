# Tính Năng: Danh Mục 7 Lĩnh Vực Cơ Hội (Opportunity Categories)

> **Mã SRS:** `FR-OPP-01`, `FR-OPP-02`  
> **Trạng thái:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Sinh viên (Student), Quản trị viên (Admin)

---

## 1. Cách Thức Hoạt Động Hiện Tại (Implementation Details)

### 1.1 7 Lĩnh Vực Cơ Hội Chuẩn Hóa Theo SRS 1.0
1. `SCHOLARSHIP`: Học bổng chính phủ, học bổng doanh nghiệp, học bổng tài năng.
2. `STUDY_ABROAD`: Chương trình trao đổi sinh viên, du học ngắn hạn và dài hạn.
3. `INTERNSHIP`: Cơ hội thực tập hè, Management Trainee tại các doanh nghiệp.
4. `COMPETITION`: Cuộc thi học thuật, khởi nghiệp, giải thưởng sinh viên.
5. `RESEARCH`: Đề tài nghiên cứu khoa học, dự án học thuật.
6. `WORKSHOP`: Tọa đàm hướng nghiệp, hội thảo chuyên đề, kỹ năng.
7. `STUDENT_PROGRAM`: Các chương trình giao lưu thanh niên, đại sứ sinh viên.

### 1.2 Giao Diện Bộ Lọc Chuyên Mục (`/explore`)
- **Tệp nguồn:** [`src/app/explore/page.tsx`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/src/app/explore/page.tsx)
- Hiển thị thanh tab ngang chứa đầy đủ 7 chuyên mục.
- Bấm vào một chuyên mục sẽ tự động lọc danh sách thẻ và cập nhật query param trên URL (ví dụ: `/explore?category=SCHOLARSHIP`).
