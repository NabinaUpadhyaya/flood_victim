-- ==============================================================================
-- INSEC "व्यक्तिगत घटना तथा प्रभावित व्यक्ति" (Personal Incident and Affected Person)
-- Database Schema for MySQL / MariaDB (utf8mb4 for complete Nepali Unicode support)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `insec_data`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `insec_data`;

-- ------------------------------------------------------------------------------
-- 1. USERS TABLE (प्रयोक्ता तालिका)
-- Roles: 'admin', 'editor', 'viewer' 
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Full name of staff member',
  `email` VARCHAR(150) NOT NULL UNIQUE COMMENT 'Login email address',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
  `role` ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer' COMMENT 'User access role',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active/Deactivated status',
  `is_verified` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Email verification status (TRUE for verified)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. INCIDENT RECORDS TABLE (घटना तथा प्रभावित व्यक्ति तथ्याङ्क तालिका)
-- Contains all fields from the official INSEC paper data collection form
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `incident_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `record_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique identifier e.g. INSEC-2026-0001',
  
  -- SECTION 1: BASIC INFORMATION (फारम नं., ठेगाना, संकलन मिति)
  `form_number` VARCHAR(100) NULL COMMENT 'फारम नं.',
  `district` VARCHAR(100) NOT NULL COMMENT 'जिल्ला (District)',
  `municipality` VARCHAR(100) NOT NULL COMMENT 'पालिका (Municipality/Rural Municipality)',
  `ward_number` INT NULL COMMENT 'वडा नं. (Ward number)',
  `location` VARCHAR(255) NULL COMMENT 'स्थान / बस्ती (Settlement/Village/Tole)',
  `collection_date` VARCHAR(30) NOT NULL COMMENT 'तथ्याङ्क संकलन मिति (Bikram Sambat BS / YYYY-MM-DD)',

  -- SECTION 1.1: PERSON DETAILS (१. विवरण)
  `full_name` VARCHAR(150) NOT NULL COMMENT 'नाम, थर (Full name of affected person)',
  `age` INT NULL COMMENT 'उमेर (Age)',
  `gender` ENUM('male', 'female', 'other') NOT NULL COMMENT 'लिङ्ग (पुरुष, महिला, अन्य)',
  `family_contact` VARCHAR(150) NULL COMMENT 'परिवारको नाम / सम्पर्क व्यक्ति (Family contact person)',
  `phone` VARCHAR(50) NULL COMMENT 'मोबाइल / सम्पर्क नम्बर (Contact phone number)',

  -- SECTION 2: INCIDENT DETAILS (२. घटनाको विवरण)
  `incident_type` ENUM('death', 'missing', 'injured', 'disabled', 'other') NOT NULL COMMENT 'घटनाको प्रकार (मृत्यु, बेपत्ता, घाइते, अपाङ्गता, अन्य)',
  `other_incident_type` VARCHAR(150) NULL COMMENT 'यदि अन्य भए उल्लेख गर्नुहोस् (Other incident specification)',
  `incident_date` VARCHAR(30) NULL COMMENT 'घटना भएको मिति (Incident date)',
  `incident_location` VARCHAR(255) NULL COMMENT 'घटना भएको स्थान (Incident location)',
  `incident_description` TEXT NULL COMMENT 'घटनाको संक्षिप्त विवरण (Incident summary description)',

  -- SECTION 3: DEATH / MISSING DETAILS (३. मृत्यु / बेपत्ता भएमा)
  `body_found` ENUM('yes', 'no') NULL DEFAULT NULL COMMENT 'शव फेला परेको (हो / होइन)',
  `identified` ENUM('yes', 'no') NULL DEFAULT NULL COMMENT 'पहिचान भएको (हो / होइन)',
  `search_status` ENUM('ongoing', 'suspended', 'found') NULL DEFAULT NULL COMMENT 'बेपत्ता भए खोजीको अवस्था (जारी / रोकिएको / फेला परेको)',
  `family_informed` ENUM('yes', 'no') NULL DEFAULT NULL COMMENT 'परिवारलाई जानकारी / सूचना (भएको / नभएको)',

  -- SECTION 4: INJURY DETAILS (४. घाइते / अपाङ्गता भएमा)
  `injury_type` VARCHAR(255) NULL COMMENT 'चोट / अपाङ्गताको प्रकृति (Nature of injury/disability)',
  `treatment_location` VARCHAR(255) NULL COMMENT 'उपचार गरिएको स्थान (Treatment location / Hospital)',
  `current_condition` ENUM('under_treatment', 'recovered', 'further_treatment_needed') NULL DEFAULT NULL COMMENT 'हालको अवस्था (उपचाररत / निको भएको / थप उपचार आवश्यक)',

  -- SECTION 5: CHILDREN & WOMEN DETAILS (५. बालबालिका तथा महिला सम्बन्धी विवरण)
  -- बालबालिका (Children)
  `is_child` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'बालबालिका (हो = TRUE, होइन = FALSE)',
  `child_guardian_lost` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'अभिभावक गुमाएको',
  `child_separated_from_family` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'परिवारबाट छुट्टिएको',
  `child_school_affected` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'विद्यालय प्रभावित',
  `child_other` VARCHAR(255) NULL COMMENT 'अन्य बालबालिका विवरण',

  -- महिला (Women)
  `is_woman` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'महिला (हो = TRUE, होइन = FALSE)',
  `is_pregnant` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'गर्भवती',
  `is_postpartum` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'सुत्केरी',
  `is_single_woman` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'एकल महिला',
  `is_woman_led_family` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'महिला नेतृत्वको परिवार',
  `woman_other` VARCHAR(255) NULL COMMENT 'अन्य महिला विवरण',

  -- SECTION 6: VERIFICATION & ENUMERATOR DETAILS (सत्यापन)
  `verification_status` ENUM('verified', 'pending') NOT NULL DEFAULT 'pending' COMMENT 'सत्यापन (भएको = verified, हुन बाँकी = pending)',
  `verified_by` VARCHAR(150) NULL COMMENT 'सत्यापन गर्ने व्यक्ति / संस्था',
  `data_collector` VARCHAR(150) NULL COMMENT 'तथ्याङ्क संकलकको नाम',
  `signature_info` VARCHAR(255) NULL COMMENT 'हस्ताक्षर / विवरण',
  `collection_sign_date` VARCHAR(30) NULL COMMENT 'मिति',

  -- AUDIT & SYSTEM METADATA
  `created_by` INT NULL COMMENT 'User ID who created if logged in (NULL for public)',
  `updated_by` INT NULL COMMENT 'User ID who last updated',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Foreign keys & indexes for fast search and filter
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_district` (`district`),
  INDEX `idx_municipality` (`municipality`),
  INDEX `idx_incident_type` (`incident_type`),
  INDEX `idx_gender` (`gender`),
  INDEX `idx_is_child` (`is_child`),
  INDEX `idx_is_woman` (`is_woman`),
  INDEX `idx_verification` (`verification_status`),
  INDEX `idx_identified` (`identified`),
  INDEX `idx_current_condition` (`current_condition`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. AUDIT LOGS TABLE (अडिट लग तालिका)
-- Tracks actions performed by Admin/Editor (CREATE, UPDATE, DELETE, EXPORT, LOGIN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `user_email` VARCHAR(150) NULL,
  `user_role` VARCHAR(50) NULL,
  `action` VARCHAR(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, EXPORT, LOGIN',
  `record_id` INT NULL COMMENT 'Associated incident_records ID',
  `details` TEXT NULL COMMENT 'JSON string with changed fields or parameters',
  `ip_address` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. USER OTPS TABLE (प्रयोगकर्ता इमेल प्रमाणीकरण र पासवर्ड रिसेट कोड)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_otps` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `purpose` ENUM('email_verification', 'password_reset') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `consumed_at` DATETIME NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_otps_email_purpose` (`email`, `purpose`),
  INDEX `idx_user_otps_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. USER AUDIT LOGS TABLE (कर्मचारी/प्रयोगकर्ता अडिट लग तालिका)
-- Tracks account creation, deletion, password changes, verification, and role updates
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `performed_by_user_id` INT NULL,
  `performed_by_name` VARCHAR(150) NOT NULL,
  `affected_user_id` INT NULL,
  `affected_user_name` VARCHAR(150) NOT NULL,
  `affected_user_email` VARCHAR(150) NOT NULL,
  `affected_user_role` VARCHAR(50) NOT NULL,
  `description` TEXT NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_audit_action` (`action`),
  INDEX `idx_user_audit_affected_email` (`affected_user_email`),
  INDEX `idx_user_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
