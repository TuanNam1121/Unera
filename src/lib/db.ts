import mongoose from "mongoose";

function resolveMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (uri) return uri;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Thiếu biến môi trường MONGODB_URI trong môi trường production."
    );
  }

  return "mongodb://localhost:27017/unera";
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB with connection reuse across Next.js serverless functions & hot-reloading.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached.promise = mongoose
      .connect(resolveMongoUri(), opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;

