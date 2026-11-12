import { NextRequest } from "next/server";
import { connection } from "next/server";
import { queryPublishedActivities } from "@/lib/activities-query";

export async function GET(req: NextRequest) {
  await connection();
  return queryPublishedActivities(req);
}
