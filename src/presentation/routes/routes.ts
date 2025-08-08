import { ComponentType, LazyExoticComponent, lazy, Fragment } from 'react';

interface RouteConfig {
  path: string;
  element: LazyExoticComponent<ComponentType<any>>;
  layout?: ComponentType<any>;
}

// Lazy load pages
const UnknownPage = lazy(() => import('../pages/Other/UnknownPage'));
const DashboardPage = lazy(() => import('../pages/Dashboard'));
const BookmarkManagerPage = lazy(() => import('../pages/BookmarkManager'));

const publicRoutes: RouteConfig[] = [
  {
    path: "/",
    element: DashboardPage,
    layout: Fragment,
  },
  {
    path: "/bookmark",
    element: BookmarkManagerPage,
    layout: Fragment,
  },
  {
    path: "*",
    element: UnknownPage,
    layout: Fragment,
  },
];

export { publicRoutes };