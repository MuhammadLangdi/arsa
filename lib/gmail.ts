import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { getOAuthClient } from "./google";
import { supabaseAdmin } from "./supabase";

export type GmailMessage = {
  id: string;
  threadId: string;
  fromAddress: string;
  fromName: string;
  toAddress: string;
  subject: string;
  snippet: string;
  date: string;
  receivedAt: Date;
  body: string;
  labels: string[];
  isNoise: boolean;
};

async function getUserOAuthClient(userId: string): Promise<OAuth2Client> {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("google_access_token, google_refresh_token, google_token_expires_at")
    .eq("id", userId)
    .single();

  if (error || !user) throw new Error("User not found");

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: user.google_access_token,
    refresh_token: user.google_refresh_token,
    expiry_date: user.google_token_expires_at
      ? new Date(user.google_token_expires_at).getTime()
      : null,
  });

  const expiresAt = user.google_token_expires_at
    ? new Date(user.google_token_expires_at).getTime()
    : 0;
  if (expiresAt < Date.now() + 60_000) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    await supabaseAdmin
      .from("users")
      .update({
        google_access_token: credentials.access_token,
        google_token_expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq("id", userId);
  }

  return oauth2Client;
}

function decodeBody(data: string | null | undefined): string {
  if (!data) return "";
  return Buffer.from(data, "base64url").toString("utf-8");
}

function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) return decodeBody(payload.body.data);

  if (payload.parts) {
    const plainPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (plainPart?.body?.data) return decodeBody(plainPart.body.data);

    const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return decodeBody(htmlPart.body.data).replace(/<[^>]+>/g, " ");
    }

    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

function getHeader(headers: any[], name: string): string {
  const h = headers?.find(
    (x: any) => x.name.toLowerCase() === name.toLowerCase()
  );
  return h?.value || "";
}

// Parse "John Doe <john@x.com>" into { name: "John Doe", address: "john@x.com" }
function parseAddress(raw: string): { name: string; address: string } {
  const match = raw.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    return {
      name: match[1].replace(/^"|"$/g, "").trim(),
      address: match[2].trim().toLowerCase(),
    };
  }
  return { name: "", address: raw.trim().toLowerCase() };
}

// Heuristic: is this email noise (promotions, newsletters, automated)?
// We use Gmail's labels + sender patterns. Fast, free, no LLM call.
function classifyNoise(
  labels: string[],
  fromAddress: string,
  subject: string
): boolean {
  // Gmail-categorized promotional or social content
  if (labels.includes("CATEGORY_PROMOTIONS")) return true;
  if (labels.includes("CATEGORY_SOCIAL")) return true;
  if (labels.includes("CATEGORY_FORUMS")) return true;

  // Common no-reply / automated sender patterns
  const noisySenderPatterns = [
    /noreply/i,
    /no-reply/i,
    /donotreply/i,
    /newsletter/i,
    /notifications?@/i,
    /updates?@/i,
    /marketing@/i,
    /info@.*\.(co|com)/i,
  ];
  if (noisySenderPatterns.some((p) => p.test(fromAddress))) {
    // But keep banking, government, work-critical even if from "noreply"
    const importantKeywords = /bank|sars|invoice|receipt|payment|otp|verification|security/i;
    if (!importantKeywords.test(subject) && !importantKeywords.test(fromAddress)) {
      return true;
    }
  }

  // Common newsletter subject patterns
  if (/unsubscribe/i.test(subject)) return true;
  if (/% off|sale ends|free shipping/i.test(subject)) return true;

  return false;
}

export async function fetchAndStoreEmails(
  userId: string,
  options: { maxResults?: number; daysBack?: number } = {}
): Promise<GmailMessage[]> {
  const maxResults = options.maxResults ?? 200;
  const daysBack = options.daysBack ?? 30;

  const auth = await getUserOAuthClient(userId);
  const gmail = google.gmail({ version: "v1", auth });

  // Calculate Gmail search query: emails newer than X days
  const afterDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const afterStr = `${afterDate.getFullYear()}/${
    afterDate.getMonth() + 1
  }/${afterDate.getDate()}`;

  // Fetch list of message IDs
  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: `after:${afterStr}`,
  });

  const messages = list.data.messages || [];
  if (messages.length === 0) return [];

  // Fetch full message bodies in parallel batches of 20
  const fullMessages: any[] = [];
  const batchSize = 20;
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((m) =>
        gmail.users.messages
          .get({ userId: "me", id: m.id!, format: "full" })
          .catch((err) => {
            console.error(`Failed to fetch message ${m.id}:`, err.message);
            return null;
          })
      )
    );
    fullMessages.push(...results.filter((r) => r !== null));
  }

  const parsed: GmailMessage[] = [];

  for (const res of fullMessages) {
    const msg = res.data;
    const headers = msg.payload?.headers || [];
    const body = extractBody(msg.payload);
    const labels: string[] = msg.labelIds || [];
    const from = parseAddress(getHeader(headers, "From"));
    const to = parseAddress(getHeader(headers, "To"));
    const subject = getHeader(headers, "Subject");
    const dateStr = getHeader(headers, "Date");
    const receivedAt = dateStr ? new Date(dateStr) : new Date();
    const isNoise = classifyNoise(labels, from.address, subject);

    parsed.push({
      id: msg.id!,
      threadId: msg.threadId!,
      fromAddress: from.address,
      fromName: from.name,
      toAddress: to.address,
      subject,
      snippet: msg.snippet || "",
      date: dateStr,
      receivedAt,
      body: body.slice(0, 3000),
      labels,
      isNoise,
    });
  }

  // Upsert into Supabase. Duplicates skipped via unique(user_id, gmail_id).
  const rows = parsed.map((p) => ({
    user_id: userId,
    gmail_id: p.id,
    thread_id: p.threadId,
    from_address: p.fromAddress,
    from_name: p.fromName,
    to_address: p.toAddress,
    subject: p.subject,
    snippet: p.snippet,
    body: p.body,
    received_at: p.receivedAt.toISOString(),
    is_noise: p.isNoise,
    labels: p.labels,
  }));

  // Upsert in batches to avoid request size limits
  const upsertBatchSize = 50;
  for (let i = 0; i < rows.length; i += upsertBatchSize) {
    const batch = rows.slice(i, i + upsertBatchSize);
    const { error } = await supabaseAdmin
      .from("emails")
      .upsert(batch, { onConflict: "user_id,gmail_id" });
    if (error) {
      console.error("[gmail] Upsert error:", error);
    }
  }

  return parsed;
}

// Get the signal-worthy emails (excluding noise) from the database
export async function getSignalEmails(
  userId: string,
  limit: number = 100
): Promise<GmailMessage[]> {
  const { data, error } = await supabaseAdmin
    .from("emails")
    .select("*")
    .eq("user_id", userId)
    .eq("is_noise", false)
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((e) => ({
    id: e.gmail_id,
    threadId: e.thread_id,
    fromAddress: e.from_address || "",
    fromName: e.from_name || "",
    toAddress: e.to_address || "",
    subject: e.subject || "",
    snippet: e.snippet || "",
    date: e.received_at,
    receivedAt: new Date(e.received_at),
    body: e.body || "",
    labels: e.labels || [],
    isNoise: e.is_noise,
  }));
}
