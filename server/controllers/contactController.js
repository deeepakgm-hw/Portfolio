const { query } = require('../config/db');
const { notifyNewInquiry } = require('../services/notificationService');

exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, message, website } = req.body;

    // 1. Honeypot check: Bots automatically fill hidden 'website' fields
    if (website && typeof website === 'string' && website.trim().length > 0) {
      const forwarded = req.headers['x-forwarded-for'];
      const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.ip || req.connection?.remoteAddress || 'unknown';
      console.warn(`[Spam Mitigation] Honeypot triggered from IP: ${clientIp}. Silently dropping submission.`);

      // Return synthetic success so bot assumes submission succeeded and terminates attempts
      return res.status(200).json({
        success: true,
        message: 'Inquiry received successfully'
      });
    }

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are all required' });
    }

    // Basic email regex format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    const result = await query.run(
      'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
      [cleanName, cleanEmail, cleanMessage]
    );

    // 2. Dispatch non-blocking notification alerts (Email / Webhook / Console)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.ip || req.connection?.remoteAddress || 'unknown';

    notifyNewInquiry({
      id: result.id,
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      ip: clientIp,
      createdAt: new Date().toISOString()
    }).catch(err => {
      console.error('[NotificationService] Unhandled dispatch failure:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully',
      id: result.id
    });
  } catch (err) {
    next(err);
  }
};

exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await query.all('SELECT * FROM contacts ORDER BY created_at DESC');
    res.json(contacts);
  } catch (err) {
    next(err);
  }
};

exports.deleteContact = async (req, res, next) => {
  try {
    const result = await query.run('DELETE FROM contacts WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contact message not found' });
    }
    res.json({ message: 'Contact message deleted successfully' });
  } catch (err) {
    next(err);
  }
};
