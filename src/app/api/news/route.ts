import { NextRequest } from "next/server";
import { connection } from "next/server";
import { queryPublishedNews } from "@/lib/news-query";

export async function GET(req: NextRequest) {
  await connection();
  return queryPublishedNews(req);
}

