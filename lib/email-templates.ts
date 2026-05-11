import type { DailyBriefContent } from "./daily-brief";

const urgencyBadge = {
  high: { bg: "#3a1414", border: "#5a2020", text: "#fca5a5" },
  medium: { bg: "#3a2a0a", border: "#5a4214", text: "#fcd34d" },
  low: { bg: "#1a1a1f", border: "#2a2a30", text: "#9ca3af" },
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
            <td class="signal-card" style="background-color: #14111f; border: 1px solid #2a2438; border-radius: 14px; padding: 18px;">
              <div style="margin-bottom: 8px; line-height: 1.8;">
                <span style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #c4a5e8; font-weight: 600;">${s.category}</span>
                <span style="display: inline-block; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; padding: 3px 9px; margin-left: 8px; border-radius: 999px; background-color: ${u.bg}; border: 1px solid ${u.border}; color: ${u.text}; font-weight: 600;">${s.urgency}</span>
                ${s.people && s.people.length > 0 ? `<span style="font-size: 10px; color: #8a8194; margin-left: 8px;">${s.people.join(", ")}</span>` : ""}
              </div>
              <div class="signal-title" style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 6px; line-height: 1.35;">${escapeHtml(s.title)}</div>
              <div class="signal-desc" style="font-size: 14px; color: #b8b0c5; line-height: 1.55;">${escapeHtml(s.description)}</div>
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
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; min-width: 100% !important; background-color: #050008 !important; }
    table { border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; }

    /* Force readable text colors on every mobile client */
    .headline { color: #ffffff !important; }
    .body-text { color: #d4ccdf !important; }
    .signal-title { color: #ffffff !important; }
    .signal-desc { color: #b8b0c5 !important; }
    .question-text { color: #ffffff !important; }
    .section-label { color: #c4a5e8 !important; }
    .date-label { color: #8a8194 !important; }
    .footer-text { color: #6e6680 !important; }

    @media only screen and (max-width: 600px) {
      .wrapper { width: 100% !important; padding: 12px 8px !important; }
      .card-padding { padding: 22px 18px !important; }
      .headline { font-size: 22px !important; line-height: 1.3 !important; }
      .body-text { font-size: 15px !important; line-height: 1.65 !important; }
      .section-label { font-size: 10px !important; letter-spacing: 0.25em !important; }
      .signal-title { font-size: 15px !important; }
      .signal-desc { font-size: 13px !important; }
      .question-text { font-size: 15px !important; line-height: 1.5 !important; }
      .cta-button { padding: 14px 28px !important; font-size: 14px !important; }
      .date-label { font-size: 10px !important; }
      .footer-text { font-size: 10px !important; }
      .header-date-cell { text-align: left !important; padding-top: 8px !important; padding-left: 38px !important; display: block !important; width: 100% !important; }
      .header-brand-cell { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #050008; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #050008;">
    <tr>
      <td align="center" class="wrapper" style="padding: 32px 20px; background-color: #050008;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%;">
          <tr>
            <td class="card-padding" style="background-color: #0d0518; border: 1px solid #2a1f3d; border-radius: 24px; padding: 36px 28px;">

              <!-- Header -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 28px;">
                <tr>
                  <td valign="middle" class="header-brand-cell" style="vertical-align: middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="width: 32px; vertical-align: middle;">
                          <div style="width: 24px; height: 24px; border-radius: 50%; background-color: #a855f7;">&nbsp;</div>
                        </td>
                        <td valign="middle" style="padding-left: 14px; vertical-align: middle;">
                          <span style="font-size: 16px; font-weight: 600; letter-spacing: -0.01em; color: #ffffff;">Arsa</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="middle" align="right" class="header-date-cell" style="vertical-align: middle; text-align: right;">
                    <span class="date-label" style="font-size: 11px; color: #8a8194; letter-spacing: 0.05em;">${dateLabel}</span>
                  </td>
                </tr>
              </table>

              <!-- Label -->
              <p class="section-label" style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #c4a5e8; font-weight: 600; margin: 0 0 14px 0;">Your morning brief, ${escapeHtml(firstName)}</p>

              <!-- Headline -->
              <h1 class="headline" style="font-size: 24px; font-weight: 500; line-height: 1.3; margin: 0 0 20px 0; color: #ffffff;">
                ${escapeHtml(brief.headline)}
              </h1>

              <!-- Body paragraph -->
              <p class="body-text" style="font-size: 15px; line-height: 1.7; color: #d4ccdf; margin: 0 0 36px 0;">
                ${escapeHtml(brief.body_paragraph)}
              </p>

              <!-- Signals header -->
              <p class="section-label" style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #c4a5e8; font-weight: 600; margin: 32px 0 14px 0;">Top signals</p>

              <!-- Signals -->
              ${signalsHtml}

              <!-- Closing question -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="padding: 20px; background-color: #1a0f2e; border-left: 3px solid #a855f7; border-radius: 0 12px 12px 0;">
                    <p class="section-label" style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #c4a5e8; font-weight: 600; margin: 0 0 8px 0;">A question for you</p>
                    <p class="question-text" style="font-size: 16px; line-height: 1.5; color: #ffffff; margin: 0; font-style: italic;">${escapeHtml(brief.closing_question)}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 36px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" target="_blank" rel="noopener" class="cta-button" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 30px; border-radius: 999px; text-decoration: none; font-size: 14px; font-weight: 600; mso-padding-alt: 0;">
                      <span style="color: #000000; font-weight: 600;">See your full picture</span>
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 36px; border-top: 1px solid #1f1830;">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <p class="footer-text" style="font-size: 11px; color: #6e6680; margin: 0;">Arsa is paying attention so you do not have to.</p>
                    <p class="footer-text" style="font-size: 10px; color: #4d4659; margin: 8px 0 0 0;">Want to pause briefs? Sign in and adjust in settings.</p>
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