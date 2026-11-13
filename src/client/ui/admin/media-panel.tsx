import { useRef, useState } from 'react';
import { LuCopy, LuTrash2, LuUpload } from 'react-icons/lu';
import { type CmsData, type MediaItem } from '@/shared/cms-types';
import { deleteAdminMediaItem, uploadAdminMedia } from '@/client/utilities/api-client';
import { Button, Card, EmptyState, SectionHeading } from '../primitives/ui';
import { SmartImage } from '../primitives/media';

export const MediaPanel = ({
  cms,
  onMediaChange,
}: {
  cms: CmsData;
  onMediaChange: (next: MediaItem[]) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        await uploadAdminMedia(file);
      }
      const response = await fetch('/api/admin/media', { credentials: 'include' });
      if (response.ok) {
        const body = (await response.json()) as { media: MediaItem[] };
        onMediaChange(body.media);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const remove = async (item: MediaItem) => {
    try {
      onMediaChange(await deleteAdminMediaItem(item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete that file.');
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError(`Copy this URL manually: ${url}`);
    }
  };

  return (
    <div className="ee-stack ee-stack-md">
      <div className="ee-row ee-row-between" style={{ gap: 14, flexWrap: 'wrap' }}>
        <SectionHeading
          title="Media library"
          description="Upload PNG, JPG or WEBP images up to 4 MB. Every image field in the admin can pick from here."
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="ee-hidden"
          aria-label="Upload images"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <Button
          icon={<LuUpload size={14} />}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : 'Upload images'}
        </Button>
      </div>

      {error ? <span className="ee-error">{error}</span> : null}

      {cms.media.length === 0 ? (
        <EmptyState>No uploads yet. Your first image will appear here.</EmptyState>
      ) : (
        <div className="ee-grid ee-grid-auto" style={{ gap: 14 }}>
          {cms.media.map((item) => (
            <Card key={item.id} className="ee-full ee-card-flush">
              <div className="ee-card-media" style={{ aspectRatio: '4 / 3' }}>
                <SmartImage src={item.url} alt={item.name} seed={item.id} />
              </div>
              <div className="ee-stack ee-stack-xs" style={{ padding: 12 }}>
                <span className="ee-mono ee-truncate" style={{ fontSize: '0.72rem' }} title={item.url}>
                  {item.url}
                </span>
                <span className="ee-faint" style={{ fontSize: '0.72rem' }}>
                  {Math.max(1, Math.round(item.size / 1024))} KB · {item.mime}
                </span>
                <div className="ee-row ee-row-xs">
                  <Button size="sm" variant="secondary" icon={<LuCopy size={12} />} onClick={() => void copy(item.url)}>
                    Copy URL
                  </Button>
                  <Button size="sm" variant="danger" icon={<LuTrash2 size={12} />} onClick={() => void remove(item)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
