/**
 * Comprehensive API Test Suite
 * Validates all endpoints, role constraints, and features.
 */

const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const opts = { ...options, path: encodeURI(options.path) };
    const req = http.request(opts, (res) => {
      let body = '';
      const isBuffer = options.responseType === 'buffer';
      if (isBuffer) {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) });
        });
        return;
      }
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING INSEC API VERIFICATION SUITE ---');

  // 1. Health check
  console.log('1. Testing /api/health...');
  const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log(`   Status: ${health.status}, System: ${health.body.system}`);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Editor Login
  console.log('2. Testing Editor Login...');
  const editorLogin = await request(
    { host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'editor@insec.org.np', password: 'Editor@12345' }
  );
  console.log(`   Status: ${editorLogin.status}, Role: ${editorLogin.body.user?.role}`);
  const editorToken = editorLogin.body.token;
  if (!editorToken) throw new Error('Editor login failed');

  // 3. Admin Login
  console.log('3. Testing Admin Login...');
  const adminLogin = await request(
    { host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'admin@insec.org.np', password: 'Admin@12345' }
  );
  console.log(`   Status: ${adminLogin.status}, Role: ${adminLogin.body.user?.role}`);
  const adminToken = adminLogin.body.token;
  if (!adminToken) throw new Error('Admin login failed');

  // 4. Public Incident Submission
  console.log('4. Testing Public Incident Submission...');
  const publicSubmission = await request(
    { host: 'localhost', port: 5000, path: '/api/public/submit', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    {
      district: 'मकवानपुर',
      municipality: 'हेटौंडा उपमहानगरपालिका',
      ward_number: 4,
      location: 'राप्ती खोला किनार',
      collection_date: '२०८१-०६-१६',
      full_name: 'हरिमाया पुलामी',
      age: 34,
      gender: 'female',
      family_contact: 'राजेश पुलामी (पति)',
      phone: '9845001122',
      incident_type: 'injured',
      incident_location: 'राप्ती पुल नजिक',
      incident_description: 'बाढीको कटान नियन्त्रण गर्न बालुवाको बोरा राख्दा चिप्लिएर हात भाँचिएको।',
      injury_type: 'दाहिने हात भाँचिएको (Fracture)',
      treatment_location: 'हेटौंडा अस्पताल',
      current_condition: 'under_treatment',
      is_woman: true,
      is_pregnant: false,
    }
  );
  console.log(`   Status: ${publicSubmission.status}, Record Code: ${publicSubmission.body.record_code}, ID: ${publicSubmission.body.record_id}`);
  const testRecordId = publicSubmission.body.record_id;
  if (!testRecordId) throw new Error('Public submission failed');

  // 5. Get Records with Editor Token
  console.log('5. Testing GET /api/records with Editor Token...');
  const recordsRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/records?search=हरिमाया',
    method: 'GET',
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  console.log(`   Status: ${recordsRes.status}, Total Found: ${recordsRes.body.pagination?.total}`);
  if (recordsRes.status !== 200 || recordsRes.body.pagination?.total < 1) throw new Error('Failed to find submitted record');

  // 6. Role Protection: Editor attempting Excel export (Forbidden)
  console.log('6. Testing Editor Excel Export (Should be 403 Forbidden)...');
  const editorExport = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/records/export',
    method: 'GET',
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  console.log(`   Status: ${editorExport.status} (Expected 403)`);
  if (editorExport.status !== 403) throw new Error('Editor should not be allowed to export Excel');

  // 7. Role Protection: Admin Excel export (Success)
  console.log('7. Testing Admin Excel Export (Should be 200 OK with XLSX bytes)...');
  const adminExport = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/records/export',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
    responseType: 'buffer',
  });
  console.log(`   Status: ${adminExport.status}, Content-Type: ${adminExport.headers['content-type']}, Size: ${adminExport.body.length} bytes`);
  if (adminExport.status !== 200 || !adminExport.headers['content-type']?.includes('spreadsheetml')) {
    throw new Error('Admin export failed');
  }

  // 8. Stats Endpoint
  console.log('8. Testing GET /api/dashboard/stats...');
  const statsRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/dashboard/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  console.log(`   Status: ${statsRes.status}, Total Records: ${statsRes.body.stats?.total_records}, Total Injured: ${statsRes.body.stats?.total_injured}`);
  if (statsRes.status !== 200 || !statsRes.body.stats) throw new Error('Stats endpoint failed');

  // 9. Role Protection: Editor attempting DELETE (Forbidden)
  console.log('9. Testing Editor DELETE (Should be 403 Forbidden)...');
  const editorDelete = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/records/${testRecordId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  console.log(`   Status: ${editorDelete.status} (Expected 403)`);
  if (editorDelete.status !== 403) throw new Error('Editor should not be allowed to delete');

  // 10. Admin DELETE (Success)
  console.log('10. Testing Admin DELETE (Should be 200 OK)...');
  const adminDelete = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/records/${testRecordId}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`   Status: ${adminDelete.status}, Message: ${adminDelete.body.message}`);
  if (adminDelete.status !== 200) throw new Error('Admin delete failed');

  // 11. Role Protection: User management (Editor Forbidden, Admin Allowed)
  console.log('11. Testing User Management Access...');
  const editorUsers = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  console.log(`   Editor /api/users Status: ${editorUsers.status} (Expected 403)`);
  if (editorUsers.status !== 403) throw new Error('Editor should not access /api/users');

  const adminUsers = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`   Admin /api/users Status: ${adminUsers.status}, User count: ${adminUsers.body.data?.length}`);
  if (adminUsers.status !== 200 || adminUsers.body.data?.length < 2) throw new Error('Admin user list failed');

  console.log('🎉 ALL BACKEND API TESTS PASSED WITH 100% SUCCESS!');
}

module.exports = { runTests };

if (require.main === module) {
  runTests().catch((err) => {
    console.error('❌ Verification test failed:', err);
    process.exit(1);
  });
}
