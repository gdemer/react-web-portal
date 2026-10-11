import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { Menu, X, Globe, ExternalLink, PanelLeftClose, PanelLeftOpen, Search, Settings, Plus, Trash2, Save, RotateCcw, ArrowLeft } from 'lucide-react';
import defaultConfig from './data/appData.json';
import './styles.css';

const SETTINGS_KEY = 'react-web-portal-settings-v1';
const LAST_PAGE_KEY = 'react-web-portal-last-page-v1';
const iconOptions = ['Folder', 'House', 'Users', 'Newspaper', 'BriefcaseBusiness', 'Code2', 'Globe', 'BookOpen', 'Wrench', 'Star', 'Heart', 'Settings', 'Mail', 'CalendarDays', 'Monitor'];
const colorOptions = ['#2563eb', '#059669', '#db2777', '#d97706', '#7c3aed', '#0891b2', '#dc2626', '#475569'];

function readSavedConfig() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.groups)) return parsed;
    }
  } catch (error) {
    console.warn('Could not read saved settings', error);
  }
  return defaultConfig;
}

function readLastPage(config) {
  try {
    const saved = JSON.parse(localStorage.getItem(LAST_PAGE_KEY) || 'null');
    if (saved && config.groups.some(group => group.items.some(item => item.url === saved.url))) return saved;
  } catch { /* ignore invalid saved state */ }
  return null;
}

function formatDateTime(date, locale) {
  return new Intl.DateTimeFormat(locale || 'el-GR', { dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(date);
}

function GroupIcon({ name, color }) {
  const Icon = Icons[name] || Icons.Folder;
  return <span className="group-icon" style={{ color: color || '#64748b', backgroundColor: `${color || '#64748b'}20` }}><Icon size={17} /></span>;
}

function cloneConfig(config) {
  return JSON.parse(JSON.stringify(config));
}

export default function App() {
  const [config, setConfig] = useState(readSavedConfig);
  const pages = useMemo(() => config.groups.flatMap(group => group.items.map(item => ({ ...item, groupName: group.groupName, groupIcon: group.icon, groupColor: group.color }))), [config]);
  const lastPage = useMemo(() => readLastPage(config), [config]);
  const [selectedUrl, setSelectedUrl] = useState(() => lastPage?.url || config.startUrl || config.groups.flatMap(g => g.items)[0]?.url || '');
  const [selectedTitle, setSelectedTitle] = useState(() => lastPage?.title || pages.find(page => page.url === (config.startUrl || ''))?.title || pages[0]?.title || '');
  const [now, setNow] = useState(() => new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [draft, setDraft] = useState(() => cloneConfig(config));
  const [notice, setNotice] = useState('');
  const [iframeError, setIframeError] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(() => Object.fromEntries(config.groups.map(group => [group.groupName, true])));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { document.title = config.appTitle || 'React Web Portal'; }, [config.appTitle]);
  useEffect(() => {
    const page = pages.find(item => item.url === selectedUrl);
    if (page) setSelectedTitle(page.title);
  }, [pages, selectedUrl]);

  function selectPage(item) {
    if (item.openInNewTab) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      setMobileMenuOpen(false);
      return;
    }
    setSelectedUrl(item.url);
    setSelectedTitle(item.title);
    setIframeError(false);
    setMobileMenuOpen(false);
    try { localStorage.setItem(LAST_PAGE_KEY, JSON.stringify({ url: item.url, title: item.title })); } catch { /* storage may be unavailable */ }
  }

  function toggleGroup(groupName) {
    setExpandedGroups(previous => ({ ...previous, [groupName]: !previous[groupName] }));
  }

  function openAdmin() {
    setDraft(cloneConfig(config));
    setNotice('');
    setAdminOpen(true);
    setMobileMenuOpen(false);
  }

  function updateDraft(field, value) { setDraft(previous => ({ ...previous, [field]: value })); }
  function updateGroup(index, field, value) {
    setDraft(previous => ({ ...previous, groups: previous.groups.map((group, i) => i === index ? { ...group, [field]: value } : group) }));
  }
  function updateItem(groupIndex, itemIndex, field, value) {
    setDraft(previous => ({ ...previous, groups: previous.groups.map((group, gi) => gi !== groupIndex ? group : ({ ...group, items: group.items.map((item, ii) => ii === itemIndex ? { ...item, [field]: value } : item) })) }));
  }
  function addGroup() {
    setDraft(previous => ({ ...previous, groups: [...previous.groups, { groupName: 'Νέα ομάδα', icon: 'Folder', color: '#2563eb', items: [] }] }));
  }
  function removeGroup(index) {
    setDraft(previous => ({ ...previous, groups: previous.groups.filter((_, i) => i !== index) }));
  }
  function addItem(groupIndex) {
    setDraft(previous => ({ ...previous, groups: previous.groups.map((group, i) => i === groupIndex ? { ...group, items: [...group.items, { title: 'Νέα ιστοσελίδα', description: '', url: 'https://example.com/', openInNewTab: false }] } : group) }));
  }
  function removeItem(groupIndex, itemIndex) {
    setDraft(previous => ({ ...previous, groups: previous.groups.map((group, i) => i === groupIndex ? { ...group, items: group.items.filter((_, ii) => ii !== itemIndex) } : group) }));
  }
  function saveSettings(event) {
    event.preventDefault();
    const cleaned = { ...draft, groups: draft.groups.map(group => ({ ...group, groupName: group.groupName.trim() || 'Νέα ομάδα', items: group.items.map(item => ({ ...item, title: item.title.trim() || 'Νέα ιστοσελίδα', url: item.url.trim() })) })) };
    if (cleaned.groups.some(group => group.items.some(item => !/^https?:\/\//i.test(item.url)))) {
      setNotice('Κάθε διεύθυνση ιστοσελίδας πρέπει να ξεκινά με http:// ή https://.');
      return;
    }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(cleaned));
      setConfig(cleaned);
      const allItems = cleaned.groups.flatMap(group => group.items);
      if (!allItems.some(item => item.url === selectedUrl)) {
        const next = allItems[0];
        setSelectedUrl(next?.url || '');
        setSelectedTitle(next?.title || '');
        if (next) localStorage.setItem(LAST_PAGE_KEY, JSON.stringify({ url: next.url, title: next.title }));
        else localStorage.removeItem(LAST_PAGE_KEY);
      }
      setExpandedGroups(Object.fromEntries(cleaned.groups.map(group => [group.groupName, true])));
      setNotice('Οι ρυθμίσεις αποθηκεύτηκαν σε αυτή τη συσκευή/φυλλομετρητή.');
      window.setTimeout(() => setAdminOpen(false), 650);
    } catch {
      setNotice('Δεν ήταν δυνατή η αποθήκευση. Ελέγξτε τις ρυθμίσεις του browser.');
    }
  }
  function resetSettings() {
    try { localStorage.removeItem(SETTINGS_KEY); localStorage.removeItem(LAST_PAGE_KEY); } catch { /* ignore */ }
    setConfig(defaultConfig);
    setDraft(cloneConfig(defaultConfig));
    const first = defaultConfig.groups.flatMap(group => group.items)[0];
    setSelectedUrl(defaultConfig.startUrl || first?.url || '');
    setSelectedTitle(defaultConfig.groups.flatMap(group => group.items).find(item => item.url === defaultConfig.startUrl)?.title || first?.title || '');
    setNotice('Επαναφέρθηκαν οι αρχικές ρυθμίσεις.');
  }

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('el-GR');
  const visibleGroups = config.groups.map(group => ({ ...group, items: group.items.filter(item => !normalizedQuery || `${item.title} ${item.description || ''} ${item.url} ${group.groupName}`.toLocaleLowerCase('el-GR').includes(normalizedQuery)) })).filter(group => group.items.length > 0 || (!normalizedQuery && group.items.length === 0));
  const selectedPage = pages.find(page => page.url === selectedUrl);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <button className="icon-button desktop-menu-toggle" type="button" aria-label={sidebarCollapsed ? 'Άνοιγμα μενού' : 'Σύμπτυξη μενού'} onClick={() => setSidebarCollapsed(value => !value)}>{sidebarCollapsed ? <PanelLeftOpen size={21} /> : <PanelLeftClose size={21} />}</button>
          <button className="icon-button mobile-menu-toggle" type="button" aria-label={mobileMenuOpen ? 'Κλείσιμο μενού' : 'Άνοιγμα μενού'} onClick={() => setMobileMenuOpen(value => !value)}>{mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          <div className="brand-mark"><Globe size={22} /></div>
          <div className="brand-text"><h1>{config.appTitle}</h1>{config.subtitle && <p>{config.subtitle}</p>}</div>
        </div>
        <div className="header-actions">
          <div className="header-datetime"><span className="datetime-label">{config.dateTimeLabel || 'Ημερομηνία και ώρα'}</span><strong>{formatDateTime(now, config.locale)}</strong></div>
          <button className="admin-button" type="button" onClick={openAdmin}><Settings size={17} /><span>Διαχείριση</span></button>
        </div>
      </header>

      <div className="main-layout">
        {mobileMenuOpen && <button className="mobile-backdrop" aria-label="Κλείσιμο μενού" onClick={() => setMobileMenuOpen(false)} />}
        <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}>
          <div className="sidebar-heading">{config.navigationTitle || 'Πλοήγηση'}</div>
          <div className="menu-search"><Search size={16} /><input aria-label="Αναζήτηση μενού" placeholder="Αναζήτηση ιστοσελίδας..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} /><button type="button" aria-label="Καθαρισμός αναζήτησης" onClick={() => setSearchQuery('')} hidden={!searchQuery}><X size={14} /></button></div>
          <nav className="navigation" aria-label={config.navigationTitle || 'Κύριο μενού'}>
            {visibleGroups.map(group => <section className="nav-group" key={group.groupName}>
              <button className="group-button" type="button" onClick={() => toggleGroup(group.groupName)} aria-expanded={Boolean(expandedGroups[group.groupName])} title={group.groupName}>
                <GroupIcon name={group.icon} color={group.color} /><span className="group-label">{group.groupName}</span><span className="group-chevron">{expandedGroups[group.groupName] || normalizedQuery ? '−' : '+'}</span>
              </button>
              {(expandedGroups[group.groupName] || normalizedQuery) && <div className="sub-menu" style={{ borderLeftColor: `${group.color || '#d9e2ec'}55` }}>
                {group.items.map(item => <button className={`nav-item ${selectedUrl === item.url ? 'nav-item-active' : ''}`} key={`${group.groupName}-${item.title}-${item.url}`} type="button" onClick={() => selectPage(item)} title={item.description || item.title} aria-current={selectedUrl === item.url ? 'page' : undefined}>
                  <span className="nav-item-indicator" style={{ backgroundColor: selectedUrl === item.url ? (group.color || undefined) : undefined }} /><span className="nav-item-title">{item.title}</span>{item.openInNewTab && <ExternalLink size={13} className="external-icon" />}
                </button>)}
              </div>}
            </section>)}
            {normalizedQuery && visibleGroups.length === 0 && <div className="search-empty">Δεν βρέθηκαν ιστοσελίδες.</div>}
          </nav>
          {config.sidebarNote && <div className="sidebar-note">{config.sidebarNote}</div>}
        </aside>

        <main className="content-area">
          {adminOpen ? <section className="admin-screen">
            <div className="admin-heading"><button className="secondary-button" type="button" onClick={() => setAdminOpen(false)}><ArrowLeft size={16} /> Επιστροφή</button><div><span className="content-eyebrow">ΡΥΘΜΙΣΕΙΣ ΕΦΑΡΜΟΓΗΣ</span><h2>Διαχείριση πύλης</h2><p>Επεξεργάσου τα στοιχεία, τις ομάδες και τις ιστοσελίδες του μενού.</p></div></div>
            <form onSubmit={saveSettings} className="settings-form">
              <section className="settings-card"><h3>Γενικές ρυθμίσεις</h3><div className="settings-grid">
                <label>Τίτλος εφαρμογής<input value={draft.appTitle || ''} onChange={e => updateDraft('appTitle', e.target.value)} /></label>
                <label>Υπότιτλος<input value={draft.subtitle || ''} onChange={e => updateDraft('subtitle', e.target.value)} /></label>
                <label>Τίτλος πλοήγησης<input value={draft.navigationTitle || ''} onChange={e => updateDraft('navigationTitle', e.target.value)} /></label>
                <label>Κείμενο υποσέλιδου<input value={draft.footerText || ''} onChange={e => updateDraft('footerText', e.target.value)} /></label>
                <label>Κείμενο δεξιά στο υποσέλιδο<input value={draft.footerRightText || ''} onChange={e => updateDraft('footerRightText', e.target.value)} /></label>
                <label className="checkbox-label"><input type="checkbox" checked={Boolean(draft.showDescription)} onChange={e => updateDraft('showDescription', e.target.checked)} /> Εμφάνιση περιγραφής ιστοσελίδας</label>
              </div></section>
              <div className="groups-admin-heading"><h3>Ομάδες και ιστοσελίδες</h3><button className="secondary-button" type="button" onClick={addGroup}><Plus size={16} /> Προσθήκη ομάδας</button></div>
              {draft.groups.map((group, gi) => <section className="settings-card group-editor" key={`draft-${gi}`}>
                <div className="group-editor-heading"><h3>Ομάδα {gi + 1}</h3><button className="danger-button" type="button" onClick={() => removeGroup(gi)}><Trash2 size={15} /> Διαγραφή ομάδας</button></div>
                <div className="settings-grid"><label>Όνομα ομάδας<input value={group.groupName} onChange={e => updateGroup(gi, 'groupName', e.target.value)} /></label>
                  <label>Εικονίδιο<select value={group.icon || 'Folder'} onChange={e => updateGroup(gi, 'icon', e.target.value)}>{iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}</select></label>
                  <label>Χρώμα ομάδας<select value={group.color || '#64748b'} onChange={e => updateGroup(gi, 'color', e.target.value)}>{colorOptions.map(color => <option key={color} value={color}>{color}</option>)}</select></label>
                </div>
                {group.items.map((item, ii) => <div className="item-editor" key={`item-${gi}-${ii}`}>
                  <div className="item-editor-top"><strong>Ιστοσελίδα {ii + 1}</strong><button className="danger-button" type="button" onClick={() => removeItem(gi, ii)}><Trash2 size={14} /> Διαγραφή</button></div>
                  <div className="settings-grid"><label>Τίτλος<input value={item.title} onChange={e => updateItem(gi, ii, 'title', e.target.value)} /></label><label>Περιγραφή<input value={item.description || ''} onChange={e => updateItem(gi, ii, 'description', e.target.value)} /></label><label className="wide-field">URL<input type="url" required value={item.url} onChange={e => updateItem(gi, ii, 'url', e.target.value)} placeholder="https://example.com" /></label><label className="checkbox-label"><input type="checkbox" checked={Boolean(item.openInNewTab)} onChange={e => updateItem(gi, ii, 'openInNewTab', e.target.checked)} /> Άνοιγμα σε νέα καρτέλα</label></div>
                </div>)}
                <button className="secondary-button add-page-button" type="button" onClick={() => addItem(gi)}><Plus size={15} /> Προσθήκη ιστοσελίδας</button>
              </section>)}
              {notice && <p className="settings-notice" role="status">{notice}</p>}
              <div className="settings-actions"><button className="danger-button" type="button" onClick={resetSettings}><RotateCcw size={16} /> Επαναφορά αρχικών</button><button className="primary-button" type="submit"><Save size={16} /> Αποθήκευση ρυθμίσεων</button></div>
              <p className="settings-help">Οι ρυθμίσεις αποθηκεύονται τοπικά σε αυτόν τον browser. Για κοινές ρυθμίσεις σε όλους τους χρήστες απαιτείται backend ή κεντρικό σύστημα διαχείρισης.</p>
            </form>
          </section> : <>
            <div className="content-toolbar"><div className="content-heading"><span className="content-eyebrow">{config.contentLabel || 'ΠΕΡΙΕΧΟΜΕΝΟ'}</span><h2>{selectedTitle || config.emptyTitle || 'Επιλέξτε ιστοσελίδα'}</h2>{config.showDescription && selectedPage?.description && <p>{selectedPage.description}</p>}</div>
              {selectedUrl && <a className="open-external" href={selectedUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /><span>{config.openExternalLabel || 'Άνοιγμα σε νέα καρτέλα'}</span></a>}
            </div>
            <div className="iframe-container">{selectedUrl ? <><iframe key={selectedUrl} className="site-frame" src={selectedUrl} title={selectedTitle || 'Ενσωματωμένη ιστοσελίδα'} referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen; clipboard-read; clipboard-write" onError={() => setIframeError(true)} /><div className="iframe-hint"><span>Αν η ιστοσελίδα δεν εμφανίζεται εδώ, μπορεί να απαγορεύει την ενσωμάτωση.</span><a href={selectedUrl} target="_blank" rel="noreferrer">Άνοιγμα σε νέα καρτέλα</a></div>{iframeError && <div className="iframe-message"><Globe size={30} /><h3>Δεν ήταν δυνατή η φόρτωση της ιστοσελίδας</h3><p>Ο ιστότοπος ενδέχεται να μην επιτρέπει την εμφάνιση μέσα σε iframe.</p><a href={selectedUrl} target="_blank" rel="noreferrer">Άνοιγμα σε νέα καρτέλα</a></div>}</> : <div className="empty-state"><Globe size={44} /><h2>{config.emptyTitle || 'Καλώς ήρθατε'}</h2><p>{config.emptyMessage || 'Επιλέξτε μια ιστοσελίδα από το αριστερό μενού.'}</p></div>}</div>
          </>}
        </main>
      </div>
      <footer className="app-footer"><span>{config.footerText}</span>{config.footerRightText && <span className="footer-right">{config.footerRightText}</span>}</footer>
    </div>
  );
}
