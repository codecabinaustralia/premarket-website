/**
 * Role helpers shared across buyer + agent dashboards.
 * Keeping the logic in one place so every redirect uses the same rules.
 */

export function isBuyer(u) {
  return !!(u?.isBuyer || u?.roles?.includes('buyer'));
}

export function isAgent(u) {
  return !!(u?.agent || u?.isAgent || u?.roles?.includes('agent'));
}

export function isBuyerOnly(u) {
  return isBuyer(u) && !isAgent(u);
}

export function defaultDashboardFor(u) {
  return isBuyerOnly(u) ? '/buyer-dashboard' : '/dashboard';
}
