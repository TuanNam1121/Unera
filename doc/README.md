# UNERA — Bộ Tài Liệu Đặc Tả Tính Năng Chi Tiết (Functional Specifications)

> **Căn cứ yêu cầu:** Được trích xuất, chuẩn hóa và chi tiết hóa toàn diện từ [`SRS_1.0.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/SRS_1.0.md), [`PROJECT_CONTEXT.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/PROJECT_CONTEXT.md) và phong cách giao diện chuẩn [`UI_UX_DESIGN_SYSTEM.md`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/UI_UX_DESIGN_SYSTEM.md).
>
> **Phiên bản:** 1.0  
> **Trạng thái:** Baseline phát triển phần mềm

---

## Danh Mục Các Cụm Tính Năng (Feature Clusters)

Toàn bộ hệ thống UNERA được phân rã thành **16 Cụm tính năng** với các tài liệu đặc tả tổng quan cụm (`MODULE_SPEC.md`) và đặc tả chi tiết cho từng tính năng đơn lẻ:

| STT | Mã Cụm | Tên Cụm Tính Năng | Yêu Cầu SRS Liên Quan | Thư Mục Đặc Tả |
|---|---|---|---|---|
| 01 | **AUTH** | Xác thực & Quản lý Tài khoản | FR-AUTH-01 đến FR-AUTH-13 | [`doc/01_AUTHENTICATION/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/01_AUTHENTICATION/MODULE_SPEC.md) |
| 02 | **PROFILE** | Quản lý Hồ sơ Sinh viên | FR-PRO-01 đến FR-PRO-06 | [`doc/02_STUDENT_PROFILE/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/02_STUDENT_PROFILE/MODULE_SPEC.md) |
| 03 | **ONBOARDING** | Trắc nghiệm Định hướng Nghề nghiệp | FR-ONB-01 đến FR-ONB-12 | [`doc/03_ONBOARDING_QUIZ/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/03_ONBOARDING_QUIZ/MODULE_SPEC.md) |
| 04 | **ROADMAP** | Lộ trình Phát triển Cá nhân hóa | FR-RM-01 đến FR-RM-16 | [`doc/04_PERSONAL_ROADMAP/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/04_PERSONAL_ROADMAP/MODULE_SPEC.md) |
| 05 & 06 | **EXPLORE_SEARCH** | Khám phá, Quản lý & Tìm kiếm Cơ hội | FR-EXP-01 đến 15, FR-SRCH-01 đến 11 | [`doc/05_06_EXPLORE_AND_SEARCH/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/05_06_EXPLORE_AND_SEARCH/MODULE_SPEC.md) |
| 07 | **SAVED_APP** | Lưu Cơ hội & Theo dõi Ứng tuyển | FR-APP-01 đến FR-APP-10 | [`doc/07_SAVED_AND_APPLICATIONS/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/07_SAVED_AND_APPLICATIONS/MODULE_SPEC.md) |
| 08 | **CALENDAR** | Lịch Hạn chót & Theo dõi Tường minh | FR-CAL-01 đến FR-CAL-14 | [`doc/08_CALENDAR_AND_DEADLINES/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/08_CALENDAR_AND_DEADLINES/MODULE_SPEC.md) |
| 09 | **NOTIFICATIONS** | Hệ thống Thông báo Đa kênh | FR-NOTI-01 đến FR-NOTI-14 | [`doc/09_NOTIFICATIONS/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/09_NOTIFICATIONS/MODULE_SPEC.md) |
| 10 | **MENTOR** | Kết nối Mentor (Qua trung gian Admin) | FR-MEN-01 đến FR-MEN-13 | [`doc/10_MENTOR_CONNECTION/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/10_MENTOR_CONNECTION/MODULE_SPEC.md) |
| 11 | **TOOLS** | Bộ Công cụ Hỗ trợ Sinh viên | FR-TOOL-01 đến FR-TOOL-12 | [`doc/11_STUDENT_TOOLS/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/11_STUDENT_TOOLS/MODULE_SPEC.md) |
| 12 | **CERT_ACT** | Chứng chỉ & Hoạt động Sinh viên | FR-CERT-01 đến 06, FR-ACT-01 đến 07 | [`doc/12_CERTIFICATES_AND_ACTIVITIES/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/12_CERTIFICATES_AND_ACTIVITIES/MODULE_SPEC.md) |
| 13 & 14 | **COMMUNITY_NEWS** | Nội dung Cộng đồng & Tin tức | FR-COM-01 đến 06, FR-NEWS-01 đến 07 | [`doc/13_14_COMMUNITY_AND_NEWS/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/13_14_COMMUNITY_AND_NEWS/MODULE_SPEC.md) |
| 15 | **ADMIN_CMS** | Bảng Quản trị & CMS Nội dung | FR-ADM-01 đến FR-ADM-20 | [`doc/15_ADMIN_CMS_AND_AUDIT/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/15_ADMIN_CMS_AND_AUDIT/MODULE_SPEC.md) |
| 16 | **FILE_UPLOAD** | Tải Tệp tin & An toàn Lưu trữ | FR-FILE-01 đến FR-FILE-10 | [`doc/16_FILE_UPLOAD_AND_STORAGE/`](file:///c:/Users/AD/OneDrive/Desktop/Project/ULIS_DMST_2026/doc/16_FILE_UPLOAD_AND_STORAGE/MODULE_SPEC.md) |

---

## Cấu Trúc Chuẩn Của Mỗi Tài Liệu Đặc Tả

Mỗi tài liệu đặc tả tính năng trong thư mục `doc/` được thiết kế theo cấu trúc kỹ thuật tiêu chuẩn phục vụ trực tiếp cho quá trình lập trình, kiểm thử (QA) và rà soát:

1. **Mã định danh (Requirement ID & Meta):** Truy xuất ngược về SRS 1.0, tác nhân thực hiện (Actors), mức độ ưu tiên.
2. **Mô tả nghiệp vụ & Quy tắc bất biến (Business Rules & Invariants):** Chi tiết hành vi hệ thống, các ràng buộc dữ liệu, quy định bảo mật.
3. **Luồng người dùng & Thiết kế giao diện (UI/UX Flow & Wireframe):** Trình tự tương tác từng bước của người dùng, giao diện phản ánh chuẩn UI/UX Unera.
4. **Mô hình dữ liệu & Cấu trúc Schema (Data Model Mapping):** Định nghĩa trường, kiểu dữ liệu, index, quan hệ giữa các collection MongoDB.
5. **Đặc tả API Endpoint (API Contract):** Phương thức, đường dẫn, schema request validation (Zod), response chuẩn, mã lỗi HTTP.
6. **Tiêu chí chấp thuận & Ca kiểm thử (Acceptance Criteria & Test Cases):** Định dạng Gherkin (Given - When - Then), kiểm thử luồng biên, kiểm thử quyền truy cập và kiểm thử tải/xung đột.
