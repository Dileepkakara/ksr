import { DocumentHeader } from './DocumentHeader.jsx';
import './DonationReceipt.css';

function ReceiptInformation({ number, date }) {
  return (
    <div className="receipt-meta">
      <div><span>Receipt No.</span><strong>{number}</strong></div>
      <div><span>Date</span><strong>{date}</strong></div>
    </div>
  );
}

function ReceiptDonor({ data }) {
  return (
    <section className="receipt-donor">
      <h3>RECEIVED WITH THANKS FROM</h3>
      <strong className="receipt-donor-name">{data['Donor Name'] || '[DONOR NAME]'}</strong>
      <div className="receipt-labeled-value">
        <span>Address</span>
        <p>{data['Donor Address / Contact'] || '[DONOR ADDRESS]'}</p>
      </div>
    </section>
  );
}

function ReceiptAmount({ data }) {
  return (
    <section className="receipt-amount">
      <div className="receipt-amount-main">
        <span>Donation Amount</span>
        <strong>₹ {Number(data['Donation Amount'] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>
      <div className="receipt-amount-words">
        <span>Amount in Words</span>
        <strong>{data['Amount in Words'] || '[AMOUNT IN WORDS]'}</strong>
      </div>
    </section>
  );
}

function ReceiptPayment({ data }) {
  return (
    <section className="receipt-payment">
      <div><span>Payment Mode</span><strong>{data['Payment Mode'] || '[PAYMENT MODE]'}</strong></div>
      <div><span>Transaction / Reference No.</span><strong>{data['Transaction / Reference Number'] || '[TRANSACTION REFERENCE]'}</strong></div>
    </section>
  );
}

function ReceiptPurpose({ data }) {
  return (
    <section className="receipt-purpose">
      <h3>Purpose of Donation</h3>
      <p>{data.Purpose || '[DONATION PURPOSE]'}</p>
      {data.Notes && <p className="receipt-notes"><strong>Notes: </strong>{data.Notes}</p>}
    </section>
  );
}

function ReceiptSignature({ signature }) {
  return (
    <section className="receipt-signature">
      <div className="receipt-signatory">
        {signature && <strong>{signature}</strong>}
        <i />
        <span>Authorised Signatory</span>
        <span>KSR Apadbandhu Charitable Trust</span>
      </div>
      <div className="receipt-seal"><span>OFFICIAL<br />SEAL</span></div>
    </section>
  );
}

function ReceiptFooter({ settings }) {
  const address = settings.address || '[TRUST ADDRESS]';
  const contacts = [settings.phone || '[PHONE NUMBER]', settings.email || '[EMAIL ADDRESS]', settings.website || '[WEBSITE]'];
  return (
    <footer className="receipt-footer">
      <span>{address}</span>
      <span>{contacts.join('  |  ')}</span>
    </footer>
  );
}

export function DonationReceipt({ type, document, settings = {}, previewRef }) {
  const data = document?.data || {};
  const date = data.Date
    ? new Date(`${data.Date}T00:00:00`).toLocaleDateString('en-GB')
    : '[DD/MM/YYYY]';
  return (
    <article className="a4-page donation-receipt-page" ref={previewRef}>
      <div className="receipt-gold-edge" />
      <DocumentHeader title={type?.id === 'donation-receipt' ? 'DONATION RECEIPT' : type?.name || 'DONATION RECEIPT'} settings={settings} />
      <ReceiptInformation number={document?.number || 'DR-000001'} date={date} />
      <ReceiptDonor data={data} />
      <ReceiptAmount data={data} />
      <ReceiptPayment data={data} />
      <ReceiptPurpose data={data} />
      <p className="receipt-thanks">We sincerely thank you for your generous contribution<br />towards the charitable activities of<br /><strong>KSR Apadbandhu Charitable Trust.</strong></p>
      <ReceiptSignature signature={data['Authorised Signature']} />
      <ReceiptFooter settings={settings} />
    </article>
  );
}
