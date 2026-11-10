import { NextResponse } from "next/server";
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
      environment: process.env.NODE_ENV || "development",
      database: {
        connected: isDbConnected,
        readyState: mongoose.connection.readyState,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        service: "UNERA Web Platform",
        database: {
          connected: false,
          error: message,
        },
      },
      { status: 500 }
    );
  }
}
