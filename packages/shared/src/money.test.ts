import assert from 'node:assert/strict';
import test from 'node:test';
import {
  lineSubtotal,
  marginPercent,
  markupPercent,
  money,
  quoteTotals,
} from './money';

test('lineSubtotal arredonda por linha', () => {
  assert.equal(lineSubtotal({ quantity: 3, unitPrice: '10.005' }).toString(), '30.02');
});

test('quoteTotals nunca retorna total negativo', () => {
  const totals = quoteTotals({
    lines: [{ quantity: 1, unitPrice: 100 }],
    globalDiscount: 500,
  });
  assert.equal(totals.total.toString(), '0');
});

test('markup e margem são conceitos distintos', () => {
  assert.equal(markupPercent(900, 572).toString(), '57.34');
  assert.equal(marginPercent(900, 572).toString(), '36.44');
});

test('money usa duas casas com meio para cima', () => {
  assert.equal(money('1.005').toString(), '1.01');
  assert.equal(money('1.004').toString(), '1');
});
