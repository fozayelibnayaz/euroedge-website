import { useEffect, useRef, useState } from 'react';
import { LuDownload, LuKeyRound, LuRefreshCw, LuShieldCheck, LuUpload } from 'react-icons/lu';
import {
  fetchAdminAudit,
  fetchAdminAccount,
  updateAdminCredentials,
} from '@/client/utilities/api-client';
import { type AuditLogEntry, type CmsData } from '@/shared/cms-types';
import { Badge, Button, Card, SectionHeading, TextInput } from '../primitives/ui';
import { Toast } from '../primitives/ui';

const CredentialsForm = () => {
  const [current, setCurrent] = useState('');
  const [nextUser, setNextUser] = useState('');
  const [nextPass, setNextPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const submit = async () => {
    setError('');

    if (!current || !nextUser || !nextPass) {
      setError('Fill in your current password, a new username and a new password.');
      return;
    }
    if (nextPass !== confirmPass) {
      setError('The new passwords do not match.');
      return;
    }
    if (nextPass.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (!/[a-z]/.test(nextPass) || !/[A-Z]/.test(nextPass) || !/[0-9]/.test(nextPass)) {
      setError('Include an uppercase letter, a lowercase letter and a number.');
      return;
    }

    setBusy(true);
    try {
      await updateAdminCredentials({
        currentPassword: current,
        newUsername: nextUser,
        newPassword: nextPass,
      });
      setCurrent('');
      setNextUser('');
      setNextPass('');
      setConfirmPass('');
      setToast('Admin credentials updated. Use the new details next time you sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="ee-stack ee-stack-sm">
      <span className="ee-label">Change username &amp; password</span>
      <div className="ee-field-grid">
        <TextInput
          id="sec-current"
          label="Current password"
          type="password"
          value={current}
          onChange={(event) => { setCurrent(event.target.value); }}
          autoComplete="current-password"
        />
        <TextInput
          id="sec-user"
          label="New username"
          value={nextUser}
          onChange={(event) => { setNextUser(event.target.value); }}
          autoComplete="username"
        />
      </div>
      <div className="ee-field-grid">
        <TextInput
          id="sec-pass"
          label="New password"
          type="password"
          value={nextPass}
          onChange={(event) => { setNextPass(event.target.value); }}
          autoComplete="new-password"
          hint="Minimum 8 characters with upper, lower and a number."
        />
        <TextInput
          id="sec-pass2"
          label="Confirm new password"
          type="password"
          value={confirmPass}
          onChange={(event) => { setConfirmPass(event.target.value); }}
          autoComplete="new-password"
        />
      </div>
      {error ? <span className="ee-error">{error}</span> : null}
      <Button onClick={() => void submit()} disabled={busy} icon={<LuKeyRound size={14} />} style={{ alignSelf: 'flex-start' }}>
        {busy ? 'Updating…' : 'Update credentials'}
      </Button>
      {toast ? <Toast message={toast} tone="success" onDone={() => { setToast(''); }} /> : null}
    </Card>
  );
};

const BackupCard = ({ cms, onReset }: { cms: CmsData; onReset: (next: CmsData) => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const download = () => {
    const blob = new Blob([JSON.stringify(cms, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `euroedge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const restore = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setError('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as CmsData;
      if (!parsed.settings || !Array.isArray(parsed.pages)) {
        setError('That file does not look like a EuroEdge backup.');
        return;
      }
      onReset(parsed);
      setToast('Backup restored in the editor. Press Save to publish it.');
    } catch {
      setError('Could not read that backup file.');
    } finally {
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  return (
    <Card className="ee-stack ee-stack-sm">
      <span className="ee-label">Backup &amp; restore</span>
      <p className="ee-body" style={{ margin: 0 }}>
        Download a full JSON snapshot of every setting, page and record. Restoring loads it into the editor —
        nothing goes live until you press Save.
      </p>
      <div className="ee-row ee-row-xs" style={{ flexWrap: 'wrap' }}>
        <Button variant="secondary" icon={<LuDownload size={14} />} onClick={download}>
          Download backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="ee-hidden"
          onChange={(event) => void restore(event.target.files?.[0])}
        />
        <Button variant="secondary" icon={<LuUpload size={14} />} onClick={() => fileRef.current?.click()}>
          Restore from file
        </Button>
      </div>
      {error ? <span className="ee-error">{error}</span> : null}
      {toast ? <Toast message={toast} tone="success" onDone={() => { setToast(''); }} /> : null}
    </Card>
  );
};

const AuditCard = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    void fetchAdminAudit().then(setEntries);
  }, []);

  return (
    <Card className="ee-stack ee-stack-sm">
      <span className="ee-label">Recent account activity</span>
      {entries.length === 0 ? (
        <span className="ee-hint">No activity recorded yet.</span>
      ) : (
        <div className="ee-table-wrap">
          <table className="ee-table" style={{ minWidth: 460 }}>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Account</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 20).map((entry) => (
                <tr key={entry.id}>
                  <td className="ee-mono" style={{ fontSize: '0.78rem' }}>
                    {new Date(entry.at).toLocaleString()}
                  </td>
                  <td>{entry.action.replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="ee-muted">{entry.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export const SecurityPanel = ({
  cms,
  onReset,
  onRestore,
}: {
  cms: CmsData;
  onReset: () => Promise<void>;
  onRestore: (next: CmsData) => void;
}) => {
  const [account, setAccount] = useState<{ email: string; updatedAt: string; mustRotate: boolean } | null>(null);

  useEffect(() => {
    void fetchAdminAccount()
      .then(setAccount)
      .catch(() => { setAccount(null); });
  }, []);

  return (
    <div className="ee-stack ee-stack-md">
      <SectionHeading
        title="Security"
        description="Rotate the admin credentials, keep backups and review account activity."
      />

      <Card className="ee-row ee-row-between" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div className="ee-row ee-row-sm">
          <span className="ee-row" style={{ color: 'var(--ee-good)' }}>
            <LuShieldCheck size={20} />
          </span>
          <div>
            <div style={{ fontWeight: 600 }}>Signed in as {account?.email ?? 'admin'}</div>
            <div className="ee-faint" style={{ fontSize: '0.78rem' }}>
              Passwords are stored as PBKDF2-SHA512 hashes. Sessions expire after 8 hours.
            </div>
          </div>
        </div>
        {account?.mustRotate ? (
          <Badge tone="coral">Still using the shipped password — change it now</Badge>
        ) : (
          <Badge tone="good">Custom credentials in use</Badge>
        )}
      </Card>

      <CredentialsForm />
      <BackupCard cms={cms} onReset={onRestore} />
      <AuditCard />

      <Card className="ee-stack ee-stack-sm">
        <span className="ee-label">Danger zone</span>
        <p className="ee-body" style={{ margin: 0 }}>
          Restore every page, section and record to the original starter content. Your enquiries are kept.
        </p>
        <Button
          variant="danger"
          icon={<LuRefreshCw size={14} />}
          onClick={() => void onReset()}
          style={{ alignSelf: 'flex-start' }}
        >
          Reset content to defaults
        </Button>
      </Card>
    </div>
  );
};
