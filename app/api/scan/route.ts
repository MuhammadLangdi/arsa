import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { fetchAndStoreEmails, getSignalEmails } from "@/lib/gmail";
import {
  fetchAndStoreCalendarEvents,
  getRelevantCalendarEvents,
} from "@/lib/calendar";
import { analyzeLifeFromEmailsAndCalendar } from "@/lib/claude";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 120;

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    console.log("[scan] Sensing inbox + calendar for user", session.userId);

    // Fetch both in parallel
    const [emails, events] = await Promise.all([
      fetchAndStoreEmails(session.userId, {
        maxResults: 200,
        daysBack: 30,
      }),
      fetchAndStoreCalendarEvents(session.userId, {
        daysBack: 14,
        daysForward: 30,
      }),
    ]);

    console.log(
      "[scan] Fetched",
      emails.length,
      "emails (",
      emails.filter((e) => !e.isNoise).length,
      "signal-worthy) and",
      events.length,
      "calendar events"
    );

    const [signalEmails, relevantEvents] = await Promise.all([
      getSignalEmails(session.userId, 100),
      getRelevantCalendarEvents(session.userId),
    ]);

    if (signalEmails.length === 0 && relevantEvents.length === 0) {
      return NextResponse.json(
        { error: "No signal-worthy data found in your inbox or calendar" },
        { status: 400 }
      );
    }

    const { data: previousSnapshot } = await supabaseAdmin
      .from("life_snapshots")
      .select("summary, signals")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log("[scan] Analyzing across email + calendar with Claude...");
    const snapshot = await analyzeLifeFromEmailsAndCalendar(
      signalEmails,
      relevantEvents,
      previousSnapshot || null
    );
    console.log(
      "[scan] Got snapshot with",
      snapshot.signals.length,
      "signals,",
      snapshot.whats_new ? "with whats_new" : "no whats_new"
    );

    const { data: saved, error: saveError } = await supabaseAdmin
      .from("life_snapshots")
      .insert({
        user_id: session.userId,
        summary: snapshot.summary,
        signals: snapshot.signals,
        email_count: signalEmails.length,
        whats_new: snapshot.whats_new || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error("[scan] Save error:", saveError);
      throw new Error("Failed to save snapshot");
    }

    return NextResponse.json({ snapshot: saved });
  } catch (err: any) {
    console.error("[scan] Error:", err);

    // If Google scope issue, tell user to reconnect
    if (
      err.message?.includes("insufficient") ||
      err.message?.includes("scope") ||
      err.message?.includes("invalid_grant")
    ) {
      return NextResponse.json(
        { error: "Sava needs new permissions. Please sign out and back in." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Scan failed" },
      { status: 500 }
    );
  }
}
