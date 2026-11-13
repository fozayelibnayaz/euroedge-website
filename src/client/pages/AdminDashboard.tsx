import { type SyntheticEvent, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  LuArrowLeft,
  LuBookOpen,
  LuBriefcase,
  LuClipboardList,
  LuFileText,
  LuGlobe,
  LuGraduationCap,
  LuImage,
  LuInbox,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuMessagesSquare,
  LuNavigation,
  LuSave,
  LuSettings,
  LuShieldCheck,
  LuUsers,
  LuWrench,
} from 'react-icons/lu';
import {
  checkAdminSession,
  loginAdminSession,
  logoutAdminSession,
  refreshCmsData as refreshCmsFromApi,
  resetAdminCmsData,
  updateAdminCmsData,
} from '@/client/utilities/api-client';
import {
  type BlogPost,
  type CmsData,
  type CourseItem,
  type FaqItem,
  type MediaItem,
  type NavItem,
  type RecruitmentRole,
  type ServiceItem,
  type SiteSettings,
  type StatItem,
  type StudyDestination,
  type TeamMember,
  type TestimonialItem,
} from '@/shared/cms-types';
import { useCms } from '@/client/context/cms-context';
import { PageMeta } from '../ui/components/page-meta';
import { Button, Card, SectionHeading } from '../ui/primitives/ui';
import { Toast } from '../ui/primitives/ui';
import { DestinationsPanel, CoursesPanel, ServicesPanel, RolesPanel, TeamPanel, TestimonialsPanel, FaqsPanel, PostsPanel, NavPanel, StatsPanel } from '../ui/admin/collection-panels';
import { SettingsPanel } from '../ui/admin/settings-panel';
import { PagesPanel } from '../ui/admin/pages-panel';
import { MediaPanel } from '../ui/admin/media-panel';
import { InquiriesPanel } from '../ui/admin/inquiries-panel';
import { SecurityPanel } from '../ui/admin/security-panel';

/* ------------------------------------------------------------------ *
 * Login — no credentials are ever displayed
 * ------------------------------------------------------------------ */

const AdminLogin = ({ onAuthenticated }: { onAuthenticated: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      return;
    }

    setBusy(true);
    try {
      await loginAdminSession(username.trim(), password);
      onAuthenticated();
    } catch {
      setError('Those credentials were not recognised.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageMeta title="Admin — EuroEdge Admission Group" description="Protected content management area." noIndex />
      <div className="ee-login-shell">
        <div className="ee-login-card">
          <div className="ee-stack ee-stack-sm">
            <div className="ee-center">
              <span className="ee-eyebrow" style={{ justifyContent: 'center' }}>
                CONTENT MANAGEMENT
              </span>
              <h1 className="ee-h3" style={{ marginTop: 8 }}>
                EuroEdge Admin
              </h1>
            </div>

            <form onSubmit={(event) => void submit(event)} className="ee-stack ee-stack-sm" noValidate>
              <label className="ee-field">
                <span className="ee-label">Username</span>
                <input
                  className="ee-input"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => { setUsername(event.target.value); }}
                  autoFocus
                  required
                />
              </label>

              <label className="ee-field">
                <span className="ee-label">Password</span>
                <input
                  className="ee-input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); }}
                  required
                />
              </label>

              {error ? (
                <span className="ee-error" role="alert">
                  {error}
                </span>
              ) : null}

              <Button type="submit" size="lg" disabled={busy} className="ee-btn-block">
                {busy ? 'Checking…' : 'Sign in'}
              </Button>
            </form>

            <Link
              to="/"
              className="ee-row ee-row-xs ee-muted ee-center"
              style={{ fontSize: '0.82rem', justifyContent: 'center' }}
            >
              <LuArrowLeft size={13} /> Back to the website
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

/* ------------------------------------------------------------------ *
 * Sidebar model
 * ------------------------------------------------------------------ */

type TabId =
  | 'dashboard'
  | 'settings'
  | 'pages'
  | 'nav'
  | 'stats'
  | 'destinations'
  | 'courses'
  | 'services'
  | 'roles'
  | 'team'
  | 'testimonials'
  | 'faqs'
  | 'posts'
  | 'media'
  | 'inquiries'
  | 'security';

interface TabDef {
  id: TabId;
  label: string;
  icon: ReactNode;
  group: string;
}

const TABS: TabDef[] = [
  { id: 'dashboard', label: 'Overview', icon: <LuLayoutDashboard size={15} />, group: 'Site' },
  { id: 'settings', label: 'Site settings', icon: <LuSettings size={15} />, group: 'Site' },
  { id: 'pages', label: 'Pages & sections', icon: <LuFileText size={15} />, group: 'Site' },
  { id: 'nav', label: 'Navigation', icon: <LuNavigation size={15} />, group: 'Site' },
  { id: 'stats', label: 'Headline numbers', icon: <LuClipboardList size={15} />, group: 'Site' },
  { id: 'media', label: 'Media library', icon: <LuImage size={15} />, group: 'Site' },

  { id: 'destinations', label: 'Study destinations', icon: <LuGlobe size={15} />, group: 'Content' },
  { id: 'courses', label: 'English courses', icon: <LuGraduationCap size={15} />, group: 'Content' },
  { id: 'services', label: 'Services', icon: <LuWrench size={15} />, group: 'Content' },
  { id: 'roles', label: 'Jobs & permits', icon: <LuBriefcase size={15} />, group: 'Content' },
  { id: 'team', label: 'Team', icon: <LuUsers size={15} />, group: 'Content' },
  { id: 'testimonials', label: 'Student stories', icon: <LuMessagesSquare size={15} />, group: 'Content' },
  { id: 'faqs', label: 'Questions', icon: <LuMessagesSquare size={15} />, group: 'Content' },
  { id: 'posts', label: 'Journal', icon: <LuBookOpen size={15} />, group: 'Content' },

  { id: 'inquiries', label: 'Enquiries', icon: <LuInbox size={15} />, group: 'Operations' },
  { id: 'security', label: 'Security', icon: <LuShieldCheck size={15} />, group: 'Operations' },
];

/* ------------------------------------------------------------------ *
 * Studio
 * ------------------------------------------------------------------ */

const AdminStudio = ({ onSignOut }: { onSignOut: () => void }) => {
  const { cms, setCmsOptimistic, refreshCms } = useCms();
  const [draft, setDraft] = useState<CmsData>(cms);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<TabId>('dashboard');
  const [drawer, setDrawer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  // Pull the published content when the tab regains focus so two editors
  // never silently overwrite each other.
  const pullLatest = useCallback(async () => {
    if (dirty) {
      return;
    }
    try {
      const live = await refreshCmsFromApi();
      setDraft(live);
    } catch {
      // Keep the current view when the network is unavailable.
    }
  }, [dirty]);

  useEffect(() => {
    void pullLatest();
    const onFocus = () => void pullLatest();
    const interval = window.setInterval(() => void pullLatest(), 30000);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [pullLatest]);

  const patch = useCallback(<K extends keyof CmsData>(key: K, value: CmsData[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const patchSettings = useCallback((next: SiteSettings) => {
    setDraft((prev) => ({ ...prev, settings: next }));
    setDirty(true);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const published = await updateAdminCmsData(draft);
      setDraft(published);
      setCmsOptimistic(published);
      setDirty(false);
      setToast({ message: 'Published. The live site now shows these changes.', tone: 'success' });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Could not save. Your edits are still here.',
        tone: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    await refreshCms();
    setDraft(cms);
    setDirty(false);
    setToast({ message: 'Discarded unpublished edits.', tone: 'success' });
  };

  const reset = async () => {
    const fresh = await resetAdminCmsData();
    setDraft(fresh);
    setCmsOptimistic(fresh);
    setDirty(false);
    setToast({ message: 'Content restored to the starter version.', tone: 'success' });
  };

  const restore = (next: CmsData) => {
    setDraft(next);
    setDirty(true);
  };

  const onUploaded = (item: MediaItem) => {
    setDraft((prev) => ({ ...prev, media: [item, ...prev.media] }));
    setDirty(true);
  };

  const tabDef = TABS.find((entry) => entry.id === tab) ?? TABS[0];
  const groups = useMemo(() => Array.from(new Set(TABS.map((entry) => entry.group))), []);

  const body = () => {
    switch (tab) {
      case 'dashboard':
        return (
          <div className="ee-stack ee-stack-md">
            <SectionHeading
              title="Overview"
              description="Everything on the public site comes from these records. Edit, then press Publish."
            />
            <div className="ee-grid ee-grid-4" style={{ gap: 12 }}>
              {[
                { label: 'Pages', value: draft.pages.length, hint: 'Routes with editable sections' },
                { label: 'Sections', value: draft.pages.reduce((sum, page) => sum + page.blocks.length, 0), hint: 'Across all pages' },
                { label: 'Destinations', value: draft.destinations.length, hint: 'Country corridors' },
                { label: 'Open jobs', value: draft.roles.filter((role) => role.status !== 'closed').length, hint: 'Recruitment listings' },
              ].map((cell) => (
                <Card key={cell.label} className="ee-full">
                  <span className="ee-label">{cell.label}</span>
                  <div className="ee-h2 ee-accent" style={{ marginTop: 4 }}>
                    {cell.value}
                  </div>
                  <div className="ee-faint" style={{ fontSize: '0.76rem' }}>
                    {cell.hint}
                  </div>
                </Card>
              ))}
            </div>
            <Card className="ee-stack ee-stack-sm">
              <span className="ee-label">How the editor works</span>
              <ol className="ee-body" style={{ margin: 0, paddingLeft: 20 }}>
                <li>
                  <strong>Pages &amp; sections</strong> — every route has an ordered list of sections. Add a
                  new one, choose its type, and it renders with a safe layout. Hide or delete without breaking
                  anything else.
                </li>
                <li>
                  <strong>Data sources</strong> — a section can pull live records (destinations, courses, jobs,
                  journal) or use manual items you write here.
                </li>
                <li>
                  <strong>Media</strong> — upload images once, then pick them from any image field.
                </li>
                <li>
                  <strong>Publish</strong> — nothing is visible on the live site until you press Publish.
                </li>
              </ol>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <SettingsPanel
            cms={draft}
            patch={patchSettings}
            patchOffices={(next) => { patchSettings({ ...draft.settings, offices: next }); }
            }
            patchSocials={(next) => { patchSettings({ ...draft.settings, socials: next }); }}
            media={draft.media}
            onUploaded={onUploaded}
          />
        );
      case 'pages':
        return (
          <PagesPanel
            cms={draft}
            patchPages={(next) => { patch('pages', next); }}
            media={draft.media}
            onUploaded={onUploaded}
          />
        );
      case 'nav':
        return <NavPanel cms={draft} patch={(next: NavItem[]) => { patch('nav', next); }} />;
      case 'stats':
        return (
          <StatsPanel
            cms={draft}
            patch={(next: StatItem[]) => { patchSettings({ ...draft.settings, stats: next }); }}
          />
        );
      case 'destinations':
        return (
          <DestinationsPanel
            cms={draft}
            patch={(next: StudyDestination[]) => { patch('destinations', next); }}
            media={draft.media}
            onUploaded={onUploaded}
          />
        );
      case 'courses':
        return (
          <CoursesPanel
            cms={draft}
            patch={(next: CourseItem[]) => { patch('courses', next); }}
            media={draft.media}
            onUploaded={onUploaded}
          />
        );
      case 'services':
        return <ServicesPanel cms={draft} patch={(next: ServiceItem[]) => { patch('services', next); }} />;
      case 'roles':
        return (
          <RolesPanel
            cms={draft}
            patch={(next: RecruitmentRole[]) => { patch('roles', next); }}
            media={draft.media}
            onUploaded={onUploaded}
          />
        );
      case 'team':
        return (
          <TeamPanel
            cms={draft}
            patch={(next: TeamMember[]) => { patch('team', next); }}
            media={draft.media}
            onUploaded={onUploaded}
          />
        );
      case 'testimonials':
        return (
          <TestimonialsPanel
            cms={draft}
            patch={(next: TestimonialItem[]) => { patch('testimonials', next); }}
            media={draft.media}
            onUploaded={onUploaded}
          />
        );
      case 'faqs':
        return <FaqsPanel cms={draft} patch={(next: FaqItem[]) => { patch('faqs', next); }} />;
      case 'posts':
        return (
          <PostsPanel
            cms={draft}
            patch={(next: BlogPost[]) => { patch('posts', next); }}
            media={draft.media}
            onUploaded={onUploaded}
          />
        );
      case 'media':
        return <MediaPanel cms={draft} onMediaChange={(next) => { patch('media', next); }} />;
      case 'inquiries':
        return <InquiriesPanel />;
      case 'security':
        return <SecurityPanel cms={draft} onReset={reset} onRestore={restore} />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageMeta title="Admin — EuroEdge Admission Group" description="Protected content management area." noIndex />
      <div className="ee-admin">
        <aside className="ee-admin-side" data-open={drawer ? 'true' : 'false'}>
          <div className="ee-row ee-row-between" style={{ marginBottom: 8 }}>
            <span className="ee-eyebrow">EUROEDGE</span>
            <button
              type="button"
              className="ee-icon-btn ee-admin-drawer-toggle"
              onClick={() => { setDrawer(false); }}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {groups.map((group) => (
            <div key={group} className="ee-stack" style={{ gap: 2 }}>
              <span className="ee-admin-group">{group}</span>
              {TABS.filter((entry) => entry.group === group).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="ee-admin-item"
                  data-active={tab === entry.id ? 'true' : 'false'}
                  onClick={() => {
                    setTab(entry.id);
                    setDrawer(false);
                  }}
                >
                  {entry.icon}
                  {entry.label}
                </button>
              ))}
            </div>
          ))}

          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button type="button" className="ee-admin-item" onClick={() => { onSignOut(); }}>
              <LuLogOut size={15} /> Sign out
            </button>
          </div>
        </aside>

        <div className="ee-admin-main">
          <div className="ee-admin-topbar">
            <div className="ee-row ee-row-sm">
              <button
                type="button"
                className="ee-icon-btn ee-admin-drawer-toggle"
                onClick={() => { setDrawer(true); }}
                aria-label="Open menu"
              >
                <LuMenu size={15} />
              </button>
              <div>
                <h1 className="ee-h4" style={{ margin: 0 }}>
                  {tabDef.label}
                </h1>
                <span className="ee-faint" style={{ fontSize: '0.76rem' }}>
                  {dirty ? 'Unpublished changes' : 'In sync with the live site'}
                </span>
              </div>
            </div>
            <div className="ee-row ee-row-xs">
              <Button variant="ghost" size="sm" onClick={() => void discard()} disabled={!dirty || saving}>
                Discard
              </Button>
              <Button
                size="sm"
                icon={<LuSave size={14} />}
                onClick={() => void save()}
                disabled={!dirty || saving}
              >
                {saving ? 'Publishing…' : 'Publish changes'}
              </Button>
              <Link to="/" className="ee-btn ee-btn-secondary ee-btn-sm" target="_blank">
                View site
              </Link>
            </div>
          </div>

          {body()}
        </div>
      </div>

      {toast ? (
        <Toast message={toast.message} tone={toast.tone} onDone={() => { setToast(null); }} />
      ) : null}
    </>
  );
};

/* ------------------------------------------------------------------ *
 * Route guard
 * ------------------------------------------------------------------ */

const AdminDashboard = () => {
  const [state, setState] = useState<'checking' | 'out' | 'in'>('checking');

  useEffect(() => {
    void checkAdminSession().then((result) => { setState(result.authenticated ? 'in' : 'out'); });
  }, []);

  const signOut = () => {
    void logoutAdminSession();
    setState('out');
  };

  if (state === 'checking') {
    return (
      <div className="ee-login-shell">
        <span className="ee-muted">Checking your session…</span>
      </div>
    );
  }

  if (state === 'out') {
    return <AdminLogin onAuthenticated={() => { setState('in'); }} />;
  }

  return <AdminStudio onSignOut={signOut} />;
};

export default AdminDashboard;
