import logo from '../assets/logo/ksr-logo.png';

export function OrganizationLogo({ className = '', alt = 'KSR Apadbandhu Charitable Trust logo' }) {
  return <img className={`organization-logo ${className}`.trim()} src={logo} alt={alt} />;
}
