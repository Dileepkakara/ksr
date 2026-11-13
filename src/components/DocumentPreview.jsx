import { useMemo } from 'react';
import { DocumentHeader } from './DocumentHeader.jsx';
import { DonationReceipt } from './DonationReceipt.jsx';

export function DocumentPreview({ type, document, settings = {}, previewRef }) {
  const fields = useMemo(() => document?.data || {}, [document]);
  if (type?.id === 'donation-receipt') {
    return <DonationReceipt type={type} document={document} settings={settings} previewRef={previewRef} />;
  }
  const entries = Object.entries(fields).filter(([, value]) => value !== '' && value !== undefined && value !== null);
  return (
    <article className="a4-page" ref={previewRef}>
      <DocumentHeader title={type?.name || 'Document preview'} settings={settings} />
      <div className="document-meta-line">
        <span>{document?.number || 'Document number'}</span>
        <span>{fields.Date || fields['Application Date'] || new Date().toLocaleDateString()}</span>
      </div>
      <p className="document-purpose">{type?.purpose}</p>
      {type?.expenses && document?.expenses?.length > 0 && (
        <table className="preview-expenses">
          <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th><th>Receipt Ref.</th></tr></thead>
          <tbody>{document.expenses.map((expense, index) => (
            <tr key={index}><td>{expense.date || '—'}</td><td>{expense.description || '—'}</td><td>{expense.category || '—'}</td><td>{expense.amount || '—'}</td><td>{expense.reference || '—'}</td></tr>
          ))}</tbody>
          <tfoot><tr><td colSpan="3">Total</td><td colSpan="2">{document.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0).toFixed(2)}</td></tr></tfoot>
        </table>
      )}
      <div className="document-fields">
        {entries.length ? entries.map(([label, value]) => (
          <section className="document-field" key={label}>
            <h3>{label}</h3>
            <p>{String(value)}</p>
          </section>
        )) : <p className="preview-placeholder">Complete the form to preview document content.</p>}
      </div>
      <div className="signature-row">
        <div><span>Prepared / authorised by</span><i /></div>
        <div><span>Signature and date</span><i /></div>
      </div>
      <footer className="document-footer">
        <span>{settings.defaultFooter || 'Editable trust contact and registration details belong here.'}</span>
        <span>Page 1</span>
      </footer>
    </article>
  );
}
