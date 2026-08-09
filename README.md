# Annamalai University CMS - Mobile Application (Android & iOS)

A complete, production-ready mobile application for **Annamalai University College Attendance Management System**, built with **React 19, Vite, TypeScript, TailwindCSS, Capacitor v6, and Supabase Cloud PostgreSQL**.

---

## Key Features

- **Multi-Role Portals**: Admin, Faculty, Student, and Parent.
- **Real Credentials Authentication**: Multi-role login gateway with role protection and account validation.
- **Registration & Admin Approval System**:
  - Student self-registration (including **Semester & Year** selection).
  - Faculty self-registration (including Staff Code & Designation).
  - OTP Email Verification during registration and profile email updates.
  - Admin **Pending Approvals Manager** to accept or reject new accounts.
- **Saturday Classes Configuration**:
  - Admin mapping to copy any weekday timetable (e.g. Saturday mirrors Monday or Tuesday).
  - Dedicated Saturday attendance marking, live QR code generation, and Saturday attendance percentage calculations.
  - Export Saturday Attendance data to CSV / Excel.
- **Weighted Attendance Engine**:
  - Automatic 3x weight calculation for Practical/Lab sessions ($1 \text{ Lab} = 3 \text{ Lectures}$).
  - Attendance percentage eligibility status (Safe $\ge 75\%$, Borderline $70-74\%$, Shortage $< 70\%$).
- **Live Camera QR Attendance**:
  - Faculty generates auto-expiring 5-minute QR codes.
  - Students scan QR codes using native device camera permissions.
- **Bulk Data Upload**: Batch import Students, Faculty, Timetables, and Subjects via CSV/Excel using SheetJS.
- **Parent Gateway**: Multi-children selector for monitoring wards' attendance, timetables, and leave applications.
- **Visual Design**:
  - Modern University Gold (`#D4AF37`) & Deep Crimson (`#800020`) color palette.
  - Aesthetic dark navy gradient background for Light Mode login gateway.
  - Mobile bottom navigation bar for mobile view (`< 768px`) with responsive desktop sidebar.
  - Full Light and Dark theme support.

---

## Project Structure

```
Smart-Attendance-System-App/
├── app/                        # Android Native Source Code
│   └── src/main/AndroidManifest.xml # Native Camera & Internet Permissions
├── src/
│   ├── components/
│   │   ├── admin/              # PendingApprovals, SaturdayConfig, BulkUpload
│   │   ├── auth/               # LoginGateway, RegisterModal
│   │   ├── calendar/           # AttendanceCalendar
│   │   ├── common/             # UniversityLogo, ThemeToggle
│   │   ├── dashboard/          # Admin, Faculty, Student, Parent Dashboards
│   │   ├── layout/             # Header, BottomNav
│   │   ├── profile/            # ProfileModal & OTP Email verification
│   │   ├── qr/                 # QRGenerator, QRScanner
│   │   └── reports/            # CSV/Excel Reports & Audit Logs
│   ├── services/
│   │   ├── authService.ts      # Multi-role authentication & OTP code generator
│   │   ├── dbService.ts        # Direct Supabase API & Capacitor Preferences cache
│   │   └── supabaseClient.ts   # Supabase REST client initialization
│   ├── types/                  # TypeScript interface declarations
│   ├── App.tsx                 # Main Application router & state container
│   ├── main.tsx                # Entry point
│   └── index.css               # Design system tokens & Tailwind CSS
├── capacitor.config.json       # Native Capacitor app metadata (App ID: edu.annamalai.cms)
├── package.json                # Project dependencies
├── schema.sql                  # Supabase database schema & RLS policies
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## Step-by-Step Setup & Build Instructions

### Step 1: Prerequisites
Ensure you have the following installed on your developer computer:
- **Node.js**: v18.0 or later ([nodejs.org](https://nodejs.org))
- **Android Studio** (for building Android APK / AAB)
- **Xcode** (macOS only, for building iOS IPA)

---

### Step 2: Set Up Supabase Cloud Database

1. Create a free project at [https://supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste the contents of `schema.sql` into the SQL Editor and click **Run**.
4. Copy your project **URL** and **anon public API Key** from **Project Settings $\rightarrow$ API**.
5. Update `src/services/supabaseClient.ts` with your credentials:
   ```typescript
   const DEFAULT_SUPABASE_URL = "https://your-project-id.supabase.co";
   const DEFAULT_SUPABASE_ANON_KEY = "your-anon-public-key";
   ```

---

### Step 3: Install & Run Web Preview Locally

```bash
# Clone the repository
git clone https://github.com/YourUsername/College_Attendance_Mobile_App.git
cd College_Attendance_Mobile_App

# Install node dependencies
npm install

# Start local Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Step 4: Build Web Distribution & Capacitor Sync

```bash
# Compile TypeScript and build production web assets to dist/
npm run build

# Add Android native platform (first time only)
npx cap add android

# Sync web build and native plugins with Android
npx cap sync
```

---

### Step 5: Build Android APK for Real Devices

To build an installable Android APK:

#### Option A: Command Line Build (Gradle)
```bash
# Navigate to android directory and compile debug APK
cd android
./gradlew assembleDebug

# Output APK path:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Option B: Android Studio GUI
```bash
# Open Android project in Android Studio
npx cap open android
```
In Android Studio:
1. Wait for Gradle sync to complete.
2. Click **Build $\rightarrow$ Build Bundle(s) / APK(s) $\rightarrow$ Build APK(s)**.
3. Transfer the generated `app-debug.apk` to any Android phone to install!

---

### Step 6: Preparing for Google Play Store Submission

1. In Android Studio, select **Build $\rightarrow$ Generate Signed Bundle / APK**.
2. Select **Android App Bundle (.aab)**.
3. Create a new Keystore certificate (.jks file) and set a secure password.
4. Select `release` build variant and click **Create**.
5. Upload the generated `.aab` file to your **Google Play Console** developer account under Production or Internal Testing.

---

### Step 7: Push as a New GitHub Repository

```bash
# Initialize clean git repository
git init

# Add all project files
git add .

# Create initial commit
git commit -m "Initial commit: Annamalai University CMS Mobile Application v1.0.0"

# Create main branch and link your GitHub repo
git branch -M main
git remote add origin https://github.com/YourUsername/College_Attendance_Mobile_App.git

# Push code to GitHub
git push -u origin main
```

---

## License

This project is open-source under the MIT License. Developed for Annamalai University CMS.
