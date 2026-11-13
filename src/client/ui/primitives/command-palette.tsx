import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  LuArrowRight,
  LuBriefcase,
  LuBookOpen,
  LuCalendar,
  LuCompass,
  LuFileText,
  LuGlobe,
  LuSearch,
} from 'react-icons/lu';
import { type CmsData } from '@/shared/cms-types';

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  group: string;
  icon: React.ReactNode;
  to?: string;
  action?: () => void;
}

export const CommandPalette = ({
  open,
  onClose,
  cms,
  onConsult,
}: {
  open: boolean;
  onClose: () => void;
  cms: CmsData;
  onConsult: () => void;
}) => {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();

  const items = useMemo<PaletteItem[]>(() => {
    const pages: PaletteItem[] = cms.nav
      .filter((item) => item.visible)
      .map((item) => ({
        id: `nav-${item.id}`,
        label: item.label,
        hint: item.path,
        group: 'Pages',
        icon: <LuGlobe size={14} />,
        to: item.path,
      }));

    const destinations: PaletteItem[] = cms.destinations.map((item) => ({
      id: `dest-${item.id}`,
      label: `Study in ${item.country}`,
      hint: item.tagline,
      group: 'Destinations',
      icon: <LuCompass size={14} />,
      to: `/study/${item.slug}`,
    }));

    const courses: PaletteItem[] = cms.courses.map((item) => ({
      id: `course-${item.id}`,
      label: item.title,
      hint: item.level,
      group: 'Courses',
      icon: <LuBookOpen size={14} />,
      to: `/courses/${item.slug}`,
    }));

    const roles: PaletteItem[] = cms.roles.map((item) => ({
      id: `role-${item.id}`,
      label: item.title,
      hint: `${item.country} · ${item.sector}`,
      group: 'Jobs',
      icon: <LuBriefcase size={14} />,
      to: `/recruitment/${item.slug}`,
    }));

    const posts: PaletteItem[] = cms.posts.map((item) => ({
      id: `post-${item.id}`,
      label: item.title,
      hint: item.category,
      group: 'Journal',
      icon: <LuFileText size={14} />,
      to: `/blog/${item.slug}`,
    }));

    const actions: PaletteItem[] = [
      {
        id: 'act-consult',
        label: 'Book a free assessment',
        hint: 'Opens the enquiry form',
        group: 'Actions',
        icon: <LuCalendar size={14} />,
        action: () => { onConsult(); },
      },
      {
        id: 'act-whatsapp',
        label: 'Message the WhatsApp desk',
        hint: cms.settings.whatsapp,
        group: 'Actions',
        icon: <LuArrowRight size={14} />,
        to: `https://wa.me/${cms.settings.whatsapp.replace(/[^0-9]/g, '')}`,
      },
    ];

    return [...pages, ...actions, ...destinations, ...courses, ...roles, ...posts];
  }, [cms, onConsult]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return items.slice(0, 12);
    }
    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(needle) || item.hint.toLowerCase().includes(needle)
      )
      .slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setCursor((prev) => Math.min(prev + 1, filtered.length - 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setCursor((prev) => Math.max(prev - 1, 0));
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const target = filtered[cursor];
        if (target?.to) {
          onClose();
          if (target.to.startsWith('http')) {
            window.open(target.to, '_blank', 'noopener,noreferrer');
          } else {
            navigate(target.to);
          }
        } else if (target?.action) {
          onClose();
          target.action();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, [open, filtered, cursor, navigate, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="ee-modal-backdrop"
      style={{ alignItems: 'flex-start', paddingTop: '12vh' }}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="ee-modal"
        style={{ maxWidth: 620, padding: 0, overflow: 'hidden' }}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div
          className="ee-row ee-row-sm"
          style={{ padding: '14px 18px', borderBottom: '1px solid var(--ee-line)' }}
        >
          <LuSearch size={16} className="ee-faint" />
          <input
            autoFocus
            value={query}
            onChange={(event) => { setQuery(event.target.value); }}
            placeholder="Search destinations, courses, jobs, guides…"
            className="ee-input"
            style={{ border: 0, padding: 0, boxShadow: 'none', background: 'transparent' }}
            aria-label="Search the site"
          />
          <kbd className="ee-badge">ESC</kbd>
        </div>

        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 8 }}>
          {filtered.length === 0 ? (
            <div className="ee-empty" style={{ border: 0 }}>
              No matches for “{query}”.
            </div>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="ee-list-row"
                data-open={index === cursor ? 'true' : 'false'}
                style={{ border: 0, width: '100%', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={() => { setCursor(index); }}
                onClick={() => {
                  onClose();
                  if (item.action) {
                    item.action();
                  } else if (item.to?.startsWith('http')) {
                    window.open(item.to, '_blank', 'noopener,noreferrer');
                  } else if (item.to) {
                    navigate(item.to);
                  }
                }}
              >
                <span className="ee-row ee-row-sm" style={{ minWidth: 0 }}>
                  <span className="ee-accent">{item.icon}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>
                      {item.label}
                    </span>
                    <span className="ee-faint ee-truncate" style={{ display: 'block', fontSize: '0.76rem' }}>
                      {item.hint}
                    </span>
                  </span>
                </span>
                <span className="ee-badge">{item.group}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
