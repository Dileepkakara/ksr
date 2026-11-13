# KSR Trust Document Management

A React and Vite frontend demo for creating, previewing, printing and managing the Trust's 15 document types.

## Run locally

```sh
npm install
npm run dev
```

Documents and Trust profile settings are stored in the current browser using localStorage. This is demo persistence, not a secure production database. Do not enter real beneficiary information into an unprotected shared browser. Replace the repository methods in `src/data/storage.js` with an API service when a backend is available.

The supplied KSR logo is stored at `src/assets/logo/ksr-logo.png`; its connected black matte has been made transparent while retaining the original artwork. It is used in the sidebar and A4 document header. Trust profile details remain placeholders until verified information is entered in Settings. Document fields and legal wording should be reviewed and approved by the Trust before official use.

Donation Receipt PDFs are generated as vector A4 documents and validated as one page. Other document PDFs are generated client-side from their A4 preview. Browser print uses A4 portrait print styles.
