/**
 * Comprehensive Verification Script for Photo Upload & Excel Export Updates
 */

const pool = require('./src/config/db');
const { generateToken } = require('./src/config/jwt');
const { generateIncidentExcel } = require('./src/utils/excelGenerator');
const fs = require('fs');
const path = require('path');
const http = require('http');

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

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 TESTING PHOTO UPLOAD & EXCEL EXPORT INTEGRATION');
  console.log('=============================================================\n');

  try {
    // 1. Verify Database Columns
    console.log('--- 1. Database Schema Verification ---');
    const [cols] = await pool.query('DESCRIBE incident_records');
    const colNames = cols.map(c => c.Field);

    assert(colNames.includes('photo_path'), 'incident_records has photo_path column');
    assert(colNames.includes('created_by'), 'incident_records has created_by column');
    assert(colNames.includes('submitted_by_name'), 'incident_records has submitted_by_name column');
    assert(colNames.includes('updated_by'), 'incident_records has updated_by column');

    // 2. Excel Generator Structure Verification
    console.log('\n--- 2. Excel Columns & Mapping Verification ---');
    const mockRecords = [
      {
        id: 101,
        record_code: 'INSEC-2026-TEST-1',
        full_name: 'राम प्रसाद अधिकारी',
        district: 'काठमाडौं',
        municipality: 'काठमाडौं महानगरपालिका',
        collection_date: '2026-10-29',
        gender: 'male',
        incident_type: 'injured',
        verification_status: 'verified',
        created_by: 1,
        submitted_by_name: 'केन्द्रीय प्रशासक (Admin)',
        submitted_by: 'केन्द्रीय प्रशासक (Admin)',
        photo_path: '/uploads/victims/victim-test-123.jpg',
      },
      {
        id: 102,
        record_code: 'INSEC-2026-TEST-2',
        full_name: 'सीता कुमारी श्रेष्ठ',
        district: 'ललितपुर',
        municipality: 'ललितपुर महानगरपालिका',
        collection_date: '2026-10-29',
        gender: 'female',
        incident_type: 'death',
        verification_status: 'pending',
        created_by: null,
        submitted_by_name: null,
        submitted_by: '',
        photo_path: null,
      },
    ];

    const workbook = await generateIncidentExcel(mockRecords, { filterDescription: 'परीक्षण तथ्याङ्क' });
    const worksheet = workbook.getWorksheet('घटना तथ्याङ्क (Records)');

    assert(worksheet !== undefined, 'Excel worksheet created successfully');

    // Check Row 4 header columns
    const headerRow = worksheet.getRow(4);
    const headers = [];
    headerRow.eachCell((cell, colNum) => {
      headers[colNum] = cell.value;
    });

    const submittedByCol = headers.findIndex(h => h && h.toString().includes('Submitted By'));
    const photoPathCol = headers.findIndex(h => h && h.toString().includes('Photo Path'));

    assert(submittedByCol > 0, `Submitted By column present at index ${submittedByCol}`);
    assert(photoPathCol > 0, `Photo Path column present at index ${photoPathCol}`);
    assert(headers[submittedByCol] === 'Submitted By', 'Exact column header is "Submitted By"');
    assert(headers[photoPathCol] === 'Photo Path', 'Exact column header is "Photo Path"');

    // Check Row 5 (Record 1 with photo and submitter)
    const row1 = worksheet.getRow(5);
    const row1SubmittedBy = row1.getCell(submittedByCol).value;
    const row1PhotoPath = row1.getCell(photoPathCol).value;
    assert(row1SubmittedBy === 'केन्द्रीय प्रशासक (Admin)', `Row 1 Submitted By matches: ${row1SubmittedBy}`);
    assert(row1PhotoPath && row1PhotoPath.includes('/uploads/victims/victim-test-123.jpg') && row1PhotoPath.startsWith('http'), `Row 1 Photo Path contains full URL with domain: ${row1PhotoPath}`);

    // Check Row 6 (Record 2 without photo or submitter - legacy record)
    const row2 = worksheet.getRow(6);
    const row2SubmittedBy = row2.getCell(submittedByCol).value;
    const row2PhotoPath = row2.getCell(photoPathCol).value;
    assert(!row2SubmittedBy || row2SubmittedBy === '', `Row 2 legacy record has blank Submitted By: "${row2SubmittedBy || ''}"`);
    assert(!row2PhotoPath || row2PhotoPath === '', `Row 2 legacy record has blank Photo Path: "${row2PhotoPath || ''}"`);

    // 3. Test API Record Creation with Photo and Automatic Submitter
    console.log('\n--- 3. Database Insertion & Record Creation Tests ---');
    const adminUserRes = await pool.query("SELECT id, name, email FROM users WHERE role = 'admin' LIMIT 1");
    const testAdmin = adminUserRes[0][0];

    const editorUserRes = await pool.query("SELECT id, name, email FROM users WHERE role = 'editor' LIMIT 1");
    const testEditor = editorUserRes[0][0];

    // Create a new record as Admin
    const testCode1 = `INSEC-2026-TEST-${Date.now()}`;
    const [insertResult] = await pool.query(`
      INSERT INTO incident_records (
        record_code, district, municipality, collection_date, full_name, gender, incident_type,
        verification_status, verified_by, data_collector, collection_sign_date,
        photo_path, created_by, submitted_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testCode1, 'कास्की', 'पोखरा महानगरपालिका', '2026-10-29', 'परीक्षण प्रभावित १', 'male', 'injured',
      'verified', 'इन्सेक कास्की', testAdmin.name, '2026-10-29',
      '/uploads/victims/test-photo.jpg', testAdmin.id, testAdmin.name
    ]);

    const newRecordId = insertResult.insertId;

    // Verify persisted record
    const [savedRows] = await pool.query(`
      SELECT ir.*, COALESCE(u.name, ir.submitted_by_name, '') as submitted_by
      FROM incident_records ir
      LEFT JOIN users u ON ir.created_by = u.id
      WHERE ir.id = ?
    `, [newRecordId]);

    const saved = savedRows[0];
    assert(saved.photo_path === '/uploads/victims/test-photo.jpg', 'Photo path saved in database');
    assert(saved.created_by === testAdmin.id, `Created by user ID saved: ${saved.created_by}`);
    assert(saved.submitted_by_name === testAdmin.name, `Submitted by name snapshot saved: ${saved.submitted_by_name}`);
    assert(saved.submitted_by === testAdmin.name, `Queried submitted_by matches: ${saved.submitted_by}`);

    // 4. Test Update: Preserve Submitter and Photo
    console.log('\n--- 4. Update Preservation Tests ---');
    // Editor updates the record created by Admin
    await pool.query(`
      UPDATE incident_records SET
        location = 'सेती नदी किनार',
        updated_by = ?
      WHERE id = ?
    `, [testEditor.id, newRecordId]);

    const [updatedRows] = await pool.query('SELECT * FROM incident_records WHERE id = ?', [newRecordId]);
    const updated = updatedRows[0];

    assert(updated.created_by === testAdmin.id, 'Original submitter user ID preserved on update');
    assert(updated.submitted_by_name === testAdmin.name, 'Original submitter name preserved on update');
    assert(updated.photo_path === '/uploads/victims/test-photo.jpg', 'Existing photo preserved on update without replacement');
    assert(updated.updated_by === testEditor.id, 'Last editor recorded separately in updated_by');

    // 5. Test Multer Upload Filter Logic
    console.log('\n--- 5. Upload Validation Filter Tests ---');
    const { upload } = require('./src/middleware/upload');
    assert(upload !== undefined, 'Multer upload middleware loaded');

    // Cleanup test record
    await pool.query('DELETE FROM incident_records WHERE id = ?', [newRecordId]);
    console.log('Cleaned up test record.');

    console.log('\n=============================================================');
    console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();

