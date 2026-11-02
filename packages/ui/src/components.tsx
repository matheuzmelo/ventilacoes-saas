import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`vs-btn vs-btn--${variant} ${className}`.trim()}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: PropsWithChildren<{ label: string; htmlFor: string; error?: string }>) {
  return (
    <div className="vs-field">
      <label className="vs-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="vs-field__error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function Input({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`vs-input ${className}`.trim()} {...props} />;
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`vs-input vs-textarea ${className}`.trim()} {...props} />;
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`vs-input vs-select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function Card({
  className = '',
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`vs-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

export function Badge({
  tone = 'neutral',
  children,
}: PropsWithChildren<{ tone?: BadgeTone }>) {
  return <span className={`vs-badge vs-badge--${tone}`}>{children}</span>;
}

type AlertTone = 'info' | 'success' | 'danger';

export function Alert({
  tone = 'info',
  children,
}: PropsWithChildren<{ tone?: AlertTone }>) {
  return (
    <div className={`vs-alert vs-alert--${tone}`} role="status">
      {children}
    </div>
  );
}

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>
        {description ? (
          <p
            style={{
              margin: '4px 0 0',
              color: 'var(--vs-color-text-muted, #52606d)',
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
