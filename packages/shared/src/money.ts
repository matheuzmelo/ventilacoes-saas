import Decimal from 'decimal.js';

Decimal.set({ precision: 24, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = Decimal.Value;

export function money(value: MoneyInput): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export interface QuoteLineInput {
  quantity: MoneyInput;
  unitPrice: MoneyInput;
  discount?: MoneyInput;
}

export function lineSubtotal(line: QuoteLineInput): Decimal {
  const quantity = new Decimal(line.quantity);
  const unitPrice = new Decimal(line.unitPrice);
  const discount = new Decimal(line.discount ?? 0);
  return money(quantity.times(unitPrice).minus(discount));
}

export interface QuoteTotalsInput {
  lines: QuoteLineInput[];
  fees?: MoneyInput;
  globalDiscount?: MoneyInput;
}

export interface QuoteTotals {
  subtotal: Decimal;
  total: Decimal;
}

export function quoteTotals(input: QuoteTotalsInput): QuoteTotals {
  const subtotal = input.lines
    .map(lineSubtotal)
    .reduce((acc, value) => acc.plus(value), new Decimal(0));
  const fees = new Decimal(input.fees ?? 0);
  const globalDiscount = new Decimal(input.globalDiscount ?? 0);
  const total = Decimal.max(subtotal.plus(fees).minus(globalDiscount), 0);
  return { subtotal: money(subtotal), total: money(total) };
}

/** Markup = (preço - custo) / custo. Retorna percentual. */
export function markupPercent(price: MoneyInput, cost: MoneyInput): Decimal {
  const c = new Decimal(cost);
  if (c.isZero()) return new Decimal(0);
  return new Decimal(price).minus(c).dividedBy(c).times(100).toDecimalPlaces(2);
}

/** Margem = (preço - custo) / preço. Retorna percentual. */
export function marginPercent(price: MoneyInput, cost: MoneyInput): Decimal {
  const p = new Decimal(price);
  if (p.isZero()) return new Decimal(0);
  return p.minus(cost).dividedBy(p).times(100).toDecimalPlaces(2);
}

export function formatBRL(value: MoneyInput): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(new Decimal(value).toNumber());
}

export { Decimal };
