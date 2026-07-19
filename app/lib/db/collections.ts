import clientPromise from "@/app/lib/mongodb";
import { Subscriber, Group, EmailTemplate, EmailCampaign } from "./types";

const DB_NAME = "shri_prasadam";
let indexesEnsured = false;

export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

async function ensureIndexes(db: Awaited<ReturnType<typeof getDb>>) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    await db.collection("subscribers").createIndex({ email: 1 }, { unique: true });
    await db.collection("subscribers").createIndex({ status: 1 });
    await db.collection("subscribers").createIndex({ groupIds: 1 });
    await db.collection("email_campaigns").createIndex({ status: 1, createdAt: -1 });
  } catch (err) {
    // Index creation failures (e.g. pre-existing duplicate emails) should not crash requests.
    console.error("Failed to ensure email marketing indexes:", err);
  }
}

export async function subscribersCol() {
  const db = await getDb();
  await ensureIndexes(db);
  return db.collection<Subscriber>("subscribers");
}

export async function groupsCol() {
  const db = await getDb();
  return db.collection<Group>("groups");
}

export async function templatesCol() {
  const db = await getDb();
  return db.collection<EmailTemplate>("email_templates");
}

export async function campaignsCol() {
  const db = await getDb();
  return db.collection<EmailCampaign>("email_campaigns");
}
