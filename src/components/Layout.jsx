import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Archive, BadgeIndianRupee, BookOpen, ChevronDown, ClipboardList, FilePlus2, FileText,
  HandHeart, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, Settings, Users,
  WalletCards, X,
} from 'lucide-react';
import { OrganizationLogo } from './OrganizationLogo.jsx';

const navigation = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
];

const documentLinks = [
  { label: 'All Documents', to: '/documents', icon: FileText },
  { label: 'Templates', to: '/templates', icon: BookOpen },
  { label: 'Create Document', to: '/create', icon: FilePlus2 },
];

const categories = [
  { label: 'Finance', icon: WalletCards },
  { label: 'Donors', icon: BadgeIndianRupee },
  { label: 'Beneficiaries', icon: HandHeart },
  { label: 'People', icon: Users },
  { label: 'Governance', icon: ClipboardList },
  { label: 'Reports', icon: Archive },
];

function getInitialSidebarCollapsed() {
  const savedPreference = window.localStorage.getItem('ksr-sidebar-collapsed');
  return savedPreference === null ? window.innerWidth <= 1100 : savedPreference === 'true';
}

export function Layout() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [documentsExpanded, setDocumentsExpanded] = useState(
    () => location.pathname.startsWith('/documents')
      || location.pathname.startsWith('/templates')
      || location.pathname.startsWith('/create')
      || location.pathname.startsWith('/edit')
      || location.pathname.startsWith('/view'),
  );
  const title = location.pathname.startsWith('/documents') ? 'Documents'
    : location.pathname.startsWith('/templates') ? 'Templates'
      : location.pathname.startsWith('/settings') ? 'Settings'
        : location.pathname.startsWith('/create') ? 'Create Document'
          : location.pathname.startsWith('/edit') ? 'Edit Document'
            : location.pathname.startsWith('/view') ? 'Document Details' : 'Dashboard';

  useEffect(() => {
    setMobileOpen(false);
    if (
      location.pathname.startsWith('/documents')
      || location.pathname.startsWith('/templates')
      || location.pathname.startsWith('/create')
      || location.pathname.startsWith('/edit')
      || location.pathname.startsWith('/view')
    ) {
      setDocumentsExpanded(true);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia('(min-width: 769px)');
    const closeOnDesktop = (event) => {
      if (event.matches) setMobileOpen(false);
    };
    desktopBreakpoint.addEventListener('change', closeOnDesktop);
    return () => desktopBreakpoint.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [mobileOpen]);

  const closeMobileNavigation = () => setMobileOpen(false);
  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      window.localStorage.setItem('ksr-sidebar-collapsed', String(next));
      return next;
    });
  };
  const isDocumentSectionActive = documentLinks.some(({ to }) => (
    to === '/documents'
      ? location.pathname.startsWith('/documents')
      : location.pathname.startsWith(to)
  )) || location.pathname.startsWith('/edit') || location.pathname.startsWith('/view');
  const sidebarClassName = [
    'sidebar',
    sidebarCollapsed ? 'sidebar-collapsed' : '',
    mobileOpen ? 'sidebar-mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileOpen ? ' mobile-navigation-open' : ''}`}>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          aria-label="Close navigation"
          tabIndex={-1}
          onClick={closeMobileNavigation}
        />
      )}
      <aside className={sidebarClassName} aria-label="Main sidebar">
        <div className="brand">
          <OrganizationLogo className="sidebar-logo" />
          <div className="brand-name"><strong>KSR Apadbandhu</strong><span>Charitable Trust</span></div>
          <button
            className="sidebar-toggle"
            type="button"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
          <button
            className="mobile-sidebar-close"
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileNavigation}
          >
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-caption">WORKSPACE</div>
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              data-tooltip={label}
              title={sidebarCollapsed ? label : undefined}
              aria-label={label}
              onClick={closeMobileNavigation}
            >
              <Icon size={18} strokeWidth={1.8} /><span className="nav-link-label">{label}</span>
            </NavLink>
          ))}
          <div className="nav-caption category-caption">DOCUMENTS</div>
          <div className={`nav-group${isDocumentSectionActive ? ' nav-group-active' : ''}`}>
            <NavLink
              to="/documents"
              className={({ isActive }) => `nav-link document-group-link ${isActive ? 'active' : ''}`}
              data-tooltip="Documents"
              title={sidebarCollapsed ? 'Documents' : undefined}
              aria-label="Documents"
              onClick={closeMobileNavigation}
            >
              <FileText size={18} strokeWidth={1.8} />
              <span className="nav-link-label">Documents</span>
            </NavLink>
            <button
              className="nav-group-toggle"
              type="button"
              aria-label={`${documentsExpanded ? 'Collapse' : 'Expand'} document links`}
              aria-expanded={documentsExpanded}
              onClick={() => setDocumentsExpanded((expanded) => !expanded)}
            >
              <ChevronDown size={16} />
            </button>
          </div>
          {documentsExpanded && !sidebarCollapsed && (
            <div className="nav-submenu">
              {documentLinks.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/documents'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobileNavigation}
                >
                  <Icon size={16} strokeWidth={1.8} /><span className="nav-link-label">{label}</span>
                </NavLink>
              ))}
            </div>
          )}
          <div className="nav-caption category-caption">CATEGORIES</div>
          {categories.map(({ label, icon: Icon }) => (
            <NavLink
              key={label}
              to={`/documents?category=${encodeURIComponent(label)}`}
              className={({ isActive }) => `nav-link category-link ${isActive && location.search.includes(encodeURIComponent(label)) ? 'active' : ''}`}
              data-tooltip={label}
              title={sidebarCollapsed ? label : undefined}
              aria-label={label}
              onClick={closeMobileNavigation}
            >
              <Icon size={18} strokeWidth={1.8} /><span className="nav-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            data-tooltip="Settings"
            title={sidebarCollapsed ? 'Settings' : undefined}
            aria-label="Settings"
            onClick={closeMobileNavigation}
          >
            <Settings size={18} strokeWidth={1.8} /><span className="nav-link-label">Settings</span>
          </NavLink>
          <div className="sidebar-note">Frontend demo · Data saved in this browser</div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            <button
              className="mobile-menu-button"
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <OrganizationLogo className="mobile-logo" />
            <strong>KSR Apadbandhu</strong>
          </div>
          <div className="topbar-title">{title}</div>
          <div className="profile">
            <div className="avatar">A</div>
            <div><strong>Admin</strong><span>Trust Administrator</span></div>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
