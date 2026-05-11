import type { DailyBriefContent } from "./daily-brief";

const urgencyBadge = {
  high: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", text: "#fca5a5" },
  medium: { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)", text: "#fcd34d" },
  low: { bg: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.1)", text: "rgba(255, 255, 255, 0.6)" },
};

export function renderDailyBriefEmail(
  brief: DailyBriefContent,
  userName: string,
  dashboardUrl: string
): string {
  const firstName = userName.split(" ")[0] || "friend";
  const dateLabel = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const signalsHtml = brief.top_signals
    .map((s) => {
      const u = urgencyBadge[s.urgency] || urgencyBadge.low;
      return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 10px;">
          <tr>
            <td style="background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px;">
              <div style="margin-bottom: 8px; font-size: 0;">
                <span style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #d8b4fe; margin-right: 10px;">${s.category}</span>
                <span style="font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; padding: 3px 9px; border-radius: 999px; background: ${u.bg}; border: 1px solid ${u.border}; color: ${u.text};">${s.urgency}</span>
                ${s.people && s.people.length > 0 ? `<span style="font-size: 10px; color: rgba(255,255,255,0.45); margin-left: 10px;">${s.people.join(", ")}</span>` : ""}
              </div>
              <div style="font-size: 16px; font-weight: 500; color: #ffffff; margin-bottom: 6px; line-height: 1.35;">${escapeHtml(s.title)}</div>
              <div style="font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.55;">${escapeHtml(s.description)}</div>
            </td>
          </tr>
        </table>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Arsa daily brief</title>
</head>
<body style="margin: 0; padding: 0; background: #050008; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #050008;">
    <tr>
      <td align="center" style="padding: 32px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
          <tr>
            <td style="background: linear-gradient(135deg, #0A0014 0%, #1a0033 100%); border: 1px solid rgba(168, 85, 247, 0.15); border-radius: 24px; padding: 36px 28px;">

              <!-- Header -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td valign="middle" style="width: 32px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #c084fc 0%, #7e22ce 100%);"></div>
                  </td>
                  <td valign="middle" style="padding-left: 14px;">
                    <span style="font-size: 16px; font-weight: 500; letter-spacing: -0.01em; color: #ffffff;">Arsa</span>
                  </td>
                  <td valign="middle" align="right">
                    <span style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 0.05em;">${dateLabel}</span>
                  </td>
                </tr>
              </table>

              <!-- Label -->
              <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #d8b4fe; margin: 0 0 14px 0;">Your morning brief, ${escapeHtml(firstName)}</p>

              <!-- Headline -->
              <h1 style="font-size: 24px; font-weight: 300; line-height: 1.3; margin: 0 0 20px 0; color: #ffffff;">
                ${escapeHtml(brief.headline)}
              </h1>

              <!-- Body paragraph -->
              <p style="font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.7); margin: 0 0 36px 0;">
                ${escapeHtml(brief.body_paragraph)}
              </p>

              <!-- Signals header -->
              <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #d8b4fe; margin: 32px 0 14px 0;">Top signals</p>

              <!-- Signals -->
              ${signalsHtml}

              <!-- Closing question -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="padding: 20px; background: rgba(168, 85, 247, 0.06); border-left: 2px solid rgba(168, 85, 247, 0.4); border-radius: 0 12px 12px 0;">
                    <p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #d8b4fe; margin: 0 0 8px 0;">A question for you</p>
                    <p style="font-size: 16px; line-height: 1.5; color: rgba(255,255,255,0.9); margin: 0; font-style: italic;">${escapeHtml(brief.closing_question)}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 36px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" rel="noopener" style="display: inline-block; background: #ffffff; color: #000000; padding: 14px 30px; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 500;">
                      <span style="color: #000000;">See your full picture</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 36px; border-top: 1px solid rgba(255,255,255,0.06);">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <p style="font-size: 11px; color: rgba(255,255,255,0.4); margin: 0;">Arsa is paying attention so you do not have to.</p>
                    <p style="font-size: 10px; color: rgba(255,255,255,0.25); margin: 8px 0 0 0;">Want to pause briefs? Sign in and adjust in settings.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}