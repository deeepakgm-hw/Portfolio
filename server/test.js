/**
 * Automated end-to-end API verification test
 */
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.PORT = '3344';

const app = require('./server');

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

    // 6. Test Static File Serving
    console.log('6. Testing Static client files');
    const indexHtml = await request('/', 'GET', null, false);
    assert(indexHtml.status === 200, 'Index HTML should return 200');
    assert(indexHtml.raw.includes('Software Engineer'), 'Index HTML should contain title text');
    console.log('   ✓ client/index.html served correctly');

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

function request(path, method = 'GET', data = null, parseJson = true) {
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
          })
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
          resolve({ status: res.statusCode, body, raw });
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
