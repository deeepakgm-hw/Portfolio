/**
 * Automated end-to-end API verification test
 */
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.PORT = '3344';

const app = require('./server');
const { notifyNewInquiry } = require('./services/notificationService');

const server = app.listen(3344, async () => {
  console.log('Testing full-stack endpoints on port 3344...\n');

  try {
    // 1. Test Health Endpoint
    console.log('1. Testing GET /api/health');
    const health = await request('/api/health');
    assert(health.status === 200, 'Health endpoint should return 200');
    assert(health.body.status === 'ok', 'Health status should be ok');
    console.log('   ✓ Health check passed');

    // Wait 500ms for DB seed if running first time
    await new Promise(r => setTimeout(r, 600));

    // 2. Test Projects Endpoint
    console.log('2. Testing GET /api/projects');
    const projectsRes = await request('/api/projects');
    assert(projectsRes.status === 200, 'Projects endpoint should return 200');
    assert(Array.isArray(projectsRes.body), 'Projects should be an array');
    assert(projectsRes.body.length >= 3, `Expected at least 3 projects, got ${projectsRes.body.length}`);
    console.log(`   ✓ Found ${projectsRes.body.length} seeded projects: "${projectsRes.body[0].title}"`);

    // 3. Test Contact Submission (Validation failure)
    console.log('3. Testing POST /api/contact validation');
    const invalidContact = await request('/api/contact', 'POST', { name: '', email: 'notanemail', message: '' });
    assert(invalidContact.status === 400, 'Invalid contact should return 400');
    console.log('   ✓ Validation properly rejected empty fields');

    // 4. Test Contact Submission (Valid)
    console.log('4. Testing POST /api/contact valid submission');
    const validContact = await request('/api/contact', 'POST', {
      name: 'Test Reviewer',
      email: 'reviewer@example.com',
      message: 'Impressive full stack conversion!'
    });
    assert(validContact.status === 201, 'Valid contact should return 201');
    assert(validContact.body.success === true, 'Response should confirm success');
    const newMsgId = validContact.body.id;
    console.log(`   ✓ Contact submission succeeded with ID #${newMsgId}`);

    // 5. Test Get Contacts (Admin endpoint)
    console.log('5. Testing GET /api/contact (Inquiries list)');
    const contactsRes = await request('/api/contact');
    assert(contactsRes.status === 200, 'Contact list should return 200');
    const foundMsg = contactsRes.body.find(m => m.id === newMsgId);
    assert(foundMsg !== undefined, 'Newly submitted message should exist in DB');
    console.log(`   ✓ Verified message stored in SQLite database: "${foundMsg.name}: ${foundMsg.message}"`);

    // 6. Test Honeypot Spam Protection
    console.log('6. Testing Honeypot bot protection');
    const botSubmission = await request('/api/contact', 'POST', {
      name: 'Spam Bot 3000',
      email: 'bot@spamnetwork.com',
      message: 'Cheap luxury watches backlinks',
      website: 'http://spam-crawler-trap.com'
    });
    assert(botSubmission.status === 200, 'Honeypot should respond with 200 OK to fool bots');
    assert(botSubmission.body.success === true, 'Honeypot response should indicate success');

    const checkContacts = await request('/api/contact');
    const botMsgInDb = checkContacts.body.find(m => m.name === 'Spam Bot 3000');
    assert(botMsgInDb === undefined, 'Bot submission with honeypot filled MUST NOT be stored in database');
    console.log('   ✓ Honeypot trapped and silently dropped bot submission without polluting database');

    // 7. Test Per-IP Rate Limiting
    console.log('7. Testing Per-IP Rate Limiting');
    const rateLimitIp = '198.51.100.42';
    // Send requests up to quota limit (5 requests)
    for (let i = 1; i <= 5; i++) {
      const res = await request(
        '/api/contact',
        'POST',
        {
          name: `Rate Tester ${i}`,
          email: `ratetester${i}@example.com`,
          message: `Testing rate limit request ${i}`
        },
        true,
        { 'x-forwarded-for': rateLimitIp }
      );
      assert(res.status === 201, `Request ${i} within quota should succeed`);
    }

    // 6th request from the same IP must be rate limited
    const blockedRes = await request(
      '/api/contact',
      'POST',
      {
        name: 'Rate Tester 6',
        email: 'ratetester6@example.com',
        message: 'This request exceeds quota'
      },
      true,
      { 'x-forwarded-for': rateLimitIp }
    );
    assert(blockedRes.status === 429, `6th request should return HTTP 429, got ${blockedRes.status}`);
    assert(blockedRes.body.error.includes('Too many contact requests'), 'Error message should indicate rate limit exceeded');
    assert(blockedRes.headers['retry-after'] !== undefined, 'Response should contain Retry-After header');
    console.log(`   ✓ Rate limiter successfully blocked 6th submission from ${rateLimitIp} with HTTP 429`);

    // 8. Test Notification Alert Service
    console.log('8. Testing Notification Alert Dispatcher');
    const notificationResult = await notifyNewInquiry({
      id: 9999,
      name: 'Notification Test User',
      email: 'alerts@example.com',
      message: 'Automated test of notification alerting system',
      ip: '127.0.0.1'
    });
    assert(typeof notificationResult === 'object', 'Notification result should be an object');
    assert(
      notificationResult.consoleLogged || notificationResult.emailSent || notificationResult.webhookSent,
      'At least one alert transport should have processed the notification'
    );
    console.log('   ✓ Notification alert service verified');

    // 9. Test Static File Serving
    console.log('9. Testing Static client files');
    const indexHtml = await request('/', 'GET', null, false);
    assert(indexHtml.status === 200, 'Index HTML should return 200');
    assert(indexHtml.raw.includes('Software Engineer'), 'Index HTML should contain title text');
    assert(indexHtml.raw.includes('name="website"'), 'Index HTML should contain honeypot input');
    console.log('   ✓ client/index.html served correctly with honeypot field');

    console.log('\n========================================');
    console.log('🎉 ALL AUTOMATED VERIFICATION TESTS PASSED!');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    server.close();
  }
});

function request(path, method = 'GET', data = null, parseJson = true, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3344,
        path,
        method,
        headers: {
          ...(data && {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }),
          ...customHeaders
        }
      },
      res => {
        let raw = '';
        res.on('data', chunk => (raw += chunk));
        res.on('end', () => {
          let body = raw;
          if (parseJson) {
            try {
              body = JSON.parse(raw);
            } catch (e) {}
          }
          resolve({ status: res.statusCode, body, raw, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
