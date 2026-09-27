-- ==============================================================================
-- INSEC DATA COLLECTION SYSTEM — COMPLETE DATABASE SETUP
-- Run this entire script in phpMyAdmin (SQL tab) or MySQL Workbench
-- ==============================================================================

-- STEP 1: Create & Select Database
CREATE DATABASE IF NOT EXISTS `insec_data`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `insec_data`;

-- STEP 2: Drop old tables if re-running (safe re-run)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `incident_records`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- TABLE 1: USERS (Admin & Editor staff accounts)
-- ==============================================================================
CREATE TABLE `users` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `name`          VARCHAR(100)  NOT NULL COMMENT 'Full name of staff member',
  `email`         VARCHAR(150)  NOT NULL UNIQUE COMMENT 'Login email',
  `password_hash` VARCHAR(255)  NOT NULL COMMENT 'bcrypt hashed password',
  `role`          ENUM('admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  `is_active`     BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 2: INCIDENT_RECORDS (all form sections mapped to columns)
-- ==============================================================================
CREATE TABLE `incident_records` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `record_code`     VARCHAR(50)   NOT NULL UNIQUE COMMENT 'e.g. INSEC-2026-0001',

  -- SECTION 1: BASIC INFO (फारम नं., ठेगाना)
  `form_number`     VARCHAR(100)  NULL  COMMENT 'फारम नं.',
  `district`        VARCHAR(100)  NOT NULL COMMENT 'जिल्ला',
  `municipality`    VARCHAR(100)  NOT NULL COMMENT 'पालिका',
  `ward_number`     INT           NULL  COMMENT 'वडा नं.',
  `location`        VARCHAR(255)  NULL  COMMENT 'स्थान / बस्ती',
  `collection_date` VARCHAR(30)   NOT NULL COMMENT 'तथ्याङ्क संकलन मिति',

  -- SECTION 1.1: PERSON DETAILS (व्यक्तिगत विवरण)
  `full_name`       VARCHAR(150)  NOT NULL COMMENT 'नाम, थर',
  `age`             INT           NULL  COMMENT 'उमेर',
  `gender`          ENUM('male','female','other') NOT NULL COMMENT 'लिङ्ग',
  `family_contact`  VARCHAR(150)  NULL  COMMENT 'परिवारको नाम / सम्पर्क व्यक्ति',
  `phone`           VARCHAR(50)   NULL  COMMENT 'मोबाइल / सम्पर्क नम्बर',

  -- SECTION 2: INCIDENT DETAILS (घटनाको विवरण)
  `incident_type`        ENUM('death','missing','injured','disabled','other') NOT NULL COMMENT 'घटनाको प्रकार',
  `other_incident_type`  VARCHAR(150) NULL  COMMENT 'अन्य घटना प्रकार',
  `incident_date`        VARCHAR(30)  NULL  COMMENT 'घटना भएको मिति',
  `incident_location`    VARCHAR(255) NULL  COMMENT 'घटना भएको स्थान',
  `incident_description` TEXT         NULL  COMMENT 'घटनाको संक्षिप्त विवरण',

  -- SECTION 3: DEATH / MISSING (मृत्यु / बेपत्ता)
  `body_found`      ENUM('yes','no')                        NULL DEFAULT NULL COMMENT 'शव फेला परेको',
  `identified`      ENUM('yes','no')                        NULL DEFAULT NULL COMMENT 'पहिचान भएको',
  `search_status`   ENUM('ongoing','suspended','found')     NULL DEFAULT NULL COMMENT 'खोजीको अवस्था',
  `family_informed` ENUM('yes','no')                        NULL DEFAULT NULL COMMENT 'परिवारलाई जानकारी',

  -- SECTION 4: INJURY / DISABILITY (घाइते / अपाङ्गता)
  `injury_type`         VARCHAR(255) NULL  COMMENT 'चोट / अपाङ्गताको प्रकृति',
  `treatment_location`  VARCHAR(255) NULL  COMMENT 'उपचार गरिएको स्थान',
  `current_condition`   ENUM('under_treatment','recovered','further_treatment_needed') NULL DEFAULT NULL COMMENT 'हालको अवस्था',

  -- SECTION 5a: CHILDREN (बालबालिका)
  `is_child`                   BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'बालबालिका',
  `child_guardian_lost`        BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'अभिभावक गुमाएको',
  `child_separated_from_family` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'परिवारबाट छुट्टिएको',
  `child_school_affected`      BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'विद्यालय प्रभावित',
  `child_other`                VARCHAR(255) NULL COMMENT 'अन्य बालबालिका विवरण',

  -- SECTION 5b: WOMEN (महिला)
  `is_woman`           BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'महिला',
  `is_pregnant`        BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'गर्भवती',
  `is_postpartum`      BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'सुत्केरी',
  `is_single_woman`    BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'एकल महिला',
  `is_woman_led_family` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'महिला नेतृत्वको परिवार',
  `woman_other`        VARCHAR(255) NULL COMMENT 'अन्य महिला विवरण',

  -- SECTION 6: VERIFICATION (सत्यापन)
  `verification_status` ENUM('verified','pending') NOT NULL DEFAULT 'pending' COMMENT 'सत्यापन',
  `verified_by`         VARCHAR(150) NULL COMMENT 'सत्यापन गर्ने व्यक्ति / संस्था',
  `data_collector`      VARCHAR(150) NULL COMMENT 'तथ्याङ्क संकलक',
  `signature_info`      VARCHAR(255) NULL COMMENT 'हस्ताक्षर / विवरण',
  `collection_sign_date` VARCHAR(30) NULL COMMENT 'मिति',

  -- AUDIT COLUMNS
  `created_by` INT NULL,
  `updated_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_district`       (`district`),
  INDEX `idx_municipality`   (`municipality`),
  INDEX `idx_incident_type`  (`incident_type`),
  INDEX `idx_gender`         (`gender`),
  INDEX `idx_is_child`       (`is_child`),
  INDEX `idx_is_woman`       (`is_woman`),
  INDEX `idx_verification`   (`verification_status`),
  INDEX `idx_identified`     (`identified`),
  INDEX `idx_created_at`     (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- TABLE 3: AUDIT_LOGS (action history for Admin/Editor changes)
-- ==============================================================================
CREATE TABLE `audit_logs` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`    INT          NULL,
  `user_email` VARCHAR(150) NULL,
  `user_role`  VARCHAR(50)  NULL,
  `action`     VARCHAR(50)  NOT NULL COMMENT 'CREATE / UPDATE / DELETE / EXPORT / LOGIN',
  `record_id`  INT          NULL,
  `details`    TEXT         NULL COMMENT 'JSON string of changed fields',
  `ip_address` VARCHAR(50)  NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_action`     (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- STEP 3: SEED USERS
-- Admin password:  Admin@12345
-- Editor password: Editor@12345
-- (bcrypt hashes generated with cost factor 10)
-- ==============================================================================
INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `is_active`) VALUES
(
  'केन्द्रीय प्रशासक (Admin)',
  'admin@insec.org.np',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhmS',
  'admin',
  TRUE
),
(
  'तथ्याङ्क सम्पादक (Editor)',
  'editor@insec.org.np',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi6',
  'editor',
  TRUE
);

-- ==============================================================================
-- STEP 4: SEED 15 INCIDENT RECORDS (sample data for development)
-- ==============================================================================
INSERT INTO `incident_records` (
  `record_code`, `form_number`,
  `district`, `municipality`, `ward_number`, `location`, `collection_date`,
  `full_name`, `age`, `gender`, `family_contact`, `phone`,
  `incident_type`, `other_incident_type`, `incident_date`, `incident_location`, `incident_description`,
  `body_found`, `identified`, `search_status`, `family_informed`,
  `injury_type`, `treatment_location`, `current_condition`,
  `is_child`, `child_guardian_lost`, `child_separated_from_family`, `child_school_affected`, `child_other`,
  `is_woman`, `is_pregnant`, `is_postpartum`, `is_single_woman`, `is_woman_led_family`, `woman_other`,
  `verification_status`, `verified_by`, `data_collector`, `signature_info`, `collection_sign_date`,
  `created_by`
) VALUES

-- Record 1: Male, Death, Kathmandu, Identified, Verified
('INSEC-2026-0001','FOR-81-01',
 'काठमाडौं','काठमाडौं महानगरपालिका',14,'कुलेश्वर, बल्खु','2081-06-12',
 'रामचन्द्र खड्का',42,'male','पार्वती खड्का (श्रीमती)','9841234567',
 'death',NULL,'2081-06-11','बल्खु खोला किनार','बाढी आएको समयमा खोला किनारबाट सुरक्षित स्थानतर्फ जान खोज्दा बाढीले बगाएर मृत्यु भएको।',
 'yes','yes','found','yes',
 NULL,NULL,NULL,
 FALSE,FALSE,FALSE,FALSE,NULL,
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'verified','इन्सेक केन्द्रीय कार्यालय','सुरेश श्रेष्ठ','सुरेश श्रेष्ठ','2081-06-13',
 1),

-- Record 2: Female, Injured, Lalitpur, Pregnant Woman, Verified
('INSEC-2026-0002','FOR-81-02',
 'ललितपुर','गोदावरी नगरपालिका',6,'टिकाभैरव, लेले','2081-06-12',
 'सुनिता तामाङ',26,'female','सोम बहादुर तामाङ','9808112233',
 'injured',NULL,'2081-06-11','गोदावरी लेले खण्ड','पहिरोमा परी कम्मर र खुट्टामा गम्भीर चोट लागेको।',
 NULL,'yes',NULL,'yes',
 'खुट्टा र ढाड भाँचिएको (Fracture)','पाटन अस्पताल, लगनखेल','under_treatment',
 FALSE,FALSE,FALSE,FALSE,NULL,
 TRUE,TRUE,FALSE,FALSE,FALSE,'७ महिनाको गर्भवती',
 'verified','ललितपुर इन्सेक','अन्जना महर्जन','अन्जना महर्जन','2081-06-13',
 2),

-- Record 3: Male, Death, Sindhupalchok, Unidentified, Pending
('INSEC-2026-0003','FOR-81-03',
 'सिन्धुपाल्चोक','भोटेकोशी गाउँपालिका',4,'तातोपानी, डाँडागाउँ','2081-06-13',
 'अज्ञात व्यक्ति (पुरुष)',35,'male','पहिचान हुन बाँकी',NULL,
 'death',NULL,'2081-06-11','भोटेकोशी नदी किनार','नदी किनारमा शव फेला परेको, पहिचान हुन बाँकी।',
 'yes','no','found','no',
 NULL,NULL,NULL,
 FALSE,FALSE,FALSE,FALSE,NULL,
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'pending',NULL,'दिपक तामाङ','दिपक तामाङ','2081-06-13',
 NULL),

-- Record 4: Male Child, Missing, Kaski, Ongoing Search
('INSEC-2026-0004','FOR-81-04',
 'कास्की','पोखरा महानगरपालिका',19,'लामाचौर','2081-06-14',
 'आयुष गुरुङ',11,'male','धनमाया गुरुङ (हजुरआमा)','9812998877',
 'missing',NULL,'2081-06-12','सेती नदी किनार','विद्यालयबाट घर फर्कने क्रममा खोल्सा तर्न खोज्दा बेपत्ता।',
 'no','yes','ongoing','yes',
 NULL,NULL,NULL,
 TRUE,FALSE,TRUE,TRUE,'कक्षा ५ को विद्यार्थी',
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'verified','कास्की जिल्ला संयोजक','सरिता बराल','सरिता बराल','2081-06-14',
 2),

-- Record 5: Female, Injured, Single Woman, Woman-led household, Kailali
('INSEC-2026-0005','FOR-81-05',
 'कैलाली','टीकापुर नगरपालिका',8,'फाँटा टोल','2081-06-15',
 'राधिका चौधरी',38,'female','राधिका चौधरी (स्वयं)','9848554433',
 'injured',NULL,'2081-06-12','कर्णाली नदी तटबन्ध','तटबन्ध फुट्दा घर भत्किएर पुरिएकी।',
 NULL,'yes',NULL,'yes',
 'टाउकोमा ५ टाँका र हात मर्किएको','टीकापुर अस्पताल','recovered',
 FALSE,FALSE,FALSE,FALSE,NULL,
 TRUE,FALSE,FALSE,TRUE,TRUE,'३ जना बालबच्चाको एकल हेरचाहकर्ता',
 'verified','सुदूरपश्चिम प्रदेश कार्यालय','विनोद चौधरी','विनोद चौधरी','2081-06-15',
 1),

-- Record 6: Male, Missing, Chitwan, Ongoing
('INSEC-2026-0006','FOR-81-06',
 'चितवन','भरतपुर महानगरपालिका',29,'सिमलताल','2081-06-15',
 'गोविन्द प्रसाद अधिकारी',50,'male','केशव अधिकारी (छोरा)','9855012345',
 'missing',NULL,'2081-06-11','त्रिशूली नदी, सिमलताल','पहिरोसँगै बस नदीमा खस्दा बेपत्ता।',
 'no','yes','ongoing','yes',
 NULL,NULL,NULL,
 FALSE,FALSE,FALSE,FALSE,NULL,
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'verified','इन्सेक बागमती प्रदेश','हरिप्रसाद दवाडी','हरिप्रसाद दवाडी','2081-06-15',
 2),

-- Record 7: Female Child, Death, Morang
('INSEC-2026-0007','FOR-81-07',
 'मोरङ','विराटनगर महानगरपालिका',12,'बखरी','2081-06-16',
 'अस्मिता मण्डल',7,'female','सन्तोष मण्डल (काका)','9804223344',
 'death',NULL,'2081-06-12','केसलिया खोला किनार','बाढीले बगाएर निधन। आमाबाबु दुबै घाइते।',
 'yes','yes','found','yes',
 NULL,NULL,NULL,
 TRUE,TRUE,TRUE,TRUE,'स्थानीय प्राथमिक विद्यालयको छात्रा',
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'verified','इन्सेक कोशी प्रदेश','पवन मण्डल','पवन मण्डल','2081-06-16',
 1),

-- Record 8: Female, Injured, Postpartum, Dhanusha
('INSEC-2026-0008','FOR-81-08',
 'धनुषा','जनकपुरधाम उपमहानगरपालिका',8,'रेल्वे स्टेशन नजिक','2081-06-16',
 'सोनिया खातुन',22,'female','मोहमद इद्रिस (पति)','9819001122',
 'injured',NULL,'2081-06-13','जनकपुरधाम वडा नं ८','कच्ची घर भत्किँदा च्यापिएर घाइते।',
 NULL,'yes',NULL,'yes',
 'हात र खुट्टामा चोटपटक','प्रादेशिक अस्पताल जनकपुर','further_treatment_needed',
 FALSE,FALSE,FALSE,FALSE,NULL,
 TRUE,FALSE,TRUE,FALSE,FALSE,'२५ दिनकी सुत्केरी महिला',
 'pending',NULL,'विशाल झा','विशाल झा','2081-06-16',
 NULL),

-- Record 9: Other gender, Other incident type, Banke
('INSEC-2026-0009','FOR-81-09',
 'बाँके','नेपालगन्ज उपमहानगरपालिका',4,'बसपार्क','2081-06-17',
 'किरण परियार',28,'other','आशा परियार','9868112233',
 'other','विस्थापन तथा आश्रयविहीन','2081-06-13','डुबान क्षेत्र, नेपालगन्ज','बाढीका कारण बासस्थान नष्ट भई शिविरमा आश्रय।',
 NULL,'yes',NULL,'yes',
 'सामान्य चोटपटक','स्थानीय स्वास्थ्य चौकी','recovered',
 FALSE,FALSE,FALSE,FALSE,NULL,
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'verified','इन्सेक लुम्बिनी प्रदेश','कमल बिक','कमल बिक','2081-06-17',
 2),

-- Record 10: Male, Death, Baglung
('INSEC-2026-0010','FOR-81-10',
 'बागलुङ','बागलुङ नगरपालिका',3,'रातामाटा','2081-06-17',
 'गणेश बहादुर थापा',62,'male','डम्मर थापा (छोरा)','9847123456',
 'death',NULL,'2081-06-12','कालीगण्डकी करिडोर','माथिबाट खसेको ढुङ्गाले लागेर घटनास्थलमै निधन।',
 'yes','yes','found','yes',
 NULL,NULL,NULL,
 FALSE,FALSE,FALSE,FALSE,NULL,
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'verified','इन्सेक गण्डकी प्रदेश','सिर्जना शर्मा','सिर्जना शर्मा','2081-06-17',
 1),

-- Record 11: Male Child, Disabled, Jumla
('INSEC-2026-0011','FOR-81-11',
 'जुम्ला','चन्दननाथ नगरपालिका',5,'खलङ्गा बजार','2081-06-18',
 'प्रदीप रोकाया',16,'male','हर्क रोकाया (बुबा)','9868776655',
 'disabled',NULL,'2081-06-14','तिला नदी पुल नजिक','अज्ञात समूहद्वारा जबर्जस्ती नियन्त्रणमा लिई लगिएको।',
 NULL,'yes','ongoing','yes',
 NULL,NULL,NULL,
 TRUE,FALSE,TRUE,TRUE,'कक्षा १० का विद्यार्थी',
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'pending',NULL,'मान बहादुर शाही','मान बहादुर शाही','2081-06-18',
 2),

-- Record 12: Female, Injured, Single woman, Sindhupalchok
('INSEC-2026-0012','FOR-81-12',
 'सिन्धुपाल्चोक','मेलम्ची नगरपालिका',11,'मेलम्ची बजार','2081-06-18',
 'माया डङ्गोल',45,'female','माया डङ्गोल (स्वयं)','9841887766',
 'injured',NULL,'2081-06-11','मेलम्ची पुल नजिक','पर्खाल भत्किएर खुट्टा थिचिएको।',
 NULL,'yes',NULL,'yes',
 'दायाँ खुट्टाको हड्डी फ्र्याक्चर','धुलिखेल अस्पताल','under_treatment',
 FALSE,FALSE,FALSE,FALSE,NULL,
 TRUE,FALSE,FALSE,TRUE,TRUE,'एकल महिला, व्यवसाय ध्वस्त',
 'verified','इन्सेक केन्द्रीय अनुसन्धान टोली','सन्तोष नेपाल','सन्तोष नेपाल','2081-06-18',
 1),

-- Record 13: Unknown Female, Missing, Kathmandu, Unidentified
('INSEC-2026-0013','FOR-81-13',
 'काठमाडौं','कीर्तिपुर नगरपालिका',2,'ट्याङ्लाफाँट','2081-06-19',
 'अज्ञात व्यक्ति (महिला)',30,'female','पहिचान हुन बाँकी',NULL,
 'missing',NULL,'2081-06-11','वाग्मती नदी किनार','वाग्मतीमा बगेको प्रत्यक्षदर्शीले बताए पनि शव फेला नपरेको।',
 'no','no','ongoing','no',
 NULL,NULL,NULL,
 FALSE,FALSE,FALSE,FALSE,NULL,
 TRUE,FALSE,FALSE,FALSE,FALSE,'हुलिया: रातो कुर्था, अन्दाजी ३० वर्ष',
 'pending',NULL,'सविना बज्राचार्य','सविना बज्राचार्य','2081-06-19',
 NULL),

-- Record 14: Male Child, Injured, Jhapa
('INSEC-2026-0014','FOR-81-14',
 'झापा','भद्रपुर नगरपालिका',5,'मेची बस्ती','2081-06-19',
 'रोशन राजवंशी',9,'male','विमल राजवंशी (बुबा)','9824991122',
 'injured',NULL,'2081-06-12','मेची नदी किनार','डिल भत्किँदा खसेर घाइते।',
 NULL,'yes',NULL,'yes',
 'टाउको र छातीमा चोट','मेची प्रादेशिक अस्पताल','recovered',
 TRUE,FALSE,FALSE,TRUE,'किताब कापी बाढीमा बगेको',
 FALSE,FALSE,FALSE,FALSE,FALSE,NULL,
 'verified','इन्सेक झापा प्रतिनिधि','दिनेश पोखरेल','दिनेश पोखरेल','2081-06-19',
 2),

-- Record 15: Female, Death, Kathmandu, Verified
('INSEC-2026-0015','FOR-81-15',
 'काठमाडौं','टोखा नगरपालिका',2,'झोर, बौडेश्वर','2081-06-20',
 'कमला सुवेदी',34,'female','गोकुल सुवेदी (पति)','9841334455',
 'death',NULL,'2081-06-11','झोर महाङ्काल','पहिरोले पुरिएर मृत्यु भएको।',
 'yes','yes','found','yes',
 NULL,NULL,NULL,
 FALSE,FALSE,FALSE,FALSE,NULL,
 TRUE,FALSE,FALSE,FALSE,FALSE,NULL,
 'verified','इन्सेक बागमती प्रदेश कार्यालय','राजेन्द्र अधिकारी','राजेन्द्र अधिकारी','2081-06-20',
 1);

-- ==============================================================================
-- STEP 5: INITIAL AUDIT LOG ENTRY
-- ==============================================================================
INSERT INTO `audit_logs` (`user_id`, `user_email`, `user_role`, `action`, `details`)
VALUES (1, 'admin@insec.org.np', 'admin', 'SYSTEM_INIT',
  '{"message":"Database initialized with 15 sample records and 2 starter users."}');

-- ==============================================================================
-- DONE! Verify:
--   SELECT * FROM users;
--   SELECT record_code, full_name, district, incident_type FROM incident_records;
-- ==============================================================================
SELECT 'Setup complete!' AS status,
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM incident_records) AS total_records;
