/**
 * Excel Generator Utility using ExcelJS
 * Produces structured .xlsx files with Nepali headers, styling, and status translations.
 */

const ExcelJS = require('exceljs');

const GENDER_MAP = {
  male: 'पुरुष',
  female: 'महिला',
  other: 'अन्य',
};

const INCIDENT_MAP = {
  death: 'मृत्यु',
  missing: 'बेपत्ता',
  injured: 'घाइते',
  disabled: 'अपाङ्गता',
  other: 'अन्य',
};

const YES_NO_MAP = {
  yes: 'हो',
  no: 'होइन',
};

const SEARCH_STATUS_MAP = {
  ongoing: 'जारी',
  suspended: 'रोकिएको',
  found: 'फेला परेको',
};

const CONDITION_MAP = {
  under_treatment: 'उपचाररत',
  recovered: 'निको भएको',
  further_treatment_needed: 'थप उपचार आवश्यक',
};

const VERIFICATION_MAP = {
  verified: 'भएको (प्रमाणीत)',
  pending: 'हुन बाँकी (Pending)',
};

async function generateIncidentExcel(records, metadata = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'INSEC Data Collection System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('घटना तथ्याङ्क (Records)', {
    views: [{ state: 'frozen', ySplit: 4 }],
    pageSetup: { orientation: 'landscape', paperSize: 9 },
  });

  // Title Row 1
  worksheet.mergeCells('A1:AC1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'अनौपचारिक क्षेत्र सेवा केन्द्र (इन्सेक) - व्यक्तिगत घटना तथा प्रभावित व्यक्ति तथ्याङ्क प्रतिवेदन';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0284C7' }, // Sky-600
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 36;

  // Subtitle Row 2
  worksheet.mergeCells('A2:AC2');
  const subtitleCell = worksheet.getCell('A2');
  const dateStr = new Date().toLocaleString('ne-NP', { timeZone: 'Asia/Kathmandu' });
  const filterDesc = metadata.filterDescription || 'सम्पूर्ण रेकर्डहरू (All Records)';
  subtitleCell.value = `प्रतिवेदन मिति: ${dateStr} | दायरा: ${filterDesc} | जम्मा रेकर्ड: ${records.length}`;
  subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF0F172A' } };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0F2FE' }, // Sky-100
  };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 24;

  // Empty separator row
  worksheet.getRow(3).height = 8;

  // Column definitions
  const columns = [
    { header: 'क्र.सं.', key: 'sn', width: 8 },
    { header: 'दर्ता कोड (Code)', key: 'record_code', width: 18 },
    { header: 'फारम नं.', key: 'form_number', width: 14 },
    { header: 'जिल्ला', key: 'district', width: 16 },
    { header: 'पालिका', key: 'municipality', width: 22 },
    { header: 'वडा नं.', key: 'ward_number', width: 10 },
    { header: 'स्थान / बस्ती', key: 'location', width: 22 },
    { header: 'संकलन मिति', key: 'collection_date', width: 14 },
    { header: 'प्रभावितको नाम, थर', key: 'full_name', width: 24 },
    { header: 'उमेर', key: 'age', width: 8 },
    { header: 'लिङ्ग', key: 'gender', width: 10 },
    { header: 'परिवार / सम्पर्क व्यक्ति', key: 'family_contact', width: 22 },
    { header: 'सम्पर्क फोन', key: 'phone', width: 16 },
    { header: 'घटनाको प्रकार', key: 'incident_type', width: 16 },
    { header: 'अन्य घटना उल्लेख', key: 'other_incident_type', width: 20 },
    { header: 'घटना मिति', key: 'incident_date', width: 14 },
    { header: 'घटना स्थान', key: 'incident_location', width: 22 },
    { header: 'संक्षिप्त विवरण', key: 'incident_description', width: 35 },
    { header: 'शव फेला परेको', key: 'body_found', width: 14 },
    { header: 'पहिचान भएको', key: 'identified', width: 14 },
    { header: 'खोजी अवस्था', key: 'search_status', width: 14 },
    { header: 'परिवारलाई सूचना', key: 'family_informed', width: 14 },
    { header: 'चोटपटक प्रकृति', key: 'injury_type', width: 22 },
    { header: 'उपचार स्थान', key: 'treatment_location', width: 22 },
    { header: 'हालको स्वास्थ्य अवस्था', key: 'current_condition', width: 18 },
    { header: 'बालबालिका स्थिति', key: 'child_summary', width: 24 },
    { header: 'महिला स्थिति', key: 'woman_summary', width: 24 },
    { header: 'सत्यापन अवस्था', key: 'verification_status', width: 18 },
    { header: 'सत्यापनकर्ता / संस्था', key: 'verified_by', width: 20 },
  ];

  worksheet.getRow(4).values = columns.map(c => c.header);
  worksheet.getRow(4).height = 28;

  // Style header row
  worksheet.getRow(4).eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0369A1' }, // Sky-700
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Populate records
  records.forEach((rec, idx) => {
    // Child details string
    let childDetails = rec.is_child ? 'हो' : 'होइन';
    if (rec.is_child) {
      const parts = [];
      if (rec.child_guardian_lost) parts.push('अभिभावक गुमाएको');
      if (rec.child_separated_from_family) parts.push('परिवारबाट छुट्टिएको');
      if (rec.child_school_affected) parts.push('विद्यालय प्रभावित');
      if (rec.child_other) parts.push(rec.child_other);
      if (parts.length > 0) {
        childDetails += ` (${parts.join(', ')})`;
      }
    }

    // Woman details string
    let womanDetails = rec.is_woman ? 'हो' : 'होइन';
    if (rec.is_woman) {
      const parts = [];
      if (rec.is_pregnant) parts.push('गर्भवती');
      if (rec.is_postpartum) parts.push('सुत्केरी');
      if (rec.is_single_woman) parts.push('एकल महिला');
      if (rec.is_woman_led_family) parts.push('महिला नेतृत्वको परिवार');
      if (rec.woman_other) parts.push(rec.woman_other);
      if (parts.length > 0) {
        womanDetails += ` (${parts.join(', ')})`;
      }
    }

    const rowValues = [
      idx + 1,
      rec.record_code || '',
      rec.form_number || '',
      rec.district || '',
      rec.municipality || '',
      rec.ward_number || '',
      rec.location || '',
      rec.collection_date || '',
      rec.full_name || '',
      rec.age != null ? rec.age : '',
      GENDER_MAP[rec.gender] || rec.gender || '',
      rec.family_contact || '',
      rec.phone || '',
      INCIDENT_MAP[rec.incident_type] || rec.incident_type || '',
      rec.other_incident_type || '',
      rec.incident_date || '',
      rec.incident_location || '',
      rec.incident_description || '',
      YES_NO_MAP[rec.body_found] || rec.body_found || '-',
      YES_NO_MAP[rec.identified] || rec.identified || '-',
      SEARCH_STATUS_MAP[rec.search_status] || rec.search_status || '-',
      YES_NO_MAP[rec.family_informed] || rec.family_informed || '-',
      rec.injury_type || '-',
      rec.treatment_location || '-',
      CONDITION_MAP[rec.current_condition] || rec.current_condition || '-',
      childDetails,
      womanDetails,
      VERIFICATION_MAP[rec.verification_status] || rec.verification_status || '',
      rec.verified_by || '-',
    ];

    const row = worksheet.addRow(rowValues);
    row.height = 22;

    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Light zebra slate-50

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Align center for codes, dates, numbers, statuses
      if ([1, 2, 3, 6, 8, 10, 11, 14, 16, 19, 20, 21, 22, 25, 28].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: colNumber === 18 };
      }
    });
  });

  // Set explicit column widths
  columns.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = col.width;
  });

  return workbook;
}

module.exports = {
  generateIncidentExcel,
};
