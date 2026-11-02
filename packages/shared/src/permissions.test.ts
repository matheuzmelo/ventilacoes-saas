import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PERMISSIONS,
  hasPermission,
  permissionsForRole,
} from './permissions';

test('admin recebe todas as permissões', () => {
  const granted = permissionsForRole('ADMIN');
  assert.ok(granted.includes(PERMISSIONS.QUOTES_COST_READ));
  assert.ok(granted.includes(PERMISSIONS.CHARGES_MANAGE));
});

test('instalador não recebe custo, margem ou cobrança', () => {
  const granted = permissionsForRole('INSTALLER');
  assert.equal(granted.includes(PERMISSIONS.QUOTES_COST_READ), false);
  assert.equal(granted.includes(PERMISSIONS.QUOTES_MARGIN_READ), false);
  assert.equal(granted.includes(PERMISSIONS.CHARGES_MANAGE), false);
  assert.ok(granted.includes(PERMISSIONS.WORK_ORDERS_EXECUTE));
});

test('hasPermission exige todas as permissões pedidas', () => {
  const granted = permissionsForRole('ADMIN');
  assert.equal(
    hasPermission(granted, [
      PERMISSIONS.LEADS_READ,
      PERMISSIONS.QUOTES_WRITE,
    ]),
    true,
  );
  assert.equal(
    hasPermission(permissionsForRole('INSTALLER'), PERMISSIONS.LEADS_READ),
    false,
  );
});
