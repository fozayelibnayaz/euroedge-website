import { useEffect, useMemo, useState } from 'react';
import {
  LuArchive,
  LuCheck,
  LuDownload,
  LuMail,
  LuMessageCircle,
  LuTrash2,
  LuUser,
} from 'react-icons/lu';
import {
  deleteAdminInquiryItem,
  fetchAdminInquiries,
  patchAdminInquiryItem,
} from '@/client/utilities/api-client';
import { type InquiryStatus, type InquirySubmission } from '@/shared/cms-types';
import { Badge, Button, Card, EmptyState, Field, SectionHeading } from '../primitives/ui';
import { Toast } from '../primitives/ui';
import { TextAreaField } from './fields';

const STATUSES: { value: InquiryStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_review', label: 'In review' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'converted', label: 'Converted' },
  { value: 'archived', label: 'Archived' },
];

const statusTone = (status: InquiryStatus) =>
  status === 'converted'
    ? 'good'
    : status === 'new'
      ? 'accent'
      : status === 'archived'
        ? 'neutral'
        : status === 'contacted'
          ? 'coral'
          : 'neutral';

const toCsv = (rows: InquirySubmission[]): string => {
  const header = [
    'Ticket',
    'Created',
    'First name',
    'Last name',
    'Email',
    'Phone',
    'Destination',
    'Programme',
    'Intake',
    'Subject',
    'Status',
    'Advisor notes',
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [
      row.ticketId,
      row.createdAt,
      row.firstName,
      row.lastName,
      row.email,
      row.phone,
      row.countryOfInterest,
      row.programInterest,
      row.preferredIntake,
      row.subject,
      row.status,
      row.advisorNotes,
    ]
      .map(escape)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
};

export const InquiriesPanel = () => {
  const [rows, setRows] = useState<InquirySubmission[]>([]);
  const [filter, setFilter] = useState<InquiryStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchAdminInquiries());
    } catch {
      setToast('Could not load enquiries. Check your session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== 'all' && row.status !== filter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [row.ticketId, row.firstName, row.lastName, row.email, row.phone, row.subject]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, filter, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    STATUSES.forEach((status) => {
      map[status.value] = rows.filter((row) => row.status === status.value).length;
    });
    return map;
  }, [rows]);

  const setStatus = async (row: InquirySubmission, status: InquiryStatus) => {
    const updated = await patchAdminInquiryItem(row.id, {
      status,
      advisorNotes: notes[row.id] ?? row.advisorNotes,
    });
    setRows((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    setToast(`${row.ticketId} moved to ${status.replace('_', ' ')}`);
  };

  const saveNotes = async (row: InquirySubmission) => {
    const updated = await patchAdminInquiryItem(row.id, { advisorNotes: notes[row.id] ?? row.advisorNotes });
    setRows((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
    setToast(`Notes saved for ${row.ticketId}`);
  };

  const remove = async (row: InquirySubmission) => {
    await deleteAdminInquiryItem(row.id);
    setRows((prev) => prev.filter((entry) => entry.id !== row.id));
    setToast(`${row.ticketId} deleted`);
  };

  const exportCsv = () => {
    const blob = new Blob([toCsv(visible)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `euroedge-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ee-stack ee-stack-md">
      <div className="ee-row ee-row-between" style={{ gap: 14, flexWrap: 'wrap' }}>
        <SectionHeading
          title="Enquiries"
          description="Every form submission lands here with a reference number. Notes are private to the desk."
        />
        <Button variant="secondary" icon={<LuDownload size={14} />} onClick={exportCsv} disabled={visible.length === 0}>
          Export CSV
        </Button>
      </div>

      <div className="ee-row ee-row-sm" style={{ flexWrap: 'wrap' }}>
        <Badge tone="accent">{rows.length} total</Badge>
        {STATUSES.map((status) => (
          <button
            key={status.value}
            type="button"
            onClick={() => { setFilter(status.value); }}
            className="ee-badge"
            style={{
              cursor: 'pointer',
              borderColor: filter === status.value ? 'var(--ee-accent)' : undefined,
              color: filter === status.value ? 'var(--ee-accent)' : undefined,
            }}
          >
            {status.label}: {counts[status.value] ?? 0}
          </button>
        ))}
        {filter !== 'all' ? (
          <button type="button" className="ee-badge" style={{ cursor: 'pointer' }} onClick={() => { setFilter('all'); }}>
            Clear filter
          </button>
        ) : null}
      </div>

      <Field>
        <input
          className="ee-input"
          placeholder="Search by reference, name, email or subject…"
          value={query}
          onChange={(event) => { setQuery(event.target.value); }}
        />
      </Field>

      {loading ? (
        <EmptyState>Loading enquiries…</EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState>No enquiries match this view.</EmptyState>
      ) : (
        <div className="ee-stack ee-stack-sm">
          {visible.map((row) => (
            <Card key={row.id} className="ee-stack ee-stack-sm" data-inquiry-id={row.id} data-inquiry-status={row.status}>
              <div className="ee-row ee-row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                <div className="ee-row ee-row-sm" style={{ minWidth: 0 }}>
                  <div
                    className="ee-row"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--ee-accent-soft)',
                      color: 'var(--ee-accent)',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <LuUser size={17} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>
                      {row.firstName} {row.lastName}
                    </div>
                    <div className="ee-faint" style={{ fontSize: '0.78rem' }}>
                      {row.email} · {row.phone}
                    </div>
                  </div>
                </div>
                <div className="ee-row ee-row-xs">
                  <Badge tone={statusTone(row.status)}>{row.status.replace('_', ' ')}</Badge>
                  <span className="ee-mono ee-faint" style={{ fontSize: '0.74rem' }}>
                    {row.ticketId}
                  </span>
                </div>
              </div>

              <div className="ee-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {[
                  { label: 'Destination', value: row.countryOfInterest },
                  { label: 'Programme', value: row.programInterest },
                  { label: 'Intake', value: row.preferredIntake },
                  { label: 'Received', value: new Date(row.createdAt).toLocaleString() },
                ].map((cell) => (
                  <div key={cell.label}>
                    <span className="ee-label">{cell.label}</span>
                    <div style={{ fontSize: '0.88rem' }}>{cell.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <span className="ee-label">Subject</span>
                <div style={{ fontSize: '0.92rem', fontWeight: 500 }}>{row.subject}</div>
              </div>

              <p className="ee-body" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {row.message}
              </p>

              <TextAreaField
                label="Private advisor notes"
                rows={2}
                value={notes[row.id] ?? row.advisorNotes}
                onChange={(next) => { setNotes((prev) => ({ ...prev, [row.id]: next })); }}
              />

              <div className="ee-row ee-row-xs" style={{ flexWrap: 'wrap' }}>
                <Button size="sm" variant="secondary" onClick={() => void saveNotes(row)}>
                  Save notes
                </Button>
                <a
                  href={`https://wa.me/${row.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="ee-btn ee-btn-secondary ee-btn-sm"
                >
                  <LuMessageCircle size={13} /> WhatsApp
                </a>
                <a
                  href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${row.ticketId} — ${row.subject}`)}`}
                  className="ee-btn ee-btn-secondary ee-btn-sm"
                >
                  <LuMail size={13} /> Email
                </a>
                {row.status !== 'converted' ? (
                  <Button size="sm" onClick={() => void setStatus(row, 'converted')} icon={<LuCheck size={13} />}>
                    Mark converted
                  </Button>
                ) : null}
                {row.status !== 'archived' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void setStatus(row, 'archived')}
                    icon={<LuArchive size={13} />}
                  >
                    Archive
                  </Button>
                ) : null}
                <Button size="sm" variant="danger" onClick={() => void remove(row)} icon={<LuTrash2 size={13} />}>
                  Delete
                </Button>
              </div>

              <Field label="Move to">
                <div className="ee-row ee-row-xs" style={{ flexWrap: 'wrap' }}>
                  {STATUSES.map((status) => (
                    <button
                      key={status.value}
                      type="button"
                      className="ee-badge"
                      style={{
                        cursor: 'pointer',
                        borderColor: row.status === status.value ? 'var(--ee-accent)' : undefined,
                      }}
                      onClick={() => void setStatus(row, status.value)}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </Field>
            </Card>
          ))}
        </div>
      )}

      {toast ? <Toast message={toast} tone="success" onDone={() => { setToast(''); }} /> : null}
    </div>
  );
};
