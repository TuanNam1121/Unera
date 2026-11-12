import type { Metadata } from "next";
import { TaxCalculatorClient } from "@/components/tools/TaxCalculatorClient";

export const metadata: Metadata = {
  title: "Tính Thuế Thu nhập cá nhân (TNCN) — Unera",
  description:
    "Công cụ tính Thuế TNCN theo biểu lũy tiến 7 bậc, phân tích từng bậc chịu thuế, giảm trừ gia cảnh và ước tính theo năm.",
};

export default function TaxToolPage() {
  return <TaxCalculatorClient />;
}

