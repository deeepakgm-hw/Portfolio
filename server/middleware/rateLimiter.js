/**
 * In-memory sliding window rate limiter per IP.
 * Protects endpoints from automated flooding without requiring external caching stores.
 */

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 mins default
  const max = options.max || parseInt(process.env.RATE_LIMIT_MAX, 10) || 5; // 5 requests default
  const message = options.message || 'Too many contact requests from this IP. Please wait a few minutes before trying again.';

  // Map: ip -> { count: number, resetTime: number }
  const clients = new Map();

  // Periodic cleanup every 5 minutes to avoid memory leaks
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      if (now > record.resetTime) {
        clients.delete(ip);
      }
    }
  }, Math.min(windowMs, 5 * 60 * 1000));

  // Ensure timer does not prevent process exit (useful for tests)
  if (interval.unref) {
    interval.unref();
  }

  return function rateLimiter(req, res, next) {
    // In test environment, allow bypassing with a special header if needed
    if (process.env.NODE_ENV === 'test' && req.headers['x-bypass-rate-limit']) {
      return next();
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let client = clients.get(ip);

    if (!client || now > client.resetTime) {
      client = {
        count: 1,
        resetTime: now + windowMs
      };
      clients.set(ip, client);
    } else {
      client.count += 1;
    }

    const remaining = Math.max(0, max - client.count);
    const resetSeconds = Math.ceil((client.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(client.resetTime / 1000));

    if (client.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        error: message,
        retryAfter: resetSeconds
      });
    }

    next();
  };
}

const contactRateLimiter = createRateLimiter();

module.exports = {
  createRateLimiter,
  contactRateLimiter
};
