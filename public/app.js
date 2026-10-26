/**
 * AgriGuardian Private Limited — Master Company Management Portal & Operations Engine
 * Client-Side Application Controller
 */

// Helper Selectors
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// API Client
const API = {
  headers: () => ({
    'Content-Type': 'application/json',
    ...(State.authToken ? { 'Authorization': `Bearer ${State.authToken}` } : {})
  }),
  get: async (url) => {
    try {
      const res = await fetch(url, { headers: API.headers() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`API GET ${url} error:`, err);
      return null;
    }
  },
  post: async (url, data) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: API.headers(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      console.error(`API POST ${url} error:`, err);
      return { error: err.message };
    }
  },
  put: async (url, data) => {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: API.headers(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      console.error(`API PUT ${url} error:`, err);
      return { error: err.message };
    }
  },
  delete: async (url) => {
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: API.headers()
      });
      return await res.json();
    } catch (err) {
      console.error(`API DELETE ${url} error:`, err);
      return { error: err.message };
    }
  }
};

// Application State
const State = {
  currentUser: null,
  currentRole: 'Super Admin',
  currentUserName: 'Shengian T',
  authToken: localStorage.getItem('ag_token') || null,
  theme: localStorage.getItem('ag_theme') || 'light',
  employees: [],
  interns: [],
  customers: [],
  vendors: [],
  quotations: [],
  invoices: [],
  payments: [],
  documents: [],
  audits: []
};

// Initialize Theme
function applyTheme(theme) {
  State.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ag_theme', theme);
  const icon = $('#theme-icon');
  const label = $('#theme-label');
  if (theme === 'dark') {
    if (icon) icon.textContent = '☀️';
    if (label) label.textContent = 'Light';
  } else {
    if (icon) icon.textContent = '🌙';
    if (label) label.textContent = 'Dark';
  }
}

// Navigation Handler
function navigateTo(sectionId, subTabId = null) {
  $$('.portal-section').forEach(sec => sec.classList.remove('active'));
  $$('.sidebar-nav .nav-item').forEach(btn => btn.classList.remove('active'));

  const targetSec = $(`#sec-${sectionId}`);
  if (targetSec) targetSec.classList.add('active');

  const navBtn = $(`[data-nav="${sectionId}"]`);
  if (navBtn) navBtn.classList.add('active');

  const titles = {
    dashboard: 'Executive Overview & Operations Center',
    hr: 'Human Resources & Internship Division',
    customers: 'School & Farmer Client Management',
    vendors: 'Vendor & Component Supplier Directory',
    sales: 'Sales Register, Quotations & Payment Ledger',
    documents: 'Official Document Generation & Archival',
    approvals: 'Document & Quotation Review Workflow',
    emails: 'Transactional PDF Email Delivery Log',
    reports: 'Financial & Operational Analytics',
    settings: 'Company Profile, Numbering & SOP Manual'
  };

  const pageTitle = $('#page-title');
  if (pageTitle && titles[sectionId]) pageTitle.textContent = titles[sectionId];

  // Reload relevant section data
  if (sectionId === 'dashboard') loadDashboard();
  if (sectionId === 'hr') loadHR();
  if (sectionId === 'customers') loadCustomers();
  if (sectionId === 'vendors') loadVendors();
  if (sectionId === 'sales') loadSales();
  if (sectionId === 'documents') loadDocuments();
  if (sectionId === 'approvals') loadApprovals();
  if (sectionId === 'emails') loadEmails();
  if (sectionId === 'settings') loadSettings();

  if (subTabId) {
    const subTabBtn = $(`[data-settingstab="${subTabId.replace('tab-', '')}"]`);
    if (subTabBtn) subTabBtn.click();
  }
}

// Open & Close Modals
function openModal(modalId) {
  const el = $(`#${modalId}`);
  if (el) el.classList.add('active');
}

function closeModal(modalId) {
  const el = $(`#${modalId}`);
  if (el) el.classList.remove('active');
}

// Format Currency
function formatINR(val) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
}

// =========================================================================
// LOAD SECTION DATA
// =========================================================================

async function loadDashboard() {
  const data = await API.get('/api/dashboard');
  if (!data) return;

  $('#kpi-emp').textContent = data.employees || 0;
  $('#badge-emp-count').textContent = data.employees || 0;
  $('#kpi-intern').textContent = data.interns || 0;
  $('#kpi-schools').textContent = data.schools || 0;
  $('#kpi-farmers').textContent = data.farmers || 0;
  $('#kpi-invoiced').textContent = formatINR(data.total_invoiced);
  $('#kpi-collected').textContent = formatINR(data.total_collected);
  $('#badge-pending-approvals').textContent = data.pending_quotations || 0;

  // Render Dashboard Quotes Table
  const tbodyQuotes = $('#table-dashboard-quotes');
  if (tbodyQuotes) {
    if (!data.recent_quotations || data.recent_quotations.length === 0) {
      tbodyQuotes.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No quotations generated yet.</td></tr>';
    } else {
      tbodyQuotes.innerHTML = data.recent_quotations.map(q => `
        <tr>
          <td><span class="code-pill">${q.quote_no}</span></td>
          <td><b>${escapeHTML(q.customer_name)}</b></td>
          <td><b>${formatINR(q.total_amount)}</b></td>
          <td><span class="status-badge ${badgeClass(q.status)}">${q.status}</span></td>
          <td>${q.quote_date || '-'}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="previewQuotation(${q.id})">Preview Sheet</button>
            ${q.status === 'Approved' ? `<button class="btn btn-primary btn-sm" onclick="convertToInvoice(${q.id})">Convert to Invoice</button>` : ''}
          </td>
        </tr>
      `).join('');
    }
  }

  // Render Dashboard Audits
  const tbodyAudits = $('#table-dashboard-audits');
  if (tbodyAudits && data.recent_audits) {
    tbodyAudits.innerHTML = data.recent_audits.map(a => `
      <tr>
        <td style="font-family:var(--font-mono); font-size:0.75rem;">${a.timestamp}</td>
        <td><b>${escapeHTML(a.user_name)}</b></td>
        <td><span class="code-pill">${a.action}</span></td>
        <td><code>${a.entity_ref || '-'}</code></td>
        <td style="color:var(--text-muted);">${escapeHTML(a.details)}</td>
      </tr>
    `).join('');
  }
}

async function loadHR() {
  const employees = await API.get('/api/employees');
  const interns = await API.get('/api/interns');

  State.employees = employees || [];
  State.interns = interns || [];

  renderEmployeesTable(State.employees);
  renderInternsTable(State.interns);
}

function renderEmployeesTable(list) {
  const tbody = $('#table-employees');
  if (!tbody) return;
  tbody.innerHTML = list.map(e => `
    <tr>
      <td><span class="code-pill">${e.employee_code}</span></td>
      <td><b>${escapeHTML(e.name)}</b></td>
      <td>${escapeHTML(e.designation)}</td>
      <td><span class="status-badge" style="background:var(--bg-surface-subtle); border:1px solid var(--border-color);">${escapeHTML(e.department)}</span></td>
      <td>${e.joining_date}</td>
      <td style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(e.email || '-')}<br>${escapeHTML(e.phone || '')}</td>
      <td><span class="status-badge active">${e.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openEditEmployee(${e.id})">✏️ Edit</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteEmployee(${e.id}, '${escapeHTML(e.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function renderInternsTable(list) {
  const tbody = $('#table-interns');
  if (!tbody) return;
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No interns match your search criteria.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(i => `
    <tr>
      <td><span class="code-pill">${i.intern_code}</span></td>
      <td><b>${escapeHTML(i.name)}</b></td>
      <td>${escapeHTML(i.college || '-')}</td>
      <td>${escapeHTML(i.designation)}</td>
      <td>${i.joining_date} to ${i.end_date}</td>
      <td>${escapeHTML(i.mentor || 'Jas Annuncia M')}</td>
      <td><span class="status-badge ${i.status === 'Completed' ? 'delivered' : 'active'}">${i.status}</span></td>
      <td>
        <button class="btn btn-gold btn-sm" onclick="previewOfficialDoc('landscape-certificate')">📜 Landscape Certificate</button>
        <button class="btn btn-secondary btn-sm" onclick="openEditIntern(${i.id})">✏️</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteIntern(${i.id}, '${escapeHTML(i.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function loadCustomers() {
  const customers = await API.get('/api/customers');
  State.customers = customers || [];
  renderCustomersTable(State.customers);
}

function renderCustomersTable(list) {
  const tbody = $('#table-customers');
  if (!tbody) return;
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No clients match your search criteria.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td><span class="code-pill">${c.customer_code}</span></td>
      <td><span class="status-badge ${c.category.toLowerCase()}">${c.category}</span></td>
      <td><b>${escapeHTML(c.name)}</b></td>
      <td>${escapeHTML(c.contact_person || '-')}</td>
      <td>${escapeHTML(c.district || c.state || '-')}</td>
      <td style="font-family:var(--font-mono); font-size:0.75rem;">${c.gstin || 'Unregistered'}</td>
      <td><span class="status-badge active">${c.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openCreateQuoteForCustomer(${c.id}, '${escapeHTML(c.name)}', '${c.category}')">+ Quotation</button>
        <button class="btn btn-secondary btn-sm" onclick="openEditCustomer(${c.id})">✏️</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteCustomer(${c.id}, '${escapeHTML(c.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function loadVendors() {
  const vendors = await API.get('/api/vendors');
  State.vendors = vendors || [];
  renderVendorsTable(State.vendors);
}

function renderVendorsTable(list) {
  const tbody = $('#table-vendors');
  if (!tbody) return;
  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No vendors match your search criteria.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(v => `
    <tr>
      <td><span class="code-pill">${v.vendor_code}</span></td>
      <td><b>${escapeHTML(v.name)}</b></td>
      <td>${escapeHTML(v.category)}</td>
      <td>${escapeHTML(v.contact_person || '-')}</td>
      <td>${escapeHTML(v.email || '')}<br><small style="color:var(--text-muted);">${escapeHTML(v.phone || '')}</small></td>
      <td style="font-family:var(--font-mono); font-size:0.75rem;">${v.gstin || '-'}</td>
      <td><span class="status-badge active">${v.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openEditVendor(${v.id})">✏️ Edit</button>
        <button class="btn btn-secondary btn-sm" onclick="deleteVendor(${v.id}, '${escapeHTML(v.name)}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function loadSales() {
  const quotes = await API.get('/api/quotations');
  const invoices = await API.get('/api/invoices');
  const payments = await API.get('/api/payments');
  const catalog = await API.get('/api/products');

  State.quotations = quotes || [];
  State.invoices = invoices || [];
  State.payments = payments || [];

  // Quotations Table
  const tbodyQ = $('#table-quotations');
  if (tbodyQ) {
    tbodyQ.innerHTML = State.quotations.map(q => `
      <tr>
        <td><span class="code-pill">${q.quote_no}</span></td>
        <td><span class="status-badge ${q.category.toLowerCase()}">${q.category}</span></td>
        <td><b>${escapeHTML(q.customer_name)}</b></td>
        <td>${escapeHTML(q.project_title)}</td>
        <td><b>${formatINR(q.total_amount)}</b></td>
        <td style="font-size:0.75rem;">${escapeHTML(q.signatory)}</td>
        <td><span class="status-badge ${badgeClass(q.status)}">${q.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="previewQuotation(${q.id})">Preview</button>
          ${q.status === 'Approved' ? `<button class="btn btn-primary btn-sm" onclick="convertToInvoice(${q.id})">Convert to Invoice</button>` : ''}
          ${q.status === 'Pending Approval' ? `<button class="btn btn-gold btn-sm" onclick="approveQuotation(${q.id})">Approve</button>` : ''}
        </td>
      </tr>
    `).join('');
  }

  // Invoices Table
  const tbodyInv = $('#table-invoices');
  if (tbodyInv) {
    if (State.invoices.length === 0) {
      tbodyInv.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No invoices generated yet. Convert an approved quotation to an invoice.</td></tr>';
    } else {
      tbodyInv.innerHTML = State.invoices.map(inv => `
        <tr>
          <td><span class="code-pill">${inv.invoice_no}</span></td>
          <td><code>${inv.quotation_ref || '-'}</code></td>
          <td><b>${escapeHTML(inv.customer_name)}</b></td>
          <td>${inv.invoice_date}</td>
          <td><b>${formatINR(inv.total_amount)}</b></td>
          <td style="color:var(--primary); font-weight:700;">${formatINR(inv.amount_paid)}</td>
          <td style="color:${inv.balance > 0 ? 'var(--accent-gold-dark)' : 'var(--primary)'}; font-weight:700;">${formatINR(inv.balance)}</td>
          <td><span class="status-badge ${badgeClass(inv.status)}">${inv.status}</span></td>
          <td>
            ${inv.balance > 0 ? `<button class="btn btn-primary btn-sm" onclick="openRecordPayment(${inv.id}, '${inv.invoice_no}', ${inv.balance})">Record Payment</button>` : '<span class="status-badge paid">Settled</span>'}
          </td>
        </tr>
      `).join('');
    }
  }

  // Payments Table
  const tbodyPay = $('#table-payments');
  if (tbodyPay) {
    if (State.payments.length === 0) {
      tbodyPay.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No payment receipts recorded yet.</td></tr>';
    } else {
      tbodyPay.innerHTML = State.payments.map(p => `
        <tr>
          <td><span class="code-pill">${p.receipt_no}</span></td>
          <td><code>${p.invoice_no}</code></td>
          <td><b>${escapeHTML(p.customer_name)}</b></td>
          <td>${p.payment_date}</td>
          <td><b>${formatINR(p.amount)}</b></td>
          <td>${p.payment_mode}</td>
          <td style="font-family:var(--font-mono); font-size:0.75rem;">${p.reference_no}</td>
        </tr>
      `).join('');
    }
  }

  // Catalog Cards
  const catCards = $('#catalog-cards');
  if (catCards && catalog) {
    catCards.innerHTML = catalog.map(p => `
      <div class="stat-card">
        <div class="stat-label">${escapeHTML(p.category)} <span class="nav-badge gold">${p.unit}</span></div>
        <div class="stat-value" style="font-size:1.1rem; margin-top:0.5rem;">${escapeHTML(p.name)}</div>
        <div class="stat-subtext" style="margin:0.4rem 0;">${escapeHTML(p.description)}</div>
        <div style="font-size:1.15rem; font-weight:800; color:var(--primary); margin-top:auto;">${formatINR(p.unit_price)} <small style="font-size:0.7rem; color:var(--text-muted);">+ ${p.tax_rate}% GST</small></div>
      </div>
    `).join('');
  }
}

async function loadDocuments() {
  const docs = await API.get('/api/documents');
  State.documents = docs || [];
  const tbody = $('#table-documents');
  if (!tbody) return;
  tbody.innerHTML = State.documents.map(d => `
    <tr>
      <td><span class="code-pill">${d.doc_no}</span></td>
      <td><b>${escapeHTML(d.doc_type)}</b></td>
      <td>${escapeHTML(d.recipient_name)}<br><small style="color:var(--text-muted);">${escapeHTML(d.recipient_sub || '')}</small></td>
      <td>${d.issue_date}</td>
      <td>${escapeHTML(d.signatory)}</td>
      <td><span class="status-badge ${badgeClass(d.status)}">${d.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="previewDocRecord(${d.id})">Preview & Print</button>
      </td>
    </tr>
  `).join('');
}

async function loadApprovals() {
  const quotes = await API.get('/api/quotations');
  const pendingQuotes = (quotes || []).filter(q => q.status === 'Pending Approval');
  $('#badge-pending-approvals').textContent = pendingQuotes.length;

  const tbody = $('#table-approvals-pending');
  if (!tbody) return;

  if (pendingQuotes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">All documents and quotations have been reviewed and approved.</td></tr>';
  } else {
    tbody.innerHTML = pendingQuotes.map(q => `
      <tr>
        <td><span class="code-pill">${q.quote_no}</span></td>
        <td>Quotation (${q.category})</td>
        <td><b>${escapeHTML(q.customer_name)}</b></td>
        <td>${escapeHTML(q.prepared_by || 'Operations')}</td>
        <td><b>${formatINR(q.total_amount)}</b></td>
        <td><span class="status-badge pending">Pending Approval</span></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="approveQuotation(${q.id})">Approve</button>
          <button class="btn btn-secondary btn-sm" onclick="rejectQuotation(${q.id})">Reject</button>
        </td>
      </tr>
    `).join('');
  }
}

async function loadEmails() {
  const emails = await API.get('/api/email-logs');
  const tbody = $('#table-emails');
  if (!tbody) return;
  if (!emails || emails.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No transactional emails dispatched yet.</td></tr>';
  } else {
    tbody.innerHTML = emails.map(m => `
      <tr>
        <td style="font-family:var(--font-mono); font-size:0.75rem;">${m.message_id}</td>
        <td><b>${escapeHTML(m.recipient)}</b></td>
        <td>${escapeHTML(m.subject)}</td>
        <td><code>${m.doc_ref}</code></td>
        <td><span class="status-badge delivered">${m.status}</span></td>
        <td style="font-size:0.75rem;">${m.sent_at}</td>
      </tr>
    `).join('');
  }
}

async function loadSettings() {
  const settings = await API.get('/api/settings');
  if (settings) {
    if ($('#set-company-name')) $('#set-company-name').value = settings.company_name || '';
    if ($('#set-brand-tagline')) $('#set-brand-tagline').value = settings.brand_tagline || '';
    if ($('#set-udyam-reg')) $('#set-udyam-reg').value = settings.udyam_reg || '';
    if ($('#set-reg-office')) $('#set-reg-office').value = settings.registered_office || '';
    if ($('#set-primary-email')) $('#set-primary-email').value = settings.primary_email || '';
    if ($('#set-primary-phone')) $('#set-primary-phone').value = settings.primary_phone || '';
    if ($('#set-bank-name')) $('#set-bank-name').value = settings.bank_name || '';
    if ($('#set-bank-acc')) $('#set-bank-acc').value = settings.bank_acc || '';
    if ($('#set-bank-ifsc')) $('#set-bank-ifsc').value = settings.bank_ifsc || '';
    if ($('#set-bank-branch')) $('#set-bank-branch').value = settings.bank_branch || '';
    if ($('#set-quote-terms')) $('#set-quote-terms').value = settings.quote_terms || '';
    if ($('#set-offer-terms')) $('#set-offer-terms').value = settings.offer_terms || '';
    if ($('#set-cert-text')) $('#set-cert-text').value = settings.cert_text || '';
  }

  const audits = await API.get('/api/audit-logs');
  const tbody = $('#table-settings-audits');
  if (tbody && audits) {
    tbody.innerHTML = audits.map(a => `
      <tr>
        <td style="font-family:var(--font-mono); font-size:0.75rem;">${a.timestamp}</td>
        <td><b>${escapeHTML(a.user_name)}</b></td>
        <td><span class="code-pill">${a.action}</span></td>
        <td>${escapeHTML(a.entity)}</td>
        <td><code>${a.entity_ref || '-'}</code></td>
        <td style="color:var(--text-muted);">${escapeHTML(a.details)}</td>
      </tr>
    `).join('');
  }
}

// =========================================================================
// DOCUMENT PREVIEW BUILDERS (AUTHENTIC REPLICAS WITH REAL SIGNATURES)
// =========================================================================

function previewOfficialDoc(templateType) {
  const container = $('#doc-preview-container');
  const modalTitle = $('#doc-viewer-modal-title');

  if (templateType === 'landscape-certificate' || templateType === 'sample-cert-completion') {
    modalTitle.textContent = 'Internship Completion Certificate (Official Landscape A4 — 297×210mm)';
    container.innerHTML = generateLandscapeCertificateHTML({
      recipient_name: 'Kamali B',
      recipient_college: 'Panimalar Engineering College, Chennai',
      domain: 'Machine Learning & Applied AI',
      start_date: '1st December 2025',
      end_date: '15th December 2025',
      cert_no: 'AG-CERT-2025-0001',
      issue_date: '15th December 2025',
      signatory1_name: 'SAIVIGNESH R V',
      signatory1_title: 'FOUNDER & CEO',
      signatory1_img: 'sig-saivignesh.png',
      signatory2_name: 'HARIPRIYA S',
      signatory2_title: 'DIRECTOR (CFO)',
      signatory2_img: 'sig-haripriya.png'
    });
  } else if (templateType === 'sample-school-quote') {
    modalTitle.textContent = 'Official Quotation Sheet — QTN-2026-SCH01';
    container.innerHTML = generateSchoolQuotationHTML({
      quote_no: 'QTN-2026-SCH01',
      date: '26-Oct-2026',
      valid_until: '26-Jan-2027',
      client_name: 'Shree A.G. Jain Higher Secondary School,',
      client_address: 'No. 19, Thulasingam Street, Elephant Gate Police Station\nSignal, Sowcarpet, Chennai – 600001, Tamil Nadu.',
      target_cohort: 'Classes 6th, 7th, 8th & 9th',
      program_title: '3-Month Student Skill Development Program',
      total_students: 196,
      course_duration: '3 Months',
      fee_per_student: 400,
      total_amount: 78400,
      cohorts: [
        { grade: 'Class 6th Standard', strength: 38, fee: 400, total: 15200, remarks: 'Confirmed Enrollment' },
        { grade: 'Class 7th Standard', strength: 46, fee: 400, total: 18400, remarks: 'Confirmed Enrollment' },
        { grade: 'Class 8th Standard', strength: 43, fee: 400, total: 17200, remarks: 'Confirmed Enrollment' },
        { grade: 'Class 9th Standard', strength: 69, fee: 400, total: 27600, remarks: 'Confirmed Enrollment' }
      ],
      milestones: [
        { milestone: '1st Installment (Program Inception)', share: '40%', due: 'Month 1 (Inception)', amount: 31360, scope: 'Curriculum onboarding, workbooks & week 1–4 sessions' },
        { milestone: '2nd Installment (Mid-Term Review)', share: '30%', due: 'Month 2 (Mid-Term)', amount: 23520, scope: 'Mid-course assessment, practical tests & month 2 sessions' },
        { milestone: '3rd Installment (Final Review & Certificates)', share: '30%', due: 'Month 3 (Completion)', amount: 23520, scope: 'Final evaluations, student certifications & showcase project' }
      ]
    });
  } else if (templateType === 'sample-intern-offer') {
    modalTitle.textContent = 'Official Internship Offer Letter — Kamali B';
    container.innerHTML = generateInternOfferLetterHTML({
      recipient_name: 'Kamali B',
      recipient_inst: 'Panimalar Engineering College, Chennai.',
      domain: 'Machine Learning',
      start_date: '1st December 2025',
      end_date: '15th December 2025',
      issue_date: '28TH SEPTEMBER 2025',
      signatory: 'SAIVIGNESH R V',
      signatory_title: 'FOUNDER'
    });
  }

  openModal('modal-doc-viewer');
}

// LANDSCAPE METHOD CERTIFICATE GENERATOR (297mm x 210mm)
function generateLandscapeCertificateHTML(d) {
  return `
    <div class="cert-landscape-wrapper">
      <div class="a4-landscape-sheet">
        <div class="cert-landscape-border">
          
          <!-- TOP BAR -->
          <div class="cert-landscape-top">
            <div class="brand-left">
              <img src="logo-shield.png" class="crest" alt="AgriGuardian Crest">
              <div>
                <h2>AGRIGUARDIAN PRIVATE LIMITED</h2>
                <span class="reg">CIN: U01639TN2026PTC194498 • SRI PERUMBUDUR, TAMIL NADU</span>
              </div>
            </div>

            <div class="cert-msme-badge">
              <span style="font-weight:700;">GOVERNMENT OF INDIA</span>
              <b>MSME</b>
              <span>MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES</span>
            </div>
          </div>

          <!-- BODY CENTER -->
          <div class="cert-landscape-body">
            <div class="cert-landscape-title">Certificate of Completion</div>
            <div class="cert-landscape-subtitle">THIS IS PROUDLY PRESENTED TO</div>

            <div class="cert-landscape-recipient">${escapeHTML(d.recipient_name)}</div>
            <div class="cert-landscape-college">${escapeHTML(d.recipient_college)}</div>

            <p class="cert-landscape-narrative">
              has successfully completed an intensive technical internship in <b>${escapeHTML(d.domain)}</b> at 
              <b>AgriGuardian Private Limited</b> from <b>${d.start_date}</b> to <b>${d.end_date}</b>.
              During this tenure, the candidate demonstrated exceptional diligence, professional integrity, 
              and technical capability in applied agricultural robotics and machine learning methodologies.
            </p>
          </div>

          <!-- SIGNATURES & VERIFICATION ROW -->
          <div class="cert-landscape-signatures">
            <!-- Left Signatory: Saivignesh R V -->
            <div class="cert-signatory-col">
              <img src="sig-saivignesh.png" class="signature-img" alt="Signature of Saivignesh R V">
              <div class="sig-rule">
                <b>${escapeHTML(d.signatory1_name || 'SAIVIGNESH R V')}</b><br>
                <span style="color:#64748b; font-size:7.5pt;">${escapeHTML(d.signatory1_title || 'FOUNDER & CEO')}</span>
              </div>
            </div>

            <!-- Center Seal & Serial -->
            <div class="cert-seal-col">
              <img src="logo-seal.png" alt="Official AgriGuardian Seal">
              <span class="cert-serial-tag">${d.cert_no}</span>
              <span style="font-size:6.5pt; color:#64748b;">Issued: ${d.issue_date}</span>
            </div>

            <!-- Right Signatory: Haripriya S / Shengian T -->
            <div class="cert-signatory-col">
              <img src="sig-haripriya.png" class="signature-img" alt="Signature of Haripriya S">
              <div class="sig-rule">
                <b>${escapeHTML(d.signatory2_name || 'HARIPRIYA S')}</b><br>
                <span style="color:#64748b; font-size:7.5pt;">${escapeHTML(d.signatory2_title || 'DIRECTOR (CFO)')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

function generateSchoolQuotationHTML(d) {
  return `
    <div class="a4-document-sheet">
      <div class="quote-top-header">
        <div class="quote-brand">
          <img src="logo-shield.png" alt="Agriguardian Logo" style="height:55px;">
        </div>
        <div>
          <div style="font-size:7.5pt; text-transform:uppercase; color:#1e3a8a; text-align:right; font-weight:700;">
            JEPPIAAR INSTITUTE, JEPPIAR NAGAR,<br>
            KUNNAM, SRIPERUMBUDUR,<br>
            KANCHIPURAM - 631604<br>
            +91 8072078836
          </div>
          <div class="quote-title-block">
            <h1 style="margin-top:6px;">QUOTATION</h1>
          </div>
        </div>
      </div>

      <div class="quote-program-title">${escapeHTML(d.program_title)}</div>

      <div class="quote-meta-grid">
        <div class="quote-meta-box border-right">
          <h4>PREPARED FOR (CLIENT)</h4>
          <b>To: ${escapeHTML(d.client_name)}</b><br>
          <span style="white-space:pre-line;">${escapeHTML(d.client_address)}</span><br>
          <b>Target Cohort:</b> ${escapeHTML(d.target_cohort)}
        </div>
        <div class="quote-meta-box">
          <h4>Quotation No: ${d.quote_no}</h4>
          <p style="margin-top:4px;"><b>Date:</b> ${d.date}</p>
          <p><b>Valid Until:</b> ${d.valid_until}</p>
          <div style="margin-top:10px; padding-top:6px; border-top:1px solid #1e3a8a;">
            <b style="color:#1e3a8a;">TRAINING PROVIDER</b><br>
            Agriguardian Private Limited<br>
            Email: agriguardians@gmail.com | +91 8072078836
          </div>
        </div>
      </div>

      <div class="quote-kpi-bar">
        <div class="quote-kpi-col">
          <span>TOTAL STUDENTS</span>
          <strong>${d.total_students}</strong>
        </div>
        <div class="quote-kpi-col">
          <span>COURSE DURATION</span>
          <strong>${d.course_duration}</strong>
        </div>
        <div class="quote-kpi-col">
          <span>FEE PER STUDENT</span>
          <strong>₹${d.fee_per_student}</strong>
        </div>
        <div class="quote-kpi-col">
          <span>TOTAL QUOTATION VALUE</span>
          <strong>₹${d.total_amount.toLocaleString('en-IN')}</strong>
        </div>
      </div>

      <table class="quote-table">
        <thead>
          <tr>
            <th>Grade / Class Cohort</th>
            <th>Student Strength</th>
            <th>Course Fee / Student (₹)</th>
            <th>Total Amount (₹)</th>
            <th>Remarks / Status</th>
          </tr>
        </thead>
        <tbody>
          ${(d.cohorts || []).map(c => `
            <tr>
              <td><b>${escapeHTML(c.grade)}</b></td>
              <td>${c.strength}</td>
              <td>₹${c.fee}</td>
              <td>₹${c.total.toLocaleString('en-IN')}</td>
              <td>${escapeHTML(c.remarks || 'Confirmed Enrollment')}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td>Total Quotation Value</td>
            <td>${d.total_students}</td>
            <td>–</td>
            <td>₹${d.total_amount.toLocaleString('en-IN')}</td>
            <td>100% Student Coverage</td>
          </tr>
        </tbody>
      </table>

      <h4 style="font-size:8.5pt; text-transform:uppercase; color:#1e3a8a; margin-bottom:4px; font-weight:700;">
        PROPOSED PAYMENT MILESTONES (3-MONTH SCHEDULE)
      </h4>
      <table class="quote-table">
        <thead>
          <tr>
            <th>Installment Milestone</th>
            <th>Share (%)</th>
            <th>Due Timeline</th>
            <th>Milestone Amount (₹)</th>
            <th>Scope & Deliverables Covered</th>
          </tr>
        </thead>
        <tbody>
          ${(d.milestones || []).map(m => `
            <tr>
              <td><b>${escapeHTML(m.milestone)}</b></td>
              <td>${m.share}</td>
              <td>${m.due}</td>
              <td>₹${Number(m.amount).toLocaleString('en-IN')}</td>
              <td>${escapeHTML(m.scope)}</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td>Total Payment Commitment</td>
            <td>100%</td>
            <td>3 Months Total</td>
            <td>₹${d.total_amount.toLocaleString('en-IN')}</td>
            <td>Complete 196 students skill certification program</td>
          </tr>
        </tbody>
      </table>

      <div class="quote-bottom-grid">
        <div class="quote-bottom-box border-right">
          <b style="color:#1e3a8a;">COMMERCIAL TERMS & INCLUSIONS</b>
          <p style="margin-top:4px;">1. Fee covers 196 students for full 3-month duration with all materials.</p>
          <p>2. Student attendance and performance tracking shared bi-weekly with school.</p>
        </div>
        <div class="quote-bottom-box">
          <b style="color:#1e3a8a;">BANK & REMITTANCE DETAILS</b>
          <p style="margin-top:4px;">Bank Name: Union Bank of India | A/c no: 520101269970136</p>
          <p>IFSC Code: UBIN0912786 | Branch: Chennai Perambur Branch</p>
        </div>
      </div>

      <div class="quote-signatures">
        <div class="sig-box">
          ACCEPTED BY:<br>
          <b style="font-size:9pt;">(School Principal / Management)</b>
        </div>
        <div class="sig-box">
          <img src="sig-saivignesh.png" class="signature-img" style="height:44px;" alt="Signature of Saivignesh R V">
          <div style="border-top:1px dashed #64748b; margin-top:2px; padding-top:4px;">
            AUTHORIZED BY:<br>
            <b style="font-size:9pt;">SAIVIGNESH R V (Course Director)</b>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateInternOfferLetterHTML(d) {
  return `
    <div class="a4-document-sheet">
      <div class="letter-top-art"></div>
      
      <div class="letter-header">
        <img src="logo-shield.png" class="shield" alt="Shield Logo">
        <h2>AGRIGUARDIAN</h2>
        <span class="udhyam">CIN: U01639TN2026PTC194498</span>
      </div>

      <div class="letter-doc-title">INTERNSHIP OFFER LETTER</div>

      <div style="display:flex; justify-content:space-between; margin-bottom:14px; font-size:9.5pt;">
        <div>
          <b>To</b><br>
          <b style="font-size:11pt;">${escapeHTML(d.recipient_name)}</b><br>
          ${escapeHTML(d.recipient_inst)}
        </div>
        <div style="text-align:right;">
          <b>${d.issue_date}</b>
        </div>
      </div>

      <div class="letter-body">
        <p><b>Welcome to Agriguardian,</b></p>
        <p>Congratulations! We are delighted to make you an offer as <b>${escapeHTML(d.domain)}</b>. Internship offer letter is to confirm your selection <b>${escapeHTML(d.domain)} Internship</b> at <b>Agriguardian</b> and welcome you for the same effective from <b>${d.start_date}</b> to <b>${d.end_date}</b>. Hope you will be doing well. This Internship is observed by Agriguardian as being a learning opportunity for you.</p>
        
        <p>Your internship will embrace orientation and give emphasis on learning new skills with a deeper understanding of concepts through hands-on application of the knowledge you gained as an intern. You will acknowledge your obligation to perform all work allocated to you to the best of your ability within lawful and reasonable direction given to you. We look forward to a worthwhile and fruitful association which will make you Equipped for future projects.</p>
        
        <p>Wishing you the most enjoyable and truly meaningful internship program experience.</p>
      </div>

      <div style="margin-top:20px; font-size:9.5pt;">
        <p>Sincerely,</p>
        <div style="margin:6px 0;">
          <img src="sig-saivignesh.png" class="signature-img" style="height:50px; margin-left:0;" alt="Signature of Saivignesh R V">
        </div>
        <b>${escapeHTML(d.signatory || 'SAIVIGNESH R V')}</b><br>
        <span style="font-size:8pt; color:#4b5563;">${escapeHTML(d.signatory_title || 'FOUNDER & CEO')}</span>
      </div>

      <div class="letter-footer-stamps">
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="logo-seal.png" class="letter-stamp-img" alt="Official Seal">
        </div>
        <div style="text-align:center;">
          <span style="font-size:7pt; color:#6b7280; display:block; font-weight:700;">GOVERNMENT OF INDIA</span>
          <b style="font-size:14pt; letter-spacing:0.1em; color:#1e3a8a;">MSME</b><br>
          <span style="font-size:6.5pt; color:#6b7280;">MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES</span>
        </div>
        <div style="font-size:8pt; color:#4b5563; text-align:right;">
          📞 8072078836<br>
          ✉️ agriguardians@gmail.com
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// ACTION HANDLERS: CONVERT, APPROVE, RECORD PAYMENT
// =========================================================================

async function convertToInvoice(quoteId) {
  if (!confirm('Convert this accepted quotation into an official AG-INV invoice?')) return;
  const res = await API.post(`/api/quotations/${quoteId}/convert-to-invoice`, {});
  if (res.ok) {
    alert(`Success! Generated Invoice: ${res.invoice_no}`);
    navigateTo('sales');
  } else {
    alert(`Error: ${res.error || 'Failed to convert'}`);
  }
}

async function approveQuotation(quoteId) {
  const res = await API.post('/api/approvals', {
    entity_type: 'quotation',
    entity_id: quoteId,
    decision: 'Approved',
    approver_name: State.currentUserName,
    comments: 'Reviewed and formally approved per AgriGuardian corporate pricing guidelines.'
  });
  if (res.ok) {
    alert(`Quotation ${res.ref_no} Approved!`);
    loadSales();
    loadDashboard();
    loadApprovals();
  }
}

async function rejectQuotation(quoteId) {
  const reason = prompt('Enter revision remarks or reason for rejection:');
  if (!reason) return;
  const res = await API.post('/api/approvals', {
    entity_type: 'quotation',
    entity_id: quoteId,
    decision: 'Rejected',
    approver_name: State.currentUserName,
    comments: reason
  });
  if (res.ok) {
    alert(`Quotation ${res.ref_no} returned for correction.`);
    loadSales();
    loadApprovals();
  }
}

function openRecordPayment(invId, invNo, balance) {
  const select = $('#pay-invoice-select');
  select.innerHTML = `<option value="${invId}">${invNo} — Outstanding Balance: ${formatINR(balance)}</option>`;
  $('#pay-amount').value = balance;
  openModal('modal-record-payment');
}

function openCreateQuoteForCustomer(custId, custName, category) {
  $('#quote-category').value = category;
  const custSelect = $('#quote-customer-select');
  custSelect.innerHTML = `<option value="${custId}">${custName} (${category})</option>`;
  openModal('modal-create-quotation');
}

// Edit & Delete Employee Handlers
function openEditEmployee(id) {
  const emp = State.employees.find(e => e.id == id);
  if (!emp) {
    alert('Employee record not found');
    return;
  }
  $('#edit-emp-id').value = emp.id;
  $('#edit-emp-name').value = emp.name || '';
  $('#edit-emp-dept').value = emp.department || '';
  $('#edit-emp-designation').value = emp.designation || '';
  $('#edit-emp-joining').value = emp.joining_date || '';
  $('#edit-emp-email').value = emp.email || '';
  $('#edit-emp-phone').value = emp.phone || '';
  $('#edit-emp-salary').value = emp.salary || '';
  $('#edit-emp-status').value = emp.status || 'Active';
  openModal('modal-edit-employee');
}

async function deleteEmployee(id, name) {
  if (!confirm(`Are you sure you want to deactivate or remove employee record: "${name}"?`)) return;
  const res = await API.delete(`/api/employees/${id}`);
  if (res.ok) {
    alert(`Employee ${name} removed.`);
    loadHR();
    loadDashboard();
  } else {
    alert(`Error removing employee: ${res.error || 'Server error'}`);
  }
}

// Edit & Delete Customer Handlers
function openEditCustomer(id) {
  const cust = State.customers.find(c => c.id == id);
  if (!cust) {
    alert('Customer record not found');
    return;
  }
  $('#edit-cust-id').value = cust.id;
  $('#edit-cust-category').value = cust.category || 'School';
  $('#edit-cust-name').value = cust.name || '';
  $('#edit-cust-contact').value = cust.contact_person || '';
  $('#edit-cust-email').value = cust.email || '';
  $('#edit-cust-phone').value = cust.phone || '';
  $('#edit-cust-district').value = cust.district || '';
  $('#edit-cust-address').value = cust.address || '';
  openModal('modal-edit-customer');
}

async function deleteCustomer(id, name) {
  if (!confirm(`Are you sure you want to remove client record: "${name}"?`)) return;
  const res = await API.delete(`/api/customers/${id}`);
  if (res.ok) {
    alert(`Client profile removed successfully.`);
    loadCustomers();
    loadDashboard();
  } else {
    alert(`Error: ${res.error || 'Server error'}`);
  }
}

// Edit & Delete Intern Handlers
function openEditIntern(id) {
  const intern = State.interns.find(i => i.id == id);
  if (!intern) {
    alert('Intern record not found');
    return;
  }
  $('#edit-intern-id').value = intern.id;
  $('#edit-intern-name').value = intern.name || '';
  $('#edit-intern-college').value = intern.college || '';
  $('#edit-intern-designation').value = intern.designation || '';
  $('#edit-intern-domain').value = intern.domain || intern.designation || '';
  $('#edit-intern-start').value = intern.joining_date || '';
  $('#edit-intern-end').value = intern.end_date || '';
  $('#edit-intern-mentor').value = intern.mentor || '';
  $('#edit-intern-stipend').value = intern.stipend || 'Performance Stipend';
  $('#edit-intern-email').value = intern.email || '';
  $('#edit-intern-phone').value = intern.phone || '';
  $('#edit-intern-status').value = intern.status || 'Active';
  openModal('modal-edit-intern');
}

async function deleteIntern(id, name) {
  if (!confirm(`Are you sure you want to remove intern record for "${name}"?`)) return;
  const res = await API.delete(`/api/interns/${id}`);
  if (res.ok) {
    alert(`Intern record ${name} removed.`);
    loadHR();
    loadDashboard();
  } else {
    alert(`Error: ${res.error || 'Failed to remove intern'}`);
  }
}

// Edit & Delete Vendor Handlers
function openEditVendor(id) {
  const v = State.vendors.find(x => x.id == id);
  if (!v) {
    alert('Vendor record not found');
    return;
  }
  $('#edit-vendor-id').value = v.id;
  $('#edit-vendor-name').value = v.name || '';
  $('#edit-vendor-category').value = v.category || 'IoT & Electronics';
  $('#edit-vendor-contact').value = v.contact_person || '';
  $('#edit-vendor-email').value = v.email || '';
  $('#edit-vendor-phone').value = v.phone || '';
  $('#edit-vendor-gstin').value = v.gstin || '';
  $('#edit-vendor-address').value = v.address || '';
  $('#edit-vendor-status').value = v.status || 'Active';
  openModal('modal-edit-vendor');
}

async function deleteVendor(id, name) {
  if (!confirm(`Are you sure you want to remove vendor profile: "${name}"?`)) return;
  const res = await API.delete(`/api/vendors/${id}`);
  if (res.ok) {
    alert(`Vendor profile removed successfully.`);
    loadVendors();
  } else {
    alert(`Error: ${res.error || 'Failed to remove vendor'}`);
  }
}

// =========================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// =========================================================================

function initAuth() {
  const savedUser = localStorage.getItem('ag_user');
  const savedToken = localStorage.getItem('ag_token');

  if (savedUser && savedToken) {
    try {
      State.currentUser = JSON.parse(savedUser);
      State.authToken = savedToken;
      State.currentRole = State.currentUser.role || 'Super Admin';
      State.currentUserName = State.currentUser.name || 'Shengian T';

      applyUserSessionUI(State.currentUser);
      document.body.classList.remove('unauthenticated');
      $('#portal-login-gate')?.classList.add('hidden');
      return true;
    } catch (e) {
      console.error('Error parsing stored user session', e);
    }
  }

  // Not logged in -> isolate login page and completely hide main website
  document.body.classList.add('unauthenticated');
  $('#portal-login-gate')?.classList.remove('hidden');
  return false;
}

function applyUserSessionUI(user) {
  if (!user) return;
  const initials = (user.name || 'AG').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
  
  if ($('#header-avatar-initials')) $('#header-avatar-initials').textContent = initials;
  if ($('#header-user-name')) $('#header-user-name').textContent = user.name;
  if ($('#header-user-role')) $('#header-user-role').textContent = user.title || user.role;
  
  if ($('#avatar-initials')) $('#avatar-initials').textContent = initials;
  if ($('#user-display-name')) $('#user-display-name').textContent = user.name;
  if ($('#user-display-role')) $('#user-display-role').textContent = `${user.role} (${user.title || ''})`;
}

async function login(username, password) {
  const errBox = $('#login-error-alert');
  if (errBox) {
    errBox.classList.add('hidden');
    errBox.textContent = '';
  }

  const res = await API.post('/api/auth/login', { username, password });
  if (res && res.ok && res.user) {
    State.currentUser = res.user;
    State.authToken = res.token;
    State.currentRole = res.user.role;
    State.currentUserName = res.user.name;

    localStorage.setItem('ag_user', JSON.stringify(res.user));
    localStorage.setItem('ag_token', res.token);

    applyUserSessionUI(res.user);
    document.body.classList.remove('unauthenticated');
    $('#portal-login-gate')?.classList.add('hidden');

    // Load fresh data into portal now that user is authenticated
    loadDashboard();

    // Route dynamically based on user role
    if (res.user.role === 'HR Manager') navigateTo('hr');
    else if (res.user.role === 'Finance Manager') navigateTo('sales');
    else navigateTo('dashboard');
  } else {
    if (errBox) {
      errBox.textContent = res.error || 'Authentication failed. Please verify credentials.';
      errBox.classList.remove('hidden');
    } else {
      alert(res.error || 'Login failed');
    }
  }
}

async function quickLogin(username, password) {
  if ($('#login-username')) $('#login-username').value = username;
  if ($('#login-password')) $('#login-password').value = password;
  await login(username, password);
}

async function logout() {
  if (State.currentUser) {
    await API.post('/api/auth/logout', { name: State.currentUserName });
  }
  localStorage.removeItem('ag_user');
  localStorage.removeItem('ag_token');
  State.currentUser = null;
  State.authToken = null;
  document.body.classList.add('unauthenticated');
  $('#portal-login-gate')?.classList.remove('hidden');
}

// =========================================================================
// UNIVERSAL GLOBAL SEARCH ENGINE
// =========================================================================

async function handleGlobalSearch(query) {
  const dropdown = $('#global-search-results');
  if (!dropdown) return;

  const q = String(query || '').trim();
  if (q.length < 2) {
    dropdown.innerHTML = '';
    dropdown.classList.add('hidden');
    return;
  }

  const res = await API.get(`/api/search?q=${encodeURIComponent(q)}`);
  if (!res) return;

  let html = '';
  let count = 0;

  if (res.employees && res.employees.length > 0) {
    count += res.employees.length;
    html += `<div class="search-result-group">
      <div class="search-group-title">Employees (${res.employees.length})</div>
      ${res.employees.map(e => `
        <div class="search-result-item" onclick="selectSearchResult('hr', 'employee', ${e.id})">
          <span><b>${escapeHTML(e.name)}</b> <small style="color:var(--text-muted);">${escapeHTML(e.designation)} • ${escapeHTML(e.department)}</small></span>
          <span class="code-pill">${e.employee_code}</span>
        </div>
      `).join('')}
    </div>`;
  }

  if (res.interns && res.interns.length > 0) {
    count += res.interns.length;
    html += `<div class="search-result-group">
      <div class="search-group-title">Interns (${res.interns.length})</div>
      ${res.interns.map(i => `
        <div class="search-result-item" onclick="selectSearchResult('hr', 'intern', ${i.id})">
          <span><b>${escapeHTML(i.name)}</b> <small style="color:var(--text-muted);">${escapeHTML(i.designation)} • ${escapeHTML(i.college)}</small></span>
          <span class="code-pill">${i.intern_code}</span>
        </div>
      `).join('')}
    </div>`;
  }

  if (res.customers && res.customers.length > 0) {
    count += res.customers.length;
    html += `<div class="search-result-group">
      <div class="search-group-title">Clients (${res.customers.length})</div>
      ${res.customers.map(c => `
        <div class="search-result-item" onclick="selectSearchResult('customers', 'customer', ${c.id})">
          <span><b>${escapeHTML(c.name)}</b> <small style="color:var(--text-muted);">(${c.category}) • ${escapeHTML(c.district || '')}</small></span>
          <span class="code-pill">${c.customer_code}</span>
        </div>
      `).join('')}
    </div>`;
  }

  if (res.quotations && res.quotations.length > 0) {
    count += res.quotations.length;
    html += `<div class="search-result-group">
      <div class="search-group-title">Quotations (${res.quotations.length})</div>
      ${res.quotations.map(q => `
        <div class="search-result-item" onclick="selectSearchResult('sales', 'quotation', ${q.id})">
          <span><b>${q.quote_no}</b> <small style="color:var(--text-muted);">${escapeHTML(q.customer_name)}</small></span>
          <b>${formatINR(q.total_amount)}</b>
        </div>
      `).join('')}
    </div>`;
  }

  if (res.invoices && res.invoices.length > 0) {
    count += res.invoices.length;
    html += `<div class="search-result-group">
      <div class="search-group-title">Invoices (${res.invoices.length})</div>
      ${res.invoices.map(inv => `
        <div class="search-result-item" onclick="selectSearchResult('sales', 'invoice', ${inv.id})">
          <span><b>${inv.invoice_no}</b> <small style="color:var(--text-muted);">${escapeHTML(inv.customer_name)}</small></span>
          <b>${formatINR(inv.total_amount)}</b>
        </div>
      `).join('')}
    </div>`;
  }

  if (count === 0) {
    dropdown.innerHTML = '<div style="padding:0.75rem 1rem; color:var(--text-muted); font-size:0.8rem; text-align:center;">No matching records found across enterprise directory</div>';
  } else {
    dropdown.innerHTML = html;
  }
  dropdown.classList.remove('hidden');
}

function selectSearchResult(section, type, id) {
  $('#global-search-results')?.classList.add('hidden');
  const inp = $('#global-search-input');
  if (inp) inp.value = '';
  navigateTo(section);
  if (type === 'quotation') previewQuotation(id);
}

// Dynamic Quotation Preview Handler
async function previewQuotation(quoteId) {
  let q = State.quotations.find(x => x.id == quoteId);
  if (!q) {
    const quotes = await API.get('/api/quotations');
    State.quotations = quotes || [];
    q = State.quotations.find(x => x.id == quoteId);
  }
  if (!q) {
    alert('Quotation record not found');
    return;
  }

  const container = $('#doc-preview-container');
  const modalTitle = $('#doc-viewer-modal-title');
  modalTitle.textContent = `Official Quotation Sheet — ${q.quote_no}`;

  let lineItems = [];
  try {
    lineItems = typeof q.line_items === 'string' ? JSON.parse(q.line_items) : (q.line_items || []);
  } catch (e) {
    lineItems = [];
  }
  if (!lineItems || lineItems.length === 0) {
    lineItems = [
      { grade: 'Class 6th Standard', strength: 38, fee: 400, total: 15200, remarks: 'Confirmed' },
      { grade: 'Class 7th Standard', strength: 46, fee: 400, total: 18400, remarks: 'Confirmed' },
      { grade: 'Class 8th Standard', strength: 43, fee: 400, total: 17200, remarks: 'Confirmed' },
      { grade: 'Class 9th Standard', strength: 69, fee: 400, total: 27600, remarks: 'Confirmed' }
    ];
  }

  let milestones = [];
  try {
    milestones = typeof q.milestones === 'string' ? JSON.parse(q.milestones) : (q.milestones || []);
  } catch (e) {
    milestones = [];
  }
  if (!milestones || milestones.length === 0) {
    const total = Number(q.total_amount) || 78400;
    milestones = [
      { milestone: '1st Installment (Program Inception)', share: '40%', due: 'Month 1 (Inception)', amount: total * 0.4, scope: 'Curriculum onboarding & week 1-4 sessions' },
      { milestone: '2nd Installment (Mid-Term Review)', share: '30%', due: 'Month 2 (Mid-Term)', amount: total * 0.3, scope: 'Mid-course assessment & month 2 sessions' },
      { milestone: '3rd Installment (Final Review)', share: '30%', due: 'Month 3 (Completion)', amount: total * 0.3, scope: 'Final evaluations & student certifications' }
    ];
  }

  const totalStudents = lineItems.reduce((acc, cur) => acc + (Number(cur.strength) || 0), 0) || 196;

  container.innerHTML = generateSchoolQuotationHTML({
    quote_no: q.quote_no,
    date: q.quote_date || '26-Oct-2026',
    valid_until: q.valid_until || '25-Nov-2026',
    client_name: q.customer_name,
    client_address: q.billing_address || 'Jeppiaar Nagar, Sriperumbudur, Tamil Nadu',
    target_cohort: q.target_cohort || 'Grade 6th to 9th Standard',
    program_title: q.project_title || 'AI, ROBOTICS & DRONE TECHNOLOGY FOUNDATION PROGRAM',
    total_students: totalStudents,
    course_duration: '3 Months (Weekly Practical Labs)',
    fee_per_student: 400,
    total_amount: Number(q.total_amount) || 78400,
    cohorts: lineItems,
    milestones: milestones
  });

  openModal('modal-doc-viewer');
}

// Dynamic Document Record Preview Handler
async function previewDocRecord(docId) {
  let d = State.documents.find(x => x.id == docId);
  if (!d) {
    const docs = await API.get('/api/documents');
    State.documents = docs || [];
    d = State.documents.find(x => x.id == docId);
  }
  if (!d) {
    alert('Document record not found');
    return;
  }

  const container = $('#doc-preview-container');
  const modalTitle = $('#doc-viewer-modal-title');
  const docType = (d.doc_type || '').toLowerCase();

  if (docType.includes('certificate')) {
    modalTitle.textContent = `Internship Completion Certificate (Official Landscape A4) — ${d.doc_no}`;
    container.innerHTML = generateLandscapeCertificateHTML({
      recipient_name: d.recipient_name,
      recipient_college: d.recipient_sub || 'Panimalar Engineering College, Chennai',
      domain: 'Applied Robotics & Machine Learning',
      start_date: '1st December 2025',
      end_date: '15th December 2025',
      cert_no: d.doc_no,
      issue_date: d.issue_date,
      signatory1_name: 'SAIVIGNESH R V',
      signatory1_title: 'FOUNDER & CEO',
      signatory1_img: 'sig-saivignesh.png',
      signatory2_name: 'HARIPRIYA S',
      signatory2_title: 'DIRECTOR (CFO)',
      signatory2_img: 'sig-haripriya.png'
    });
  } else if (docType.includes('offer')) {
    modalTitle.textContent = `Internship Offer Letter — ${d.recipient_name}`;
    container.innerHTML = generateInternOfferLetterHTML({
      recipient_name: d.recipient_name,
      recipient_inst: d.recipient_sub || 'Panimalar Engineering College, Chennai',
      domain: 'Machine Learning',
      start_date: '1st December 2025',
      end_date: '15th December 2025',
      issue_date: d.issue_date,
      signatory: d.signatory || 'SAIVIGNESH R V',
      signatory_title: 'FOUNDER'
    });
  } else {
    modalTitle.textContent = `Official Document — ${d.doc_no}`;
    previewOfficialDoc('sample-school-quote');
    return;
  }

  openModal('modal-doc-viewer');
}

// Bind Global Functions to Window for Inline Handlers
window.previewQuotation = previewQuotation;
window.previewDocRecord = previewDocRecord;
window.previewOfficialDoc = previewOfficialDoc;
window.convertToInvoice = convertToInvoice;
window.approveQuotation = approveQuotation;
window.rejectQuotation = rejectQuotation;
window.openRecordPayment = openRecordPayment;
window.openCreateQuoteForCustomer = openCreateQuoteForCustomer;
window.openEditEmployee = openEditEmployee;
window.deleteEmployee = deleteEmployee;
window.openEditCustomer = openEditCustomer;
window.deleteCustomer = deleteCustomer;
window.openEditIntern = openEditIntern;
window.deleteIntern = deleteIntern;
window.openEditVendor = openEditVendor;
window.deleteVendor = deleteVendor;
window.login = login;
window.quickLogin = quickLogin;
window.logout = logout;
window.selectSearchResult = selectSearchResult;
window.openModal = openModal;
window.closeModal = closeModal;
window.navigateTo = navigateTo;


// =========================================================================
// UTILITY FUNCTIONS & EVENT LISTENERS
// =========================================================================

function escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function badgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('active') || s.includes('approved') || s.includes('paid') || s.includes('issued')) return 'approved';
  if (s.includes('pending')) return 'pending';
  if (s.includes('partially')) return 'partially-paid';
  if (s.includes('draft') || s.includes('unpaid')) return 'draft';
  if (s.includes('reject') || s.includes('overdue')) return 'rejected';
  return 'draft';
}

// DOM Setup on Load
document.addEventListener('DOMContentLoaded', () => {
  // Apply Initial Theme
  applyTheme(State.theme);

  // Theme Toggle Button
  const themeBtn = $('#theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const nextTheme = State.theme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
    });
  }

  // Persona Role Switcher
  const roleSwitcher = $('#role-switcher');
  if (roleSwitcher) {
    roleSwitcher.addEventListener('change', (e) => {
      State.currentRole = e.target.value;
      if (State.currentRole === 'HR Manager') State.currentUserName = 'Harini Sri M';
      else if (State.currentRole === 'Finance Manager') State.currentUserName = 'Haripriya S';
      else if (State.currentRole === 'Sales Executive') State.currentUserName = 'Sabari Krishnan I';
      else State.currentUserName = 'Saivignesh R V';

      $('#user-display-name').textContent = State.currentUserName;
      $('#user-display-role').textContent = State.currentRole;
      $('#avatar-initials').textContent = State.currentUserName.split(' ').map(x => x[0]).slice(0, 2).join('');
    });
  }

  // Navigation Links
  $$('.sidebar-nav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.nav);
    });
  });

  // HR Subtabs
  $$('[data-hrtab]').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('[data-hrtab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $('#hr-view-employees').style.display = tab.dataset.hrtab === 'employees' ? 'block' : 'none';
      $('#hr-view-interns').style.display = tab.dataset.hrtab === 'interns' ? 'block' : 'none';
      $('#hr-view-departments').style.display = tab.dataset.hrtab === 'departments' ? 'block' : 'none';
    });
  });

  // Customer Subtabs
  $$('[data-custab]').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('[data-custab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.custab;
      if (cat === 'all') renderCustomersTable(State.customers);
      else renderCustomersTable(State.customers.filter(c => c.category === cat));
    });
  });

  // Sales Subtabs
  $$('[data-salestab]').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('[data-salestab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.salestab;
      $('#sales-view-quotations').style.display = tabName === 'quotations' ? 'block' : 'none';
      $('#sales-view-invoices').style.display = tabName === 'invoices' ? 'block' : 'none';
      $('#sales-view-payments').style.display = tabName === 'payments' ? 'block' : 'none';
      $('#sales-view-catalog').style.display = tabName === 'catalog' ? 'block' : 'none';
    });
  });

  // Settings Subtabs
  $$('[data-settingstab]').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('[data-settingstab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const s = tab.dataset.settingstab;
      if ($('#settings-view-admin')) $('#settings-view-admin').style.display = s === 'admin' ? 'block' : 'none';
      if ($('#settings-view-signatories')) $('#settings-view-signatories').style.display = s === 'signatories' ? 'block' : 'none';
      if ($('#settings-view-templates')) $('#settings-view-templates').style.display = s === 'templates' ? 'block' : 'none';
      if ($('#settings-view-sop')) $('#settings-view-sop').style.display = s === 'sop' ? 'block' : 'none';
      if ($('#settings-view-numbering')) $('#settings-view-numbering').style.display = s === 'numbering' ? 'block' : 'none';
      if ($('#settings-view-roles')) $('#settings-view-roles').style.display = s === 'roles' ? 'block' : 'none';
      if ($('#settings-view-audit')) $('#settings-view-audit').style.display = s === 'audit' ? 'block' : 'none';
      if (s === 'admin' || s === 'templates') loadSettings();
    });
  });

  // Admin Settings Form Submit
  $('#form-edit-admin-settings')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      company_name: $('#set-company-name').value,
      brand_tagline: $('#set-brand-tagline').value,
      udyam_reg: $('#set-udyam-reg').value,
      registered_office: $('#set-reg-office').value,
      primary_email: $('#set-primary-email').value,
      primary_phone: $('#set-primary-phone').value,
      bank_name: $('#set-bank-name').value,
      bank_acc: $('#set-bank-acc').value,
      bank_ifsc: $('#set-bank-ifsc').value,
      bank_branch: $('#set-bank-branch').value,
      quote_terms: $('#set-quote-terms')?.value,
      offer_terms: $('#set-offer-terms')?.value,
      cert_text: $('#set-cert-text')?.value,
      author: State.currentUserName
    };
    const res = await API.put('/api/settings', payload);
    if (res.ok) {
      alert('Success! Company Profile and Banking details have been updated.');
      loadDashboard();
    } else {
      alert(`Error updating settings: ${res.error || 'Server error'}`);
    }
  });

  // Document Templates Form Submit
  $('#form-edit-doc-templates')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      quote_terms: $('#set-quote-terms').value,
      offer_terms: $('#set-offer-terms').value,
      cert_text: $('#set-cert-text').value,
      author: State.currentUserName
    };
    const res = await API.put('/api/settings', payload);
    if (res.ok) {
      alert('Success! Official document template clauses updated.');
    }
  });

  // Form: Edit Employee Submit
  $('#form-edit-employee')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#edit-emp-id').value;
    const payload = {
      name: $('#edit-emp-name').value,
      department: $('#edit-emp-dept').value,
      designation: $('#edit-emp-designation').value,
      joining_date: $('#edit-emp-joining').value,
      email: $('#edit-emp-email').value,
      phone: $('#edit-emp-phone').value,
      salary: $('#edit-emp-salary').value,
      status: $('#edit-emp-status').value
    };
    const res = await API.put(`/api/employees/${id}`, payload);
    if (res.ok) {
      alert('Employee details updated successfully!');
      closeModal('modal-edit-employee');
      loadHR();
    }
  });

  // Form: Edit Customer Submit
  $('#form-edit-customer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#edit-cust-id').value;
    const payload = {
      category: $('#edit-cust-category').value,
      name: $('#edit-cust-name').value,
      contact_person: $('#edit-cust-contact').value,
      email: $('#edit-cust-email').value,
      phone: $('#edit-cust-phone').value,
      district: $('#edit-cust-district').value,
      address: $('#edit-cust-address').value
    };
    const res = await API.put(`/api/customers/${id}`, payload);
    if (res.ok) {
      alert('Client details saved successfully!');
      closeModal('modal-edit-customer');
      loadCustomers();
    }
  });

  // Quick Action Buttons
  $('#btn-quick-new-doc')?.addEventListener('click', () => openModal('modal-create-quotation'));
  $('#btn-create-quote')?.addEventListener('click', () => openModal('modal-create-quotation'));
  $('#btn-add-employee')?.addEventListener('click', () => openModal('modal-add-employee'));
  $('#btn-add-intern')?.addEventListener('click', () => openModal('modal-add-intern'));
  $('#btn-add-customer')?.addEventListener('click', () => openModal('modal-add-customer'));
  $('#btn-open-payment-modal')?.addEventListener('click', () => {
    if (State.invoices.length > 0) {
      const inv = State.invoices[0];
      openRecordPayment(inv.id, inv.invoice_no, inv.balance);
    } else {
      alert('Please generate or convert an invoice before recording payments.');
    }
  });

  // Quotation Calculation Listener
  const calcStrength = $('#quote-calc-strength');
  const calcRate = $('#quote-calc-rate');
  const calcTotal = $('#quote-calc-total');
  function updateQuoteSubtotal() {
    const s = Number(calcStrength.value) || 0;
    const r = Number(calcRate.value) || 0;
    calcTotal.value = s * r;
  }
  calcStrength?.addEventListener('input', updateQuoteSubtotal);
  calcRate?.addEventListener('input', updateQuoteSubtotal);

  // Form: Create Quotation Submit
  $('#form-create-quote')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cat = $('#quote-category').value;
    const custSelect = $('#quote-customer-select');
    const custId = custSelect.value || 1;
    const custName = custSelect.options[custSelect.selectedIndex]?.text || 'Client';
    const total = Number($('#quote-calc-total').value) || 78400;

    const payload = {
      category: cat,
      customer_id: custId,
      customer_name: custName,
      project_title: $('#quote-project-title').value,
      target_cohort: $('#quote-target-cohort').value,
      subtotal: total,
      total_amount: total,
      signatory: $('#quote-signatory').value,
      author: State.currentUserName,
      line_items: [
        { grade: 'Class 6th Standard', strength: 38, fee: 400, total: 15200, remarks: 'Confirmed' },
        { grade: 'Class 7th Standard', strength: 46, fee: 400, total: 18400, remarks: 'Confirmed' },
        { grade: 'Class 8th Standard', strength: 43, fee: 400, total: 17200, remarks: 'Confirmed' },
        { grade: 'Class 9th Standard', strength: 69, fee: 400, total: 27600, remarks: 'Confirmed' }
      ],
      milestones: [
        { milestone: '1st Installment (Program Inception)', share: '40%', due: 'Month 1', amount: total * 0.4, scope: 'Curriculum & week 1-4' },
        { milestone: '2nd Installment (Mid-Term Review)', share: '30%', due: 'Month 2', amount: total * 0.3, scope: 'Practical tests & sessions' },
        { milestone: '3rd Installment (Final Review)', share: '30%', due: 'Month 3', amount: total * 0.3, scope: 'Evaluations & certificates' }
      ]
    };

    const res = await API.post('/api/quotations', payload);
    if (res.ok) {
      alert(`Quotation ${res.quote_no} created successfully!`);
      closeModal('modal-create-quotation');
      loadSales();
      loadDashboard();
    } else {
      alert(`Error: ${res.error || 'Failed to create quotation'}`);
    }
  });

  // Form: Add Employee Submit
  $('#form-add-employee')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: $('#emp-name').value,
      department: $('#emp-dept').value,
      designation: $('#emp-designation').value,
      joining_date: $('#emp-joining').value,
      email: $('#emp-email').value,
      phone: $('#emp-phone').value,
      author: State.currentUserName
    };
    const res = await API.post('/api/employees', payload);
    if (res.ok) {
      alert(`Employee registered! Permanent ID: ${res.employee_code}`);
      closeModal('modal-add-employee');
      loadHR();
      loadDashboard();
    }
  });

  // Form: Add Intern Submit
  $('#form-add-intern')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: $('#intern-name').value,
      college: $('#intern-college').value,
      designation: $('#intern-designation').value,
      mentor: $('#intern-mentor').value,
      joining_date: $('#intern-start').value,
      end_date: $('#intern-end').value,
      author: State.currentUserName
    };
    const res = await API.post('/api/interns', payload);
    if (res.ok) {
      alert(`Intern onboarded! Identifier: ${res.intern_code}`);
      closeModal('modal-add-intern');
      loadHR();
      loadDashboard();
    }
  });

  // Form: Add Customer Submit
  $('#form-add-customer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      category: $('#cust-category').value,
      name: $('#cust-name').value,
      contact_person: $('#cust-contact').value,
      email: $('#cust-email').value,
      phone: $('#cust-phone').value,
      district: $('#cust-district').value,
      address: $('#cust-address').value,
      author: State.currentUserName
    };
    const res = await API.post('/api/customers', payload);
    if (res.ok) {
      alert(`Client profile registered! Assigned ID: ${res.customer_code}`);
      closeModal('modal-add-customer');
      loadCustomers();
      loadDashboard();
    }
  });

  // Form: Record Payment Submit
  $('#form-record-payment')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      invoice_id: $('#pay-invoice-select').value,
      amount: $('#pay-amount').value,
      payment_mode: $('#pay-mode').value,
      reference_no: $('#pay-ref').value
    };
    const res = await API.post('/api/payments', payload);
    if (res.ok) {
      alert(`Payment verified! Receipt: ${res.receipt_no} | Balance: ${formatINR(res.new_balance)}`);
      closeModal('modal-record-payment');
      loadSales();
      loadDashboard();
    }
  });

  // Form: Login Submit
  $('#form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = $('#login-username').value;
    const p = $('#login-password').value;
    await login(u, p);
  });

  // Toggle Password Visibility
  $('#btn-toggle-pwd')?.addEventListener('click', () => {
    const input = $('#login-password');
    const btn = $('#btn-toggle-pwd');
    if (input) {
      if (input.type === 'password') {
        input.type = 'text';
        if (btn) btn.textContent = '🔒';
      } else {
        input.type = 'password';
        if (btn) btn.textContent = '👁️';
      }
    }
  });

  // Logout Button
  $('#btn-logout')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to sign out of the management portal?')) {
      await logout();
    }
  });

  // Form: Edit Intern Submit
  $('#form-edit-intern')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#edit-intern-id').value;
    const payload = {
      name: $('#edit-intern-name').value,
      college: $('#edit-intern-college').value,
      designation: $('#edit-intern-designation').value,
      domain: $('#edit-intern-domain').value,
      joining_date: $('#edit-intern-start').value,
      end_date: $('#edit-intern-end').value,
      mentor: $('#edit-intern-mentor').value,
      stipend: $('#edit-intern-stipend').value,
      email: $('#edit-intern-email').value,
      phone: $('#edit-intern-phone').value,
      status: $('#edit-intern-status').value,
      author: State.currentUserName
    };
    const res = await API.put(`/api/interns/${id}`, payload);
    if (res.ok) {
      alert('Intern record updated successfully!');
      closeModal('modal-edit-intern');
      loadHR();
      loadDashboard();
    } else {
      alert(`Error updating intern: ${res.error || 'Server error'}`);
    }
  });

  // Form: Add Vendor Submit
  $('#btn-add-vendor')?.addEventListener('click', () => openModal('modal-add-vendor'));
  $('#form-add-vendor')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: $('#vendor-name').value,
      category: $('#vendor-category').value,
      contact_person: $('#vendor-contact').value,
      email: $('#vendor-email').value,
      phone: $('#vendor-phone').value,
      gstin: $('#vendor-gstin').value,
      address: $('#vendor-address').value,
      author: State.currentUserName
    };
    const res = await API.post('/api/vendors', payload);
    if (res.ok) {
      alert(`Vendor registered successfully! Code: ${res.vendor_code}`);
      closeModal('modal-add-vendor');
      loadVendors();
    } else {
      alert(`Error registering vendor: ${res.error || 'Server error'}`);
    }
  });

  // Form: Edit Vendor Submit
  $('#form-edit-vendor')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $('#edit-vendor-id').value;
    const payload = {
      name: $('#edit-vendor-name').value,
      category: $('#edit-vendor-category').value,
      contact_person: $('#edit-vendor-contact').value,
      email: $('#edit-vendor-email').value,
      phone: $('#edit-vendor-phone').value,
      gstin: $('#edit-vendor-gstin').value,
      address: $('#edit-vendor-address').value,
      status: $('#edit-vendor-status').value,
      author: State.currentUserName
    };
    const res = await API.put(`/api/vendors/${id}`, payload);
    if (res.ok) {
      alert('Vendor record updated successfully!');
      closeModal('modal-edit-vendor');
      loadVendors();
    } else {
      alert(`Error updating vendor: ${res.error || 'Server error'}`);
    }
  });

  // Global Universal Search Input (Debounced)
  let searchDebounce = null;
  $('#global-search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      handleGlobalSearch(e.target.value);
    }, 200);
  });

  // Close search dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.global-search-box')) {
      $('#global-search-results')?.classList.add('hidden');
    }
  });

  // In-Section Filter: Employees
  $('#search-employees')?.addEventListener('input', (e) => {
    const val = (e.target.value || '').toLowerCase().trim();
    const deptVal = $('#filter-dept')?.value || '';
    const filtered = State.employees.filter(emp => {
      const matchText = (emp.name + ' ' + emp.employee_code + ' ' + emp.designation + ' ' + emp.department).toLowerCase().includes(val);
      const matchDept = !deptVal || emp.department === deptVal;
      return matchText && matchDept;
    });
    renderEmployeesTable(filtered);
  });

  $('#filter-dept')?.addEventListener('change', () => {
    $('#search-employees')?.dispatchEvent(new Event('input'));
  });

  // In-Section Filter: Interns
  $('#search-interns')?.addEventListener('input', (e) => {
    const val = (e.target.value || '').toLowerCase().trim();
    const filtered = State.interns.filter(i => {
      return (i.name + ' ' + i.intern_code + ' ' + i.college + ' ' + i.designation + ' ' + (i.mentor || '')).toLowerCase().includes(val);
    });
    renderInternsTable(filtered);
  });

  // In-Section Filter: Customers
  $('#search-customers')?.addEventListener('input', (e) => {
    const val = (e.target.value || '').toLowerCase().trim();
    const filtered = State.customers.filter(c => {
      return (c.name + ' ' + c.customer_code + ' ' + (c.contact_person || '') + ' ' + (c.district || '') + ' ' + c.category).toLowerCase().includes(val);
    });
    renderCustomersTable(filtered);
  });

  // In-Section Filter: Vendors
  $('#search-vendors')?.addEventListener('input', (e) => {
    const val = (e.target.value || '').toLowerCase().trim();
    const filtered = State.vendors.filter(v => {
      return (v.name + ' ' + v.vendor_code + ' ' + v.category + ' ' + (v.contact_person || '')).toLowerCase().includes(val);
    });
    renderVendorsTable(filtered);
  });

  // In-Section Filter: Quotations
  $('#search-quotations')?.addEventListener('input', (e) => {
    const val = (e.target.value || '').toLowerCase().trim();
    const tbody = $('#table-quotations');
    if (!tbody) return;
    const filtered = State.quotations.filter(q => {
      return (q.quote_no + ' ' + q.customer_name + ' ' + q.project_title + ' ' + q.status).toLowerCase().includes(val);
    });
    tbody.innerHTML = filtered.map(q => `
      <tr>
        <td><span class="code-pill">${q.quote_no}</span></td>
        <td><span class="status-badge ${q.category.toLowerCase()}">${q.category}</span></td>
        <td><b>${escapeHTML(q.customer_name)}</b></td>
        <td>${escapeHTML(q.project_title)}</td>
        <td><b>${formatINR(q.total_amount)}</b></td>
        <td style="font-size:0.75rem;">${escapeHTML(q.signatory)}</td>
        <td><span class="status-badge ${badgeClass(q.status)}">${q.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="previewQuotation(${q.id})">Preview</button>
          ${q.status === 'Approved' ? `<button class="btn btn-primary btn-sm" onclick="convertToInvoice(${q.id})">Convert to Invoice</button>` : ''}
          ${q.status === 'Pending Approval' ? `<button class="btn btn-gold btn-sm" onclick="approveQuotation(${q.id})">Approve</button>` : ''}
        </td>
      </tr>
    `).join('');
  });

  // Initialize Authentication & Load Initial Dashboard only if authenticated
  const authenticated = initAuth();
  if (authenticated) {
    loadDashboard();
  }
});
