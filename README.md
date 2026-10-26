# AgriGuardian Private Limited — Company Management Portal & Operations Manual

An enterprise web application built for **AgriGuardian Private Limited** to manage company administration, employees, interns, clients (Schools and Farmers), component vendors, quotations, invoices, payments, document generation, approvals, and audit trails.

---

## 🚀 Key Features

* **Dual Theme Engine:** Clean Light theme & deep Dark theme, styled with an Operations Handbook / SOP Manual aesthetic.
* **5 Authorized Logins & RBAC:**
  * **3 Director Logins (Full Admins):** Saivignesh R V (CEO), Haripriya S (CFO), Shengian T (MD).
  * **1 HR Login:** Harini Sri M (Project Management Lead & HR).
  * **1 Finance Login:** Kanika H A (Financial Documentation Lead & Accounts).
  * **Quick Demo One-Click Sign-in** on the login gate for seamless evaluation.
* **Persistent Database:** Real SQLite storage (`data/agriguardian.db`) with immediate write synchronization — added/modified records remain intact across page reloads and server restarts.
* **Universal Search Bar:** Real-time search across Employees, Interns, Customers, Quotations, and Invoices by Name, Code (`AG-EMP-...`, `AG-INT-...`, `QTN-...`), Category, or Department.
* **Directories with Edit & Delete:** Full CRUD capabilities for Employees, Interns, Customers, and Vendors with modal dialogs and confirmation safety.
* **Landscape Internship Certificate (297mm × 210mm):** High-resolution A4 Landscape certificate with ornate border, AgriGuardian crest, Government of India MSME emblem, dual signatories, and official corporate seal.
* **Authentic Extracted Signatures:** Transparent vector-quality signatures of all 3 executive directors.

---

## 🔑 Default Login Credentials

| Role | Name | Username / Email | Password | Fallback Demo Password |
| :--- | :--- | :--- | :--- | :--- |
| **Director & MD (Admin)** | Shengian T | `shengian` | `Director@2026` | `agri123` |
| **Founder & CEO (Admin)** | Saivignesh R V | `saivignesh` | `Director@2026` | `agri123` |
| **Director & CFO (Admin)** | Haripriya S | `haripriya` | `Director@2026` | `agri123` |
| **HR Manager** | Harini Sri M | `hr` | `HR@2026` | `agri123` |
| **Finance Manager** | Kanika H A | `finance` | `Finance@2026` | `agri123` |

> *Note: You can also click any of the 5 one-click login persona buttons on the sign-in screen.*

---

## 💻 Local Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the production server
npm start

# 3. Open in your browser
http://localhost:8080
```

---

## 🌐 Deploy to Render (Free Tier)

This repository includes a pre-configured `render.yaml` blueprint for zero-config deployment to [Render](https://render.com).

### Step 1: Push this repository to your GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: AgriGuardian Portal production release"

# Link to your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/agriguardian-portal.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your `agriguardian-portal` repository.
4. Render automatically detects `render.yaml`:
   * **Runtime:** Node
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
   * **Environment Variables:** `PORT=10000`, `NODE_VERSION=20.18.0`
5. Click **Create Web Service**. Your portal will be live in ~2 minutes with a free HTTPS URL (e.g. `https://agriguardian-portal.onrender.com`).

---

## 📁 Repository Structure

```
agriguardian-portal/
├── data/
│   └── agriguardian.db        # SQLite database (auto-seeded on first run)
├── public/
│   ├── index.html             # Application UI & Modals
│   ├── style.css              # Light & Dark theme stylesheets
│   ├── app.js                 # Frontend MVC controller & API client
│   ├── logo-shield.png        # Official AgriGuardian Crest
│   ├── logo-seal.png          # Circular Corporate Product Seal
│   ├── sig-saivignesh.png     # Transparent Signature (Founder & CEO)
│   ├── sig-haripriya.png      # Transparent Signature (Director & CFO)
│   └── sig-shengian.png       # Transparent Signature (Director & MD)
├── server.js                  # Production Node.js + Express backend
├── package.json               # NPM manifest
├── render.yaml                # Render Blueprint configuration
├── .gitignore
└── README.md
```

---

## 🛡️ License & Copyright
© 2026 AgriGuardian Private Limited. All rights reserved. Corporate Identification Number (CIN: U01639TN2026PTC194498).
