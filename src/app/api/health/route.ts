import { NextResponse } from "next/server";
import { getDevErrorDetails } from "@/lib/api-error";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const mongoose = await connectToDatabase();
    const isDbConnected = mongoose.connection.readyState === 1;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "UNERA Web Platform",
      version: "1.0.0",
      database: {
        connected: isDbConnected,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        service: "UNERA Web Platform",
        database: {
          connected: false,
          ...getDevErrorDetails(error),
        },
      },
      { status: 500 }
    );
  }
}

