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
            <td class="signal-card" style="background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px;">
              <div style="margin-bottom: 8px; line-height: 1.8;">
                <span style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #d8b4fe;">${s.category}</span>
                <span style="display: inline-block; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; padding: 3px 9px; margin-left: 8px; border-radius: 999px; background: ${u.bg}; border: 1px solid ${u.border}; color: ${u.text};">${s.urgency}</span>
                ${s.people && s.people.length > 0 ? `<span style="font-size: 10px; color: rgba(255,255,255,0.45); margin-left: 8px;">${s.people.join(", ")}</span>` : ""}
              </div>
              <div class="signal-title" style="font-size: 16px; font-weight: 500; color: #ffffff; margin-bottom: 6px; line-height: 1.35;">${escapeHtml(s.title)}</div>
              <div class="signal-desc" style="font-size: 14px; color: rgba(255,255,255,0.65); line-height: 1.55;">${escapeHtml(s.description)}</div>
            </td>
          </tr>
        </table>
      `;
    })
    .join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Arsa daily brief</title>
  <style type="text/css">
    /* Reset for mobile email clients */
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; }
    table { border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; }

    /* Force dark background everywhere */
    body, .body-bg { background-color: #050008 !important; }

    /* Mobile-specific overrides */
    @media only screen and (max-width: 600px) {
      .wrapper { width: 100% !important; padding: 16px 12px !important; }
      .card-padding { padding: 24px 18px !important; }
      .headline { font-size: 22px !important; line-height: 1.3 !important; }
      .body-text { font-size: 15px !important; line-height: 1.65 !important; }
      .section-label { font-size: 10px !important; letter-spacing: 0.25em !important; }
      .signal-title { font-size: 15px !important; }
      .signal-desc { font-size: 13px !important; }
      .question-text { font-size: 15px !important; line-height: 1.5 !important; }
      .cta-button { padding: 14px 28px !important; font-size: 14px !important; }
      .date-label { font-size: 10px !important; }
      .footer-text { font-size: 10px !important; }

      /* Stack the header on mobile so date drops below */
      .header-table { display: block !important; }
      .header-cell { display: block !important; width: 100% !important; padding: 0 !important; }
      .header-date-cell { text-align: left !important; padding-top: 6px !important; padding-left: 38px !important; }
    }
  </style>
</head>
<body class="body-bg" style="margin: 0; padding: 0; background-color: #050008; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="body-bg" style="background-color: #050008;">
    <tr>
      <td align="center" class="wrapper" style="padding: 32px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
          <tr>
            <td class="card-padding" style="background: linear-gradient(135deg, #0A0014 0%, #1a0033 100%); background-color: #0A0014; border: 1px solid rgba(168, 85, 247, 0.15); border-radius: 24px; padding: 36px 28px;">

              <!-- Header -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="header-table" style="margin-bottom: 32px;">
                <tr>
                  <td valign="middle" class="header-cell" style="vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="width: 32px; vertical-align: middle;">
                          <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #c084fc 0%, #7e22ce 100%); background-color: #a855f7;"></div>
                        </td>
                        <td valign="middle" style="padding-left: 14px; vertical-align: middle;">
                          <span style="font-size: 16px; font-weight: 500; letter-spacing: -0.01em; color: #ffffff;">Arsa</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" align="right" class="header-date-cell" style="vertical-align: middle; text-align: right;">
                    <span class="date-label" style="font-size: 11px; color: rgba(255,255,255,0.5); letter-spacing: 0.05em;">${dateLabel}</span>
                  </td>
                </tr>
              </table>

              <!-- Label -->
              <p class="section-label" style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #d8b4fe; margin: 0 0 14px 0;">Your morning brief, ${escapeHtml(firstName)}</p>

              <!-- Headline -->
              <h1 class="headline" style="font-size: 24px; font-weight: 300; line-height: 1.3; margin: 0 0 20px 0; color: #ffffff;">
                ${escapeHtml(brief.headline)}
              </h1>

              <!-- Body paragraph -->
              <p class="body-text" style="font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.7); margin: 0 0 36px 0;">
                ${escapeHtml(brief.body_paragraph)}
              </p>

              <!-- Signals header -->
              <p class="section-label" style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #d8b4fe; margin: 32px 0 14px 0;">Top signals</p>

              <!-- Signals -->
              ${signalsHtml}

              <!-- Closing question -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="padding: 20px; background: rgba(168, 85, 247, 0.06); border-left: 2px solid rgba(168, 85, 247, 0.4); border-radius: 0 12px 12px 0;">
                    <p class="section-label" style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #d8b4fe; margin: 0 0 8px 0;">A question for you</p>
                    <p class="question-text" style="font-size: 16px; line-height: 1.5; color: rgba(255,255,255,0.9); margin: 0; font-style: italic;">${escapeHtml(brief.closing_question)}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 36px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" rel="noopener" class="cta-button" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 30px; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 500; mso-padding-alt: 0;">
                      <span style="color: #000000;">See your full picture</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 36px; border-top: 1px solid rgba(255,255,255,0.06);">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <p class="footer-text" style="font-size: 11px; color: rgba(255,255,255,0.4); margin: 0;">Arsa is paying attention so you do not have to.</p>
                    <p class="footer-text" style="font-size: 10px; color: rgba(255,255,255,0.25); margin: 8px 0 0 0;">Want to pause briefs? Sign in and adjust in settings.</p>
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