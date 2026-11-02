'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Field, Input, Select, Textarea } from '@vs/ui';
import type { ErrorEnvelope, SiteLegalVersion } from '@vs/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const SERVICE_OPTIONS = [
  'Instalação',
  'Manutenção preventiva',
  'Higienização',
  'Projeto ou infraestrutura',
  'Reparo',
  'Outro',
];

export function QuoteForm({ privacy }: { privacy: SiteLegalVersion | null }) {
  const router = useRouter();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [serviceType, setServiceType] = useState(SERVICE_OPTIONS[0]);
  const [equipmentCount, setEquipmentCount] = useState('1');
  const [btu, setBtu] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!consent) {
      setError('É necessário aceitar a política de privacidade.');
      return;
    }

    setLoading(true);
    try {
      const utm = utmFromLocation();
      const response = await fetch(`${API_URL}/public/v1/leads`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          name,
          whatsapp,
          ...(email.trim() ? { email: email.trim() } : {}),
          city,
          ...(neighborhood.trim() ? { neighborhood: neighborhood.trim() } : {}),
          serviceType,
          equipmentCount: Number(equipmentCount),
          ...(btu.trim() ? { btu: Number(btu) } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
          consent,
          ...(website ? { website } : {}),
          ...(Object.keys(utm).length > 0 ? { utm } : {}),
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | { protocol?: string; error?: ErrorEnvelope['error'] }
        | null;

      if (!response.ok || !body?.protocol) {
        setError(
          body?.error?.message ??
            'Não foi possível enviar a solicitação. Tente novamente.',
        );
        return;
      }

      router.push(`/obrigado?protocol=${encodeURIComponent(body.protocol)}`);
    } catch {
      setError('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="lead-name">
          <Input
            id="lead-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            minLength={2}
            maxLength={120}
            required
          />
        </Field>
        <Field label="WhatsApp" htmlFor="lead-whatsapp">
          <Input
            id="lead-whatsapp"
            name="whatsapp"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            required
          />
        </Field>
        <Field label="E-mail (opcional)" htmlFor="lead-email">
          <Input
            id="lead-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Cidade" htmlFor="lead-city">
          <Input
            id="lead-city"
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            autoComplete="address-level2"
            required
          />
        </Field>
        <Field label="Bairro (opcional)" htmlFor="lead-neighborhood">
          <Input
            id="lead-neighborhood"
            name="neighborhood"
            value={neighborhood}
            onChange={(event) => setNeighborhood(event.target.value)}
            autoComplete="address-level3"
          />
        </Field>
        <Field label="Tipo de serviço" htmlFor="lead-service">
          <Select
            id="lead-service"
            name="serviceType"
            value={serviceType}
            onChange={(event) => setServiceType(event.target.value)}
          >
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Quantidade de equipamentos" htmlFor="lead-count">
          <Input
            id="lead-count"
            name="equipmentCount"
            type="number"
            min={1}
            max={50}
            value={equipmentCount}
            onChange={(event) => setEquipmentCount(event.target.value)}
            required
          />
        </Field>
        <Field label="BTU (opcional)" htmlFor="lead-btu">
          <Input
            id="lead-btu"
            name="btu"
            type="number"
            min={1000}
            max={120000}
            step={500}
            value={btu}
            onChange={(event) => setBtu(event.target.value)}
            placeholder="Ex.: 12000"
          />
        </Field>
      </div>

      <Field label="Observações (opcional)" htmlFor="lead-notes">
        <Textarea
          id="lead-notes"
          name="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={2000}
          placeholder="Conte sobre o ambiente, andar, infraestrutura etc."
        />
      </Field>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="lead-website">Website</label>
        <input
          id="lead-website"
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 h-4 w-4"
          required
        />
        <span>
          Li e aceito a{' '}
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            Política de Privacidade
          </a>
          {privacy ? ` (versão ${privacy.version})` : ''} e autorizo o contato
          pelo WhatsApp informado.
        </span>
      </label>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Button type="submit" disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar solicitação'}
      </Button>
    </form>
  );
}

function utmFromLocation(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const params = new URLSearchParams(window.location.search);
  const keys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ];
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value) {
      result[key] = value;
    }
  }
  return result;
}
