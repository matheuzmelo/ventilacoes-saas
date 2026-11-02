'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Field, Input, Textarea } from '@vs/ui';
import type { TenantSettingsView } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export function SiteSettingsForm({
  initialSettings,
}: {
  initialSettings: TenantSettingsView | null;
}) {
  const router = useRouter();
  const [siteTitle, setSiteTitle] = useState(initialSettings?.siteTitle ?? '');
  const [siteDescription, setSiteDescription] = useState(
    initialSettings?.siteDescription ?? '',
  );
  const [logoUrl, setLogoUrl] = useState(initialSettings?.logoUrl ?? '');
  const [primaryColor, setPrimaryColor] = useState(
    initialSettings?.primaryColor ?? '#0b6e99',
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initialSettings?.secondaryColor ?? '#f59e0b',
  );
  const [phone, setPhone] = useState(initialSettings?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(initialSettings?.whatsapp ?? '');
  const [contactEmail, setContactEmail] = useState(
    initialSettings?.contactEmail ?? '',
  );
  const [address, setAddress] = useState(initialSettings?.address ?? '');
  const [serviceAreas, setServiceAreas] = useState(
    Array.isArray(initialSettings?.serviceAreas)
      ? (initialSettings.serviceAreas as string[]).join(', ')
      : '',
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    initialSettings?.whatsappMessage ?? '',
  );
  const [instagramUrl, setInstagramUrl] = useState(
    initialSettings?.instagramUrl ?? '',
  );
  const [facebookUrl, setFacebookUrl] = useState(
    initialSettings?.facebookUrl ?? '',
  );
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState(
    initialSettings?.googleBusinessUrl ?? '',
  );
  const [senderName, setSenderName] = useState(
    initialSettings?.senderName ?? '',
  );
  const [replyToEmail, setReplyToEmail] = useState(
    initialSettings?.replyToEmail ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/v1/tenant/settings`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          siteTitle,
          siteDescription,
          logoUrl,
          primaryColor: primaryColor || '#0b6e99',
          secondaryColor: secondaryColor || '#f59e0b',
          phone,
          whatsapp,
          ...(contactEmail.trim() ? { contactEmail: contactEmail.trim() } : {}),
          address,
          serviceAreas: serviceAreas
            .split(',')
            .map((area) => area.trim())
            .filter(Boolean),
          whatsappMessage,
          instagramUrl,
          facebookUrl,
          googleBusinessUrl,
          senderName,
          ...(replyToEmail.trim() ? { replyToEmail: replyToEmail.trim() } : {}),
        }),
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

      if (!response.ok) {
        setError(body?.error?.message ?? 'Não foi possível salvar.');
        return;
      }

      setMessage('Configurações salvas.');
      router.refresh();
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card>
        <h2 className="text-lg font-semibold">Identidade do site</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nome exibido" htmlFor="settings-site-title">
            <Input
              id="settings-site-title"
              value={siteTitle}
              onChange={(event) => setSiteTitle(event.target.value)}
              maxLength={160}
              required
            />
          </Field>
          <Field label="URL do logo" htmlFor="settings-logo">
            <Input
              id="settings-logo"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://..."
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Descrição do site"
              htmlFor="settings-site-description"
            >
              <Textarea
                id="settings-site-description"
                value={siteDescription}
                onChange={(event) => setSiteDescription(event.target.value)}
                maxLength={400}
              />
            </Field>
          </div>
          <Field label="Cor primária" htmlFor="settings-primary">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                aria-label="Selecionar cor primária"
                className="h-10 w-12 cursor-pointer rounded border border-line"
              />
              <Input
                id="settings-primary"
                value={primaryColor}
                onChange={(event) => setPrimaryColor(event.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
              />
            </div>
          </Field>
          <Field label="Cor secundária" htmlFor="settings-secondary">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(event) => setSecondaryColor(event.target.value)}
                aria-label="Selecionar cor secundária"
                className="h-10 w-12 cursor-pointer rounded border border-line"
              />
              <Input
                id="settings-secondary"
                value={secondaryColor}
                onChange={(event) => setSecondaryColor(event.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
              />
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Contato</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" htmlFor="settings-phone">
            <Input
              id="settings-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={40}
            />
          </Field>
          <Field label="WhatsApp" htmlFor="settings-whatsapp">
            <Input
              id="settings-whatsapp"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              maxLength={40}
              placeholder="(11) 99999-9999"
            />
          </Field>
          <Field label="E-mail de contato" htmlFor="settings-email">
            <Input
              id="settings-email"
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
          </Field>
          <Field label="Endereço" htmlFor="settings-address">
            <Input
              id="settings-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={240}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Áreas de atendimento (separadas por vírgula)"
              htmlFor="settings-areas"
            >
              <Input
                id="settings-areas"
                value={serviceAreas}
                onChange={(event) => setServiceAreas(event.target.value)}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Mensagem inicial no WhatsApp"
              htmlFor="settings-whatsapp-message"
            >
              <Textarea
                id="settings-whatsapp-message"
                value={whatsappMessage}
                onChange={(event) => setWhatsappMessage(event.target.value)}
                maxLength={600}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Redes e e-mail</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" htmlFor="settings-instagram">
            <Input
              id="settings-instagram"
              value={instagramUrl}
              onChange={(event) => setInstagramUrl(event.target.value)}
              placeholder="https://instagram.com/..."
            />
          </Field>
          <Field label="Facebook" htmlFor="settings-facebook">
            <Input
              id="settings-facebook"
              value={facebookUrl}
              onChange={(event) => setFacebookUrl(event.target.value)}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field label="Google Business" htmlFor="settings-google">
            <Input
              id="settings-google"
              value={googleBusinessUrl}
              onChange={(event) => setGoogleBusinessUrl(event.target.value)}
              placeholder="https://g.page/..."
            />
          </Field>
          <Field label="Nome do remetente" htmlFor="settings-sender">
            <Input
              id="settings-sender"
              value={senderName}
              onChange={(event) => setSenderName(event.target.value)}
              maxLength={160}
            />
          </Field>
          <Field label="Responder para (e-mail)" htmlFor="settings-reply-to">
            <Input
              id="settings-reply-to"
              type="email"
              value={replyToEmail}
              onChange={(event) => setReplyToEmail(event.target.value)}
            />
          </Field>
        </div>
      </Card>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}

      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </form>
  );
}
