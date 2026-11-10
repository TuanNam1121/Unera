# Đặc Tả Tính Năng: Nhãn Cơ Hội Được Tài Trợ (Sponsored Label)

> **Mã tính năng:** `FR-EXP-10`  
> **Thuộc cụm:** `05_06_EXPLORE_AND_SEARCH`  
> **Tác nhân:** Hệ thống (System), Sinh viên (Student)  
> **Mức độ ưu tiên:** Bắt buộc (P0 - Transparency)  
> **Trạng thái:** Confirmed Business Decision  

---

## 1. Nghiệp Vụ Tính Năng

- Để đảm bảo tính minh bạch thông tin cho sinh viên:
  - Mọi cơ hội có thỏa thuận hợp tác truyền thông hoặc được tài trợ bởi đối tác (`isSponsored: true`) **bắt buộc phải hiển thị nhãn "Được tài trợ" (Sponsored)** ở vị trí nổi bật trên cả thẻ danh sách (Card) và trang chi tiết (Detail page).
  - Nhãn có kiểu dáng chuẩn hóa: huy hiệu viền vàng/amber nhạt với chữ đậm:
    ```tsx
    <Badge variant="warning" className="text-[10px] uppercase font-bold tracking-wider">
      Được tài trợ
    </Badge>
    ```
  - Nghiêm cấm hiển thị nội dung tài trợ ngầm hoặc trà trộn nội dung quảng cáo như một cơ hội thông thường mà không có nhãn nhận diện.
