import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowLeft, Eye, FilePlus2, Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { documentTypes, getDocumentType, statusOptions } from './data/documentTypes.js';
import { createDocumentNumber, documentRepository, reserveDocumentNumber, settingsRepository } from './data/storage.js';
import { DocumentPreview } from './components/DocumentPreview.jsx';
import { downloadDocumentPdf } from './utils/pdf.js';

const today = () => new Date().toISOString().slice(0, 10);
const donationReceiptDemoData = () => ({
  Date: '2026-11-13',
  'Donor Name': '[Sample Donor]',
  'Donor Address / Contact': '[Sample Address]',
  'Donation Amount': '10000',
  'Amount in Words': 'Rupees Ten Thousand Only',
  'Payment Mode': 'UPI',
  'Transaction / Reference Number': '[Transaction Reference]',
  Purpose: '[Donation Purpose]',
  Notes: '',
  'Authorised Signature': '',
});
const makeId = () => globalThis.crypto?.randomUUID?.() || `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const paymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online Payment', 'Other'];
const receiptRequiredFields = new Set(['Donor Name', 'Date', 'Donation Amount', 'Payment Mode']);
const multilineFields = new Set([
  'Body', 'Letter Body', 'Reason for Request', 'Assessment Findings', 'Discussion', 'Decisions',
  'Resolution Text', 'Message / Introduction', 'Financial Summary', 'Activities Conducted',
  'Objectives', 'Outcomes', 'Address', 'Purpose', 'Notes', 'Declaration', 'Responsibilities',
  'Working Conditions', 'Additional Approved Clauses', 'Employment Terms', 'Trust Information',
  'Trustee Information', 'Programmes', 'Activities', 'Challenges', 'Future Priorities',
  'Acknowledgements', 'Thank-you Message', 'Family / Household Information',
]);
const fieldExamples = {
  'Donor Name': 'e.g. Sample Donor',
  'Donation Amount': 'e.g. 25000',
  'Transaction / Reference Number': 'e.g. DEMO-TXN-202611120045',
  Purpose: 'e.g. General charitable activities',
  'Payment Mode': 'Select a payment mode',
  'Donor Address / Contact': '[Sample address and contact]',
  'Contact Information': '[Sample contact]',
  Contact: '[Sample contact]',
  Address: '[Sample location]',
  'Applicant Name': 'e.g. Sample Applicant',
  'Beneficiary / Applicant': 'e.g. Sample Applicant',
  'Applicant / Beneficiary': 'e.g. Sample Applicant',
  'Authorised Signature': '[Sample signature]',
  'Supporting Documents': '[Sample document reference]',
};

function isDateField(field) {
  return field === 'Date' || field.endsWith('Date') || field === 'Joining Date' || field === 'Effective Date';
}

function isAmountField(field) {
  return /amount|compensation|expenditure/i.test(field) && !/amount in words/i.test(field);
}

function getFieldPlaceholder(field) {
  if (isDateField(field)) return '';
  if (fieldExamples[field]) return fieldExamples[field];
  if (/amount in words/i.test(field)) return 'e.g. Rupees Twenty Five Thousand Only';
  if (isAmountField(field)) return 'e.g. 25000';
  if (/signature/i.test(field)) return '[Sample signature]';
  if (/contact|phone/i.test(field)) return '[Sample contact]';
  if (/address|location|venue/i.test(field)) return '[Sample location]';
  if (/reference|document number|voucher number/i.test(field)) return 'e.g. DEMO-REF-001';
  return `Enter sample ${field.toLowerCase()}`;
}

function getDocumentAmount(document) {
  const data = document.data || {};
  const amount = data['Donation Amount'] || data.Amount || data.Expenditure
    || (document.expenses || []).reduce((total, item) => total + (Number(item.amount) || 0), 0);
  return Number(amount) > 0
    ? `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    : '—';
}

function formatDocumentDate(value) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${(status || 'Draft').toLowerCase().replaceAll(' ', '-')}`}>{status || 'Draft'}</span>;
}

export function Dashboard() {
  const documents = documentRepository.list();
  const month = new Date().toISOString().slice(0, 7);
  const stats = [
    ['Total Documents', documents.length, 'Across all categories'],
    ['Completed', documents.filter((item) => ['Approved', 'Final'].includes(item.status)).length, 'Approved or final'],
    ['Drafts', documents.filter((item) => item.status === 'Draft').length, 'Awaiting completion'],
    ['This Month', documents.filter((item) => item.createdAt?.startsWith(month)).length, 'Created this month'],
  ];
  return <>
    <PageHeading eyebrow="OVERVIEW" title="Welcome Back, Admin" description="Manage trust documents, records and reports from one place." action={<Link className="button button-primary" to="/create"><Plus size={16} /> New Document</Link>} />
    <section className="stats-grid">{stats.map(([label, value, note]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</section>
    <section className="panel quick-panel"><div className="section-heading"><div><h2>Quick actions</h2><p>Start common documents quickly.</p></div></div><div className="quick-actions">
      {['donation-receipt', 'payment-voucher', 'beneficiary-application'].map((id) => { const type = getDocumentType(id); return <Link key={id} to={`/create/${id}`} className="quick-action"><FilePlus2 size={18} /><span>New {type.name}</span></Link>; })}
      <Link to="/templates" className="quick-action"><FilePlus2 size={18} /><span>Browse all document types</span></Link>
    </div></section>
    <section className="panel">
      <div className="section-heading"><div><h2>Recent documents</h2><p>Latest records saved in this browser.</p></div><Link className="text-link" to="/documents">View all</Link></div>
      <DocumentTable documents={[...documents].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 6)} />
    </section>
  </>;
}

function DocumentTable({ documents }) {
  if (!documents.length) return <div className="empty-state"><FileTextIcon /><strong>No documents yet</strong><span>Create your first document or choose a template to get started.</span><Link className="button button-secondary" to="/create">Create document</Link></div>;
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>Document</th><th>Document Number</th><th>Date</th><th>Amount</th><th>Category</th><th>Status</th><th>Created By</th><th aria-label="Actions" /></tr></thead><tbody>{documents.map((document) => {
    const type = getDocumentType(document.typeId);
    return <tr key={document.id}>
      <td><Link className="table-title" to={`/view/${document.id}`}>{type?.name || 'Document'}</Link></td>
      <td>{document.number}</td><td>{formatDocumentDate(document.data?.Date || document.data?.['Application Date'] || document.createdAt)}</td>
      <td>{getDocumentAmount(document)}</td>
      <td>{type?.category || '—'}</td><td><StatusBadge status={document.status} /></td><td>{document.createdBy || 'Admin'}</td>
      <td><div className="row-actions"><Link aria-label="View document" title="View" className="icon-button" to={`/view/${document.id}`}><Eye size={15} /></Link><Link aria-label="Edit document" title="Edit" className="icon-button" to={`/edit/${document.id}`}><Pencil size={14} /></Link></div></td>
    </tr>;
  })}</tbody></table></div>;
}

function FileTextIcon() {
  return <div className="empty-icon"><FilePlus2 size={23} /></div>;
}

export function DocumentsPage() {
  const [params] = useSearchParams();
  const initialCategory = params.get('category') || 'All categories';
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [typeId, setTypeId] = useState('All types');
  const [status, setStatus] = useState('All statuses');
  const [createdBy, setCreatedBy] = useState('All creators');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sort, setSort] = useState('Newest first');
  const documents = documentRepository.list();
  const filtered = documents.filter((document) => {
    const type = getDocumentType(document.typeId);
    const haystack = [document.number, type?.name, type?.category, document.status, ...Object.values(document.data || {})].join(' ').toLowerCase();
    const date = document.data?.Date || document.data?.['Application Date'] || document.createdAt?.slice(0, 10) || '';
    return (!query || haystack.includes(query.toLowerCase()))
      && (category === 'All categories' || type?.category === category)
      && (typeId === 'All types' || document.typeId === typeId)
      && (status === 'All statuses' || document.status === status)
      && (createdBy === 'All creators' || (document.createdBy || 'Admin') === createdBy)
      && (!startDate || date >= startDate)
      && (!endDate || date <= endDate);
  });
  filtered.sort((a, b) => sort === 'Oldest first'
    ? (a.createdAt || '').localeCompare(b.createdAt || '')
    : sort === 'Document name'
      ? (getDocumentType(a.typeId)?.name || '').localeCompare(getDocumentType(b.typeId)?.name || '')
      : (b.createdAt || '').localeCompare(a.createdAt || ''));
  const creators = [...new Set(documents.map((item) => item.createdBy || 'Admin'))];
  return <>
    <PageHeading eyebrow="RECORDS" title="All Documents" description="Search and manage saved trust records." action={<Link className="button button-primary" to="/create"><Plus size={16} /> Create document</Link>} />
    <section className="panel">
      <div className="filter-bar">
        <label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search number, type or status" /></label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by category"><option>All categories</option>{[...new Set(documentTypes.map((type) => type.category))].map((item) => <option key={item}>{item}</option>)}</select>
        <select value={typeId} onChange={(event) => setTypeId(event.target.value)} aria-label="Filter by document type"><option>All types</option>{documentTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option>All statuses</option>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} aria-label="Filter by creator"><option>All creators</option>{creators.map((item) => <option key={item}>{item}</option>)}</select>
        <label className="date-filter"><span>From</span><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
        <label className="date-filter"><span>To</span><input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort documents"><option>Newest first</option><option>Oldest first</option><option>Document name</option></select>
      </div>
      <DocumentTable documents={filtered} />
    </section>
  </>;
}

export function TemplatesPage() {
  return <>
    <PageHeading eyebrow="DOCUMENT LIBRARY" title="Templates" description="Choose one of the 15 document types to create a record." />
    <div className="template-grid">{documentTypes.map((type, index) => <article className="template-card" key={type.id}>
      <div className="template-top"><span className="template-number">{String(index + 1).padStart(2, '0')}</span><span className="category-chip">{type.category}</span></div>
      <h2>{type.name}</h2><p>{type.purpose}</p><Link className="button button-secondary" to={`/create/${type.id}`}>Create document</Link>
    </article>)}</div>
  </>;
}

export function DocumentEditorPage({ mode = 'create' }) {
  const { typeId, id } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const existing = mode === 'edit' ? documentRepository.get(id) : undefined;
  const selectedType = getDocumentType(typeId || existing?.typeId);
  const [typeChoice, setTypeChoice] = useState(selectedType?.id || '');
  const type = getDocumentType(typeChoice);
  const [values, setValues] = useState(() => existing?.data || (selectedType?.id === 'donation-receipt' ? donationReceiptDemoData() : {}));
  const [status, setStatus] = useState(existing?.status || 'Draft');
  const [expenses, setExpenses] = useState(existing?.expenses || [{ date: '', description: '', category: '', amount: '', reference: '' }]);
  const [error, setError] = useState('');
  const settings = settingsRepository.get();

  const setField = (field, value) => setValues((current) => ({ ...current, [field]: value }));
  const model = useMemo(() => ({
    ...existing,
    id: existing?.id || 'preview',
    typeId: type?.id,
    number: existing?.number || (type ? createDocumentNumber(type.id, documentRepository.list()) : ''),
    status,
    data: values,
    expenses,
  }), [existing, type, status, values, expenses]);

  async function handlePdf() {
    try {
      if (type?.id === 'donation-receipt') {
        const { downloadDonationReceiptPdf } = await import('./utils/donationReceiptPdf.js');
        await downloadDonationReceiptPdf({
          document: model,
          settings,
          filename: `KSR-Donation-Receipt-${model.number}.pdf`,
        });
      } else {
        await downloadDocumentPdf(previewRef.current, `${(type?.name || 'Document').replaceAll(/[^a-z0-9]+/gi, '-')}-${model.number}.pdf`);
      }
    } catch (pdfError) {
      setError(pdfError.message || 'PDF could not be generated.');
    }
  }

  function save() {
    if (!type) { setError('Select a document type before saving.'); return; }
    if (type.id === 'donation-receipt') {
      const required = ['Donor Name', 'Date', 'Payment Mode'];
      const missing = required.filter((field) => !String(values[field] || '').trim());
      const amount = Number(values['Donation Amount']);
      if (missing.length || !Number.isFinite(amount) || amount <= 0) {
        setError(`Complete the required fields: ${[...missing, ...(!Number.isFinite(amount) || amount <= 0 ? ['a donation amount greater than zero'] : [])].join(', ')}.`);
        return;
      }
    }
    const now = new Date().toISOString();
    try {
      documentRepository.save({
        id: existing?.id || makeId(),
        typeId: type.id,
        number: existing?.number || reserveDocumentNumber(type.id, documentRepository.list()),
        status,
        data: values,
        expenses,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        createdBy: existing?.createdBy || 'Admin',
      });
      navigate('/documents');
    } catch (saveError) {
      setError(saveError.message || 'Document could not be saved in this browser.');
    }
  }

  if (mode === 'edit' && !existing) return <div className="empty-state"><strong>Document not found</strong><Link to="/documents" className="button button-secondary">Back to documents</Link></div>;
  return <>
    <PageHeading eyebrow={mode === 'edit' ? 'EDIT RECORD' : 'NEW RECORD'} title={mode === 'edit' ? 'Edit Document' : 'Create Document'} description="Enter the approved information; the A4 preview updates as you type." action={<Link className="button button-quiet" to="/templates"><ArrowLeft size={16} /> Templates</Link>} />
    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="editor-layout">
      <section className="panel editor-form">
        <div className="section-heading"><div><h2>Document information</h2><p>Fields are editable placeholders until the Trust approves final layouts.</p></div></div>
        {!selectedType && <label className="form-field"><span>Document type</span><select value={typeChoice} onChange={(event) => { setTypeChoice(event.target.value); setValues(event.target.value === 'donation-receipt' ? donationReceiptDemoData() : {}); }}><option value="">Select a document type</option>{documentTypes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}
        {type && <>
          <div className="number-field"><span>Document Number</span><strong>{model.number}</strong></div>
          <label className="form-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          {type.id === 'donation-receipt' && <p className="demo-data-note">Sample values are for preview only. Replace and verify all information before issuing an official receipt.</p>}
          <div className={`form-grid ${type.id === 'donation-receipt' ? 'receipt-editor-fields' : ''}`}>{type.fields.map((field) => {
            const required = type.id === 'donation-receipt' && receiptRequiredFields.has(field);
            const isPaymentMode = field === 'Payment Mode';
            const isDecision = field === 'Decision';
            const isAmount = isAmountField(field);
            const isMultiline = multilineFields.has(field);
            return <label className={`form-field ${isMultiline ? 'wide-field' : ''}`} key={field}>
              <span>{field}{required && <abbr className="required-mark" title="Required"> *</abbr>}</span>
              {isMultiline
                ? <textarea required={required} value={values[field] || ''} onChange={(event) => setField(field, event.target.value)} rows={3} placeholder={getFieldPlaceholder(field)} />
                : isPaymentMode || isDecision
                  ? <select required={required} value={values[field] || ''} onChange={(event) => setField(field, event.target.value)}>
                    <option value="">{isPaymentMode ? 'Select payment mode' : 'Select decision'}</option>
                    {(isPaymentMode ? paymentModes : ['Pending Review', 'Approved', 'Rejected']).map((option) => <option key={option}>{option}</option>)}
                  </select>
                  : <input type={isDateField(field) ? 'date' : isAmount ? 'number' : 'text'} min={isAmount ? '0' : undefined} step={isAmount ? '0.01' : undefined} maxLength={type.id === 'donation-receipt' ? ({ 'Donor Name': 100, 'Donor Address / Contact': 180, 'Amount in Words': 120, 'Transaction / Reference Number': 60, Purpose: 140, Notes: 80, 'Authorised Signature': 60 }[field]) : undefined} required={required} value={values[field] || ''} onChange={(event) => setField(field, event.target.value)} placeholder={getFieldPlaceholder(field)} />}
              {field === 'Transaction / Reference Number' && <small className="field-helper">Optional: enter the bank, UPI or cheque reference.</small>}
            </label>;
          })}</div>
          {type.expenses && <div className="expense-entry">
            <div className="section-heading"><div><h3>Expense items</h3><p>Total: {expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)}</p></div><button className="button button-quiet" type="button" onClick={() => setExpenses([...expenses, { date: '', description: '', category: '', amount: '', reference: '' }])}><Plus size={15} /> Add row</button></div>
            {expenses.map((expense, index) => <div className="expense-row" key={index}>{Object.entries({ date: 'Date', description: 'Description', category: 'Category', amount: 'Amount', reference: 'Receipt reference' }).map(([key, label]) => <label className="form-field" key={key}><span>{label}</span><input type={key === 'date' ? 'date' : key === 'amount' ? 'number' : 'text'} min={key === 'amount' ? '0' : undefined} step={key === 'amount' ? '0.01' : undefined} value={expense[key]} onChange={(event) => setExpenses(expenses.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: event.target.value } : row))} placeholder={key === 'date' ? undefined : key === 'amount' ? 'e.g. 1200' : key === 'reference' ? 'e.g. DEMO-BILL-01' : `Enter sample ${label.toLowerCase()}`} /></label>)}</div>)}
          </div>}
          <div className="editor-actions"><button type="button" className="button button-primary" onClick={save}>{mode === 'edit' ? 'Save Changes' : 'Save Draft'}</button><button type="button" className="button button-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button><button type="button" className="button button-secondary" onClick={handlePdf}><ArrowDownToLine size={16} /> Download PDF</button></div>
        </>}
      </section>
      <section className="preview-column"><div className="preview-label">LIVE A4 PREVIEW</div>{type ? <DocumentPreview type={type} document={model} settings={settings} previewRef={previewRef} /> : <div className="panel preview-empty">Select a document type to see its preview.</div>}</section>
    </div>
  </>;
}

export function ViewDocumentPage() {
  const { id } = useParams();
  const document = documentRepository.get(id);
  const previewRef = useRef(null);
  const [error, setError] = useState('');
  if (!document) return <div className="empty-state"><strong>Document not found</strong><Link to="/documents" className="button button-secondary">Back to documents</Link></div>;
  const type = getDocumentType(document.typeId);
  async function handlePdf() {
    try {
      if (type?.id === 'donation-receipt') {
        const { downloadDonationReceiptPdf } = await import('./utils/donationReceiptPdf.js');
        await downloadDonationReceiptPdf({
          document,
          settings: settingsRepository.get(),
          filename: `KSR-Donation-Receipt-${document.number}.pdf`,
        });
      } else {
        await downloadDocumentPdf(previewRef.current, `${type.name.replaceAll(/[^a-z0-9]+/gi, '-')}-${document.number}.pdf`);
      }
    }
    catch (pdfError) { setError(pdfError.message || 'PDF could not be generated.'); }
  }
  function remove() {
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    documentRepository.remove(document.id);
    window.location.assign('/documents');
  }
  return <>
    <PageHeading eyebrow="DOCUMENT DETAILS" title={type?.name || 'Document'} description={`Record ${document.number}`} action={<Link className="button button-quiet" to="/documents"><ArrowLeft size={16} /> Back</Link>} />
    {error && <div className="inline-error" role="alert">{error}</div>}
    <div className="detail-layout"><section className="panel detail-panel"><div className="section-heading"><div><h2>Record information</h2><p>Created {new Date(document.createdAt).toLocaleString()} · Updated {new Date(document.updatedAt).toLocaleString()}</p></div><StatusBadge status={document.status} /></div>
      <dl className="metadata"><dt>Document number</dt><dd>{document.number}</dd><dt>Category</dt><dd>{type?.category}</dd><dt>Created by</dt><dd>{document.createdBy || 'Admin'}</dd></dl>
      <div className="detail-actions"><Link className="button button-primary" to={`/edit/${document.id}`}><Pencil size={15} /> Edit</Link><button className="button button-secondary" onClick={() => window.print()}><Printer size={15} /> Print</button><button className="button button-secondary" onClick={handlePdf}><ArrowDownToLine size={15} /> Download PDF</button><button className="button button-danger" onClick={remove}><Trash2 size={15} /> Delete</button></div>
    </section><div className="preview-column"><div className="preview-label">A4 PREVIEW</div><DocumentPreview type={type} document={document} settings={settingsRepository.get()} previewRef={previewRef} /></div></div>
  </>;
}

export function SettingsPage() {
  const [settings, setSettings] = useState(() => settingsRepository.get());
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const update = (key, value) => { setSettings((current) => ({ ...current, [key]: value })); setSaved(false); setSaveError(''); };
  function save() {
    try { settingsRepository.save(settings); setSaved(true); setSaveError(''); }
    catch (error) { console.error('Unable to save settings.', error); setSaved(false); setSaveError('Settings could not be saved in this browser.'); }
  }
  return <>
    <PageHeading eyebrow="PREFERENCES" title="Settings" description="Configure editable Trust profile and document defaults." />
    <section className="panel settings-panel"><div className="section-heading"><div><h2>Trust Profile</h2><p>Use verified Trust details only. Empty fields remain as placeholders on documents.</p></div></div>
      <div className="form-grid settings-grid">{[['trustName', 'Trust Name'], ['address', 'Address'], ['phone', 'Phone'], ['email', 'Email'], ['website', 'Website'], ['registrationDetails', 'Registration details (verified only)'], ['defaultFooter', 'Default Footer']].map(([key, label]) => <label className={`form-field ${['address', 'defaultFooter', 'registrationDetails'].includes(key) ? 'wide-field' : ''}`} key={key}><span>{label}</span>{['address', 'defaultFooter', 'registrationDetails'].includes(key) ? <textarea rows={2} value={settings[key] || ''} onChange={(event) => update(key, event.target.value)} placeholder={`Enter verified ${label.toLowerCase()}`} /> : <input value={settings[key] || ''} onChange={(event) => update(key, event.target.value)} placeholder={`Enter verified ${label.toLowerCase()}`} />}</label>)}</div>
      <div className="settings-actions"><span role={saveError ? 'alert' : 'status'}>{saveError || (saved ? 'Settings saved in this browser.' : 'Changes are not saved yet.')}</span><button className="button button-primary" onClick={save}>Save settings</button></div>
    </section>
  </>;
}
