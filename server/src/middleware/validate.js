/**
 * Input Validation Middleware
 */

function validateIncidentRecord(req, res, next) {
  const errors = [];
  const {
    district,
    municipality,
    collection_date,
    collection_sign_date,
    full_name,
    gender,
    incident_type,
    other_incident_type,
    age,
    ward_number,
    verification_status,
    verified_by,
    data_collector,
  } = req.body;

  if (!district || typeof district !== 'string' || !district.trim()) {
    errors.push('जिल्ला उल्लेख गर्न अनिवार्य छ (District is required)');
  }

  if (!municipality || typeof municipality !== 'string' || !municipality.trim()) {
    errors.push('पालिका उल्लेख गर्न अनिवार्य छ (Municipality is required)');
  }

  if (!collection_date || typeof collection_date !== 'string' || !collection_date.trim()) {
    errors.push('तथ्याङ्क संकलन मिति उल्लेख गर्न अनिवार्य छ (Collection date is required)');
  }

  const signDate = collection_sign_date || collection_date;
  if (!signDate || typeof signDate !== 'string' || !signDate.trim()) {
    errors.push('मिति (हस्ताक्षर/प्रमाणीकरण मिति) उल्लेख गर्न अनिवार्य छ (Date is required)');
  }

  if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
    errors.push('प्रभावित व्यक्तिको नाम, थर उल्लेख गर्न अनिवार्य छ (Full name is required)');
  }

  if (!gender || !['male', 'female', 'other'].includes(gender)) {
    errors.push('लिङ्ग चयन गर्न अनिवार्य छ: पुरुष, महिला वा अन्य (Valid gender is required: male, female, other)');
  }

  if (!incident_type || !['death', 'missing', 'injured', 'disabled', 'other'].includes(incident_type)) {
    errors.push('घटनाको प्रकार चयन गर्न अनिवार्य छ: मृत्यु, बेपत्ता, घाइते, अपाङ्गता वा अन्य (Valid incident type is required: death, missing, injured, disabled, other)');
  }

  if (incident_type === 'other' && (!other_incident_type || !other_incident_type.trim())) {
    errors.push('अन्य घटना प्रकार खुलाउनुहोस् (Please specify other incident type)');
  }

  if (age === undefined || age === null || age === '' || isNaN(Number(age))) {
    errors.push('उमेर उल्लेख गर्न अनिवार्य छ (Age is required)');
  } else {
    const numAge = Number(age);
    if (numAge < 0 || numAge > 130) {
      errors.push('उमेर ० देखि १३० बीच हुनुपर्छ (Age must be between 0 and 130)');
    }
  }

  if (ward_number === undefined || ward_number === null || ward_number === '' || isNaN(Number(ward_number))) {
    errors.push('वडा नं. उल्लेख गर्न अनिवार्य छ (Ward number is required)');
  } else {
    const numWard = Number(ward_number);
    if (numWard < 1 || numWard > 100) {
      errors.push('वडा नं. मान्य हुनुपर्छ (Ward number must be between 1 and 100)');
    }
  }

  if (!verification_status || !['verified', 'pending'].includes(verification_status)) {
    errors.push('सत्यापन अवस्था चयन गर्न अनिवार्य छ: भएको वा हुन बाँकी (Valid verification status is required: verified or pending)');
  }

  if (!verified_by || typeof verified_by !== 'string' || !verified_by.trim()) {
    errors.push('सत्यापन गर्ने व्यक्ति / संस्था उल्लेख गर्न अनिवार्य छ (Verified by is required)');
  }

  if (!data_collector || typeof data_collector !== 'string' || !data_collector.trim()) {
    errors.push('तथ्याङ्क संकलक उल्लेख गर्न अनिवार्य छ (Data collector is required)');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

function validateUserPayload(isUpdate = false) {
  return (req, res, next) => {
    const errors = [];
    const { name, email, password, role } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.push('नाम अनिवार्य छ (Name is required)');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push('मान्य इमेल ठेगाना प्रविष्ट गर्नुहोस् (Valid email is required)');
    }

    if (role && !['admin', 'editor', 'viewer'].includes(role)) {
      errors.push('भूमिका केवल admin, editor वा viewer हुनुपर्छ (Role must be admin, editor, or viewer)');
    }

    if (!isUpdate && (!password || typeof password !== 'string' || password.length < 6)) {
      errors.push('पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ (Password must be at least 6 characters)');
    }

    if (isUpdate && password && password.length < 6) {
      errors.push('नयाँ पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ (Password must be at least 6 characters)');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    next();
  };
}

module.exports = {
  validateIncidentRecord,
  validateUserPayload,
};
