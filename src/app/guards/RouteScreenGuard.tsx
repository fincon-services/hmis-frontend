import { Outlet, useLocation } from 'react-router-dom';
import { findScreenForPath } from '@/constants/nav';
import { useAuthorization } from './PermissionGuard';
import { UnauthorizedPage } from './UnauthorizedPage';

/**
 * Route-level authorization for the sidebar-reachable surface: resolves the
 * current URL to a nav entry's `screen` route_key and blocks with a
 * polished 403 if that screen is already known-denied this session. This
 * stops "hidden from the sidebar, but still reachable by typing the URL."
 *
 * Reactive: the moment any API call 403s and records the screen as denied
 * (see api/client.ts), this re-renders into the Unauthorized page
 * immediately, without needing to navigate away and back.
 *
 * Routes with no matching nav entry (e.g. a workflow sub-page reached only
 * by row-click, like `/vitals/record/:id`) aren't pre-emptively blocked
 * here — their own data-fetching hooks still carry the correct `screenKey`
 * and degrade to ErrorState's existing 403 handling if genuinely denied.
 */
export function RouteScreenGuard() {
  const location = useLocation();
  const { hasScreen } = useAuthorization();

  const screen = findScreenForPath(location.pathname);
  if (screen && !hasScreen(screen)) {
    return <UnauthorizedPage />;
  }

  return <Outlet />;
}
