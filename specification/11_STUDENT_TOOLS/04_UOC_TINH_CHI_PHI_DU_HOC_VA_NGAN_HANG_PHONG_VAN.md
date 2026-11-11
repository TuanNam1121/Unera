# Tính Năng: Ước Tính Chi Phí Du Học & Ngân Hàng Câu Hỏi Phỏng Vấn (Cost Estimator & Mock Interview)

> **Mã SRS:** `FR-TOOL-09`, `FR-TOOL-10`  
> **Trạng thái:** ![Kế hoạch theo SRS](https://img.shields.io/badge/-KẾ%20HOẠCH%20THEO%20SRS-amber)  
> **Thuộc cụm:** `11_STUDENT_TOOLS`  
> **Tác nhân:** Sinh viên (Student)

---

## 1. Hiện Trạng Triển Khai
- Cần xây dựng hai tiện ích hỗ trợ sinh viên tại `/tools/study-abroad-cost` và `/tools/interview-prep`.

---

## 2. Đặc Tả Nghiệp Vụ Theo SRS 1.0 (Specification)

### 2.1 Công Cụ Ước Tính Chi Phí Du Học (FR-TOOL-09)
- Cho phép sinh viên chọn quốc gia đích:
  - Mỹ (USA), Vương quốc Anh (UK), Úc (Australia), Canada.
  - Châu Âu (Đức, Pháp, Hà Lan, Ý, v.v.).
  - Châu Á: Nhật Bản, Hàn Quốc, Đài Loan, Trung Quốc, Singapore.
- Chọn bậc học: Cử nhân, Thạc sĩ, Trao đổi văn hóa 1 năm.
- Máy tính tổng hợp:
  - Học phí trung bình theo năm.
  - Chi phí nhà ở (Ký túc xá vs Thuê ngoài).
  - Chi phí sinh hoạt, ăn uống, bảo hiểm y tế.
  - Dự kiến mức học bổng (Toàn phần, 50%, 25%, Tự túc) -> Đưa ra khoản ngân sách gia đình cần chuẩn bị ròng.

### 2.2 Ngân Hàng Câu Hỏi Phỏng Vấn Thử (FR-TOOL-10)
- Tổng hợp các bộ câu hỏi phỏng vấn chuẩn hóa theo từng nhóm mục tiêu:
  1. **Phỏng vấn Học bổng Du học (Scholarship Interview):** Giới thiệu bản thân, lý do chọn ngành/quốc gia, kế hoạch quay về đóng góp, giải quyết xung đột văn hóa.
  2. **Phỏng vấn Thực tập sinh Doanh nghiệp (Internship / Fresher):** Điểm mạnh/yếu, tình huống xử lý áp lực, dự án từng tham gia ở trường.
  3. **Phỏng vấn Giảng dạy / Sư phạm Ngoại ngữ:** Phương pháp giảng dạy, xử lý học sinh mất tập trung, thiết kế giáo án.
- Cung cấp khung cấu trúc trả lời theo phương pháp STAR (Situation - Task - Action - Result).
