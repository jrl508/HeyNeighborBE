const { Resend } = require("resend");

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

// Default sender (resend.dev works out of the box for testing)
const FROM_EMAIL = process.env.FROM_EMAIL || "HeyNeighbor <onboarding@resend.dev>";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Send Welcome Email to a newly registered user
 */
const sendWelcomeEmail = async ({ email, firstName }) => {
  if (!resend) {
    console.warn("[emailUtils] RESEND_API_KEY not configured. Skipping welcome email.");
    return null;
  }

  const name = firstName || "Neighbor";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #2d3748; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          .header { background: #2b2b2b; padding: 28px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #3e8ed0; }
          .content { padding: 32px 28px; line-height: 1.6; }
          .button { display: inline-block; background-color: #3e8ed0; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 HeyNeighbor</h1>
          </div>
          <div class="content">
            <h2>Welcome to the neighborhood, ${name}!</h2>
            <p>We're thrilled to have you join <strong>HeyNeighbor</strong>—the community platform where neighbors share, rent, and borrow tools locally.</p>
            <p>Here is how to get started:</p>
            <ul>
              <li><strong>List your tools:</strong> Earn extra income from tools sitting in your shed.</li>
              <li><strong>Borrow nearby:</strong> Find lawnmowers, power drills, and specialized tools right down your street.</li>
              <li><strong>Connect:</strong> Chat securely with verified local neighbors.</li>
            </ul>
            <div style="text-align: center;">
              <a href="${FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <p>If you have any questions, feel free to reach out to support.</p>
            <p>Best regards,<br>The HeyNeighbor Team</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} HeyNeighbor. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Welcome to HeyNeighbor! 🤝",
      html,
    });
    console.log("[emailUtils] Welcome email sent:", data);
    return data;
  } catch (error) {
    console.error("[emailUtils] Error sending welcome email:", error);
    return null;
  }
};

/**
 * Send Password Reset Email with a secure token link
 */
const sendPasswordResetEmail = async ({ email, firstName, resetToken }) => {
  if (!resend) {
    console.warn("[emailUtils] RESEND_API_KEY not configured. Skipping password reset email.");
    return null;
  }

  const name = firstName || "Neighbor";
  const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #2d3748; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
          .header { background: #2b2b2b; padding: 28px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #3e8ed0; }
          .content { padding: 32px 28px; line-height: 1.6; }
          .button { display: inline-block; background-color: #3e8ed0; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }
          .warning { font-size: 13px; color: #718096; background: #edf2f7; padding: 12px; border-radius: 6px; margin-top: 16px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 HeyNeighbor</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your <strong>HeyNeighbor</strong> account.</p>
            <p>Click the button below to choose a new password. This link will expire in <strong>1 hour</strong> for security reasons:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #4a5568;">Or copy and paste this URL into your web browser:<br><a href="${resetLink}" style="color: #3e8ed0;">${resetLink}</a></p>
            <div class="warning">
              If you did not request a password reset, please ignore this email or contact support if you have concerns about your account security.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} HeyNeighbor. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Reset your HeyNeighbor Password 🔑",
      html,
    });
    console.log("[emailUtils] Password reset email sent:", data);
    return data;
  } catch (error) {
    console.error("[emailUtils] Error sending password reset email:", error);
    return null;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
};
