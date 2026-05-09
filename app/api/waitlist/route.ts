import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const why = (body.why || "").trim().slice(0, 500);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Save to Supabase. If email already exists, treat it as success silently.
    const { error: dbError } = await supabaseAdmin
      .from("waitlist")
      .upsert(
        {
          email,
          why: why || null,
          ip_address: ip,
          user_agent: userAgent,
        },
        { onConflict: "email" }
      );

    if (dbError) {
      console.error("[waitlist] Supabase error:", dbError);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // Send notification email to founder.
    // Wrapped in its own try/catch so a Resend failure does not break the user flow.
    try {
      await resend.emails.send({
        from: "Arsa Waitlist <onboarding@resend.dev>",
        to: process.env.NOTIFICATION_EMAIL!,
        subject: `New Arsa waitlist signup: ${email}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
            <div style="background: linear-gradient(135deg, #0A0014 0%, #1a0033 100%); padding: 32px; border-radius: 16px; color: white;">
              <h2 style="margin: 0 0 8px 0; font-weight: 300; font-size: 24px;">New Arsa waitlist signup</h2>
              <p style="color: rgba(216, 180, 254, 0.7); margin: 0 0 24px 0; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;">Someone wants in</p>
              <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                <p style="margin: 0 0 4px 0; color: rgba(255,255,255,0.5); font-size: 12px;">Email</p>
                <p style="margin: 0; font-size: 16px; font-weight: 500;">${email}</p>
              </div>
              ${
                why
                  ? `<div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 20px;">
                      <p style="margin: 0 0 4px 0; color: rgba(255,255,255,0.5); font-size: 12px;">Why they want in</p>
                      <p style="margin: 0; font-size: 14px; line-height: 1.6; font-style: italic;">${why.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
                    </div>`
                  : ""
              }
              <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin: 24px 0 0 0;">Sent from arsaza.com</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("[waitlist] Email send failed:", emailError);
      // Do not fail the request, signup is already saved.
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[waitlist] Error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
