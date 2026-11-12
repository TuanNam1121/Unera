# TOOL-03: Công Cụ Tính Lương Gross ↔ Net (`/tools/gross-net`)

> **Module:** `07_TOOLS`  
> **Yêu cầu:** Tính lương Gross - Net chuẩn quy định Việt Nam cho sinh viên sắp ra trường, thực tập sinh và người đi làm.  
> **Tác nhân:** Visitor, Student.

---

## 1. Quy Tắc Nghiệp Vụ & Tham Số Tính Toán Chuẩn Hóa

Tất cả hằng số pháp quy được tách riêng tại `src/constants/salaryTaxConfig.ts` (kèm ngày hiệu lực & ghi chú cấu hình dễ cập nhật khi Nhà nước thay đổi mức lương cơ sở/tối thiểu vùng/giảm trừ):

1. **Chế độ quy đổi 2 chiều:**
   - **Gross → Net:** Nhập Lương Gross → Tính các khoản Bảo hiểm, Thuế TNCN và Lương Net thực nhận.
   - **Net → Gross:** Nhập Lương Net mong muốn → Giải ngược (bằng phép biến đổi lũy tiến từng bậc thuế TNCN hoặc giải phương trình chính xác theo từng khoảng thu nhập tính thuế, xử lý chính xác trường hợp chạm trần đóng bảo hiểm!).
2. **Đầu vào (Inputs):**
   - Số tiền lương (`salaryAmount`, VNĐ, mặc định hoặc gợi ý nhanh `10tr`, `15tr`, `20tr`, `30tr`).
   - Chiều tính: `GROSS_TO_NET` | `NET_TO_GROSS`.
   - Mức lương đóng bảo hiểm: **Trên lương chính thức** (mặc định) hoặc **Nhập mức đóng BH riêng** (`customInsuranceSalary`).
   - **Vùng (I, II, III, IV):** Quy định mức trần lương đóng BHTN (`20 x Lương tối thiểu vùng`: Vùng I `4.960.000`, Vùng II `4.410.000`, Vùng III `3.860.000`, Vùng IV `3.450.000` theo Nghị định 74/2024/NĐ-CP; trần BHXH & BHYT = `20 x Lương cơ sở 2.340.000 = 46.800.000đ`).
   - **Số người phụ thuộc** (`dependents`, số nguyên `>= 0`).
   - Tùy chọn nâng cao (collapsible): Tỷ lệ đóng BHXH (`8%`), BHYT (`1.5%`), BHTN (`1%`) và tùy chọn so sánh **Chi phí Nhà tuyển dụng trả** (BHXH 17.5%, BHYT 3%, BHTN 1%).
3. **Công Thức Chuẩn Gross → Net:**
   - `BHXH = min(insuranceBase, MAX_BHXH_BHYT_CAP) * 0.08`
   - `BHYT = min(insuranceBase, MAX_BHXH_BHYT_CAP) * 0.015`
   - `BHTN = min(insuranceBase, MAX_BHTN_CAP[region]) * 0.01`
   - `Tổng Bảo hiểm NLĐ = BHXH + BHYT + BHTN`
   - `Thu nhập trước thuế = Gross - Tổng Bảo hiểm NLĐ`
   - `Giảm trừ gia cảnh = 11.000.000 (bản thân) + dependents * 4.400.000`
   - `Thu nhập tính thuế (TNTT) = max(0, Thu nhập trước thuế - Giảm trừ gia cảnh)`
   - `Thuế TNCN = tính lũy tiến 7 bậc(TNTT)` (dùng chung helper thuần `calculatePIT(taxableIncome)` với `TOOL-04`)
   - `Lương Net = Thu nhập trước thuế - Thuế TNCN`
4. **Công Thức Chuẩn Net → Gross:**
   - B1: Quy đổi `Net` + `Giảm trừ gia cảnh` → `Thu nhập trước thuế (TNTT_Gross_Before_Tax)` thông qua hàm nghịch đảo 7 bậc thuế TNCN (`invertTaxFromNet(net, personalDeduction, dependentDeduction)`).
   - B2: Tính ngược `Gross` từ `Thu nhập trước thuế` có xét ngưỡng trần đóng BHXH/BHYT (`46.800.000đ`) và trần BHTN theo vùng (hoặc mức đóng bảo hiểm cố định nếu user chọn mức đóng riêng), sau đó chạy kiểm chứng lại qua hàm `Gross → Net` để đảm bảo sai số <= 1đ!

---

## 2. Giao Diện Đầu Ra (Output Breakdown)

1. **Summary Cards:** Lương Gross, Lương Net, Tổng Bảo hiểm, Thuế TNCN (format `vi-VN` VNĐ).
2. **Bảng Diễn Giải Chi Tiết (Breakdown Table):** Hiển thị từng dòng rõ ràng (Lương Gross → BHXH 8% → BHYT 1.5% → BHTN 1% → Thu nhập trước thuế → Giảm trừ bản thân → Giảm trừ người phụ thuộc → Thu nhập tính thuế → Thuế TNCN → Lương Net).
3. **Bảng Chi tiết Thuế TNCN theo 7 bậc** (hiển thị bậc nào chịu bao nhiêu tiền).
4. **Bảng Chi phí Doanh nghiệp (Employer Cost):** Tham khảo tổng chi phí công ty chi trả.

---

## 3. Tiêu Chí Chấp Thuận

- **AC-01 (Gross → Net):** Nhập Gross `20.000.000đ`, Vùng I, `0` người phụ thuộc → BHXH = `1.600.000`, BHYT = `300.000`, BHTN = `200.000` (Tổng BH = `2.100.000`), TNTT = `20.000.000 - 2.100.000 - 11.000.000 = 6.900.000`, Thuế TNCN = `5.000.000 * 5% + 1.900.000 * 10% = 440.000`, Net = `17.460.000đ`.
- **AC-02 (Trần Bảo hiểm):** Nhập Gross `60.000.000đ`, Vùng I → BHXH & BHYT tính trên trần `46.800.000đ`, BHTN tính trên trần `99.200.000đ` (`20 * 4.960.000`).
- **AC-03 (Net → Gross Round-trip):** Tính Net → Gross cho `Net = 17.460.000đ`, Vùng I, 0 phụ thuộc → trả về Gross chính xác `20.000.000đ`.

