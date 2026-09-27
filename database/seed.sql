-- ==============================================================================
-- INSEC Personal Incident and Affected Person Seed Data (MySQL)
-- Accounts:
--   Admin:  admin@insec.org.np  / Admin@12345
--   Editor: editor@insec.org.np / Editor@12345
-- ==============================================================================

USE `insec_data`;

-- 1. USERS
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`)
VALUES
  (1, 'केन्द्रीय प्रशासक (Admin)', 'admin@insec.org.np', '$2a$10$7ZhyE/o11Uj6lSsm2vF4g.v1hL2fNkV/lWzQ8OqYq0M.gq/5jH45e', 'admin', 1),
  (2, 'तथ्याङ्क सम्पादक (Editor)', 'editor@insec.org.np', '$2a$10$m6d45e0d.o11Uj6lSsm2vF4g.v1hL2fNkV/lWzQ8OqYq0M.gq/5jH45e', 'editor', 1)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. SAMPLE INCIDENT RECORDS
INSERT INTO `incident_records` (
  `id`, `record_code`, `form_number`, `district`, `municipality`, `ward_number`, `location`, `collection_date`,
  `full_name`, `age`, `gender`, `family_contact`, `phone`,
  `incident_type`, `other_incident_type`, `incident_date`, `incident_location`, `incident_description`,
  `body_found`, `identified`, `search_status`, `family_informed`,
  `injury_type`, `treatment_location`, `current_condition`,
  `is_child`, `child_guardian_lost`, `child_separated_from_family`, `child_school_affected`, `child_other`,
  `is_woman`, `is_pregnant`, `is_postpartum`, `is_single_woman`, `is_woman_led_family`, `woman_other`,
  `verification_status`, `verified_by`, `data_collector`, `signature_info`, `collection_sign_date`, `created_by`
) VALUES
(1, 'INSEC-2026-0001', 'FOR-81-01', 'काठमाडौं', 'काठमाडौं महानगरपालिका', 14, 'कुलेश्वर, बल्खु', '२०८१-०६-१२', 'रामचन्द्र खड्का', 42, 'male', 'पार्वती खड्का (श्रीमती)', '9841234567', 'death', NULL, '२०८१-०६-११', 'बल्खु खोला किनार', 'बाढी आएको समयमा खोला किनारबाट सुरक्षित स्थानतर्फ जान खोज्दा बाढीले बगाएर मृत्यु भएको।', 'yes', 'yes', 'found', 'yes', NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, 0, 0, 0, NULL, 'verified', 'इन्सेक केन्द्रीय कार्यालय', 'सुरेश श्रेष्ठ', 'डिजिटल हस्ताक्षर प्रमाणीत', '२०८१-०६-१३', 1),
(2, 'INSEC-2026-0002', 'FOR-81-02', 'ललितपुर', 'गोदावरी नगरपालिका', 6, 'टिकाभैरव, लेले', '२०८१-०६-१२', 'सुनिता तामाङ', 26, 'female', 'सोम बहादुर तामाङ', '9808112233', 'injured', NULL, '२०८१-०६-११', 'गोदावरी लेले खण्ड', 'पहिरोमा परी कम्मर र खुट्टामा गम्भीर चोट लागेको, स्थानीयले उद्धार गरेका।', NULL, 'yes', NULL, 'yes', 'खुट्टा र ढाड भाँचिएको (Fracture)', 'पाटन अस्पताल, लगनखेल', 'under_treatment', 0, 0, 0, 0, NULL, 1, 1, 0, 0, 0, '७ महिनाको गर्भवती, विशेष उपचार भइरहेको', 'verified', 'ललितपुर इन्सेक प्रतिनिधि', 'अन्जना महर्जन', 'अन्जना महर्जन', '२०८१-०६-१३', 2),
(3, 'INSEC-2026-0003', 'FOR-81-03', 'सिन्धुपाल्चोक', 'भोटेकोशी गाउँपालिका', 4, 'तातोपानी, डाँडागाउँ', '२०८१-०६-१३', 'अज्ञात व्यक्ति (पुरुष)', 35, 'male', 'पहिचान हुन बाँकी', NULL, 'death', NULL, '२०८१-०६-११', 'भोटेकोशी नदी किनार', 'नदी किनारमा शव फेला परेको, अनुहार चिन्न नसकिने अवस्थामा रहेकोले सनाखत हुन बाँकी।', 'yes', 'no', 'found', 'no', NULL, NULL, NULL, 0, 0, 0, 0, NULL, 0, 0, 0, 0, 0, NULL, 'pending', NULL, 'दिपक तामाङ', 'दिपक तामाङ', '२०८१-०६-१३', NULL),
(4, 'INSEC-2026-0004', 'FOR-81-04', 'कास्की', 'पोखरा महानगरपालिका', 19, 'लामाचौर', '२०८१-०६-१४', 'आयुष गुरुङ', 11, 'male', 'धनमाया गुरुङ (हजुरआमा)', '9812998877', 'missing', NULL, '२०८१-०६-१२', 'सेती नदी किनार', 'विद्यालयबाट घर फर्कने क्रममा बाढी आएको खोल्सा तर्न खोज्दा बेपत्ता भएको, खोजी जारी।', 'no', 'yes', 'ongoing', 'yes', NULL, NULL, NULL, 1, 0, 1, 1, 'कक्षा ५ को विद्यार्थी, विद्यालय सामग्री नष्ट', 0, 0, 0, 0, 0, NULL, 'verified', 'कास्की जिल्ला संयोजक', 'सरिता बराल', 'सरिता बराल', '२०८१-०६-१४', 2),
(5, 'INSEC-2026-0005', 'FOR-81-05', 'कैलाली', 'टीकापुर नगरपालिका', 8, 'फाँटा टोल', '२०८१-०६-१५', 'राधिका चौधरी', 38, 'female', 'राधिका चौधरी (स्वयं)', '9848554433', 'injured', NULL, '२०८१-०६-१२', 'कर्णाली नदी तटबन्ध', 'तटबन्ध फुट्दा घर भत्किएर पुरिएकी, टाउको र हातमा चोट।', NULL, 'yes', NULL, 'yes', 'टाउकोमा ५ टाँका लागेको र हात मर्किएको', 'टीकापुर अस्पताल', 'recovered', 0, 0, 0, 0, NULL, 1, 0, 0, 1, 1, '३ जना बालबच्चाको एकल हेरचाहकर्ता', 'verified', 'सुदूरपश्चिम प्रदेश कार्यालय', 'विनोद चौधरी', 'विनोद चौधरी', '२०८१-०६-१५', 1)
ON DUPLICATE KEY UPDATE `record_code`=VALUES(`record_code`);
