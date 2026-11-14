import { documentTypes } from './documentTypes.js';

const featuredRecords = [
  {
    typeId: 'donation-receipt',
    number: 'DR-000124',
    date: '2026-11-12',
    data: {
      'Donor Name': 'Sample Donor',
      'Donor Address / Contact': '[Sample address and contact]',
      'Donation Amount': '25000',
      'Amount in Words': 'Rupees Twenty Five Thousand Only',
      'Payment Mode': 'UPI',
      'Transaction / Reference Number': 'DEMO-TXN-202611120045',
      Purpose: 'General charitable activities',
      Notes: 'Fictional demo record',
    },
  },
  {
    typeId: 'payment-voucher',
    number: 'PV-000087',
    date: '2026-11-10',
    data: {
      Payee: 'Sample Supplier',
      'Payment Purpose': 'Classroom learning materials',
      Amount: '8500',
      'Payment Mode': 'Bank Transfer',
      'Reference Number': 'DEMO-PAY-20261110',
      'Supporting Bill / Reference': '[Sample bill reference]',
    },
  },
  {
    typeId: 'donor-appreciation',
    number: 'DAL-000032',
    date: '2026-11-08',
    data: {
      'Donor Name': 'Sample Donor',
      'Contribution Reference': 'DEMO-DR-000124',
      'Contribution Type': 'Sample contribution',
      Purpose: 'General charitable activities',
      'Thank-you Message': 'Thank you for supporting our charitable work.',
    },
  },
  {
    typeId: 'beneficiary-application',
    number: 'BA-000019',
    date: '2026-11-07',
    data: {
      'Applicant Name': 'Sample Applicant',
      'Contact Information': '[Sample contact]',
      Address: '[Sample location]',
      'Assistance Requested': 'Education support',
      'Reason for Request': 'Fictional sample application for layout demonstration.',
      'Supporting Documents': '[Sample document reference]',
    },
  },
  {
    typeId: 'programme-report',
    number: 'PR-000011',
    date: '2026-11-05',
    data: {
      'Programme Name': 'Sample Learning Support Programme',
      'Reporting Period': 'November 2026',
      Location: '[Sample location]',
      Objectives: 'Support access to learning resources.',
      'Activities Conducted': 'Distributed sample learning materials.',
      'Beneficiaries / Reach': '[Sample count: 12]',
      Outcomes: 'Fictional outcome summary for demonstration.',
      Expenditure: '25000',
    },
  },
  {
    typeId: 'petty-cash-voucher',
    date: '2026-11-04',
    data: { 'Paid To': 'Sample Recipient', Purpose: 'Local programme supplies', Amount: '1200' },
  },
  {
    typeId: 'donation-request',
    date: '2026-11-03',
    data: {
      'Donor / Organisation': 'Sample Community Partner',
      Subject: 'Request for learning material support',
      'Requested Support': 'Sample learning materials',
    },
  },
  {
    typeId: 'beneficiary-assessment',
    date: '2026-11-02',
    data: {
      'Applicant / Beneficiary': 'Sample Applicant',
      Decision: 'Pending Review',
      'Assessment Findings': 'Fictional assessment notes for demonstration.',
    },
  },
  {
    typeId: 'employee-appointment',
    date: '2026-11-01',
    data: { 'Employee Name': 'Sample Employee', Position: 'Programme Assistant' },
  },
  {
    typeId: 'volunteer-registration',
    date: '2026-11-01',
    data: { Name: 'Sample Volunteer', Contact: '[Sample contact]', Address: '[Sample location]' },
  },
  {
    typeId: 'expense-reimbursement',
    date: '2026-11-01',
    data: { Claimant: 'Sample Team Member', 'Payment Details Placeholder': '[Sample payment reference]' },
  },
  {
    typeId: 'meeting-minutes',
    date: '2026-11-01',
    data: { Chairperson: 'Sample Chairperson', Venue: '[Sample meeting venue]', Decisions: 'Fictional sample decision.' },
  },
];

const additionalRecords = new Set(['donation-receipt', 'payment-voucher', 'programme-report']);
const samplePaymentModes = ['UPI', 'Bank Transfer', 'Cheque', 'Cash', 'Online Payment'];

function getSampleValue(field, date, number, index) {
  const normalized = field.toLowerCase();
  if (normalized === 'date' || normalized.endsWith(' date')) return date;
  if ((normalized.includes('amount') && !normalized.includes('amount in words'))
    || normalized.includes('compensation') || normalized === 'expenditure') {
    return '25000';
  }
  if (normalized.includes('amount in words')) return 'Rupees Twenty Five Thousand Only';
  if (normalized.includes('payment mode')) return samplePaymentModes[index % samplePaymentModes.length];
  if (normalized.includes('address') || normalized === 'location' || normalized === 'venue') return '[Sample location]';
  if (normalized.includes('contact') || normalized === 'phone' || normalized === 'emergency contact') return '[Sample contact]';
  if (normalized.includes('signature')) return '[Sample signature]';
  if (normalized.includes('name') || normalized === 'claimant' || normalized === 'payee' || normalized === 'paid to') {
    return `Sample ${field} ${String(index + 1).padStart(2, '0')}`;
  }
  if (normalized.includes('reference') || normalized.includes('document')) return `DEMO-${number}`;
  if (normalized.includes('purpose') || normalized.includes('reason') || normalized.includes('objective')) {
    return 'Fictional sample information for charitable programme demonstration.';
  }
  return `Sample ${field.toLowerCase()} for demonstration.`;
}

function createRecord(record, index) {
  const type = documentTypes.find((item) => item.id === record.typeId);
  const sequence = Number(record.number?.split('-').at(-1)) || index + 1;
  const number = record.number || `${type.prefix}-${String(sequence).padStart(6, '0')}`;
  const data = Object.fromEntries(type.fields.map((field) => [
    field,
    getSampleValue(field, record.date, number, index),
  ]));
  Object.assign(data, record.data);

  const createdAt = `${record.date}T${String(8 + (index % 9)).padStart(2, '0')}:00:00.000Z`;
  return {
    id: `demo-${type.id}-${number}`,
    typeId: type.id,
    number,
    status: 'Draft',
    data,
    expenses: type.expenses
      ? [{ date: record.date, description: 'Sample programme supplies', category: 'Programme', amount: '1200', reference: 'DEMO-BILL-01' }]
      : [],
    createdAt,
    updatedAt: createdAt,
    createdBy: 'Sample Admin',
  };
}

export function createDemoDocuments() {
  const records = [...featuredRecords];
  let olderRecordIndex = 0;

  documentTypes.forEach((type) => {
    const targetCount = 3 + Number(additionalRecords.has(type.id));
    const existing = records.filter((record) => record.typeId === type.id);
    let sequence = existing.reduce((max, record) => Math.max(
      max,
      Number(record.number?.split('-').at(-1)) || 0,
    ), 0);

    while (existing.length < targetCount) {
      sequence += 1;
      const day = 31 - (olderRecordIndex % 28);
      records.push({
        typeId: type.id,
        number: `${type.prefix}-${String(sequence).padStart(6, '0')}`,
        date: `2026-10-${String(day).padStart(2, '0')}`,
      });
      olderRecordIndex += 1;
      existing.push(records[records.length - 1]);
    }
  });

  const documents = records
    .map(createRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const featuredStatuses = {
    'DR-000124': 'Approved',
    'PV-000087': 'Final',
    'DAL-000032': 'Final',
    'BA-000019': 'Pending Review',
    'PR-000011': 'Approved',
  };
  let completedCount = 0;
  let draftCount = 0;
  let otherCount = 0;

  documents.forEach((document) => {
    if (featuredStatuses[document.number]) {
      document.status = featuredStatuses[document.number];
      if (['Approved', 'Final'].includes(document.status)) completedCount += 1;
    } else if (completedCount < 31) {
      document.status = completedCount % 2 === 0 ? 'Approved' : 'Final';
      completedCount += 1;
    } else if (draftCount < 9) {
      document.status = 'Draft';
      draftCount += 1;
    } else {
      document.status = otherCount < 4 ? 'Pending Review' : 'Rejected';
      otherCount += 1;
    }
  });

  return documents;
}
