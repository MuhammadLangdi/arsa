import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchAndStoreEmails, getSignalEmails } from "@/lib/gmail";
import {
  fetchAndStoreCalendarEvents,
  getRelevantCalendarEvents,
} from "@/lib/calendar";
import {
  analyzeLifeFromEmailsAndCalendar,
  scoreEmailsForSignal,
} from "@/lib/claude";
import { writeDailyBrief } from "@/lib/daily-brief";
import { renderDailyBriefEmail } from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify this is Vercel Cron or our manual trigger
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron] Starting daily brief run");

  // Get all users with daily brief enabled who have not received one today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: users, error: usersError } = await supabaseAdmin
    .from("users")
    .select("id, email, name, last_brief_sent_at")
    .eq("daily_brief_enabled", true);

  if (usersError || !users) {
    console.error("[cron] Failed to fetch users:", usersError);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  // Filter out users who already got today's brief
  const targetUsers = users.filter((u) => {
    if (!u.last_brief_sent_at) return true;
    return new Date(u.last_brief_sent_at) < today;
  });

  console.log(`[cron] ${targetUsers.length} users to send briefs to`);

  let succeeded = 0;
  let failed = 0;

  // Process sequentially to avoid hammering Gmail/Calendar APIs
  for (const user of targetUsers) {
    try {
      console.log(`[cron] Processing ${user.email}`);

      // Fetch fresh data
      await Promise.all([
        fetchAndStoreEmails(user.id, { maxResults: 200, daysBack: 30 }),
        fetchAndStoreCalendarEvents(user.id, { daysBack: 14, daysForward: 30 }),
      ]);

      const [candidateEmails, relevantEvents] = await Promise.all([
        getSignalEmails(user.id, 100),
        getRelevantCalendarEvents(user.id),
      ]);

      if (candidateEmails.length === 0 && relevantEvents.length === 0) {
        console.log(`[cron] No data for ${user.email}, skipping`);
        continue;
      }

      let signalEmails = candidateEmails;
      if (candidateEmails.length > 40) {
        const scores = await scoreEmailsForSignal(candidateEmails);
        signalEmails = candidateEmails
          .map((e) => ({ email: e, score: scores.get(e.id) ?? 5 }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 40)
          .map((x) => x.email);
      }

      const { data: previousSnapshot } = await supabaseAdmin
        .from("life_snapshots")
        .select("summary, signals")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const snapshot = await analyzeLifeFromEmailsAndCalendar(
        signalEmails,
        relevantEvents,
        previousSnapshot || null
      );

      // Save snapshot
      const { data: savedSnapshot } = await supabaseAdmin
        .from("life_snapshots")
        .insert({
          user_id: user.id,
          summary: snapshot.summary,
          signals: snapshot.signals,
          email_count: signalEmails.length,
          whats_new: snapshot.whats_new || null,
        })
        .select()
        .single();

      // Generate brief content
      const brief = await writeDailyBrief(snapshot);

      // Render email HTML
      const html = renderDailyBriefEmail(
        brief,
        user.name || "friend",
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      );

      // Send via Resend
      await resend.emails.send({
        from: "Arsa <onboarding@resend.dev>",
        to: user.email,
        subject: brief.subject,
        html,
      });

      // Record the brief
      await supabaseAdmin.from("daily_briefs").insert({
        user_id: user.id,
        snapshot_id: savedSnapshot?.id || null,
        subject: brief.subject,
        preview: brief.preview,
        email_html: html,
      });

      // Mark user as sent today
      await supabaseAdmin
        .from("users")
        .update({ last_brief_sent_at: new Date().toISOString() })
        .eq("id", user.id);

      succeeded++;
      console.log(`[cron] Sent brief to ${user.email}`);
    } catch (err: any) {
      failed++;
      console.error(`[cron] Failed for ${user.email}:`, err.message);
      await supabaseAdmin.from("daily_briefs").insert({
        user_id: user.id,
        subject: "ERROR",
        preview: "ERROR",
        error: err.message?.slice(0, 500) || "Unknown error",
      });
    }
  }

  console.log(`[cron] Done. ${succeeded} sent, ${failed} failed`);

  return NextResponse.json({
    succeeded,
    failed,
    total: targetUsers.length,
  });
}