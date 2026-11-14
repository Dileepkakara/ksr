import { getDocumentType } from './documentTypes.js';
import { createDemoDocuments } from './demoData.js';

const DOCUMENTS_KEY = 'ksr.documents.v1';
const DEMO_SEEDED_KEY = 'ksr.demo-seeded.v1';
const SETTINGS_KEY = 'ksr.settings.v1';
const NUMBER_COUNTERS_KEY = 'ksr.document-number-counters.v1';

function readJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.error(`Unable to read ${key} from localStorage.`, error);
    return fallback;
  }
}

export const documentRepository = {
  list() {
    let documents = readJson(DOCUMENTS_KEY, []);
    if (!Array.isArray(documents)) return [];
    if (localStorage.getItem(DEMO_SEEDED_KEY) !== 'true') {
      if (documents.length === 0) {
        documents = createDemoDocuments();
        localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
      }
      localStorage.setItem(DEMO_SEEDED_KEY, 'true');
    }
    return documents;
  },
  get(id) {
    return this.list().find((document) => document.id === id);
  },
  save(document) {
    const documents = this.list();
    const index = documents.findIndex((item) => item.id === document.id);
    const updated = [...documents];
    if (index >= 0) updated[index] = document;
    else updated.unshift(document);
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updated));
    return document;
  },
  remove(id) {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(this.list().filter((document) => document.id !== id)));
  },
};

export const settingsRepository = {
  get() {
    return readJson(SETTINGS_KEY, {});
  },
  save(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  },
};

export function createDocumentNumber(typeId, existing) {
  const prefix = getDocumentType(typeId)?.prefix || 'DOC';
  const counters = readJson(NUMBER_COUNTERS_KEY, {});
  const savedSequence = Number(counters[typeId]) || 0;
  const existingSequence = existing
    .filter((document) => document.typeId === typeId)
    .reduce((max, document) => {
      const match = new RegExp(`^${prefix}-(\\d+)$`).exec(document.number || '');
      return Math.max(max, Number(match?.[1]) || 0);
    }, 0);
  return `${prefix}-${String(Math.max(savedSequence, existingSequence) + 1).padStart(6, '0')}`;
}

export function reserveDocumentNumber(typeId, existing) {
  const number = createDocumentNumber(typeId, existing);
  const counters = readJson(NUMBER_COUNTERS_KEY, {});
  counters[typeId] = Number(number.split('-').at(-1));
  localStorage.setItem(NUMBER_COUNTERS_KEY, JSON.stringify(counters));
  return number;
}
