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

  // Proactive background pre-fetch for Directory autofill
  if (!State.employees || State.employees.length === 0) {
    API.get('/api/employees').then(emps => { if (emps && Array.isArray(emps)) { State.employees = emps; populateDraftDirectoryDropdown(); } });
  }
  if (!State.interns || State.interns.length === 0) {
    API.get('/api/interns').then(ints => { if (ints && Array.isArray(ints)) { State.interns = ints; populateDraftDirectoryDropdown(); } });
  }
}

async function loadHR() {
  const employees = await API.get('/api/employees');
  const interns = await API.get('/api/interns');

  State.employees = employees || [];
  State.interns = interns || [];
  populateDraftDirectoryDropdown();

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
  const [docs, emps, interns] = await Promise.all([
    API.get('/api/documents'),
    (!State.employees || State.employees.length === 0) ? API.get('/api/employees') : Promise.resolve(State.employees),
    (!State.interns || State.interns.length === 0) ? API.get('/api/interns') : Promise.resolve(State.interns)
  ]);
  State.documents = docs || [];
  if (emps && Array.isArray(emps)) State.employees = emps;
  if (interns && Array.isArray(interns)) State.interns = interns;
  populateDraftDirectoryDropdown();

  const tbody = $('#table-documents');
  if (!tbody) return;
  if (State.documents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No documents issued yet. Click "+ Draft Official Document" above to create an employee offer letter, internship certificate, or official correspondence.</td></tr>';
    return;
  }
  tbody.innerHTML = State.documents.map(d => `
    <tr>
      <td><span class="code-pill">${d.doc_no}</span></td>
      <td><b>${escapeHTML(d.doc_type)}</b></td>
      <td>${escapeHTML(d.recipient_name)}<br><small style="color:var(--text-muted);">${escapeHTML(d.recipient_sub || '')}</small></td>
      <td>${d.issue_date}</td>
      <td style="font-size:0.8rem;">${escapeHTML(d.signatory)}</td>
      <td><span class="status-badge ${badgeClass(d.status)}">${d.status}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="previewDocRecord(${d.id})">Preview & Print</button>
        <button class="btn btn-secondary btn-sm" style="color:var(--badge-red-text);" onclick="deleteDocRecord(${d.id}, '${escapeHTML(d.doc_no)}')" title="Delete Document Record">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function deleteDocRecord(docId, docNo) {
  if (!confirm(`Are you sure you want to permanently delete document ${docNo}?`)) return;
  const res = await API.delete(`/api/documents/${docId}`);
  if (res.ok) {
    alert(`Document ${docNo} has been deleted.`);
    loadDocuments();
  } else {
    alert(`Error: ${res.error || 'Failed to delete document'}`);
  }
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
// DOCUMENT TEMPLATES & DYNAMIC GENERATORS (OFFICIAL REPLICAS & SIGNATURES)
// =========================================================================

const DOCUMENT_DEFAULT_TEMPLATES = {
  'Employee Offer Letter': {
    subject: (name, role) => `CONFIDENTIAL: Formal Employment Offer — ${role || 'Specialist'}`,
    body: (d) => `Dear ${d.name || '[Candidate Name]'},

On behalf of AgriGuardian Private Limited, we are pleased to offer you the full-time position of ${d.role || '[Designation]'} within our ${d.dept || 'Engineering'} Department, effective from ${d.startDate || '[Start Date]'}.

Your compensation package will be ${d.comp || '₹4,20,000 per annum'} (Cost to Company), payable in 12 equal monthly installments subject to statutory deductions (PF, Professional Tax) as per applicable laws.

You will undergo an initial probationary period of 3 months from your date of joining. Upon successful evaluation of your performance and company standards, your employment will be formally confirmed.

Working hours are Monday through Saturday, 9:00 AM to 5:30 PM, based at our R&D hub in Kunnam, Sriperumbudur, Tamil Nadu. All intellectual property, robotics code, neural network models, and technical documentation generated during your employment remain the exclusive proprietary property of AgriGuardian Private Limited.

Notice period for termination by either party is 30 days during probation, and 60 days following confirmation.`
  },

  'Internship Offer Letter': {
    subject: (name, role) => `OFFICIAL INTERNSHIP OFFER LETTER — ${name || '[Candidate Name]'}`,
    body: (d) => `Welcome to AgriGuardian,

Congratulations! We are delighted to make you an offer as ${d.role || 'Machine Learning'} Intern at AgriGuardian Private Limited, effective from ${d.startDate || '[Start Date]'} to ${d.endDate || '[End Date]'}. This internship is observed by AgriGuardian as being a significant learning opportunity for you.

Your internship will embrace orientation and give emphasis on learning new skills with a deeper understanding of concepts through hands-on application of the knowledge you gained. You will acknowledge your obligation to perform all work allocated to you to the best of your ability within lawful and reasonable direction given to you.

Stipend: ${d.comp || '₹10,000 per month'} | Reporting Mentor: ${d.mentor || 'Jas Annuncia M'}

Wishing you the most enjoyable and truly meaningful internship program experience.`
  },

  'Internship Completion Certificate': {
    subject: (name, role) => `INTERNSHIP COMPLETION CERTIFICATION — ${name || '[Candidate Name]'}`,
    body: (d) => `has successfully completed an intensive technical internship in ${d.role || 'Applied Robotics & Machine Learning'} at AgriGuardian Private Limited from ${d.startDate || '[Start Date]'} to ${d.endDate || '[End Date]'}. During this tenure, the candidate demonstrated exceptional diligence, professional integrity, and technical capability in applied agricultural robotics and machine learning methodologies.`
  },

  'Appointment Letter': {
    subject: (name, role) => `LETTER OF FORMAL APPOINTMENT — ${role || '[Designation]'}`,
    body: (d) => `Dear ${d.name || '[Candidate Name]'},

With reference to your acceptance of our offer letter, the Management of AgriGuardian Private Limited is pleased to confirm your appointment as ${d.role || '[Designation]'} in the ${d.dept || 'Operations'} Department with effect from ${d.startDate || '[Start Date]'}.

You will be stationed at our corporate technical facility in Sriperumbudur, Tamil Nadu. Your compensation remains as agreed in your appointment terms, payable monthly in arrears.

You will report directly to the Designated Lead / Director and adhere strictly to the AgriGuardian Enterprise SOP Manual and Code of Conduct.

We look forward to an enduring and mutually rewarding association.`
  },

  'Experience & Relieving Letter': {
    subject: (name, role) => `EXPERIENCE & RELIEVING CERTIFICATE — ${name || '[Candidate Name]'}`,
    body: (d) => `This is to certify that ${d.name || '[Candidate Name]'} was employed with AgriGuardian Private Limited as ${d.role || '[Designation]'} in the ${d.dept || 'Engineering'} Department from ${d.startDate || '[Start Date]'} to ${d.endDate || '[End Date]'}.

During their service tenure, ${d.name || '[Candidate Name]'} demonstrated outstanding professional competence, dedication, and high ethical standards.

The employee was formally relieved of all duties and responsibilities at the close of working hours on ${d.endDate || '[End Date]'}. All company assets, access credentials, and technical handover have been completed satisfactorily, and there are no outstanding liabilities or financial dues against the employee.

We wish them all success in their future career endeavors.`
  },

  'Salary Certificate': {
    subject: (name, role) => `SALARY & EMOLUMENTS CERTIFICATE — ${name || '[Candidate Name]'}`,
    body: (d) => `This is to certify that ${d.name || '[Candidate Name]'} is currently employed as a full-time ${d.role || '[Designation]'} in the ${d.dept || 'Operations'} Department of AgriGuardian Private Limited since ${d.startDate || '[Start Date]'}.

As per company payroll records, the employee's gross monthly remuneration is ${d.comp || '₹45,000.00'}, with net monthly remuneration payable after applicable statutory deductions.

This certificate is issued on employee's request for official and financial verification purposes.`
  },

  'Quotation Cover Letter': {
    subject: (name, role) => `OFFICIAL SUBMISSION: COMMERCIAL PROPOSAL & SKILL PROGRAM`,
    body: (d) => `To the Management,

AgriGuardian Private Limited is pleased to submit our comprehensive curriculum and commercial proposal for the Student Skill Development & Agritech Training Program.

Our structured 3-month modular program encompasses hands-on robotics workshops, embedded IoT programming, practical agronomy field labs, and Government of India MSME-recognized certifications.

We look forward to partnering with your institution to foster hands-on STEM and agritech innovation among students.`
  },

  'General Official Letter': {
    subject: (name, role) => `OFFICIAL CORRESPONDENCE / MEMORANDUM`,
    body: (d) => `Dear ${d.name || 'Sir / Madam'},

This official communication confirms the corporate decisions and operational terms agreed upon by AgriGuardian Private Limited.

Should you require any further assistance, please contact our administration office at agriguardians@gmail.com.`
  }
};

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
      signatory2_img: 'sig-haripriya.png',
      is_dual: true
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
      signatory_title: 'FOUNDER & CEO',
      signatory_img: 'sig-saivignesh.png'
    });
  }

  openModal('modal-doc-viewer');
}

// 1. LANDSCAPE METHOD CERTIFICATE GENERATOR (297mm x 210mm)
function generateLandscapeCertificateHTML(d) {
  const isDual = d.is_dual || Boolean(d.signatory2_name) || (d.signatory && d.signatory.includes('&'));
  const sig1Img = d.signatory1_img || d.signatory_img || 'sig-saivignesh.png';
  const sig1Name = d.signatory1_name || (d.signatory && !isDual ? d.signatory : 'SAIVIGNESH R V');
  const sig1Title = d.signatory1_title || (d.signatory_title && !isDual ? d.signatory_title : 'FOUNDER & CEO');
  
  const sig2Img = d.signatory2_img || 'sig-haripriya.png';
  const sig2Name = d.signatory2_name || 'HARIPRIYA S';
  const sig2Title = d.signatory2_title || 'DIRECTOR (CFO)';

  const narrativeText = d.body ? escapeHTML(d.body).replace(/\n/g, '<br>') : `
    has successfully completed an intensive technical internship in <b>${escapeHTML(d.domain || 'Applied Robotics & Machine Learning')}</b> at 
    <b>AgriGuardian Private Limited</b> from <b>${d.start_date || '1st December 2025'}</b> to <b>${d.end_date || '15th December 2025'}</b>.
    During this tenure, the candidate demonstrated exceptional diligence, professional integrity, 
    and technical capability in applied agricultural robotics and machine learning methodologies.
  `;

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
            <div class="cert-landscape-college">${escapeHTML(d.recipient_college || d.recipient_sub || 'Panimalar Engineering College, Chennai')}</div>

            <p class="cert-landscape-narrative">
              ${narrativeText}
            </p>
          </div>

          <!-- SIGNATURES & VERIFICATION ROW -->
          <div class="cert-landscape-signatures">
            <!-- Left Signatory -->
            <div class="cert-signatory-col">
              <img src="${sig1Img}" class="signature-img" alt="Signature of ${escapeHTML(sig1Name)}">
              <div class="sig-rule">
                <b>${escapeHTML(sig1Name)}</b><br>
                <span style="color:#64748b; font-size:7.5pt;">${escapeHTML(sig1Title)}</span>
              </div>
            </div>

            <!-- Center Seal & Serial -->
            <div class="cert-seal-col">
              <img src="logo-seal.png" alt="Official AgriGuardian Seal">
              <span class="cert-serial-tag">${d.cert_no || d.doc_no || 'AG-CERT-2026-0001'}</span>
              <span style="font-size:6.5pt; color:#64748b;">Issued: ${d.issue_date || '2026-10-26'}</span>
            </div>

            <!-- Right Signatory -->
            <div class="cert-signatory-col">
              ${isDual ? `
                <img src="${sig2Img}" class="signature-img" alt="Signature of ${escapeHTML(sig2Name)}">
                <div class="sig-rule">
                  <b>${escapeHTML(sig2Name)}</b><br>
                  <span style="color:#64748b; font-size:7.5pt;">${escapeHTML(sig2Title)}</span>
                </div>
              ` : `
                <div style="font-size:7.5pt; color:#64748b; text-align:center; padding-top:28px;">
                  <b>OFFICIAL VERIFICATION</b><br>
                  verify@agriguardian.in<br>
                  CIN: U01639TN2026PTC194498
                </div>
              `}
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

// 2. SCHOOL QUOTATION SHEET
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

// 3. INTERNSHIP OFFER LETTER REPLICA
function generateInternOfferLetterHTML(d) {
  const sigImg = d.signatory_img || (d.signatory && d.signatory.includes('HARIPRIYA') ? 'sig-haripriya.png' : (d.signatory && d.signatory.includes('SHENGIAN') ? 'sig-shengian.png' : 'sig-saivignesh.png'));
  const bodyHTML = d.body ? d.body.split('\n\n').map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`).join('') : `
    <p><b>Welcome to Agriguardian,</b></p>
    <p>Congratulations! We are delighted to make you an offer as <b>${escapeHTML(d.domain || d.designation || 'Machine Learning')}</b>. Internship offer letter is to confirm your selection <b>${escapeHTML(d.domain || d.designation || 'Machine Learning')} Internship</b> at <b>Agriguardian</b> and welcome you for the same effective from <b>${d.start_date || '1st December 2025'}</b> to <b>${d.end_date || '15th December 2025'}</b>. Hope you will be doing well. This Internship is observed by Agriguardian as being a learning opportunity for you.</p>
    
    <p>Your internship will embrace orientation and give emphasis on learning new skills with a deeper understanding of concepts through hands-on application of the knowledge you gained as an intern. You will acknowledge your obligation to perform all work allocated to you to the best of your ability within lawful and reasonable direction given to you. We look forward to a worthwhile and fruitful association which will make you Equipped for future projects.</p>
    
    <p>Wishing you the most enjoyable and truly meaningful internship program experience.</p>
  `;

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
          ${escapeHTML(d.recipient_inst || d.recipient_sub || 'Panimalar Engineering College, Chennai.')}
        </div>
        <div style="text-align:right;">
          <b>${d.issue_date || new Date().toISOString().substring(0, 10)}</b><br>
          <span class="code-pill">${d.doc_no || 'AG-INT-OFF-2026-DRAFT'}</span>
        </div>
      </div>

      <div class="letter-body">
        ${bodyHTML}
      </div>

      <div style="margin-top:20px; font-size:9.5pt;">
        <p>Sincerely,</p>
        <div style="margin:6px 0;">
          <img src="${sigImg}" class="signature-img" style="height:50px; margin-left:0;" alt="Signature of ${escapeHTML(d.signatory || 'SAIVIGNESH R V')}">
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

// 4. EMPLOYEE OFFER LETTER
function generateEmployeeOfferLetterHTML(d) {
  const sigImg = d.signatory_img || (d.signatory && d.signatory.includes('HARIPRIYA') ? 'sig-haripriya.png' : (d.signatory && d.signatory.includes('SHENGIAN') ? 'sig-shengian.png' : 'sig-saivignesh.png'));
  const bodyHTML = d.body ? d.body.split('\n\n').map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`).join('') : `
    <p>Dear <b>${escapeHTML(d.recipient_name)}</b>,</p>
    <p>On behalf of <b>AgriGuardian Private Limited</b>, we are thrilled to offer you the full-time position of <b>${escapeHTML(d.designation || 'Specialist')}</b> in the <b>${escapeHTML(d.department || 'Engineering')}</b> Department. Your technical expertise, problem-solving mindset, and passion for deep-tech agrarian innovation impressed our interview panel, and we believe you will play a vital role in our journey.</p>
    
    <div class="doc-clause-title">1. Remuneration & CTC Structure</div>
    <p>Your annual Cost to Company (CTC) will be <b>${escapeHTML(d.compensation || '₹4,20,000 per annum')}</b>, payable in 12 equal monthly installments, subject to statutory deductions (PF, Professional Tax) as per applicable labor laws.</p>

    <table class="doc-table-annexure">
      <thead>
        <tr><th>Salary Component</th><th>Monthly Entitlement (₹)</th><th>Annual Equivalent (₹)</th></tr>
      </thead>
      <tbody>
        <tr><td>Basic Pay (50%)</td><td>Calculated Pro-rata</td><td>Calculated Pro-rata</td></tr>
        <tr><td>House Rent Allowance (HRA - 20%)</td><td>Calculated Pro-rata</td><td>Calculated Pro-rata</td></tr>
        <tr><td>Special Allowance & Tech Incentives</td><td>Calculated Pro-rata</td><td>Calculated Pro-rata</td></tr>
        <tr style="font-weight:700; background:#f8fafc;"><td>Total Gross Remuneration</td><td colspan="2">${escapeHTML(d.compensation || 'Competitive Executive Grade')}</td></tr>
      </tbody>
    </table>

    <div class="doc-clause-title">2. Joining Date & Probation Period</div>
    <p>Your employment will commence on <b>${d.start_date || 'immediate joining'}</b>. You will undergo an initial probationary review of <b>3 months</b> from your commencement date, during which your technical execution and culture alignment will be evaluated. Upon satisfactory completion, your confirmation will be officially notified.</p>

    <div class="doc-clause-title">3. Place of Work & Working Hours</div>
    <p>Your primary workplace will be at the AgriGuardian Technical Campus / R&D Hub, Kunnam, Sriperumbudur, Tamil Nadu – 631604. Standard business hours are Monday through Saturday, 9:00 AM to 5:30 PM, with reasonable flex-time for field testing.</p>

    <div class="doc-clause-title">4. Intellectual Property & Confidentiality</div>
    <p>All software architectures, robot designs, computer vision models, hardware schematics, and client databases developed during your employment are the exclusive proprietary property of AgriGuardian Private Limited. You shall maintain strict confidentiality during and post-tenure.</p>

    <div class="doc-clause-title">5. Notice Period</div>
    <p>Either party may terminate the employment relationship by providing 30 days written notice during probation, and 60 days following confirmation, or payment of gross salary in lieu thereof.</p>
  `;

  return `
    <div class="a4-document-sheet">
      <!-- HEADER -->
      <div class="doc-letterhead-top">
        <div class="doc-letterhead-left">
          <img src="logo-shield.png" class="logo" alt="AgriGuardian Logo">
          <div>
            <h2>AGRIGUARDIAN PRIVATE LIMITED</h2>
            <span class="cin">CIN: U01639TN2026PTC194498 • SRI PERUMBUDUR, TAMIL NADU</span>
          </div>
        </div>
        <div class="doc-letterhead-right">
          <b>CAMPUS & R&D HUB:</b><br>
          JEPPIAAR INSTITUTE, KUNNAM,<br>
          SRIPERUMBUDUR – 631604, TN.<br>
          📞 +91 8072078836 | ✉️ agriguardians@gmail.com
        </div>
      </div>

      <!-- META -->
      <div class="doc-meta-bar">
        <div>
          <b>REF:</b> <span class="code-pill">${d.doc_no || 'AG-EMP-OFF-2026-DRAFT'}</span>
        </div>
        <div>
          <b>DATE OF ISSUE:</b> ${d.issue_date || new Date().toISOString().substring(0, 10)}
        </div>
      </div>

      <!-- RECIPIENT -->
      <div style="margin-bottom:14px; font-size:9.5pt;">
        <b>TO:</b><br>
        <b style="font-size:11.5pt; color:var(--primary);">${escapeHTML(d.recipient_name)}</b><br>
        ${escapeHTML(d.recipient_sub || 'Chennai, Tamil Nadu, India')}<br>
        <b>Designation:</b> ${escapeHTML(d.designation || 'Team Member')} | <b>Department:</b> ${escapeHTML(d.department || 'Engineering')}
      </div>

      <!-- SUBJECT -->
      <div class="doc-subject-bar">
        SUBJECT: ${escapeHTML(d.subject || `FORMAL OFFER OF EMPLOYMENT — ${d.designation || ''}`)}
      </div>

      <!-- BODY CONTENT -->
      <div class="letter-body" style="font-size:9pt; line-height:1.5;">
        ${bodyHTML}
      </div>

      <!-- SIGNATURE BLOCK -->
      <div class="doc-signatures-wrap">
        <div class="doc-sig-block">
          <span style="font-size:8pt; color:#64748b; margin-bottom:4px;">FOR AGRIGUARDIAN PRIVATE LIMITED:</span>
          <img src="${sigImg}" class="sig-img" alt="Authorized Signature">
          <b>${escapeHTML(d.signatory || 'SAIVIGNESH R V')}</b>
          <span style="font-size:7.5pt; color:#64748b;">${escapeHTML(d.signatory_title || 'FOUNDER & CEO')}</span>
        </div>

        <div style="text-align:center;">
          <img src="logo-seal.png" style="height:70px;" alt="Corporate Seal">
        </div>

        <div class="doc-sig-block right">
          <span style="font-size:8pt; color:#64748b; margin-bottom:4px;">CANDIDATE ACCEPTANCE:</span>
          <div style="height:44px; width:140px; border-bottom:1px dashed #64748b; margin-bottom:4px;"></div>
          <b>${escapeHTML(d.recipient_name)}</b>
          <span style="font-size:7.5pt; color:#64748b;">Signature & Date</span>
        </div>
      </div>

      <!-- ACCEPTANCE SLIP -->
      <div class="doc-acceptance-box">
        <b style="color:var(--primary);">ACKNOWLEDGEMENT & ACCEPTANCE SLIP:</b><br>
        I, <b>${escapeHTML(d.recipient_name)}</b>, hereby acknowledge receipt of this employment offer. I confirm my unconditional acceptance of the terms and conditions outlined herein and agree to join duty on <b>${d.start_date || 'the agreed date'}</b>.
      </div>
    </div>
  `;
}

// 5. APPOINTMENT LETTER
function generateAppointmentLetterHTML(d) {
  const sigImg = d.signatory_img || (d.signatory && d.signatory.includes('HARIPRIYA') ? 'sig-haripriya.png' : (d.signatory && d.signatory.includes('SHENGIAN') ? 'sig-shengian.png' : 'sig-saivignesh.png'));
  const bodyHTML = d.body ? d.body.split('\n\n').map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`).join('') : `
    <p>Dear <b>${escapeHTML(d.recipient_name)}</b>,</p>
    <p>Subsequent to your acceptance of our offer letter, the Board of Directors of <b>AgriGuardian Private Limited</b> is pleased to officially confirm your appointment as <b>${escapeHTML(d.designation || 'Executive')}</b> in the <b>${escapeHTML(d.department || 'Operations')}</b> Department, effective from <b>${d.start_date || 'immediate'}</b>.</p>
    
    <div class="doc-clause-title">1. Terms of Appointment</div>
    <p>Your appointment is governed by the rules, regulations, code of conduct, and employment policies of AgriGuardian Private Limited in force from time to time. You will report directly to the Designated Department Lead / Director.</p>

    <div class="doc-clause-title">2. Duties & Professional Responsibilities</div>
    <p>In your role, you are required to perform all duties and tasks diligently, maintain high ethical standards, and safeguard company assets, technical intellectual property, and confidential client data.</p>

    <div class="doc-clause-title">3. Remuneration</div>
    <p>You will receive a consolidated remuneration of <b>${escapeHTML(d.compensation || 'As per offer contract')}</b>, credited monthly directly to your designated bank account.</p>

    <p>We welcome you to the AgriGuardian family and look forward to your valuable contribution towards scaling modern agricultural technology across the nation.</p>
  `;

  return `
    <div class="a4-document-sheet">
      <div class="doc-letterhead-top">
        <div class="doc-letterhead-left">
          <img src="logo-shield.png" class="logo" alt="AgriGuardian Logo">
          <div>
            <h2>AGRIGUARDIAN PRIVATE LIMITED</h2>
            <span class="cin">CIN: U01639TN2026PTC194498 • SRI PERUMBUDUR, TAMIL NADU</span>
          </div>
        </div>
        <div class="doc-letterhead-right">
          <b>HEADQUARTERS & R&D HUB:</b><br>
          Jeppiaar Institute Campus, Kunnam,<br>
          Sriperumbudur – 631604, TN.<br>
          📞 +91 8072078836 | ✉️ agriguardians@gmail.com
        </div>
      </div>

      <div class="doc-meta-bar">
        <div><b>REF:</b> <span class="code-pill">${d.doc_no || 'AG-APT-2026-DRAFT'}</span></div>
        <div><b>DATE:</b> ${d.issue_date || new Date().toISOString().substring(0, 10)}</div>
      </div>

      <div style="margin-bottom:14px; font-size:9.5pt;">
        <b>TO:</b><br>
        <b style="font-size:11.5pt; color:var(--primary);">${escapeHTML(d.recipient_name)}</b><br>
        ${escapeHTML(d.recipient_sub || 'Chennai, Tamil Nadu, India')}<br>
        <b>Designation:</b> ${escapeHTML(d.designation || 'Appointee')} | <b>Department:</b> ${escapeHTML(d.department || 'Operations')}
      </div>

      <div class="doc-subject-bar">
        SUBJECT: ${escapeHTML(d.subject || `LETTER OF FORMAL APPOINTMENT — ${d.designation || ''}`)}
      </div>

      <div class="letter-body" style="font-size:9.5pt; line-height:1.6;">
        ${bodyHTML}
      </div>

      <div class="doc-signatures-wrap" style="margin-top:40px;">
        <div class="doc-sig-block">
          <span style="font-size:8pt; color:#64748b; margin-bottom:4px;">FOR AGRIGUARDIAN PRIVATE LIMITED:</span>
          <img src="${sigImg}" class="sig-img" alt="Authorized Signature">
          <b>${escapeHTML(d.signatory || 'SAIVIGNESH R V')}</b>
          <span style="font-size:7.5pt; color:#64748b;">${escapeHTML(d.signatory_title || 'FOUNDER & CEO')}</span>
        </div>

        <div style="text-align:center;">
          <img src="logo-seal.png" style="height:75px;" alt="Corporate Seal">
        </div>

        <div class="doc-sig-block right">
          <span style="font-size:8pt; color:#64748b; margin-bottom:4px;">ACCEPTED & RECEIVED:</span>
          <div style="height:48px; width:140px; border-bottom:1px dashed #64748b; margin-bottom:4px;"></div>
          <b>${escapeHTML(d.recipient_name)}</b>
          <span style="font-size:7.5pt; color:#64748b;">Appointee Signature</span>
        </div>
      </div>
    </div>
  `;
}

// 6. EXPERIENCE & RELIEVING LETTER
function generateExperienceRelievingLetterHTML(d) {
  const sigImg = d.signatory_img || (d.signatory && d.signatory.includes('HARIPRIYA') ? 'sig-haripriya.png' : (d.signatory && d.signatory.includes('SHENGIAN') ? 'sig-shengian.png' : 'sig-saivignesh.png'));
  const bodyHTML = d.body ? d.body.split('\n\n').map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`).join('') : `
    <p>This is to formally certify that <b>${escapeHTML(d.recipient_name)}</b> was an esteemed employee of <b>AgriGuardian Private Limited</b>, serving in the position of <b>${escapeHTML(d.designation || 'Engineer')}</b> in the <b>${escapeHTML(d.department || 'Engineering')}</b> Department from <b>${d.start_date || '–'}</b> to <b>${d.end_date || '–'}</b>.</p>
    
    <p>During their tenure with AgriGuardian, ${escapeHTML(d.recipient_name)} exhibited exceptional technical competence, unwavering dedication, and professional ethics. They consistently contributed to key milestones in agricultural automation and displayed commendable team collaboration.</p>

    <p>We further confirm that ${escapeHTML(d.recipient_name)} has been relieved of all official responsibilities and company duties effective from the close of business hours on <b>${d.end_date || d.issue_date}</b>. All company assets, technical repositories, and clearance processes have been settled satisfactorily, and there are no outstanding dues.</p>

    <p>We take this opportunity to thank ${escapeHTML(d.recipient_name)} for their dedicated service to AgriGuardian and wish them immense success in all their future career pursuits and personal endeavors.</p>
  `;

  return `
    <div class="a4-document-sheet">
      <div class="doc-letterhead-top">
        <div class="doc-letterhead-left">
          <img src="logo-shield.png" class="logo" alt="AgriGuardian Logo">
          <div>
            <h2>AGRIGUARDIAN PRIVATE LIMITED</h2>
            <span class="cin">CIN: U01639TN2026PTC194498 • SRI PERUMBUDUR, TAMIL NADU</span>
          </div>
        </div>
        <div class="doc-letterhead-right">
          <b>CORPORATE CAMPUS:</b><br>
          Jeppiaar Institute Campus, Kunnam,<br>
          Sriperumbudur – 631604, TN.<br>
          📞 +91 8072078836 | ✉️ agriguardians@gmail.com
        </div>
      </div>

      <div class="doc-meta-bar">
        <div><b>REF:</b> <span class="code-pill">${d.doc_no || 'AG-EXP-2026-DRAFT'}</span></div>
        <div><b>DATE:</b> ${d.issue_date || new Date().toISOString().substring(0, 10)}</div>
      </div>

      <div style="text-align:center; margin:18px 0 14px 0;">
        <span style="font-size:12pt; font-weight:800; letter-spacing:0.08em; color:var(--primary); text-transform:uppercase; border-bottom:2px solid var(--primary); padding-bottom:4px;">
          TO WHOMSOEVER IT MAY CONCERN
        </span>
      </div>

      <div class="doc-subject-bar" style="text-align:center;">
        SUBJECT: ${escapeHTML(d.subject || `EXPERIENCE AND RELIEVING CERTIFICATE — ${d.recipient_name}`)}
      </div>

      <div class="letter-body" style="font-size:10pt; line-height:1.65; margin-top:16px;">
        ${bodyHTML}
      </div>

      <div class="doc-signatures-wrap" style="margin-top:60px;">
        <div class="doc-sig-block">
          <span style="font-size:8pt; color:#64748b; margin-bottom:4px;">FOR AGRIGUARDIAN PRIVATE LIMITED:</span>
          <img src="${sigImg}" class="sig-img" alt="Authorized Signature">
          <b>${escapeHTML(d.signatory || 'SAIVIGNESH R V')}</b>
          <span style="font-size:7.5pt; color:#64748b;">${escapeHTML(d.signatory_title || 'FOUNDER & CEO')}</span>
        </div>

        <div style="text-align:center;">
          <img src="logo-seal.png" style="height:75px;" alt="Corporate Seal">
        </div>

        <div style="text-align:right; font-size:7.5pt; color:#64748b;">
          <b>Official Verification Contact:</b><br>
          hr@agriguardian.in | +91 8072078836<br>
          CIN: U01639TN2026PTC194498
        </div>
      </div>
    </div>
  `;
}

// 7. SALARY CERTIFICATE
function generateSalaryCertificateHTML(d) {
  const sigImg = d.signatory_img || (d.signatory && d.signatory.includes('HARIPRIYA') ? 'sig-haripriya.png' : (d.signatory && d.signatory.includes('SHENGIAN') ? 'sig-shengian.png' : 'sig-saivignesh.png'));
  const bodyHTML = d.body ? d.body.split('\n\n').map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`).join('') : `
    <p>This is to certify that <b>${escapeHTML(d.recipient_name)}</b> is a bona fide full-time employee of <b>AgriGuardian Private Limited</b>, designated as <b>${escapeHTML(d.designation || 'Specialist')}</b> in the <b>${escapeHTML(d.department || 'Operations')}</b> Department since <b>${d.start_date || 'joining'}</b>.</p>

    <p>As per official company payroll records, the monthly gross and net earnings entitlement of the employee is structured as follows:</p>

    <table class="doc-table-annexure">
      <thead>
        <tr><th>Earnings Head</th><th>Amount (₹)</th><th>Deductions Head</th><th>Amount (₹)</th></tr>
      </thead>
      <tbody>
        <tr><td>Basic Salary</td><td>₹25,000.00</td><td>Provident Fund (PF)</td><td>₹1,800.00</td></tr>
        <tr><td>House Rent Allowance (HRA)</td><td>₹10,000.00</td><td>Professional Tax (PT)</td><td>₹200.00</td></tr>
        <tr><td>Special Allowance</td><td>₹7,500.00</td><td>Income Tax (TDS)</td><td>₹0.00</td></tr>
        <tr><td>Conveyance / Field Allowance</td><td>₹2,500.00</td><td>Other Deductions</td><td>₹0.00</td></tr>
        <tr style="font-weight:700; background:#f8fafc;">
          <td>Total Gross Earnings</td>
          <td><b>${escapeHTML(d.compensation || '₹45,000.00')}</b></td>
          <td>Total Deductions</td>
          <td><b>₹2,000.00</b></td>
        </tr>
      </tbody>
    </table>

    <p><b>Net Monthly Take-Home Salary:</b> Calculated at Net Entitlement, credited directly to employee's bank account on or before the last working day of each calendar month.</p>

    <p>This certificate is issued at the specific request of the employee for banking, loan processing, or official record verification purposes without any financial liability on the part of AgriGuardian Private Limited or its Directors.</p>
  `;

  return `
    <div class="a4-document-sheet">
      <div class="doc-letterhead-top">
        <div class="doc-letterhead-left">
          <img src="logo-shield.png" class="logo" alt="AgriGuardian Logo">
          <div>
            <h2>AGRIGUARDIAN PRIVATE LIMITED</h2>
            <span class="cin">CIN: U01639TN2026PTC194498 • SRI PERUMBUDUR, TAMIL NADU</span>
          </div>
        </div>
        <div class="doc-letterhead-right">
          <b>CAMPUS & FINANCE DESK:</b><br>
          Jeppiaar Institute Campus, Kunnam,<br>
          Sriperumbudur – 631604, TN.<br>
          📞 +91 8072078836 | ✉️ agriguardians@gmail.com
        </div>
      </div>

      <div class="doc-meta-bar">
        <div><b>REF:</b> <span class="code-pill">${d.doc_no || 'AG-SAL-CERT-2026-DRAFT'}</span></div>
        <div><b>DATE:</b> ${d.issue_date || new Date().toISOString().substring(0, 10)}</div>
      </div>

      <div style="text-align:center; margin:16px 0 12px 0;">
        <span style="font-size:12pt; font-weight:800; letter-spacing:0.08em; color:var(--primary); text-transform:uppercase; border-bottom:2px solid var(--primary); padding-bottom:4px;">
          TO WHOMSOEVER IT MAY CONCERN
        </span>
      </div>

      <div class="doc-subject-bar" style="text-align:center;">
        SUBJECT: ${escapeHTML(d.subject || `SALARY AND EARNINGS CERTIFICATE — ${d.recipient_name}`)}
      </div>

      <div class="letter-body" style="font-size:9.5pt; line-height:1.6; margin-top:14px;">
        ${bodyHTML}
      </div>

      <div class="doc-signatures-wrap" style="margin-top:50px;">
        <div class="doc-sig-block">
          <span style="font-size:8pt; color:#64748b; margin-bottom:4px;">AUTHORIZED BY (FINANCE & ACCOUNTS):</span>
          <img src="${sigImg}" class="sig-img" alt="Authorized Signature">
          <b>${escapeHTML(d.signatory || 'HARIPRIYA S')}</b>
          <span style="font-size:7.5pt; color:#64748b;">${escapeHTML(d.signatory_title || 'DIRECTOR (CFO)')}</span>
        </div>

        <div style="text-align:center;">
          <img src="logo-seal.png" style="height:75px;" alt="Corporate Seal">
        </div>

        <div style="text-align:right; font-size:7.5pt; color:#64748b;">
          <b>Finance Department:</b><br>
          accounts@agriguardian.in<br>
          Union Bank of India A/c: 520101269970136
        </div>
      </div>
    </div>
  `;
}

// 8. GENERAL OFFICIAL CORRESPONDENCE / MEMORANDUM
function generateGeneralOfficialDocHTML(d) {
  const sigImg = d.signatory_img || (d.signatory && d.signatory.includes('HARIPRIYA') ? 'sig-haripriya.png' : (d.signatory && d.signatory.includes('SHENGIAN') ? 'sig-shengian.png' : 'sig-saivignesh.png'));
  const bodyHTML = d.body ? d.body.split('\n\n').map(p => `<p>${escapeHTML(p).replace(/\n/g, '<br>')}</p>`).join('') : `
    <p>Dear <b>${escapeHTML(d.recipient_name)}</b>,</p>
    <p>This official memorandum serves to formalize our corporate correspondence regarding ongoing commercial and operational engagements.</p>
    <p>AgriGuardian Private Limited remains committed to advancing sustainable farming robotics and high-quality educational skill development programs.</p>
    <p>Please feel free to reach out to our administration desk for further clarifications.</p>
  `;

  return `
    <div class="a4-document-sheet">
      <div class="doc-letterhead-top">
        <div class="doc-letterhead-left">
          <img src="logo-shield.png" class="logo" alt="AgriGuardian Logo">
          <div>
            <h2>AGRIGUARDIAN PRIVATE LIMITED</h2>
            <span class="cin">CIN: U01639TN2026PTC194498 • SRI PERUMBUDUR, TAMIL NADU</span>
          </div>
        </div>
        <div class="doc-letterhead-right">
          <b>ADMINISTRATION DESK:</b><br>
          Jeppiaar Institute Campus, Kunnam,<br>
          Sriperumbudur – 631604, TN.<br>
          📞 +91 8072078836 | ✉️ agriguardians@gmail.com
        </div>
      </div>

      <div class="doc-meta-bar">
        <div><b>REF:</b> <span class="code-pill">${d.doc_no || 'AG-DOC-2026-DRAFT'}</span></div>
        <div><b>DATE:</b> ${d.issue_date || new Date().toISOString().substring(0, 10)}</div>
      </div>

      <div style="margin-bottom:14px; font-size:9.5pt;">
        <b>TO:</b><br>
        <b style="font-size:11.5pt; color:var(--primary);">${escapeHTML(d.recipient_name)}</b><br>
        ${escapeHTML(d.recipient_sub || 'Chennai, Tamil Nadu, India')}
      </div>

      <div class="doc-subject-bar">
        SUBJECT: ${escapeHTML(d.subject || 'OFFICIAL CORRESPONDENCE')}
      </div>

      <div class="letter-body" style="font-size:10pt; line-height:1.65; margin-top:14px;">
        ${bodyHTML}
      </div>

      <div class="doc-signatures-wrap" style="margin-top:60px;">
        <div class="doc-sig-block">
          <span style="font-size:8pt; color:#64748b; margin-bottom:4px;">FOR AGRIGUARDIAN PRIVATE LIMITED:</span>
          <img src="${sigImg}" class="sig-img" alt="Authorized Signature">
          <b>${escapeHTML(d.signatory || 'SAIVIGNESH R V')}</b>
          <span style="font-size:7.5pt; color:#64748b;">${escapeHTML(d.signatory_title || 'FOUNDER & CEO')}</span>
        </div>

        <div style="text-align:center;">
          <img src="logo-seal.png" style="height:75px;" alt="Corporate Seal">
        </div>

        <div style="text-align:right; font-size:7.5pt; color:#64748b;">
          <b>Authorized Signatory Desk</b><br>
          CIN: U01639TN2026PTC194498
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

  let meta = {};
  try {
    meta = typeof d.meta_json === 'string' ? JSON.parse(d.meta_json) : (d.meta_json || {});
  } catch(e) {
    meta = {};
  }

  const docParams = {
    ...d,
    ...meta,
    recipient_name: d.recipient_name,
    recipient_sub: d.recipient_sub || meta.recipient_sub || '',
    recipient_college: d.recipient_sub || meta.recipient_sub || '',
    recipient_inst: d.recipient_sub || meta.recipient_sub || '',
    designation: meta.designation || d.category || 'Specialist',
    department: meta.department || 'Engineering',
    domain: meta.designation || meta.domain || 'Applied Robotics & Machine Learning',
    start_date: meta.start_date || '1st December 2025',
    end_date: meta.end_date || '15th December 2025',
    compensation: meta.compensation || '₹4,20,000 per annum',
    mentor: meta.mentor || 'Saivignesh R V',
    cert_no: d.doc_no,
    issue_date: d.issue_date || new Date().toISOString().substring(0, 10),
    signatory: d.signatory || 'SAIVIGNESH R V',
    signatory_title: d.signatory_title || 'FOUNDER & CEO',
    signatory_img: meta.signatory_img || (d.signatory && d.signatory.includes('HARIPRIYA') ? 'sig-haripriya.png' : (d.signatory && d.signatory.includes('SHENGIAN') ? 'sig-shengian.png' : 'sig-saivignesh.png')),
    signatory1_name: meta.signatory1_name || 'SAIVIGNESH R V',
    signatory1_title: meta.signatory1_title || 'FOUNDER & CEO',
    signatory1_img: meta.signatory1_img || 'sig-saivignesh.png',
    signatory2_name: meta.signatory2_name || 'HARIPRIYA S',
    signatory2_title: meta.signatory2_title || 'DIRECTOR (CFO)',
    signatory2_img: meta.signatory2_img || 'sig-haripriya.png',
    is_dual: meta.is_dual || (d.signatory && d.signatory.includes('&'))
  };

  if (docType.includes('certificate')) {
    modalTitle.textContent = `Internship Completion Certificate (Official Landscape A4) — ${d.doc_no}`;
    container.innerHTML = generateLandscapeCertificateHTML(docParams);
  } else if (docType.includes('intern') && docType.includes('offer')) {
    modalTitle.textContent = `Internship Offer Letter — ${d.recipient_name}`;
    container.innerHTML = generateInternOfferLetterHTML(docParams);
  } else if (docType.includes('offer')) {
    modalTitle.textContent = `Employee Offer Letter — ${d.recipient_name}`;
    container.innerHTML = generateEmployeeOfferLetterHTML(docParams);
  } else if (docType.includes('appoint')) {
    modalTitle.textContent = `Appointment Letter — ${d.recipient_name}`;
    container.innerHTML = generateAppointmentLetterHTML(docParams);
  } else if (docType.includes('experience') || docType.includes('relieving')) {
    modalTitle.textContent = `Experience & Relieving Certificate — ${d.recipient_name}`;
    container.innerHTML = generateExperienceRelievingLetterHTML(docParams);
  } else if (docType.includes('salary')) {
    modalTitle.textContent = `Salary Certificate — ${d.recipient_name}`;
    container.innerHTML = generateSalaryCertificateHTML(docParams);
  } else {
    modalTitle.textContent = `Official Document — ${d.doc_no}`;
    container.innerHTML = generateGeneralOfficialDocHTML(docParams);
  }

  openModal('modal-doc-viewer');
}

// Extract form data from Draft Document modal
function getDraftFormData() {
  const docType = $('#draft-doc-type')?.value || 'Employee Offer Letter';
  const name = $('#draft-recipient-name')?.value || 'Candidate / Recipient';
  const sub = $('#draft-recipient-sub')?.value || 'Chennai, Tamil Nadu';
  const designation = $('#draft-designation')?.value || 'Specialist';
  const dept = $('#draft-department')?.value || 'AI & Robotics';
  const startDate = $('#draft-start-date')?.value || new Date().toISOString().substring(0, 10);
  const endDate = $('#draft-end-date')?.value || '';
  const compensation = $('#draft-compensation')?.value || '₹4,20,000 per annum';
  const mentor = $('#draft-mentor')?.value || 'Saivignesh R V';
  const sigParts = ($('#draft-signatory')?.value || '').split('|');
  const isDual = sigParts[0] === 'DUAL';
  const issueDate = $('#draft-issue-date')?.value || new Date().toISOString().substring(0, 10);
  const subject = $('#draft-subject')?.value || `${docType} — ${name}`;
  const body = $('#draft-body')?.value || '';

  return {
    doc_no: 'AG-DRAFT-' + new Date().getFullYear() + '-0001',
    doc_type: docType,
    recipient_name: name,
    recipient_sub: sub,
    recipient_college: sub,
    recipient_inst: sub,
    designation,
    domain: designation,
    department: dept,
    start_date: startDate,
    end_date: endDate,
    compensation,
    mentor,
    issue_date: issueDate,
    subject,
    body,
    is_dual: isDual,
    signatory: isDual ? 'SAIVIGNESH R V & HARIPRIYA S' : (sigParts[0] || 'SAIVIGNESH R V'),
    signatory_title: isDual ? 'FOUNDER & DIRECTOR' : (sigParts[1] || 'FOUNDER & CEO'),
    signatory_img: isDual ? 'sig-saivignesh.png' : (sigParts[2] || 'sig-saivignesh.png'),
    signatory1_name: 'SAIVIGNESH R V',
    signatory1_title: 'FOUNDER & CEO',
    signatory1_img: 'sig-saivignesh.png',
    signatory2_name: 'HARIPRIYA S',
    signatory2_title: 'DIRECTOR (CFO)',
    signatory2_img: 'sig-haripriya.png',
    cert_no: 'AG-CERT-' + new Date().getFullYear() + '-DRAFT'
  };
}

// Live preview trigger from drafting modal
function previewDraftFromForm() {
  const d = getDraftFormData();
  const container = $('#doc-preview-container');
  const modalTitle = $('#doc-viewer-modal-title');
  const docType = d.doc_type.toLowerCase();

  if (docType.includes('certificate')) {
    modalTitle.textContent = `Live Preview: Internship Completion Certificate (Landscape A4) — ${d.recipient_name}`;
    container.innerHTML = generateLandscapeCertificateHTML(d);
  } else if (docType.includes('intern') && docType.includes('offer')) {
    modalTitle.textContent = `Live Preview: Internship Offer Letter — ${d.recipient_name}`;
    container.innerHTML = generateInternOfferLetterHTML(d);
  } else if (docType.includes('offer')) {
    modalTitle.textContent = `Live Preview: Employee Offer Letter — ${d.recipient_name}`;
    container.innerHTML = generateEmployeeOfferLetterHTML(d);
  } else if (docType.includes('appoint')) {
    modalTitle.textContent = `Live Preview: Appointment Letter — ${d.recipient_name}`;
    container.innerHTML = generateAppointmentLetterHTML(d);
  } else if (docType.includes('experience') || docType.includes('relieving')) {
    modalTitle.textContent = `Live Preview: Experience & Relieving Certificate — ${d.recipient_name}`;
    container.innerHTML = generateExperienceRelievingLetterHTML(d);
  } else if (docType.includes('salary')) {
    modalTitle.textContent = `Live Preview: Salary Certificate — ${d.recipient_name}`;
    container.innerHTML = generateSalaryCertificateHTML(d);
  } else {
    modalTitle.textContent = `Live Preview: ${d.doc_type} — ${d.recipient_name}`;
    container.innerHTML = generateGeneralOfficialDocHTML(d);
  }

  openModal('modal-doc-viewer');
}

// Populate Directory quick autofill dropdown
function populateDraftDirectoryDropdown() {
  const quickSelect = $('#draft-quick-entity');
  if (!quickSelect) return;
  let opts = '<option value="">-- Choose Employee or Intern to Auto-Fill --</option>';
  if (State.employees && State.employees.length > 0) {
    opts += '<optgroup label="Registered Employees (Staff Directory)">';
    State.employees.forEach(emp => {
      opts += `<option value="emp:${emp.id}">[Staff] ${escapeHTML(emp.name)} (${escapeHTML(emp.employee_code || '')}) — ${escapeHTML(emp.designation || 'Specialist')}</option>`;
    });
    opts += '</optgroup>';
  }
  if (State.interns && State.interns.length > 0) {
    opts += '<optgroup label="Internship Cohort (Interns & Trainees)">';
    State.interns.forEach(intn => {
      opts += `<option value="intn:${intn.id}">[Intern] ${escapeHTML(intn.name)} (${escapeHTML(intn.intern_code || '')}) — ${escapeHTML(intn.college || 'Intern')}</option>`;
    });
    opts += '</optgroup>';
  }
  quickSelect.innerHTML = opts;
}

// Open and initialize Draft Document Modal
async function openDraftDocumentModal() {
  const today = new Date().toISOString().substring(0, 10);
  if ($('#draft-issue-date')) $('#draft-issue-date').value = today;
  if ($('#draft-start-date') && !$('#draft-start-date').value) $('#draft-start-date').value = today;

  // Ensure employees and interns are loaded from API if empty
  if (!State.employees || State.employees.length === 0) {
    try {
      const emps = await API.get('/api/employees');
      if (emps && Array.isArray(emps)) State.employees = emps;
    } catch (e) {
      console.warn('Failed to prefetch employees for draft modal:', e);
    }
  }
  if (!State.interns || State.interns.length === 0) {
    try {
      const interns = await API.get('/api/interns');
      if (interns && Array.isArray(interns)) State.interns = interns;
    } catch (e) {
      console.warn('Failed to prefetch interns for draft modal:', e);
    }
  }

  populateDraftDirectoryDropdown();
  onDraftDocTypeChange();
  openModal('modal-draft-document');
}

// Template update on document type change
function onDraftDocTypeChange() {
  const typeSelect = $('#draft-doc-type');
  if (!typeSelect) return;
  const docType = typeSelect.value;
  const tmpl = DOCUMENT_DEFAULT_TEMPLATES[docType] || DOCUMENT_DEFAULT_TEMPLATES['General Official Letter'];

  const name = $('#draft-recipient-name')?.value || '';
  const role = $('#draft-designation')?.value || '';
  const dept = $('#draft-department')?.value || 'AI & Robotics';
  const startDate = $('#draft-start-date')?.value || '';
  const endDate = $('#draft-end-date')?.value || '';
  const comp = $('#draft-compensation')?.value || '';
  const mentor = $('#draft-mentor')?.value || '';

  const subjectInput = $('#draft-subject');
  const bodyTextarea = $('#draft-body');

  if (subjectInput) {
    subjectInput.value = tmpl.subject(name, role);
  }

  if (bodyTextarea) {
    bodyTextarea.value = tmpl.body({ name, role, dept, startDate, endDate, comp, mentor });
  }

  // Adjust defaults per type
  const compInput = $('#draft-compensation');
  if (compInput && !compInput.value) {
    if (docType === 'Internship Offer Letter') compInput.value = '₹10,000 / month Stipend';
    else if (docType === 'Employee Offer Letter') compInput.value = '₹4,20,000 per annum';
    else if (docType === 'Salary Certificate') compInput.value = '₹45,000.00 / month Gross';
  }
}

// Mobile sidebar controls
function toggleMobileSidebar() {
  const sidebar = $('#portal-sidebar');
  const backdrop = $('#sidebar-backdrop');
  const toggleBtn = $('#btn-mobile-toggle');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('mobile-open');
  if (isOpen) {
    sidebar.classList.remove('mobile-open');
    backdrop?.classList.remove('active');
    toggleBtn?.setAttribute('aria-expanded', 'false');
  } else {
    sidebar.classList.add('mobile-open');
    backdrop?.classList.add('active');
    toggleBtn?.setAttribute('aria-expanded', 'true');
  }
}

function closeMobileSidebar() {
  $('#portal-sidebar')?.classList.remove('mobile-open');
  $('#sidebar-backdrop')?.classList.remove('active');
  $('#btn-mobile-toggle')?.setAttribute('aria-expanded', 'false');
}

// Clean document print / PDF handler (Isolates purely document sheet without website chrome)
function printCurrentDocument() {
  const container = $('#doc-preview-container');
  const isLandscape = container && !!container.querySelector('.a4-landscape-sheet');

  let printStyle = document.getElementById('dynamic-print-page-style');
  if (!printStyle) {
    printStyle = document.createElement('style');
    printStyle.id = 'dynamic-print-page-style';
    document.head.appendChild(printStyle);
  }

  if (isLandscape) {
    printStyle.innerHTML = '@media print { @page { size: 297mm 210mm landscape !important; margin: 0 !important; } }';
  } else {
    printStyle.innerHTML = '@media print { @page { size: 210mm 297mm portrait !important; margin: 0 !important; } }';
  }

  window.print();
}

// Download raw standalone HTML document
function downloadCurrentDocumentHTML() {
  const container = $('#doc-preview-container');
  if (!container || !container.innerHTML.trim()) {
    alert('No document currently loaded to download.');
    return;
  }
  const title = ($('#doc-viewer-modal-title')?.textContent || 'AgriGuardian_Document')
    .replace(/[^a-zA-Z0-9_\-]/g, '_');
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(title)}</title>
  <link rel="stylesheet" href="style.css">
  <style>
    body { background: #525659; display: flex; justify-content: center; padding: 20px; margin: 0; font-family: 'Inter', -apple-system, sans-serif; }
    .a4-document-sheet, .a4-landscape-sheet { background: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
    @media print {
      body { background: #fff; padding: 0; }
      .a4-document-sheet, .a4-landscape-sheet { box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
  ${container.innerHTML}
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Ensure correct print page size on Ctrl+P
window.addEventListener('beforeprint', () => {
  const container = $('#doc-preview-container');
  const isLandscape = container && !!container.querySelector('.a4-landscape-sheet');
  let printStyle = document.getElementById('dynamic-print-page-style');
  if (!printStyle) {
    printStyle = document.createElement('style');
    printStyle.id = 'dynamic-print-page-style';
    document.head.appendChild(printStyle);
  }
  if (isLandscape) {
    printStyle.innerHTML = '@media print { @page { size: 297mm 210mm landscape !important; margin: 0 !important; } }';
  } else {
    printStyle.innerHTML = '@media print { @page { size: 210mm 297mm portrait !important; margin: 0 !important; } }';
  }
});

// Bind Global Functions to Window for Inline Handlers
window.previewQuotation = previewQuotation;
window.previewDocRecord = previewDocRecord;
window.previewOfficialDoc = previewOfficialDoc;
window.printCurrentDocument = printCurrentDocument;
window.downloadCurrentDocumentHTML = downloadCurrentDocumentHTML;
window.populateDraftDirectoryDropdown = populateDraftDirectoryDropdown;
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
window.deleteDocRecord = deleteDocRecord;
window.openDraftDocumentModal = openDraftDocumentModal;
window.previewDraftFromForm = previewDraftFromForm;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
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
      closeMobileSidebar();
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

  // Mobile Navigation Drawer Toggle Listeners
  $('#btn-mobile-toggle')?.addEventListener('click', toggleMobileSidebar);
  $('#btn-sidebar-close')?.addEventListener('click', closeMobileSidebar);
  $('#sidebar-backdrop')?.addEventListener('click', closeMobileSidebar);

  // Close mobile drawer or active modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileSidebar();
      const activeModal = $('.modal-overlay.active');
      if (activeModal) closeModal(activeModal.id);
    }
  });

  // Official Document Drafting Listeners
  $('#btn-create-letter')?.addEventListener('click', openDraftDocumentModal);
  $('#btn-quick-new-doc')?.addEventListener('click', openDraftDocumentModal);
  $('#draft-doc-type')?.addEventListener('change', onDraftDocTypeChange);

  // Quick Autofill from Directory (Employee / Intern)
  $('#draft-quick-entity')?.addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return;
    const [type, idStr] = val.split(':');
    const id = parseInt(idStr, 10);
    if (type === 'emp') {
      const emp = State.employees.find(x => x.id === id);
      if (emp) {
        if ($('#draft-recipient-name')) $('#draft-recipient-name').value = emp.name;
        if ($('#draft-designation')) $('#draft-designation').value = emp.designation || 'Specialist';
        if ($('#draft-department')) $('#draft-department').value = emp.department || 'AI & Robotics';
        if ($('#draft-recipient-sub')) $('#draft-recipient-sub').value = emp.address || 'Chennai, Tamil Nadu';
        if ($('#draft-start-date')) $('#draft-start-date').value = emp.joining_date || new Date().toISOString().substring(0, 10);

        let compStr = '';
        if (emp.salary) {
          if (typeof emp.salary === 'string' && emp.salary.trim()) {
            compStr = emp.salary;
          } else if (typeof emp.salary === 'number') {
            compStr = formatINR(emp.salary) + ' / month (Gross)';
          }
        }
        if (!compStr) compStr = '₹35,000 / month (Gross)';
        if ($('#draft-compensation')) $('#draft-compensation').value = compStr;
        if ($('#draft-mentor')) $('#draft-mentor').value = 'Saivignesh R V';

        // Auto-switch to employee document if intern document was currently selected
        if ($('#draft-doc-type') && $('#draft-doc-type').value.toLowerCase().includes('intern')) {
          $('#draft-doc-type').value = 'Employee Offer Letter';
        }

        onDraftDocTypeChange();
      }
    } else if (type === 'intn') {
      const intn = State.interns.find(x => x.id === id);
      if (intn) {
        if ($('#draft-recipient-name')) $('#draft-recipient-name').value = intn.name;
        if ($('#draft-designation')) $('#draft-designation').value = intn.designation || intn.domain || 'Machine Learning Intern';
        if ($('#draft-department')) $('#draft-department').value = 'AI & Robotics';
        if ($('#draft-recipient-sub')) $('#draft-recipient-sub').value = intn.college || 'Panimalar Engineering College, Chennai';
        if ($('#draft-start-date')) $('#draft-start-date').value = intn.joining_date || '';
        if ($('#draft-end-date')) $('#draft-end-date').value = intn.end_date || '';
        if ($('#draft-compensation')) $('#draft-compensation').value = intn.stipend || 'Performance Stipend';
        if ($('#draft-mentor')) $('#draft-mentor').value = intn.mentor || 'Jas Annuncia M';

        // Auto-switch to internship document if employee document was currently selected
        if ($('#draft-doc-type') && !$('#draft-doc-type').value.toLowerCase().includes('intern') && !$('#draft-doc-type').value.toLowerCase().includes('certificate')) {
          $('#draft-doc-type').value = 'Internship Offer Letter';
        }

        onDraftDocTypeChange();
      }
    }
  });

  // Dynamic Subject update when recipient or designation changes
  ['draft-recipient-name', 'draft-designation', 'draft-department'].forEach(fieldId => {
    $('#' + fieldId)?.addEventListener('input', () => {
      const docType = $('#draft-doc-type')?.value;
      const tmpl = DOCUMENT_DEFAULT_TEMPLATES[docType];
      if (tmpl && $('#draft-subject')) {
        const name = $('#draft-recipient-name')?.value || '';
        const role = $('#draft-designation')?.value || '';
        $('#draft-subject').value = tmpl.subject(name, role);
      }
    });
  });

  // Reset Body Template button
  $('#btn-reset-draft-body')?.addEventListener('click', onDraftDocTypeChange);

  // Live Preview button in Draft modal
  $('#btn-preview-draft-doc')?.addEventListener('click', previewDraftFromForm);

  // Form: Save & Issue Official Document
  $('#form-draft-document')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = getDraftFormData();
    const sigVal = $('#draft-signatory')?.value || '';
    const [sigName, sigTitle, sigImg] = sigVal.split('|');

    const meta = {
      recipient_sub: d.recipient_sub,
      designation: d.designation,
      domain: d.domain,
      department: d.department,
      start_date: d.start_date,
      end_date: d.end_date,
      compensation: d.compensation,
      mentor: d.mentor,
      is_dual: d.is_dual,
      signatory_img: sigImg,
      signatory1_name: 'SAIVIGNESH R V',
      signatory1_title: 'FOUNDER & CEO',
      signatory1_img: 'sig-saivignesh.png',
      signatory2_name: 'HARIPRIYA S',
      signatory2_title: 'DIRECTOR (CFO)',
      signatory2_img: 'sig-haripriya.png'
    };

    let cat = 'Official Correspondence';
    if (d.doc_type.includes('Offer') || d.doc_type.includes('Appointment') || d.doc_type.includes('Experience') || d.doc_type.includes('Salary')) {
      cat = 'HR & Personnel';
    } else if (d.doc_type.includes('Certificate')) {
      cat = 'Student & Intern Certification';
    }

    const payload = {
      doc_type: d.doc_type,
      category: cat,
      recipient_name: d.recipient_name,
      recipient_sub: d.recipient_sub,
      subject: d.subject,
      body: d.body,
      signatory: d.signatory,
      signatory_title: d.signatory_title,
      issue_date: d.issue_date,
      valid_until: d.end_date || '-',
      status: 'Issued',
      meta_json: meta,
      author: State.currentUserName
    };

    const res = await API.post('/api/documents', payload);
    if (res.ok) {
      alert(`Success! Generated and archived official document: ${res.doc_no}`);
      closeModal('modal-draft-document');
      await loadDocuments();
      if (res.id) {
        previewDocRecord(res.id);
      }
    } else {
      alert(`Error creating document: ${res.error || 'Server error'}`);
    }
  });

  // Initialize Authentication & Load Initial Dashboard only if authenticated
  const authenticated = initAuth();
  if (authenticated) {
    loadDashboard();
  }
});
