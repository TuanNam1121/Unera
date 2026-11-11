# Cụm Module 03: Trắc Nghiệm Định Hướng Nghề Nghiệp (Onboarding Quiz & Career Orientation)

> **Mã Module:** `03_ONBOARDING_QUIZ`  
> **Căn cứ SRS:** Mục 4.3 (`FR-ONB-01` đến `FR-ONB-12`)  
> **Trạng thái cụm:** ![Hoàn thành](https://img.shields.io/badge/-ĐÃ%20HOÀN%20THÀNH%20100%25-emerald)

---

## Danh Mục Các Tính Năng Con Trong Cụm

| Mã File | Tên Tính Năng Chi Tiết | Trạng Thái | Mô Tả & Endpoint |
|---|---|:---:|---|
| [`01_KHA_DUNG_VA_NUT_SKIP.md`](./01_KHA_DUNG_VA_NUT_SKIP.md) | Khả dụng & Cơ chế Bỏ qua trắc nghiệm | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Giao diện `/onboarding`, nút Skip không chặn luồng theo BR-04. |
| [`02_THU_THAP_VA_NOP_BAI_QUIZ.md`](./02_THU_THAP_VA_NOP_BAI_QUIZ.md) | Thu thập câu trả lời & Nộp bài trắc nghiệm | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Stepper form, kiểm tra hợp lệ đầy đủ câu hỏi phía server. |
| [`03_CHAM_DIEM_RULE_BASED_5_HUONG.md`](./03_CHAM_DIEM_RULE_BASED_5_HUONG.md) | Chấm điểm Rule-based & Khuyến nghị 5 hướng | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Công thức cộng dồn trọng số, Top 1 & Top 2 (chênh $\le 25\%$), Next steps. |
| [`04_LICH_SU_VA_LAM_LAI_QUIZ.md`](./04_LICH_SU_VA_LAM_LAI_QUIZ.md) | Lịch sử kết quả & Làm lại trắc nghiệm | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Bản ghi `QuizResult` bảo toàn lịch sử, cho phép retake bất kỳ lúc nào. |
| [`05_ADMIN_CMS_QUAN_TRI_CAU_HOI_OPTIONS_DIEM.md`](./05_ADMIN_CMS_QUAN_TRI_CAU_HOI_OPTIONS_DIEM.md) | Admin CMS Quản trị câu hỏi & ma trận điểm | ![Hoàn thành](https://img.shields.io/badge/-DONE-emerald) | Giao diện `/admin/quiz`, CRUD câu hỏi, options, điểm 5 hướng, AuditLog. |
