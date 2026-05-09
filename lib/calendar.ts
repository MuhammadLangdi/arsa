import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { getOAuthClient } from "./google";
import { supabaseAdmin } from "./supabase";

export type CalendarEvent = {
  id: string;
  summary: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  attendees: { email: string; name?: string; responseStatus?: string }[];
  organizer: string;
  status: string;
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

export async function fetchAndStoreCalendarEvents(
  userId: string,
  options: { daysBack?: number; daysForward?: number } = {}
): Promise<CalendarEvent[]> {
  const daysBack = options.daysBack ?? 14;
  const daysForward = options.daysForward ?? 30;

  const auth = await getUserOAuthClient(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const timeMin = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const timeMax = new Date(Date.now() + daysForward * 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  const events = res.data.items || [];
  const parsed: CalendarEvent[] = [];

  for (const ev of events) {
    if (!ev.id) continue;

    const isAllDay = !!ev.start?.date;
    const startTime = ev.start?.dateTime
      ? new Date(ev.start.dateTime)
      : ev.start?.date
      ? new Date(ev.start.date)
      : null;
    const endTime = ev.end?.dateTime
      ? new Date(ev.end.dateTime)
      : ev.end?.date
      ? new Date(ev.end.date)
      : null;

    if (!startTime) continue;

    parsed.push({
      id: ev.id,
      summary: ev.summary || "(no title)",
      description: ev.description || "",
      location: ev.location || "",
      startTime,
      endTime: endTime || startTime,
      isAllDay,
      attendees: (ev.attendees || []).map((a) => ({
        email: a.email || "",
        name: a.displayName || undefined,
        responseStatus: a.responseStatus || undefined,
      })),
      organizer: ev.organizer?.email || "",
      status: ev.status || "confirmed",
    });
  }

  // Upsert into Supabase
  const rows = parsed.map((e) => ({
    user_id: userId,
    google_event_id: e.id,
    calendar_id: "primary",
    summary: e.summary,
    description: e.description.slice(0, 2000),
    location: e.location,
    start_time: e.startTime.toISOString(),
    end_time: e.endTime.toISOString(),
    is_all_day: e.isAllDay,
    attendees: e.attendees,
    organizer: e.organizer,
    status: e.status,
  }));

  const batchSize = 50;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabaseAdmin
      .from("calendar_events")
      .upsert(batch, { onConflict: "user_id,google_event_id" });
    if (error) console.error("[calendar] Upsert error:", error);
  }

  return parsed;
}

export async function getRelevantCalendarEvents(
  userId: string
): Promise<CalendarEvent[]> {
  // Get events from 7 days ago to 30 days forward — Sava's "horizon"
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .gte("start_time", since.toISOString())
    .lte("start_time", until.toISOString())
    .neq("status", "cancelled")
    .order("start_time", { ascending: true });

  if (error || !data) return [];

  return data.map((e) => ({
    id: e.google_event_id,
    summary: e.summary || "",
    description: e.description || "",
    location: e.location || "",
    startTime: new Date(e.start_time),
    endTime: new Date(e.end_time),
    isAllDay: e.is_all_day,
    attendees: e.attendees || [],
    organizer: e.organizer || "",
    status: e.status || "confirmed",
  }));
}
