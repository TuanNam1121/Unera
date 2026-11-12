# TOOL-04: Công Cụ Tính Thuế Thu Nhập Cá Nhân — TNCN (`/tools/tax`)

> **Module:** `07_TOOLS`  
> **Yêu cầu:** Tính thu nhập cá nhân (Thuế Thu nhập cá nhân từ tiền lương, tiền công).  
> **Tác nhân:** Visitor, Student.

---

## 1. Quy Tắc Nghiệp Vụ & Biểu Thuế Lũy Tiến 7 Bậc

Dùng chung thư viện tính toán thuần `src/lib/calculators/salaryTax.ts` với `TOOL-03` để không trùng lặp logic.

1. **Đầu vào (Inputs):**
   - **Tổng thu nhập chịu thuế tháng** (`grossIncome`, VNĐ).
   - **Các khoản bảo hiểm bắt buộc đã đóng** (`insuranceAmount`, VNĐ — có nút auto tính 10.5% theo lương hoặc nhập trực tiếp số tiền đã trừ).
   - **Số người phụ thuộc** (`dependents >= 0`, mặc định `4.400.000đ / người / tháng`).
   - **Giảm trừ gia cảnh bản thân** (mặc định `11.000.000đ / tháng`).
   - **Các khoản giảm trừ hợp lệ khác** (`otherDeductions`, VD: đóng góp từ thiện, nhân đạo, khuyến học, quỹ hưu trí tự nguyện tối đa theo quy định).
   - Tùy chọn xem theo **Tháng** hoặc ước tính **Cả năm (x12)**.
2. **Biểu Thuế Lũy Tiến Từng Phần 7 Bậc (Luật Thuế TNCN Việt Nam):**
   | Bậc | Phần thu nhập tính thuế / tháng | Thuế suất |
   |---|---|---|
   | Bậc 1 | Đến 5 triệu VNĐ | `5%` |
   | Bậc 2 | Trên 5 triệu đến 10 triệu VNĐ | `10%` |
   | Bậc 3 | Trên 10 triệu đến 18 triệu VNĐ | `15%` |
   | Bậc 4 | Trên 18 triệu đến 32 triệu VNĐ | `20%` |
   | Bậc 5 | Trên 32 triệu đến 52 triệu VNĐ | `25%` |
   | Bậc 6 | Trên 52 triệu đến 80 triệu VNĐ | `30%` |
   | Bậc 7 | Trên 80 triệu VNĐ | `35%` |
3. **Công thức:**
   - `Tổng các khoản giảm trừ = Giảm trừ bản thân + (dependents * Giảm trừ người phụ thuộc) + Bảo hiểm bắt buộc + Giảm trừ khác`
   - `Thu nhập tính thuế (TNTT) = max(0, Tổng thu nhập - Tổng các khoản giảm trừ)`
   - `Thuế TNCN phải nộp = Tổng thuế từng bậc mà TNTT đi qua`
   - `Thuế suất hiệu dụng (%) = (Thuế TNCN / Tổng thu nhập) * 100`
   - `Thu nhập thực nhận sau thuế & BH = Tổng thu nhập - Bảo hiểm - Thuế TNCN`

---

## 2. Giao Diện Trực Quan

- Form nhập liệu rõ ràng bên trái, kết quả phân tích tức thì (real-time calculation, không cần reload) bên phải.
- **Bảng Breakdown 7 Bậc Thuế:** Chỉ ra rõ từng bậc chịu thuế (phần thu nhập nằm trong bậc đó, thuế suất %, và số tiền thuế của riêng bậc đó), giúp sinh viên dễ hiểu cơ chế lũy tiến từng phần (tránh hiểu nhầm bị nhân toàn bộ thu nhập với bậc cao nhất).
- Hỗ trợ nút reset và các ví dụ mẫu ("Lương 15 triệu - 0 phụ thuộc", "Lương 25 triệu - 1 phụ thuộc", "Lương 40 triệu - 2 phụ thuộc").

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (Không phải nộp thuế):** Nhập thu nhập `12.000.000đ`, bảo hiểm `1.260.000đ`, 0 người phụ thuộc → TNTT = `0đ` → Thuế TNCN = `0đ`.
- **AC-02 (Nhiều bậc lũy tiến):** Nhập thu nhập `30.000.000đ`, bảo hiểm `3.150.000đ`, 1 người phụ thuộc (`4.400.000đ`) → Tổng giảm trừ = `3.150.000 + 11.000.000 + 4.400.000 = 18.550.000đ` → TNTT = `11.450.000đ` → Bậc 1 (`5tr * 5% = 250.000`) + Bậc 2 (`5tr * 10% = 500.000`) + Bậc 3 (`1.45tr * 15% = 217.500`) = **`967.500đ`**.
- **AC-03:** Validate không cho nhập số âm cho thu nhập, bảo hiểm, hoặc số người phụ thuộc.

