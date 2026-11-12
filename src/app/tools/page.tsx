import type { Metadata } from "next";
import { ToolsHubClient } from "@/components/tools/ToolsHubClient";

export const metadata: Metadata = {
  title: "Công cụ sinh viên — Unera",
  description:
    "Trắc nghiệm MBTI, Đa trí thông minh MI, Tính lương Gross - Net và Tính Thuế Thu nhập cá nhân chuẩn Việt Nam.",
};

export default function ToolsHubPage() {
  return <ToolsHubClient />;
}

