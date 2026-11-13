import { type SyntheticEvent, useEffect, useState } from 'react';
import { LuCheck, LuLoader, LuRefreshCw, LuSend, LuShieldCheck } from 'react-icons/lu';
import { fetchFormChallenge, submitSecuredInquiry } from '@/client/utilities/api-client';
import { Field, TextArea, TextInput, Button } from './ui';

export interface InquiryFormValues {
  subject?: string;
  country?: string;
  program?: string;
}

interface SecuredInquiryFormProps {
  prefill?: InquiryFormValues;
  compact?: boolean;
  onSuccess?: (ticketId: string) => void;
  id?: string;
}

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  countryOfInterest: '',
  programInterest: '',
  preferredIntake: '',
  subject: '',
  message: '',
};

export const SecuredInquiryForm = ({
  prefill,
  compact = false,
  onSuccess,
  id = 'consultation',
}: SecuredInquiryFormProps) => {
  const [values, setValues] = useState({ ...EMPTY, ...prefill });
  const [challenge, setChallenge] = useState<{ question: string; challengeToken: string } | null>(null);
  const [answer, setAnswer] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [startedAt, setStartedAt] = useState<number>(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState('');

  const loadChallenge = async () => {
    try {
      const next = await fetchFormChallenge();
      setChallenge({ question: next.question, challengeToken: next.challengeToken });
    } catch {
      setError('Could not start the security check. Please reload the page.');
    }
  };

  useEffect(() => {
    setStartedAt(Date.now());
    void loadChallenge();
  }, []);

  useEffect(() => {
    if (prefill) {
      setValues((prev) => ({ ...prev, ...prefill }));
    }
  }, [prefill]);

  const set = (key: keyof typeof EMPTY) => (event: { target: { value: string } }) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!challenge) {
      setError('Security check is loading. Please try again in a moment.');
      return;
    }

    setBusy(true);
    try {
      const result = await submitSecuredInquiry({
        ...values,
        countryOfInterest: values.countryOfInterest,
        programInterest: values.programInterest || 'University Admission',
        preferredIntake: values.preferredIntake || 'Upcoming Intake',
        challengeAnswer: answer,
        challengeToken: challenge.challengeToken,
        honeypot,
        formStartedAt: startedAt,
      });
      setTicket(result.ticketId);
      setValues({ ...EMPTY, ...prefill });
      setAnswer('');
      onSuccess?.(result.ticketId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your enquiry.');
      void loadChallenge();
    } finally {
      setBusy(false);
    }
  };

  if (ticket) {
    return (
      <div className="ee-panel ee-stack ee-stack-sm ee-center" style={{ alignItems: 'center' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(15,122,77,0.12)',
            color: 'var(--ee-good)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <LuCheck size={24} />
        </div>
        <h3 className="ee-h3">Enquiry received</h3>
        <p className="ee-body">
          Your reference is <strong className="ee-mono">{ticket}</strong>. An advisor replies within 48
          hours with a written shortlist.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setTicket('');
            void loadChallenge();
          }}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={(event) => void handleSubmit(event)} className="ee-panel ee-stack ee-stack-sm" noValidate>
      <div className="ee-row ee-row-between">
        <h3 className="ee-h3" style={{ margin: 0 }}>
          {compact ? 'Quick enquiry' : 'Send your file'}
        </h3>
        <span className="ee-badge ee-badge-accent">
          <LuShieldCheck size={12} /> Secured
        </span>
      </div>

      <div className="ee-field-grid">
        <TextInput
          id="inq-first"
          label="First name"
          value={values.firstName}
          onChange={set('firstName')}
          required
          autoComplete="given-name"
        />
        <TextInput
          id="inq-last"
          label="Last name"
          value={values.lastName}
          onChange={set('lastName')}
          required
          autoComplete="family-name"
        />
      </div>

      <div className="ee-field-grid">
        <TextInput
          id="inq-email"
          label="Email"
          type="email"
          value={values.email}
          onChange={set('email')}
          required
          autoComplete="email"
        />
        <TextInput
          id="inq-phone"
          label="Phone / WhatsApp"
          value={values.phone}
          onChange={set('phone')}
          required
          autoComplete="tel"
        />
      </div>

      <div className="ee-field-grid">
        <TextInput
          id="inq-country"
          label="Destination of interest"
          value={values.countryOfInterest}
          onChange={set('countryOfInterest')}
          placeholder="United Kingdom"
          required
        />
        <TextInput
          id="inq-intake"
          label="Preferred intake"
          value={values.preferredIntake}
          onChange={set('preferredIntake')}
          placeholder="September 2027"
        />
      </div>

      <TextInput
        id="inq-subject"
        label="Subject"
        value={values.subject}
        onChange={set('subject')}
        placeholder="MSc Data Science — UK assessment"
        required
      />

      <TextArea
        id="inq-message"
        label="Tell us about your profile"
        value={values.message}
        onChange={set('message')}
        placeholder="Current qualification, grades, work experience, budget and target intake."
        required
      />

      <div className="ee-field-grid" style={{ alignItems: 'end' }}>
        <Field label={`Security check: ${challenge?.question ?? '…'} = ?`} htmlFor="inq-challenge">
          <input
            id="inq-challenge"
            className="ee-input"
            value={answer}
            onChange={(event) => { setAnswer(event.target.value); }}
            inputMode="numeric"
            required
          />
        </Field>
        <Button
          variant="ghost"
          size="sm"
          icon={<LuRefreshCw size={13} />}
          onClick={() => void loadChallenge()}
          style={{ marginBottom: 1 }}
        >
          New question
        </Button>
      </div>

      <label className="ee-hp" aria-hidden="true">
        Leave this field empty
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => { setHoneypot(event.target.value); }}
        />
      </label>

      {error ? (
        <span className="ee-error" role="alert">
          {error}
        </span>
      ) : null}

      <Button type="submit" size="lg" disabled={busy} icon={busy ? <LuLoader size={15} /> : <LuSend size={15} />}>
        {busy ? 'Sending…' : 'Send enquiry'}
      </Button>

      <p className="ee-hint" style={{ margin: 0 }}>
        Your details are used only to prepare your assessment. We never sell or share them.
      </p>
    </form>
  );
};
