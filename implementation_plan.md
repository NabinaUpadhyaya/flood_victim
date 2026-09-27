# INSEC "व्यक्तिगत घटना तथा प्रभावित व्यक्ति" (Personal Incident and Affected Person) Data Collection System

A complete full-stack web application designed for INSEC (अनौपचारिक क्षेत्र सेवा केन्द्र - इन्सेक) for collecting, managing, verifying, and reporting personal incident and affected-person data across Nepal.

---

## User Review Required

> [!IMPORTANT]
> - **Self-Contained Workspace**: All code, schemas, and configurations will be created strictly inside `d:\Flood_Victim` without linking or referencing any external directories.
> - **MySQL Service**: The backend will connect to MySQL on `localhost:3306`. The application includes automated database initialization scripts that create the database `insec_data` if it does not yet exist.
> - **XLSX Export**: Uses `exceljs` on the backend to stream genuine `.xlsx` files with professional Nepali column headers for either all records or current search/filter subsets.
> - **Role Separation**:
>   - **Public User**: No login required. Can submit incident records and receives a unique tracking code (e.g. `INSEC-2026-XXXX`). Cannot browse existing records or access admin panels.
>   - **Editor**: JWT login. Can search, filter, view all records, inspect details, add records, and edit existing records. Cannot delete records, export Excel, or manage users.
>   - **Admin**: Full control. Can do everything an Editor can do, plus delete records (with confirmation dialog), export Excel (all or filtered), manage Editor/Admin accounts, and inspect audit logs.

---

## System Architecture

```
d:\Flood_Victim\
├── client/                     # Next.js Frontend (Tailwind CSS, Nepali Unicode, Responsive)
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── page.tsx        # Public Data Collection Form (No login required)
│   │   │   ├── login/page.tsx  # Staff Login (Editor / Admin)
│   │   │   ├── dashboard/      # Protected Staff Portal
│   │   │   │   ├── page.tsx    # Dynamic Stats & Filterable Records Table
│   │   │   │   ├── new/        # Add New Record (Editor/Admin)
│   │   │   │   ├── [id]/edit/  # Edit Record (Editor/Admin)
│   │   │   │   └── users/      # User Management (Admin only)
│   │   │   ├── layout.tsx
│   │   │   └── globals.css     # Sky Blue / Teal / Lavender palette & form components
│   │   ├── components/         # Reusable UI Components
│   │   │   ├── FormSections/   # Form steps & fields (Nepali labels & conditional logic)
│   │   │   ├── Navbar.tsx      # Role-aware responsive navigation
│   │   │   ├── StatsCards.tsx  # 10 dynamic casualty/incident statistics
│   │   │   ├── FilterBar.tsx   # Multi-criteria filter controls
│   │   │   ├── RecordTable.tsx # Responsive data table with action modals
│   │   │   ├── RecordDetailModal.tsx # Full modal for viewing individual record
│   │   │   └── DeleteModal.tsx # Confirmation modal for Admin deletion
│   │   ├── services/           # API client (Axios/fetch with JWT interceptor)
│   │   └── types/              # TypeScript interfaces matching database schema
│   ├── package.json
│   └── tailwind.config.ts
│
├── server/                     # Node.js + Express REST API Backend
│   ├── src/
│   │   ├── config/             # Database connection pool (mysql2/promise) & JWT config
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── recordController.ts
│   │   │   ├── statsController.ts
│   │   │   ├── exportController.ts
│   │   │   └── userController.ts
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts # JWT verification & role authorization (Admin/Editor)
│   │   │   ├── rateLimiter.ts    # Rate limiting for public submissions
│   │   │   └── validate.ts       # Request validation
│   │   ├── routes/
│   │   │   ├── publicRoutes.ts   # POST /api/public/submit
│   │   │   ├── authRoutes.ts     # POST /api/auth/login, GET /api/auth/me
│   │   │   ├── recordRoutes.ts   # CRUD /api/records, GET /api/records/export
│   │   │   ├── statsRoutes.ts    # GET /api/dashboard/stats
│   │   │   └── userRoutes.ts     # CRUD /api/users
│   │   ├── utils/
│   │   │   ├── excelGenerator.ts # ExcelJS workbook builder with Nepali headers
│   │   │   └── auditLogger.ts    # Writes action history to audit_logs table
│   │   └── server.ts           # Express entry point
│   ├── package.json
│   └── .env.example
│
└── database/
    ├── schema.sql              # MySQL DDL (users, incident_records, audit_logs)
    ├── seed.sql                # Starter users (Admin, Editor) + 15 comprehensive records
    └── setup.js                # Automatic database & table provisioner script
```

---

## Form Sections & Field Mapping

The web form mirrors the INSEC paper questionnaire with exact Nepali Unicode text:

### Section 1: आधारभूत विवरण (Basic Information)
- **फारम नं.** (`form_number`): Text input
- **जिल्ला** (`district`): Dropdown / Text input (e.g., काठमाडौं, ललितपुर, कास्की, सिन्धुपाल्चोक)
- **पालिका** (`municipality`): Dropdown / Text input
- **वडा नं.** (`ward_number`): Numeric input
- **स्थान / बस्ती** (`location`): Text input
- **तथ्याङ्क संकलन मिति** (`collection_date`): Nepali / BS Date string

### Section 1.1: व्यक्तिगत विवरण (Person Details)
- **नाम, थर** (`full_name`): Required text
- **उमेर** (`age`): Number (0 - 120)
- **लिङ्ग** (`gender`): Radio (पुरुष - MALE, महिला - FEMALE, अन्य - OTHER)
- **परिवारको नाम / सम्पर्क व्यक्ति** (`family_contact`): Text input
- **मोबाइल / सम्पर्क नम्बर** (`phone`): Phone text input

### Section 2: घटनाको विवरण (Incident Details)
- **घटनाको प्रकार** (`incident_type`):
  - मृत्यु (Death)
  - बेपत्ता (Missing)
  - घाइते (Injured)
  - अपहरण (Kidnapped)
  - अन्य (Other) -> reveals **अन्य घटना प्रकार** (`other_incident_type`)
- **घटना भएको मिति** (`incident_date`): Date string
- **घटना भएको स्थान** (`incident_location`): Text input
- **घटनाको संक्षिप्त विवरण** (`incident_description`): Large textarea

### Section 3: मृत्यु / बेपत्ता भएमा (Death / Missing Details)
*Conditionally active when Incident Type is "मृत्यु" or "बेपत्ता"*
- **शव फेला परेको** (`body_found`): हो (Yes) / होइन (No)
- **पहिचान भएको** (`identified`): हो (Yes) / होइन (No)
- **बेपत्ता भए खोजीको अवस्था** (`search_status`): जारी (Ongoing) / रोकिएको (Suspended) / फेला परेको (Found)
- **परिवारलाई जानकारी / सूचना** (`family_informed`): भएको (Yes) / नभएको (No)

### Section 4: घाइते / अपाङ्गता भएमा (Injury / Disability Details)
*Conditionally active when Incident Type is "घाइते"*
- **चोट / अपाङ्गताको प्रकृति** (`injury_type`): Text input
- **उपचार गरिएको स्थान** (`treatment_location`): Text input
- **हालको अवस्था** (`current_condition`): उपचाररत (Under Treatment) / निको भएको (Recovered) / थप उपचार आवश्यक (Further Treatment Needed)

### Section 5: बालबालिका तथा महिला सम्बन्धी विवरण (Children & Women Details)
- **बालबालिका** (`is_child`): हो / होइन
  - यदि हो भने (checkboxes):
    - अभिभावक गुमाएको (`child_guardian_lost`)
    - परिवारबाट छुट्टिएको (`child_separated_from_family`)
    - विद्यालय प्रभावित (`child_school_affected`)
    - अन्य (`child_other` text)
- **महिला** (`is_woman`): हो / होइन
  - यदि हो भने (checkboxes):
    - गर्भवती (`is_pregnant`)
    - सुत्केरी (`is_postpartum`)
    - एकल महिला (`is_single_woman`)
    - महिला नेतृत्वको परिवार (`is_woman_led_family`)
    - अन्य (`woman_other` text)

### Section 6: सत्यापन र संकलन विवरण (Verification & Collection)
- **सत्यापन** (`verification_status`): भएको (Verified) / हुन बाँकी (Pending)
- **सत्यापन गर्ने व्यक्ति / संस्था** (`verified_by`): Text input
- **तथ्याङ्क संकलक** (`data_collector`): Text input
- **हस्ताक्षर / डिजिटल विवरण** (`signature_info`): Text input
- **मिति** (`collection_sign_date`): Date string

---

## Database Design

### 1. `users` Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor') NOT NULL DEFAULT 'editor',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. `incident_records` Table
```sql
CREATE TABLE IF NOT EXISTS incident_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_code VARCHAR(50) NOT NULL UNIQUE,
  form_number VARCHAR(100),
  district VARCHAR(100) NOT NULL,
  municipality VARCHAR(100) NOT NULL,
  ward_number INT,
  location VARCHAR(255),
  collection_date VARCHAR(20) NOT NULL,
  
  full_name VARCHAR(150) NOT NULL,
  age INT,
  gender ENUM('male', 'female', 'other') NOT NULL,
  family_contact VARCHAR(150),
  phone VARCHAR(50),
  
  incident_type ENUM('death', 'missing', 'injured', 'kidnapped', 'other') NOT NULL,
  other_incident_type VARCHAR(150),
  incident_date VARCHAR(20),
  incident_location VARCHAR(255),
  incident_description TEXT,
  
  body_found ENUM('yes', 'no') DEFAULT NULL,
  identified ENUM('yes', 'no') DEFAULT NULL,
  search_status ENUM('ongoing', 'suspended', 'found') DEFAULT NULL,
  family_informed ENUM('yes', 'no') DEFAULT NULL,
  
  injury_type VARCHAR(255),
  treatment_location VARCHAR(255),
  current_condition ENUM('under_treatment', 'recovered', 'further_treatment_needed') DEFAULT NULL,
  
  is_child BOOLEAN DEFAULT FALSE,
  child_guardian_lost BOOLEAN DEFAULT FALSE,
  child_separated_from_family BOOLEAN DEFAULT FALSE,
  child_school_affected BOOLEAN DEFAULT FALSE,
  child_other VARCHAR(255),
  
  is_woman BOOLEAN DEFAULT FALSE,
  is_pregnant BOOLEAN DEFAULT FALSE,
  is_postpartum BOOLEAN DEFAULT FALSE,
  is_single_woman BOOLEAN DEFAULT FALSE,
  is_woman_led_family BOOLEAN DEFAULT FALSE,
  woman_other VARCHAR(255),
  
  verification_status ENUM('verified', 'pending') DEFAULT 'pending',
  verified_by VARCHAR(150),
  data_collector VARCHAR(150),
  signature_info VARCHAR(255),
  collection_sign_date VARCHAR(20),
  
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_district (district),
  INDEX idx_incident_type (incident_type),
  INDEX idx_gender (gender),
  INDEX idx_is_child (is_child),
  INDEX idx_is_woman (is_woman),
  INDEX idx_verification (verification_status),
  INDEX idx_identified (identified)
);
```

### 3. `audit_logs` Table
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  user_email VARCHAR(150),
  user_role VARCHAR(50),
  action VARCHAR(50) NOT NULL,
  record_id INT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Design System & Palette

- **Background**: `#F8FAFC` (Slate 50)
- **Primary / Sky Blue**: `#E0F2FE` (Sky 100) / `#0284C7` (Sky 600)
- **Secondary / Teal**: `#CCFBF1` (Teal 100) / `#0D9488` (Teal 600)
- **Accent / Lavender**: `#EDE9FE` (Violet 100) / `#7C3AED` (Violet 600)
- **Cards & Surfaces**: `#FFFFFF` with subtle slate borders (`#E2E8F0`)
- **Text**: Primary `#0F172A`, Muted `#64748B`
- **Destructive**: `#EF4444` (used exclusively for delete actions, errors, and validation alerts)

---

## Verification Plan

### Automated & API Verification
1. **Database initialization**:
   - Run setup script to create MySQL database, tables, and test seeds.
   - Verify all 15 sample records load with complete column integrity.
2. **Public Submission Flow**:
   - `POST /api/public/submit` with sample Nepali payload.
   - Confirm new record ID generated (`INSEC-YYYY-XXXX`) and returned.
   - Verify database row inserted with correct fields.
3. **Authentication & Authorization**:
   - Editor login: Token issued, verifies editor role.
   - Admin login: Token issued, verifies admin role.
   - Editor attempting DELETE: Expect 403 Forbidden.
   - Editor attempting Excel export: Expect 403 Forbidden.
   - Admin attempting DELETE: Expect 200 OK after confirmation.
4. **Server-side Multi-criteria Filters**:
   - Test filtering: District = Kathmandu AND Woman = Yes AND Incident = Injured.
   - Test filtering: Children = Yes AND Incident = Death.
   - Confirm SQL uses parameterized query and returns accurate subset.
5. **Excel Export**:
   - Request `GET /api/records/export` with filter parameters.
   - Validate HTTP headers (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) and content.

### Manual / Browser Verification
1. Open public landing page at `http://localhost:3000`.
2. Fill the complete Nepali data collection form:
   - Test dynamic show/hide of death, missing, injury, child, and woman sections.
   - Submit form, verify clean confirmation card with record code.
3. Open `/login`:
   - Log in as Editor (`editor@insec.org.np` / `Editor@12345`).
   - Check dynamic statistic cards.
   - Search by name, filter by district, view details modal.
   - Add new record, edit existing record. Verify delete and export buttons are hidden/inaccessible.
4. Log out and log in as Admin (`admin@insec.org.np` / `Admin@12345`):
   - Verify delete button appears with confirmation modal.
   - Click "फिल्टर गरिएको तथ्याङ्क एक्सेलमा निर्यात गर्नुहोस्" (Export Filtered Excel) and verify file download.
   - Navigate to `/dashboard/users` and test user management (Add Editor, Reset Password, Role Change).
5. Mobile Responsiveness:
   - Resize to 375px mobile viewport to ensure all cards, form fields, and navigation scale smoothly without horizontal overflow.
