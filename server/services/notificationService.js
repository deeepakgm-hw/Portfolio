/**
 * Notification Service for incoming contact submissions.
 * Dispatches alerts via Email (SMTP/nodemailer), Webhooks (Discord/Slack/custom),
 * or structured Console logging.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  // Nodemailer will be loaded if installed
}

/**
 * Dispatch notification alert for a new contact form submission.
 * This runs asynchronously and never throws uncaught errors to caller.
 */
async function notifyNewInquiry(inquiry = {}) {
  const { name, email, message, id, ip = 'Unknown', createdAt = new Date().toISOString() } = inquiry;
  const results = { emailSent: false, webhookSent: false, consoleLogged: false };

  // 1. Webhook Alert (Discord, Slack, or Generic HTTP Webhook)
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await sendWebhookNotification(webhookUrl, { name, email, message, id, ip, createdAt });
      results.webhookSent = true;
    } catch (err) {
      console.error('[NotificationService] Webhook alert failed:', err.message);
    }
  }

  // 2. SMTP Email Alert (Nodemailer)
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const alertTo = process.env.ALERT_EMAIL_TO || 'deeeepakgm@gmail.com';

  if (nodemailer && smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const mailOptions = {
        from: process.env.ALERT_EMAIL_FROM || `"Portfolio Bot" <${smtpUser}>`,
        to: alertTo,
        replyTo: email,
        subject: `New Portfolio Inquiry from ${name} (#${id || 'new'})`,
        text: `You have received a new inquiry from your portfolio website:

Name: ${name}
Email: ${email}
Time: ${createdAt}
IP Address: ${ip}

Message:
${message}
`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 6px;">
            <h2 style="color: #6c5ce7; margin-top: 0;">New Portfolio Inquiry</h2>
            <p><strong>From:</strong> ${escapeHtml(name)} (<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>)</p>
            <p><strong>Date / Time:</strong> ${escapeHtml(createdAt)}</p>
            <p><strong>Client IP:</strong> ${escapeHtml(ip)}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
            <div style="background: #f9f9f9; padding: 14px; border-radius: 4px; border-left: 4px solid #6c5ce7;">
              <p style="white-space: pre-wrap; margin: 0; color: #2d3436; font-size: 15px; line-height: 1.6;">${escapeHtml(message)}</p>
            </div>
            <p style="font-size: 12px; color: #888; margin-top: 20px;">Hit "Reply" in your email client to respond directly to ${escapeHtml(email)}.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      results.emailSent = true;
      console.log(`[NotificationService] Email alert sent to ${alertTo}`);
    } catch (err) {
      console.error('[NotificationService] SMTP email alert failed:', err.message);
    }
  }

  // 3. Fallback / Console Alert
  // If neither transport was configured, log a high-visibility alert banner to server console
  if (!results.emailSent && !results.webhookSent) {
    console.log('\n' + '='.repeat(54));
    console.log('📬 NEW PORTFOLIO CONTACT INQUIRY RECEIVED');
    console.log('='.repeat(54));
    console.log(`• ID:      #${id || 'N/A'}`);
    console.log(`• From:    ${name} <${email}>`);
    console.log(`• Time:    ${createdAt}`);
    console.log(`• IP:      ${ip}`);
    console.log(`• Message:\n${message}`);
    console.log('='.repeat(54) + '\n');
    results.consoleLogged = true;
  }

  return results;
}

/**
 * Send payload to Discord, Slack, or generic JSON webhook URL.
 */
function sendWebhookNotification(urlString, { name, email, message, id, ip, createdAt }) {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(urlString);
      const isDiscord = url.hostname.includes('discord.com');
      const isSlack = url.hostname.includes('slack.com');

      let payload = {};

      if (isDiscord) {
        payload = {
          username: 'Portfolio Inquiry Bot',
          embeds: [
            {
              title: `New Inquiry from ${name}`,
              color: 0x6c5ce7,
              fields: [
                { name: 'Email', value: email, inline: true },
                { name: 'ID', value: `#${id || 'N/A'}`, inline: true },
                { name: 'IP', value: ip, inline: true },
                { name: 'Message', value: message.length > 1000 ? message.slice(0, 997) + '...' : message }
              ],
              timestamp: new Date().toISOString()
            }
          ]
        };
      } else if (isSlack) {
        payload = {
          text: `*New Portfolio Inquiry from ${name}* (<mailto:${email}|${email}>):\n>${message.replace(/\n/g, '\n>')}`
        };
      } else {
        // Generic Webhook
        payload = {
          event: 'contact.submission',
          id,
          name,
          email,
          message,
          ip,
          createdAt
        };
      }

      const postData = JSON.stringify(payload);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(
        {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        },
        res => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Webhook responded with status ${res.statusCode}`));
          }
        }
      );

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy(new Error('Webhook request timed out'));
      });

      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  notifyNewInquiry,
  sendWebhookNotification
};
