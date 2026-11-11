# Danh Mục Đặc Tả Tính Năng Dự Án Unera (Feature Specifications Master Index)

> **Dự án:** Unera — Nền tảng Định hướng Nghề nghiệp & Lộ trình Cá nhân hóa cho Sinh viên Ngoại ngữ ULIS  
> **Phiên bản:** v1.0.0  
> **Cấu trúc lưu trữ:** Mỗi Cụm Mô-đun là 1 thư mục riêng (`specification/<MODULE_NAME>/`), bên trong **mỗi tính năng đơn lẻ là 1 tệp Markdown độc lập** đi kèm mã định danh SRS, hiện trạng mã nguồn hoặc yêu cầu chi tiết.

---

## 1. Bảng Trạng Thái Triển Khai Toàn Dự Án (System Status Matrix)

| Cụm Mô-đun | Tên Cụm | Mã SRS Bao Quát | Số Tính Năng | Trạng Thái Tổng Thể | Thư Mục Chi Tiết |
| :---: | :--- | :---: | :---: | :---: | :--- |
| **01** | Xác Thực & Phân Quyền | `FR-AUTH-01..13` | 8 files | ![Đã hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH-emerald) | [`01_AUTHENTICATION/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/README.md) |
| **02** | Hồ Sơ Năng Lực Sinh Viên | `FR-PROF-01..07` | 4 files | ![Đã hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH-emerald) | [`02_STUDENT_PROFILE/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/02_STUDENT_PROFILE/README.md) |
| **03** | Bài Đánh Giá Định Hướng (Quiz) | `FR-ONB-01..12` | 5 files | ![Đã hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald) | [`03_ONBOARDING_QUIZ/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/03_ONBOARDING_QUIZ/README.md) |
| **04** | Lộ Trình Cá Nhân Hóa (Roadmap) | `FR-RM-01..16` | 5 files | ![Đã hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH-emerald) | [`04_PERSONAL_ROADMAP/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/04_PERSONAL_ROADMAP/README.md) |
| **05 & 06** | Khám Phá & Tìm Kiếm Cơ Hội | `FR-EXP-01..15`, `FR-SRCH-01..11` | 5 files | ![Đã hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH-emerald) | [`05_06_EXPLORE_AND_SEARCH/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/05_06_EXPLORE_AND_SEARCH/README.md) |
| **07** | Cơ Hội Đã Lưu & Hồ Sơ Ứng Tuyển | `FR-APP-01..10` | 3 files | ![Đã hoàn thành 1 phần](https://img.shields.io/badge/-ĐÃ%20LƯU%20%26%20SCHEMA-blue) | [`07_SAVED_AND_APPLICATIONS/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/07_SAVED_AND_APPLICATIONS/README.md) |
| **08** | Lịch & Nhắc Hạn Chót (Calendar) | `FR-CAL-01..14` | 4 files | ![Đã hoàn thành 1 phần](https://img.shields.io/badge/-LỊCH%20%26%20WIDGET%20XONG-blue) | [`08_CALENDAR_AND_DEADLINES/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/08_CALENDAR_AND_DEADLINES/README.md) |
| **09** | Hệ Thống Thông Báo (Notifications) | `FR-NOTI-01..14` | 4 files | ![Đã có UI chuông](https://img.shields.io/badge/-UI%20XONG%20%2F%20KẾ%20HOẠCH-amber) | [`09_NOTIFICATIONS/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/09_NOTIFICATIONS/README.md) |
| **10** | Mạng Lưới Cố Vấn (Mentors) | `FR-MEN-01..13` | 4 files | ![Admin xong](https://img.shields.io/badge/-ADMIN%20XONG%20%2F%20KẾ%20HOẠCH-amber) | [`10_MENTOR_CONNECTION/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/10_MENTOR_CONNECTION/README.md) |
| **11** | Bộ Công Cụ Sinh Viên (Tools) | `FR-TOOL-01..12` | 5 files | ![Kế hoạch SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber) | [`11_STUDENT_TOOLS/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/11_STUDENT_TOOLS/README.md) |
| **12** | Chứng Chỉ & Hoạt Động Ngoại Khóa | `FR-CERT-01..06`, `FR-ACT-01..07` | 4 files | ![Schema xong](https://img.shields.io/badge/-SCHEMA%20XONG%20%2F%20KẾ%20HOẠCH-amber) | [`12_CERTIFICATES_AND_ACTIVITIES/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/12_CERTIFICATES_AND_ACTIVITIES/README.md) |
| **13 & 14** | Cộng Đồng & Tin Tức Định Hướng | `FR-COM-01..06`, `FR-NEWS-01..07` | 5 files | ![Tin tức xong](https://img.shields.io/badge/-TIN%20TỨC%20XONG%20100%25-emerald) | [`13_14_COMMUNITY_AND_NEWS/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/13_14_COMMUNITY_AND_NEWS/README.md) |
| **15** | Hệ Thống Quản Trị Admin CMS & Audit | `FR-ADM-01..20` | 7 files | ![Hoàn thành 100%](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald) | [`15_ADMIN_CMS_AND_AUDIT/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/15_ADMIN_CMS_AND_AUDIT/README.md) |
| **16** | Tải Tệp Lên & Lưu Trữ An Toàn | `FR-FILE-01..10` | 3 files | ![Kế hoạch SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber) | [`16_FILE_UPLOAD_AND_STORAGE/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/16_FILE_UPLOAD_AND_STORAGE/README.md) |

---

## 2. Chi Tiết Toàn Bộ Từng Tệp Đặc Tả Tính Năng

### Cụm 01: Xác Thực & Quản Lý Phiên (`01_AUTHENTICATION/`)
1. [`01_DANG_KY_TAI_KHOAN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/01_DANG_KY_TAI_KHOAN.md) — Đăng ký email mật khẩu chuẩn OWASP (`FR-AUTH-01`).
2. [`02_DANG_NHAP_PASSWORD_GOOGLE.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/02_DANG_NHAP_PASSWORD_GOOGLE.md) — Đăng nhập mật khẩu & Google OAuth2 NextAuth (`FR-AUTH-02`, `FR-AUTH-03`).
3. [`03_DANG_XUAT.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/03_DANG_XUAT.md) — Đăng xuất hủy phiên an toàn (`FR-AUTH-04`, `FR-AUTH-10`).
4. [`04_QUEN_VA_DAT_LAI_MAT_KHAU.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/04_QUEN_VA_DAT_LAI_MAT_KHAU.md) — Quên & đặt lại mật khẩu bằng Token 1 giờ (`FR-AUTH-07`, `FR-AUTH-08`).
5. [`05_XAC_THUC_EMAIL.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/05_XAC_THUC_EMAIL.md) — Xác thực email kích hoạt tài khoản (`FR-AUTH-05`, `FR-AUTH-06`).
6. [`06_PHAN_QUYEN_ROLES_VA_ADMIN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/06_PHAN_QUYEN_ROLES_VA_ADMIN.md) — Phân quyền STUDENT & ADMIN, bảo vệ API (`FR-AUTH-11`, `FR-AUTH-12`).
7. [`07_TRANG_THAI_TAI_KHOAN_VA_PHIEN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/07_TRANG_THAI_TAI_KHOAN_VA_PHIEN.md) — Trạng thái ACTIVE / SUSPENDED & JWT 30 ngày (`FR-AUTH-09`, `FR-AUTH-10`).
8. [`08_CHAN_TU_XOA_TAI_KHOAN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/01_AUTHENTICATION/08_CHAN_TU_XOA_TAI_KHOAN.md) — Quy tắc bảo toàn dữ liệu sinh viên (`FR-AUTH-13`).

### Cụm 02: Hồ Sơ Sinh Viên (`02_STUDENT_PROFILE/`)
1. [`01_THONG_TIN_CA_NHAN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/02_STUDENT_PROFILE/01_THONG_TIN_CA_NHAN.md) — Thông tin cá nhân, khoa ngành, niên khóa (`FR-PROF-01`).
2. [`02_MUC_TIEU_PHAT_TRIEN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/02_STUDENT_PROFILE/02_MUC_TIEU_PHAT_TRIEN.md) — Mục tiêu nghề nghiệp, học tập (`FR-PROF-02`, `FR-PROF-03`).
3. [`03_KY_NANG_VA_THANH_TICH.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/02_STUDENT_PROFILE/03_KY_NANG_VA_THANH_TICH.md) — Kỹ năng, chứng chỉ, giải thưởng (`FR-PROF-04`, `FR-PROF-05`).
4. [`04_TONG_QUAN_HO_SO_VA_BAO_MAT_IDOR.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/02_STUDENT_PROFILE/04_TONG_QUAN_HO_SO_VA_BAO_MAT_IDOR.md) — Tổng quan hồ sơ, bảo vệ chống IDOR (`FR-PROF-06`, `FR-PROF-07`).

### Cụm 03: Bài Đánh Giá Định Hướng (`03_ONBOARDING_QUIZ/`)
1. [`01_KHA_DUNG_VA_NUT_SKIP.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/03_ONBOARDING_QUIZ/01_KHA_DUNG_VA_NUT_SKIP.md) — Nút Bỏ qua (Skip) & Khả dụng Quiz (`FR-ONB-01`, `FR-ONB-02`, `FR-ONB-03`).
2. [`02_THU_THAP_VA_NOP_BAI_QUIZ.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/03_ONBOARDING_QUIZ/02_THU_THAP_VA_NOP_BAI_QUIZ.md) — Giao diện làm quiz & nộp bài an toàn (`FR-ONB-04`, `FR-ONB-05`, `FR-ONB-06`).
3. [`03_CHAM_DIEM_RULE_BASED_5_HUONG.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/03_ONBOARDING_QUIZ/03_CHAM_DIEM_RULE_BASED_5_HUONG.md) — Thuật toán chấm điểm Rule-based 5 hướng đi (`FR-ONB-07`, `FR-ONB-08`).
4. [`04_LICH_SU_VA_LAM_LAI_QUIZ.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/03_ONBOARDING_QUIZ/04_LICH_SU_VA_LAM_LAI_QUIZ.md) — Lưu lịch sử & cho phép làm lại bài (`FR-ONB-09`, `FR-ONB-11`).
5. [`05_ADMIN_CMS_QUAN_TRI_CAU_HOI_OPTIONS_DIEM.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/03_ONBOARDING_QUIZ/05_ADMIN_CMS_QUAN_TRI_CAU_HOI_OPTIONS_DIEM.md) — Admin CMS quản trị câu hỏi, options, điểm số (`FR-ONB-10`, `FR-ADM-10`).

### Cụm 04: Lộ Trình Cá Nhân Hóa (`04_PERSONAL_ROADMAP/`)
1. [`01_RANG_BUOC_DUY_NHAT_1_ACTIVE_ROADMAP.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/04_PERSONAL_ROADMAP/01_RANG_BUOC_DUY_NHAT_1_ACTIVE_ROADMAP.md) — Ràng buộc duy nhất 1 lộ trình hoạt động (`FR-RM-01`, `FR-RM-02`).
2. [`02_CAU_TRUC_4_NAM_HOC_KY_COT_MOC.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/04_PERSONAL_ROADMAP/02_CAU_TRUC_4_NAM_HOC_KY_COT_MOC.md) — Cấu trúc cây 4 năm, học kỳ & cột mốc (`FR-RM-03`, `FR-RM-04`, `FR-RM-05`).
3. [`03_TICK_HOAN_THANH_VA_CONG_THUC_TIEN_DO.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/04_PERSONAL_ROADMAP/03_TICK_HOAN_THANH_VA_CONG_THUC_TIEN_DO.md) — Tick hoàn thành & công thức tính tiến độ (`FR-RM-06`, `FR-RM-07`).
4. [`04_DONG_BO_WIDGET_TRANG_CHU.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/04_PERSONAL_ROADMAP/04_DONG_BO_WIDGET_TRANG_CHU.md) — Đồng bộ widget tiến độ trang chủ (`FR-RM-07`).
5. [`05_LICH_SU_LUU_TRU_SNAPSHOT.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/04_PERSONAL_ROADMAP/05_LICH_SU_LUU_TRU_SNAPSHOT.md) — Snapshot lưu trữ & tạo lại lộ trình (`FR-RM-08..14`, `FR-RM-16`).

### Cụm 05 & 06: Khám Phá & Tìm Kiếm Cơ Hội (`05_06_EXPLORE_AND_SEARCH/`)
1. [`01_DANH_MUC_7_LINH_VUC_CO_HOI.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/05_06_EXPLORE_AND_SEARCH/01_DANH_MUC_7_LINH_VUC_CO_HOI.md) — 7 lĩnh vực cơ hội chuẩn hóa (`FR-EXP-01..04`).
2. [`02_BO_LOC_DIA_LY_TRONG_NUOC_QUOC_TE.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/05_06_EXPLORE_AND_SEARCH/02_BO_LOC_DIA_LY_TRONG_NUOC_QUOC_TE.md) — Lọc địa lý Trong nước / Quốc tế (`FR-EXP-08..12`).
3. [`03_TIM_KIEM_DA_CHIEU.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/05_06_EXPLORE_AND_SEARCH/03_TIM_KIEM_DA_CHIEU.md) — Tìm kiếm từ khóa, danh mục, niên khóa, sắp xếp (`FR-SRCH-01..11`).
4. [`04_KHOA_LAC_QUAN_OPTIMISTIC_LOCKING.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/05_06_EXPLORE_AND_SEARCH/04_KHOA_LAC_QUAN_OPTIMISTIC_LOCKING.md) — Khóa lạc quan chống ghi đè phiên bản (`FR-EXP-14`, `FR-ADM-16..19`).
5. [`05_ADMIN_CMS_QUAN_LY_CO_HOI.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/05_06_EXPLORE_AND_SEARCH/05_ADMIN_CMS_QUAN_LY_CO_HOI.md) — Admin CMS quản lý cơ hội (`FR-EXP-05..07`, `FR-ADM-03`).

### Cụm 07: Lưu Trữ & Ứng Tuyển (`07_SAVED_AND_APPLICATIONS/`)
1. [`01_BOOKMARK_LUU_CO_HOI.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/07_SAVED_AND_APPLICATIONS/01_BOOKMARK_LUU_CO_HOI.md) — Bookmark 1 chạm cơ hội & bài viết (`FR-APP-01..03`).
2. [`02_THEO_DOI_TIEN_TRINH_UNG_TUYEN_KANBAN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/07_SAVED_AND_APPLICATIONS/02_THEO_DOI_TIEN_TRINH_UNG_TUYEN_KANBAN.md) — Bảng Kanban theo dõi ứng tuyển (`FR-APP-04, 06, 07`).
3. [`03_VONG_DOI_7_TRANG_THAI_UNG_TUYEN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/07_SAVED_AND_APPLICATIONS/03_VONG_DOI_7_TRANG_THAI_UNG_TUYEN.md) — Vòng đời 7 trạng thái & ghi chú (`FR-APP-05, 08, 09, 10`).

### Cụm 08: Lịch & Hạn Chót (`08_CALENDAR_AND_DEADLINES/`)
1. [`01_THEM_VAO_LICH_TRACKING.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/08_CALENDAR_AND_DEADLINES/01_THEM_VAO_LICH_TRACKING.md) — Thêm cơ hội vào lịch cá nhân (`FR-CAL-01..03`, `FR-CAL-08..14`).
2. [`02_WIDGET_HAN_SAP_TOI_DASHBOARD.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/08_CALENDAR_AND_DEADLINES/02_WIDGET_HAN_SAP_TOI_DASHBOARD.md) — Widget hạn sắp tới tại trang chủ (`FR-CAL-07`).
3. [`03_GIAO_DIEN_LICH_THANG_TOAN_TRANG.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/08_CALENDAR_AND_DEADLINES/03_GIAO_DIEN_LICH_THANG_TOAN_TRANG.md) — Giao diện xem lịch tháng / tuần (`FR-CAL-04..06`).
4. [`04_NHAC_HAN_TU_DONG_EMAIL_INAPP.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/08_CALENDAR_AND_DEADLINES/04_NHAC_HAN_TU_DONG_EMAIL_INAPP.md) — Cơ chế nhắc hạn tự động (`FR-CAL-09, 10`).

### Cụm 09: Thông Báo (`09_NOTIFICATIONS/`)
1. [`01_CHUONG_THONG_BAO_TOPBAR.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/09_NOTIFICATIONS/01_CHUONG_THONG_BAO_TOPBAR.md) — Chuông thông báo & trạng thái đọc trên Topbar (`FR-NOTI-01, 04`).
2. [`02_TRUNG_TAM_THONG_BAO_PHAN_LOAI.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/09_NOTIFICATIONS/02_TRUNG_TAM_THONG_BAO_PHAN_LOAI.md) — Trang trung tâm thông báo & phân loại (`FR-NOTI-03, 07`).
3. [`03_LICH_NHAC_HAN_TU_DONG_DUAL_CHANNEL.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/09_NOTIFICATIONS/03_LICH_NHAC_HAN_TU_DONG_DUAL_CHANNEL.md) — Nhắc hạn kênh đôi 7-3-1 ngày (`FR-NOTI-02, 09..14`).
4. [`04_TUY_CHON_THONG_BAO_VA_CHONG_SPAM.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/09_NOTIFICATIONS/04_TUY_CHON_THONG_BAO_VA_CHONG_SPAM.md) — Tùy chọn thông báo & khóa Idempotency chống spam (`FR-NOTI-05, 06, 08`).

### Cụm 10: Kết Nối Cố Vấn (`10_MENTOR_CONNECTION/`)
1. [`01_DANH_BA_VA_TIM_KIEM_MENTOR.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/10_MENTOR_CONNECTION/01_DANH_BA_VA_TIM_KIEM_MENTOR.md) — Danh bạ & tìm kiếm chuyên gia cố vấn (`FR-MEN-01..03`).
2. [`02_GUI_YEU_CAU_DAT_LICH_TU_VAN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/10_MENTOR_CONNECTION/02_GUI_YEU_CAU_DAT_LICH_TU_VAN.md) — Form gửi yêu cầu đặt lịch 1-1 & quyền hủy (`FR-MEN-04, 05, 13`).
3. [`03_ADMIN_DIEU_PHOI_DUYET_LICH_GUI_LINK_MEET.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/10_MENTOR_CONNECTION/03_ADMIN_DIEU_PHOI_DUYET_LICH_GUI_LINK_MEET.md) — Admin CMS duyệt gửi link Meet hoặc từ chối kèm lý do (`FR-MEN-06..08, 12`).
4. [`04_CO_CHE_TRUNG_GIAN_KHONG_TAI_KHOAN_MENTOR.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/10_MENTOR_CONNECTION/04_CO_CHE_TRUNG_GIAN_KHONG_TAI_KHOAN_MENTOR.md) — Kiến trúc trung gian không cấp account riêng cho Mentor (`FR-MEN-09..11`).

### Cụm 11: Bộ Công Cụ Sinh Viên (`11_STUDENT_TOOLS/`)
1. [`01_CV_BUILDER_SONG_NGU_XUAT_PDF.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/11_STUDENT_TOOLS/01_CV_BUILDER_SONG_NGU_XUAT_PDF.md) — Trình tạo CV song ngữ chuẩn ATS & xuất file PDF vector (`FR-TOOL-01..04`).
2. [`02_MAU_THU_COVER_LETTER_RECOMMENDATION.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/11_STUDENT_TOOLS/02_MAU_THU_COVER_LETTER_RECOMMENDATION.md) — Mẫu đơn Cover Letter & Thư giới thiệu chuẩn (`FR-TOOL-05`).
3. [`03_CONG_CU_TINH_GPA_QUY_DOI_NGOAI_NGU.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/11_STUDENT_TOOLS/03_CONG_CU_TINH_GPA_QUY_DOI_NGOAI_NGU.md) — Tính điểm GPA chuẩn ĐHQGHN & bảng quy đổi ngoại ngữ (`FR-TOOL-07, 08`).
4. [`04_UOC_TINH_CHI_PHI_DU_HOC_VA_NGAN_HANG_PHONG_VAN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/11_STUDENT_TOOLS/04_UOC_TINH_CHI_PHI_DU_HOC_VA_NGAN_HANG_PHONG_VAN.md) — Ước tính chi phí du học & ngân hàng câu hỏi phỏng vấn STAR (`FR-TOOL-09, 10`).
5. [`05_LOAI_TRU_CHATBOT_AI_TRONG_V1.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/11_STUDENT_TOOLS/05_LOAI_TRU_CHATBOT_AI_TRONG_V1.md) — Nguyên tắc loại trừ Chatbot AI trong phiên bản 1.0 (`FR-TOOL-11, 12`).

### Cụm 12: Chứng Chỉ & Hoạt Động Ngoại Khóa (`12_CERTIFICATES_AND_ACTIVITIES/`)
1. [`01_DANH_MUC_CHUNG_CHI_VA_VI_CHUNG_CHI_CA_NHAN.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/12_CERTIFICATES_AND_ACTIVITIES/01_DANH_MUC_CHUNG_CHI_VA_VI_CHUNG_CHI_CA_NHAN.md) — Tra cứu chứng chỉ & Ví chứng chỉ số cá nhân (`FR-CERT-01..05`).
2. [`02_DANH_MUC_HOAT_DONG_NGOAI_KHOA_NCKH.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/12_CERTIFICATES_AND_ACTIVITIES/02_DANH_MUC_HOAT_DONG_NGOAI_KHOA_NCKH.md) — Hoạt động phong trào, tình nguyện, sinh viên 5 tốt & NCKH (`FR-ACT-01..04`).
3. [`03_TICH_HOP_HO_SO_SINH_VIEN_PROFILE.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/12_CERTIFICATES_AND_ACTIVITIES/03_TICH_HOP_HO_SO_SINH_VIEN_PROFILE.md) — Đồng bộ 1 chạm thành tích hoạt động vào Profile (`FR-ACT-05, 07`).
4. [`04_ADMIN_CMS_QUAN_TRI_CHUNG_CHI_HOAT_DONG.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/12_CERTIFICATES_AND_ACTIVITIES/04_ADMIN_CMS_QUAN_TRI_CHUNG_CHI_HOAT_DONG.md) — Quản trị danh mục chứng chỉ & hoạt động CMS (`FR-CERT-06, FR-ACT-06`).

### Cụm 13 & 14: Cộng Đồng & Tin Tức Định Hướng (`13_14_COMMUNITY_AND_NEWS/`)
1. [`01_THU_VIEN_BAI_VIET_DINH_HUONG.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/13_14_COMMUNITY_AND_NEWS/01_THU_VIEN_BAI_VIET_DINH_HUONG.md) — Thư viện bài viết định hướng nghề nghiệp theo danh mục (`FR-NEWS-01..03`).
2. [`02_BAI_VIET_DE_XUAT_HERO_FEATURED.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/13_14_COMMUNITY_AND_NEWS/02_BAI_VIET_DE_XUAT_HERO_FEATURED.md) — Bài viết tiêu điểm nổi bật Hero Banner (`FR-NEWS-05`).
3. [`03_MINH_BACH_NOI_DUNG_TAI_TRO_SPONSORED.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/13_14_COMMUNITY_AND_NEWS/03_MINH_BACH_NOI_DUNG_TAI_TRO_SPONSORED.md) — Gắn nhãn minh bạch đối tác & nhà tài trợ (`FR-NEWS-06, 07`).
4. [`04_ADMIN_CMS_BIEN_TAP_DANG_BAI_VIET.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/13_14_COMMUNITY_AND_NEWS/04_ADMIN_CMS_BIEN_TAP_DANG_BAI_VIET.md) — CMS biên tập, xuất bản & lưu nháp bài viết (`FR-NEWS-04`).
5. [`05_DANH_BA_CONG_DONG_CLB_READ_ONLY.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/13_14_COMMUNITY_AND_NEWS/05_DANH_BA_CONG_DONG_CLB_READ_ONLY.md) — Danh bạ câu lạc bộ sinh viên chế độ tra cứu Read-only (`FR-COM-01..06`).

### Cụm 15: Hệ Thống Quản Trị Admin CMS & Audit (`15_ADMIN_CMS_AND_AUDIT/`)
1. [`01_SIDEBAR_ADMIN_CMS_RIENG_BIET.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/15_ADMIN_CMS_AND_AUDIT/01_SIDEBAR_ADMIN_CMS_RIENG_BIET.md) — Sidebar Admin tách biệt & tự động mở mục con (`FR-ADM-15`).
2. [`02_DASHBOARD_KPI_THOI_GIAN_THUC.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/15_ADMIN_CMS_AND_AUDIT/02_DASHBOARD_KPI_THOI_GIAN_THUC.md) — Dashboard thống kê KPI & tăng trưởng sinh viên (`FR-ADM-01`).
3. [`03_QUAN_LY_SINH_VIEN_KHOA_MO_CO_LY_DO.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/15_ADMIN_CMS_AND_AUDIT/03_QUAN_LY_SINH_VIEN_KHOA_MO_CO_LY_DO.md) — Quản lý tài khoản sinh viên, khóa/mở bắt buộc nhập lý do (`FR-ADM-02`).
4. [`04_NHAT_KY_KIEM_TOAN_APPEND_ONLY.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/15_ADMIN_CMS_AND_AUDIT/04_NHAT_KY_KIEM_TOAN_APPEND_ONLY.md) — Nhật ký kiểm toán bất biến append-only, lưu IP & Metadata (`FR-ADM-14, 20`).
5. [`05_TRINH_XEM_KHAC_BIET_DIFF_VIEWER.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/15_ADMIN_CMS_AND_AUDIT/05_TRINH_XEM_KHAC_BIET_DIFF_VIEWER.md) — Trình so sánh dữ liệu Before/After trực quan (`FR-ADM-14, 20`).
6. [`06_KHOA_LAC_QUAN_XUNG_DOT_DONG_THOI.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/15_ADMIN_CMS_AND_AUDIT/06_KHOA_LAC_QUAN_XUNG_DOT_DONG_THOI.md) — Cơ chế khóa lạc quan chống xung đột cập nhật đồng thời (`FR-ADM-16..19`).
7. [`07_QUAN_TRI_LO_TRINH_MAU_ROADMAP_TEMPLATE.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/15_ADMIN_CMS_AND_AUDIT/07_QUAN_TRI_LO_TRINH_MAU_ROADMAP_TEMPLATE.md) — Quản trị khung mẫu lộ trình 4 năm chuẩn hóa (`FR-ADM-11`, `FR-RM-15`).

### Cụm 16: Tải Tệp Lên & Lưu Trữ An Toàn (`16_FILE_UPLOAD_AND_STORAGE/`)
1. [`01_GIOI_HAN_DUNG_LUONG_10MB_VA_DINH_DANG.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/16_FILE_UPLOAD_AND_STORAGE/01_GIOI_HAN_DUNG_LUONG_10MB_VA_DINH_DANG.md) — Giới hạn 10MB & danh mục định dạng được phép (`FR-FILE-01..03, 05, 08`).
2. [`02_XAC_THUC_MIME_TYPE_MAGIC_BYTES_PHIA_SERVER.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/16_FILE_UPLOAD_AND_STORAGE/02_XAC_THUC_MIME_TYPE_MAGIC_BYTES_PHIA_SERVER.md) — Kiểm tra chữ ký số Magic Bytes phía Server (`FR-FILE-04`).
3. [`03_PHAN_QUYEN_FILE_CONG_KHAI_VA_RIENG_TU_PRE_SIGNED.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/specification/16_FILE_UPLOAD_AND_STORAGE/03_PHAN_QUYEN_FILE_CONG_KHAI_VA_RIENG_TU_PRE_SIGNED.md) — Phân tách Public/Private Bucket & Pre-signed URL chống IDOR (`FR-FILE-06, 07, 09, 10`).
