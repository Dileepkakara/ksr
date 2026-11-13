import { OrganizationLogo } from './OrganizationLogo.jsx';

export function DocumentHeader({ title, settings = {} }) {
  return <>
    <header className="document-header">
      <OrganizationLogo className="document-logo" />
      <div className="trust-heading">
        <h1>{settings.trustName || 'KSR APADBANDHU CHARITABLE TRUST'}</h1>
        <p>{settings.address || 'Address placeholder'}</p>
        <p>{[settings.phone, settings.email, settings.website].filter(Boolean).join(' · ') || 'Phone · Email · Website placeholders'}</p>
        {settings.registrationDetails && <p>{settings.registrationDetails}</p>}
      </div>
    </header>
    <div className="document-rule" />
    <h2 className="document-title">{title}</h2>
    <div className="document-rule document-rule-after-title" />
  </>;
}
