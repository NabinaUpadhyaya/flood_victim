/**
 * End-to-End HTTP Test for Photo Upload & Excel Export
 */

process.env.NODE_ENV = 'test';

const http = require('http');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const app = require('./src/server');
const pool = require('./src/config/db');
const { signToken } = require('./src/config/jwt');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function makeMultipartBody(fields, file) {
  const boundary = `----WebKitFormBoundary${Date.now()}`;
  const crlf = '\r\n';
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}${crlf}Content-Disposition: form-data; name="${key}"${crlf}${crlf}${val}${crlf}`));
  }

  if (file) {
    parts.push(Buffer.from(`--${boundary}${crlf}Content-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"${crlf}Content-Type: ${file.mimetype}${crlf}${crlf}`));
    parts.push(file.content);
    parts.push(Buffer.from(crlf));
  }

  parts.push(Buffer.from(`--${boundary}--${crlf}`));
  const body = Buffer.concat(parts);
  const contentType = `multipart/form-data; boundary=${boundary}`;
  return { body, contentType };
}

function httpRequest(options, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const reqHeaders = { ...headers };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body);
    }
    const req = http.request({
      ...options,
      headers: reqHeaders,
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const rawBuffer = Buffer.concat(chunks);
        let parsed = null;
        try {
          parsed = JSON.parse(rawBuffer.toString('utf8'));
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBuffer,
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function runHttpTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING HTTP API TESTS FOR PHOTO UPLOAD & EXCEL EXPORT');
  console.log('=============================================================\n');

  // Start temporary HTTP server on port 5055 to test live HTTP endpoints
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5055, resolve));
  console.log('Test HTTP server listening on port 5055');

  try {
    // Generate auth tokens for Admin and Editor
    const [adminUser] = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    const admin = adminUser[0];
    const adminToken = signToken({ id: admin.id, email: admin.email, role: admin.role, name: admin.name });

    const [editorUser] = await pool.query("SELECT * FROM users WHERE role = 'editor' LIMIT 1");
    const editor = editorUser[0];
    const editorToken = signToken({ id: editor.id, email: editor.email, role: editor.role, name: editor.name });

    // -------------------------------------------------------------------------
    // TEST 1: Reject Invalid Photo Format (e.g. .txt or .pdf)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Reject Invalid Photo Format ---');
    const invalidFile = {
      fieldname: 'photo',
      filename: 'document.pdf',
      mimetype: 'application/pdf',
      content: Buffer.from('%PDF-1.4 test invalid file'),
    };
    const { body: invalidBody, contentType: invalidCT } = makeMultipartBody({}, invalidFile);

    const invalidUploadRes = await httpRequest(
      { host: 'localhost', port: 5055, path: '/api/records/upload-photo', method: 'POST' },
      invalidBody,
      { 'Content-Type': invalidCT, Authorization: `Bearer ${editorToken}` }
    );

    assert(invalidUploadRes.statusCode === 400, `Invalid file type returned status ${invalidUploadRes.statusCode} (Expected 400)`);
    assert(invalidUploadRes.body && invalidUploadRes.body.message.includes('JPEG'), 'Clear error message indicating JPEG/JPG/PNG only');

    // -------------------------------------------------------------------------
    // TEST 2: Valid Photo Upload (JPG / PNG)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Valid Photo Upload via /api/records/upload-photo ---');
    const validJpegBytes = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
      0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
      0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
      0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
      0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
      0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
      0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
      0x00, 0xbf, 0x80, 0xff, 0xd9
    ]);

    const validFile = {
      fieldname: 'photo',
      filename: 'victim_avatar.jpg',
      mimetype: 'image/jpeg',
      content: validJpegBytes,
    };
    const { body: validBody, contentType: validCT } = makeMultipartBody({}, validFile);

    const validUploadRes = await httpRequest(
      { host: 'localhost', port: 5055, path: '/api/records/upload-photo', method: 'POST' },
      validBody,
      { 'Content-Type': validCT, Authorization: `Bearer ${editorToken}` }
    );

    assert(validUploadRes.statusCode === 200, `Upload returned status ${validUploadRes.statusCode}`);
    assert(validUploadRes.body && validUploadRes.body.success === true, 'Upload returned success: true');
    assert(validUploadRes.body && validUploadRes.body.photo_path.includes('/uploads/victims/') && validUploadRes.body.photo_path.startsWith('http://localhost:5055'), `Returned full photo_path with domain: ${validUploadRes.body?.photo_path}`);

    const uploadedPhotoPath = validUploadRes.body.photo_path;

    // Verify static serving of uploaded photo
    const photoPathname = new URL(uploadedPhotoPath).pathname;
    const staticRes = await httpRequest(
      { host: 'localhost', port: 5055, path: photoPathname, method: 'GET' }
    );
    assert(staticRes.statusCode === 200, `Static image accessible at ${uploadedPhotoPath} with status 200`);
    assert(staticRes.headers['content-type']?.includes('image/jpeg'), `Content-Type is image/jpeg: ${staticRes.headers['content-type']}`);

    // -------------------------------------------------------------------------
    // TEST 3: Create Incident Record with Uploaded Photo (Logged in as Editor)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Create Incident Record with Photo (Editor Submitter) ---');
    const recordPayload = {
      district: 'सिन्धुपाल्चोक',
      municipality: 'मेलम्ची नगरपालिका',
      ward_number: 11,
      location: 'मेलम्ची बजार',
      collection_date: '2026-10-29',
      collection_sign_date: '2026-10-29',
      full_name: 'हरि शरण ढकाल',
      age: 42,
      gender: 'male',
      incident_type: 'injured',
      injury_type: 'बाढीले खुट्टामा चोट',
      treatment_location: 'मेलम्ची प्राथमिक स्वास्थ्य केन्द्र',
      current_condition: 'under_treatment',
      verification_status: 'verified',
      verified_by: 'इन्सेक सिन्धुपाल्चोक प्रतिनिधि',
      data_collector: editor.name,
      photo_path: uploadedPhotoPath,
    };

    const createRes = await httpRequest(
      { host: 'localhost', port: 5055, path: '/api/records', method: 'POST' },
      JSON.stringify(recordPayload),
      { 'Content-Type': 'application/json', Authorization: `Bearer ${editorToken}` }
    );

    assert(createRes.statusCode === 201, `Record created with status ${createRes.statusCode}`);
    assert(createRes.body && createRes.body.success === true, 'Record created success: true');
    assert(createRes.body && createRes.body.photo_path === uploadedPhotoPath, `Record returned photo_path: ${createRes.body?.photo_path}`);
    const createdRecordId = createRes.body.record_id;

    // Verify via GET /api/records/:id
    const fetchRes = await httpRequest(
      { host: 'localhost', port: 5055, path: `/api/records/${createdRecordId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${editorToken}` }
    );
    assert(fetchRes.statusCode === 200, `Fetched record details status: ${fetchRes.statusCode}`);
    assert(fetchRes.body.data.photo_path === uploadedPhotoPath, `Saved photo_path matches: ${fetchRes.body.data.photo_path}`);
    assert(fetchRes.body.data.created_by === editor.id, `Created by ID matches authenticated editor: ${fetchRes.body.data.created_by}`);
    assert(fetchRes.body.data.submitted_by === editor.name, `Submitted by username matches authenticated editor: ${fetchRes.body.data.submitted_by}`);

    // -------------------------------------------------------------------------
    // TEST 4: Update Record (Admin updates, preserving original Editor submitter and photo)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Update Record (Preserve Original Submitter & Photo) ---');
    const updatePayload = {
      ...recordPayload,
      location: 'मेलम्ची नयाँ बजार',
      // No replacement photo sent
    };

    const updateRes = await httpRequest(
      { host: 'localhost', port: 5055, path: `/api/records/${createdRecordId}`, method: 'PUT' },
      JSON.stringify(updatePayload),
      { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    );

    assert(updateRes.statusCode === 200, `Update returned status 200: ${updateRes.statusCode}`);

    const verifyAfterUpdate = await httpRequest(
      { host: 'localhost', port: 5055, path: `/api/records/${createdRecordId}`, method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );

    assert(verifyAfterUpdate.body.data.photo_path === uploadedPhotoPath, 'Photo path preserved after update without replacement');
    assert(verifyAfterUpdate.body.data.created_by === editor.id, 'Original submitter ID preserved after update by Admin');
    assert(verifyAfterUpdate.body.data.submitted_by === editor.name, 'Original submitter name preserved after update by Admin');
    assert(verifyAfterUpdate.body.data.updater_name === admin.name, 'Admin recorded separately as updater');

    // -------------------------------------------------------------------------
    // TEST 5: Excel Export (Admin Only) - Verify "Submitted By" and "Photo Path"
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Excel Export Verification ---');
    const exportRes = await httpRequest(
      { host: 'localhost', port: 5055, path: '/api/records/export', method: 'GET' },
      null,
      { Authorization: `Bearer ${adminToken}` }
    );

    assert(exportRes.statusCode === 200, `Excel export returned status 200: ${exportRes.statusCode}`);
    assert(exportRes.headers['content-type']?.includes('spreadsheetml'), `Content-Type header correct: ${exportRes.headers['content-type']}`);

    // Load exported workbook into ExcelJS from rawBuffer
    const exportedWb = new ExcelJS.Workbook();
    await exportedWb.xlsx.load(exportRes.rawBuffer);
    const ws = exportedWb.getWorksheet('घटना तथ्याङ्क (Records)');
    assert(ws !== undefined, 'Exported workbook contains sheet "घटना तथ्याङ्क (Records)"');

    const headersList = [];
    ws.getRow(4).eachCell((cell, colNum) => {
      headersList[colNum] = cell.value;
    });

    const subByColIdx = headersList.findIndex(h => h === 'Submitted By');
    const photoPathColIdx = headersList.findIndex(h => h === 'Photo Path');

    assert(subByColIdx > 0, `Column "Submitted By" found at index ${subByColIdx}`);
    assert(photoPathColIdx > 0, `Column "Photo Path" found at index ${photoPathColIdx}`);

    // Find the row for our created record
    let foundRow = null;
    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 4) {
        if (row.getCell(9).value === 'हरि शरण ढकाल') {
          foundRow = row;
        }
      }
    });

    assert(foundRow !== null, 'Created record row located in Excel export');
    if (foundRow) {
      const exportedSubBy = foundRow.getCell(subByColIdx).value;
      const exportedPhoto = foundRow.getCell(photoPathColIdx).value;
      assert(exportedSubBy === editor.name, `Exported "Submitted By" correctly shows submitter: "${exportedSubBy}"`);
      assert(exportedPhoto === uploadedPhotoPath, `Exported "Photo Path" correctly shows path: "${exportedPhoto}"`);
    }

    // Clean up created record & uploaded file
    await pool.query('DELETE FROM incident_records WHERE id = ?', [createdRecordId]);
    const filename = path.basename(new URL(uploadedPhotoPath).pathname);
    const localFilePath = path.join(__dirname, 'uploads/victims', filename);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.log('Cleaned up test record and uploaded file.');

    console.log('\n=============================================================');
    console.log(`📊 ALL HTTP TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('HTTP Test failure:', err);
    server.close();
    process.exit(1);
  }
}

runHttpTests();
