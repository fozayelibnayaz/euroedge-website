import { useRef, useState, type ReactNode } from 'react';
import { LuArrowDown, LuArrowUp, LuPlus, LuTrash2, LuUpload } from 'react-icons/lu';
import { type MediaItem } from '@/shared/cms-types';
import { uploadAdminMedia } from '@/client/utilities/api-client';
import { Button, Field, IconButton } from '../primitives/ui';
import { SmartImage } from '../primitives/media';

/* ------------------------------------------------------------------ *
 * One field kit reused by every admin editor — no repeated markup.
 * ------------------------------------------------------------------ */

export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  hint?: string;
  mono?: boolean;
}) => (
  <Field label={label} hint={hint}>
    <input
      className="ee-input"
      value={value}
      placeholder={placeholder}
      aria-label={label}
      onChange={(event) => { onChange(event.target.value); }}
      style={mono ? { fontFamily: 'var(--ee-font-mono)', fontSize: '0.82rem' } : undefined}
    />
  </Field>
);

export const TextAreaField = ({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  hint?: string;
}) => (
  <Field label={label} hint={hint}>
    <textarea
      className="ee-textarea"
      rows={rows}
      value={value}
      aria-label={label}
      onChange={(event) => { onChange(event.target.value); }}
    />
  </Field>
);

export const NumberField = ({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) => (
  <Field label={label}>
    <input
      className="ee-input"
      type="number"
      min={min}
      max={max}
      value={value}
      aria-label={label}
      onChange={(event) => { onChange(Number(event.target.value)); }}
    />
  </Field>
);

export const SelectField = ({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
  hint?: string;
}) => (
  <Field label={label} hint={hint}>
    <select
      className="ee-select"
      value={value}
      aria-label={label}
      onChange={(event) => { onChange(event.target.value); }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </Field>
);

export const ToggleField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) => (
  <label className="ee-check">
    <input type="checkbox" checked={value} onChange={(event) => { onChange(event.target.checked); }} />
    {label}
  </label>
);

export const ImageField = ({
  label,
  value,
  onChange,
  media,
  onUploaded,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      const item = await uploadAdminMedia(file);
      onUploaded(item);
      onChange(item.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const recent = media.slice(0, 8);

  return (
    <Field label={label} error={error} hint="Paste a URL, upload a file, or pick a recent upload.">
      <div className="ee-row ee-row-sm" style={{ flexWrap: 'nowrap' }}>
        <input
          className="ee-input"
          value={value}
          placeholder="/uploads/example.png"
          aria-label={label}
          onChange={(event) => { onChange(event.target.value); }}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="ee-hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={<LuUpload size={13} />}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      {recent.length > 0 ? (
        <div className="ee-row ee-row-xs" style={{ flexWrap: 'wrap', marginTop: 6 }}>
          {recent.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onChange(item.url); }}
              title={item.name}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: item.url === value ? '2px solid var(--ee-accent)' : '1px solid var(--ee-line)',
                overflow: 'hidden',
                padding: 0,
                cursor: 'pointer',
                background: 'var(--ee-bg-alt)',
              }}
            >
              <SmartImage
                src={item.url}
                alt={item.name}
                seed={item.id}
                loading="eager"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      ) : null}
    </Field>
  );
};

export const StringListField = ({
  label,
  items,
  onChange,
  placeholder = 'Add an entry',
  hint,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hint?: string;
}) => (
  <Field label={label} hint={hint}>
    <div className="ee-stack ee-stack-xs">
      {items.map((item, index) => (
        <div key={`${label}-${String(index)}`} className="ee-row ee-row-xs" style={{ flexWrap: 'nowrap' }}>
          <input
            className="ee-input"
            value={item}
            placeholder={placeholder}
            aria-label={`${label} ${String(index + 1)}`}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <IconButton
            label="Remove"
            icon={<LuTrash2 size={14} />}
            variant="danger"
            onClick={() => { onChange(items.filter((_, i) => i !== index)); }}
          />
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        icon={<LuPlus size={13} />}
        onClick={() => { onChange([...items, '']); }}
        style={{ alignSelf: 'flex-start' }}
      >
        Add entry
      </Button>
    </div>
  </Field>
);

export const ParagraphListField = ({
  label,
  items,
  onChange,
  hint,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}) => (
  <Field label={label} hint={hint}>
    <div className="ee-stack ee-stack-xs">
      {items.map((item, index) => (
        <div key={`${label}-p-${String(index)}`} className="ee-row ee-row-xs" style={{ alignItems: 'flex-start' }}>
          <textarea
            className="ee-textarea"
            rows={3}
            value={item}
            aria-label={`${label} ${String(index + 1)}`}
            onChange={(event) => {
              const next = [...items];
              next[index] = event.target.value;
              onChange(next);
            }}
          />
          <IconButton
            label="Remove paragraph"
            icon={<LuTrash2 size={14} />}
            variant="danger"
            onClick={() => { onChange(items.filter((_, i) => i !== index)); }}
          />
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        icon={<LuPlus size={13} />}
        onClick={() => { onChange([...items, '']); }}
        style={{ alignSelf: 'flex-start' }}
      >
        Add paragraph
      </Button>
    </div>
  </Field>
);

export const EditorCard = ({
  title,
  subtitle,
  children,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) => (
  <div className="ee-panel ee-stack ee-stack-sm">
    <div className="ee-row ee-row-between" style={{ gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>{title}</div>
        {subtitle ? (
          <div className="ee-faint" style={{ fontSize: '0.78rem' }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="ee-row ee-row-xs">
        {onMoveUp ? (
          <IconButton label="Move up" icon={<LuArrowUp size={14} />} onClick={onMoveUp} />
        ) : null}
        {onMoveDown ? (
          <IconButton label="Move down" icon={<LuArrowDown size={14} />} onClick={onMoveDown} />
        ) : null}
        {onDuplicate ? (
          <Button variant="ghost" size="sm" onClick={onDuplicate}>
            Duplicate
          </Button>
        ) : null}
        {onDelete ? (
          <IconButton label="Delete" icon={<LuTrash2 size={14} />} variant="danger" onClick={onDelete} />
        ) : null}
      </div>
    </div>
    {children}
  </div>
);
