import type { Metadata } from "next";
import { GrossNetCalculatorClient } from "@/components/tools/GrossNetCalculatorClient";

export const metadata: Metadata = {
  title: "Tính lương Gross ↔ Net — Công cụ sinh viên Unera",
  description:
    "Quy đổi lương Gross sang Net và Net sang Gross chuẩn quy định BHXH, BHYT, BHTN theo vùng I–IV và biểu thuế TNCN 7 bậc.",
};

export default function GrossNetToolPage() {
  return <GrossNetCalculatorClient />;
}

