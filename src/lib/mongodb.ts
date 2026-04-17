import { MongoClient, Db } from "mongodb";

const DB_NAME = process.env.MONGODB_DB_NAME || "parnami_report";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let db: Db | null = null;

function isAuthError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("bad auth") || message.includes("authentication failed");
}

function hasTemplatePlaceholders(uri: string): boolean {
  return uri.includes("<username>") || uri.includes("<url-encoded-password>") || uri.includes("<cluster-host>");
}

function isDnsSrvError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("querysrv") || message.includes("ebadname") || message.includes("_mongodb._tcp");
}

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables.");
  }

  if (hasTemplatePlaceholders(uri)) {
    throw new Error("MONGODB_URI contains template placeholders. Set a real MongoDB Atlas URI in deployment environment variables.");
  }

  if (!clientPromise) {
    client = new MongoClient(uri);
    clientPromise = client.connect().catch((error) => {
      clientPromise = null;
      client = null;
      db = null;

      if (isAuthError(error)) {
        throw new Error("Database authentication failed. Verify MONGODB_URI username/password and URL encoding.");
      }

      if (isDnsSrvError(error)) {
        throw new Error("Database host resolution failed. Verify MONGODB_URI cluster host in deployment environment variables.");
      }

      throw error;
    });
  }

  if (!db) {
    const connectedClient = await clientPromise;
    db = connectedClient.db(DB_NAME);
  }

  return db as Db;
}
