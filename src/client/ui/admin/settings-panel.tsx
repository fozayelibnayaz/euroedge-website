import {
  createId,
  type CmsData,
  type MediaItem,
  type OfficeItem,
  type SiteSettings,
  type SocialItem,
} from '@/shared/cms-types';
import { Button, Card, Field, SectionHeading } from '../primitives/ui';
import { ImageField, TextAreaField, TextField, ToggleField } from './fields';

export const SettingsPanel = ({
  cms,
  patch,
  patchOffices,
  patchSocials,
  media,
  onUploaded,
}: {
  cms: CmsData;
  patch: (next: SiteSettings) => void;
  patchOffices: (next: OfficeItem[]) => void;
  patchSocials: (next: SocialItem[]) => void;
  media: MediaItem[];
  onUploaded: (item: MediaItem) => void;
}) => {
  const { settings } = cms;

  return (
    <div className="ee-stack ee-stack-lg">
      <SectionHeading
        title="Site settings"
        description="Branding, contact details, offices and the home hero. Changes publish as soon as you save."
      />

      <Card className="ee-stack ee-stack-sm">
        <span className="ee-label">Brand</span>
        <div className="ee-field-grid">
          <TextField
            label="Organisation name"
            value={settings.brandName}
            onChange={(next) => { patch({ ...settings, brandName: next }); }}
          />
          <TextField
            label="Sub-line"
            value={settings.brandSubline}
            onChange={(next) => { patch({ ...settings, brandSubline: next }); }}
          />
          <TextField
            label="Company registration number"
            value={settings.companyRegistrationNumber}
            onChange={(next) => { patch({ ...settings, companyRegistrationNumber: next }); }}
            hint="Printed in the footer."
          />
        </div>
        <div className="ee-field-grid">
          <ImageField
            label="Logo (light background)"
            value={settings.logoLight}
            media={media}
            onUploaded={onUploaded}
            onChange={(next) => { patch({ ...settings, logoLight: next }); }}
          />
          <ImageField
            label="Logo (dark background)"
            value={settings.logoDark}
            media={media}
            onUploaded={onUploaded}
            onChange={(next) => { patch({ ...settings, logoDark: next }); }}
          />
        </div>
      </Card>

      <Card className="ee-stack ee-stack-sm">
        <span className="ee-label">Announcement bar</span>
        <ToggleField
          label="Show announcement bar on the home hero"
          value={settings.announcementEnabled}
          onChange={(next) => { patch({ ...settings, announcementEnabled: next }); }}
        />
        <TextField
          label="Announcement text"
          value={settings.announcementText}
          onChange={(next) => { patch({ ...settings, announcementText: next }); }}
        />
      </Card>

      <Card className="ee-stack ee-stack-sm">
        <span className="ee-label">Home hero</span>
        <TextField
          label="Eyebrow"
          value={settings.heroBadge}
          onChange={(next) => { patch({ ...settings, heroBadge: next }); }}
        />
        <div className="ee-field-grid">
          <TextField
            label="Headline"
            value={settings.heroTitle}
            onChange={(next) => { patch({ ...settings, heroTitle: next }); }}
          />
          <TextField
            label="Highlighted words"
            value={settings.heroHighlight}
            onChange={(next) => { patch({ ...settings, heroHighlight: next }); }}
          />
        </div>
        <TextAreaField
          label="Supporting paragraph"
          value={settings.heroSubtitle}
          rows={3}
          onChange={(next) => { patch({ ...settings, heroSubtitle: next }); }}
        />
        <ImageField
          label="Hero object image"
          value={settings.heroObjectImage}
          media={media}
          onUploaded={onUploaded}
          onChange={(next) => { patch({ ...settings, heroObjectImage: next }); }}
        />
      </Card>

      <Card className="ee-stack ee-stack-sm">
        <span className="ee-label">Contact</span>
        <div className="ee-field-grid">
          <TextField
            label="Phone"
            value={settings.phone}
            onChange={(next) => { patch({ ...settings, phone: next }); }}
          />
          <TextField
            label="WhatsApp (digits only)"
            value={settings.whatsapp}
            onChange={(next) => { patch({ ...settings, whatsapp: next }); }}
          />
          <TextField
            label="Email"
            value={settings.email}
            onChange={(next) => { patch({ ...settings, email: next }); }}
          />
        </div>
        <div className="ee-field-grid">
          <TextField
            label="Weekday hours"
            value={settings.weekdayHours}
            onChange={(next) => { patch({ ...settings, weekdayHours: next }); }}
          />
          <TextField
            label="Saturday hours"
            value={settings.saturdayHours}
            onChange={(next) => { patch({ ...settings, saturdayHours: next }); }}
          />
          <TextField
            label="Sunday hours"
            value={settings.sundayHours}
            onChange={(next) => { patch({ ...settings, sundayHours: next }); }}
          />
        </div>
      </Card>

      <Card className="ee-stack ee-stack-sm">
        <div className="ee-row ee-row-between">
          <span className="ee-label">Offices</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              patchOffices([
                ...settings.offices,
                {
                  id: createId('office'),
                  label: 'New office',
                  address: 'Full address',
                  mapUrl: '',
                  phone: settings.phone,
                  email: settings.email,
                  hours: '',
                  isPrimary: false,
                },
              ]); 
            }
            }
          >
            + Add office
          </Button>
        </div>
        {settings.offices.map((office, index) => (
          <div key={office.id} className="ee-panel ee-stack ee-stack-sm" style={{ padding: 16 }}>
            <div className="ee-field-grid">
              <TextField
                label="Label"
                value={office.label}
                onChange={(next) => {
                  const nextOffices = [...settings.offices];
                  nextOffices[index] = { ...office, label: next };
                  patchOffices(nextOffices);
                }}
              />
              <TextField
                label="Phone"
                value={office.phone}
                onChange={(next) => {
                  const nextOffices = [...settings.offices];
                  nextOffices[index] = { ...office, phone: next };
                  patchOffices(nextOffices);
                }}
              />
              <TextField
                label="Email"
                value={office.email}
                onChange={(next) => {
                  const nextOffices = [...settings.offices];
                  nextOffices[index] = { ...office, email: next };
                  patchOffices(nextOffices);
                }}
              />
              <TextField
                label="Hours"
                value={office.hours}
                onChange={(next) => {
                  const nextOffices = [...settings.offices];
                  nextOffices[index] = { ...office, hours: next };
                  patchOffices(nextOffices);
                }}
              />
            </div>
            <TextAreaField
              label="Address"
              value={office.address}
              rows={2}
              onChange={(next) => {
                const nextOffices = [...settings.offices];
                nextOffices[index] = { ...office, address: next };
                patchOffices(nextOffices);
              }}
            />
            <TextField
              label="Map link"
              value={office.mapUrl}
              mono
              onChange={(next) => {
                const nextOffices = [...settings.offices];
                nextOffices[index] = { ...office, mapUrl: next };
                patchOffices(nextOffices);
              }}
            />
            <div className="ee-row ee-row-between">
              <ToggleField
                label="Primary office"
                value={office.isPrimary}
                onChange={(next) => {
                  patchOffices(
                    settings.offices.map((entry) => ({
                      ...entry,
                      isPrimary: entry.id === office.id ? next : next ? false : entry.isPrimary,
                    }))
                  ); 
                }
                }
              />
              <Button
                size="sm"
                variant="danger"
                onClick={() => { patchOffices(settings.offices.filter((entry) => entry.id !== office.id)); }}
              >
                Delete office
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <Card className="ee-stack ee-stack-sm">
        <div className="ee-row ee-row-between">
          <span className="ee-label">Social links</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              patchSocials([
                ...settings.socials,
                { id: createId('social'), label: 'New link', href: '', icon: 'facebook' },
              ]); 
            }
            }
          >
            + Add link
          </Button>
        </div>
        {settings.socials.map((social, index) => (
          <div key={social.id} className="ee-row ee-row-xs" style={{ flexWrap: 'nowrap' }}>
            <input
              className="ee-input"
              value={social.label}
              placeholder="Label"
              style={{ maxWidth: 160 }}
              onChange={(event) => {
                const next = [...settings.socials];
                next[index] = { ...social, label: event.target.value };
                patchSocials(next);
              }}
            />
            <select
              className="ee-select"
              value={social.icon}
              style={{ maxWidth: 150 }}
              onChange={(event) => {
                const next = [...settings.socials];
                next[index] = { ...social, icon: event.target.value as SocialItem['icon'] };
                patchSocials(next);
              }}
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="x">X</option>
            </select>
            <input
              className="ee-input"
              value={social.href}
              placeholder="https://"
              onChange={(event) => {
                const next = [...settings.socials];
                next[index] = { ...social, href: event.target.value };
                patchSocials(next);
              }}
            />
            <Button
              size="sm"
              variant="danger"
              onClick={() => { patchSocials(settings.socials.filter((entry) => entry.id !== social.id)); }}
            >
              ✕
            </Button>
          </div>
        ))}
      </Card>

      <Card className="ee-stack ee-stack-sm">
        <span className="ee-label">About copy &amp; footer</span>
        <TextAreaField
          label="Mission"
          value={settings.mission}
          rows={3}
          onChange={(next) => { patch({ ...settings, mission: next }); }}
        />
        <TextAreaField
          label="Vision"
          value={settings.vision}
          rows={3}
          onChange={(next) => { patch({ ...settings, vision: next }); }}
        />
        <TextAreaField
          label="Promise"
          value={settings.promise}
          rows={3}
          onChange={(next) => { patch({ ...settings, promise: next }); }}
        />
        <TextAreaField
          label="Footer note"
          value={settings.footerNote}
          rows={3}
          onChange={(next) => { patch({ ...settings, footerNote: next }); }}
        />
      </Card>
    </div>
  );
};

export const OfficeSummary = ({ offices }: { offices: OfficeItem[] }) => (
  <Field label="Configured offices">
    <div className="ee-stack ee-stack-xs">
      {offices.map((office) => (
        <span key={office.id} className="ee-badge">
          {office.label}: {office.address.slice(0, 48)}
          {office.address.length > 48 ? '…' : ''}
        </span>
      ))}
    </div>
  </Field>
);
