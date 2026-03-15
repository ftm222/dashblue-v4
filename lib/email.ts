import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resendClient = new Resend(key);
  return resendClient;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "Dashblue <noreply@dashblue.com>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[Email] Resend not configured, skipping email send");
    return { success: false, error: "Email service not configured" };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Email] Send failed:", message);
    return { success: false, error: message };
  }
}

export function inviteEmailHTML(params: { inviterName: string; orgName: string; inviteUrl: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e40af; margin: 0;">Dashblue</h1>
      </div>
      <p>Olá!</p>
      <p><strong>${params.inviterName}</strong> convidou você para fazer parte de <strong>${params.orgName}</strong> no Dashblue.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Aceitar Convite
        </a>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Se você não esperava este convite, pode ignorar este email.</p>
    </body>
    </html>
  `;
}

export function welcomeEmailHTML(params: { userName: string; loginUrl: string }): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e40af; margin: 0;">Dashblue</h1>
      </div>
      <p>Olá, <strong>${params.userName}</strong>!</p>
      <p>Bem-vindo ao Dashblue — sua torre de controle para analytics B2B.</p>
      <p>Próximos passos:</p>
      <ol>
        <li>Conecte seu CRM (Kommo, HubSpot ou Pipedrive)</li>
        <li>Mapeie as etapas do funil</li>
        <li>Cadastre sua equipe</li>
        <li>Defina as metas do período</li>
      </ol>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Acessar Dashboard
        </a>
      </div>
    </body>
    </html>
  `;
}

export function alertEmailHTML(params: { alertType: string; message: string; dashboardUrl: string }): string {
  const colors: Record<string, string> = {
    critical: "#dc2626",
    warning: "#f59e0b",
    info: "#2563eb",
  };
  const color = colors[params.alertType] || colors.info;

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e40af; margin: 0;">Dashblue</h1>
      </div>
      <div style="border-left: 4px solid ${color}; padding: 12px 16px; background-color: #f9fafb; border-radius: 4px;">
        <p style="margin: 0; font-weight: 600; text-transform: uppercase; font-size: 12px; color: ${color};">
          ${params.alertType}
        </p>
        <p style="margin: 8px 0 0;">${params.message}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.dashboardUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Ver no Dashboard
        </a>
      </div>
    </body>
    </html>
  `;
}
