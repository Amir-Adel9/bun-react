import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  Link,
  RouterProvider,
} from "@tanstack/react-router";

// Import pages
import { AdminLayout } from "./pages/admin/Layout";
import { Dashboard } from "./pages/admin/Dashboard";
import { CategoriesPage } from "./pages/admin/Categories";
import { ContentPage } from "./pages/admin/Content";
import { ContentEditorPage } from "./pages/admin/ContentEditor";
import { HomePage } from "./pages/Home";

// Root layout
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Home route
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

// Admin layout route
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});

// Admin dashboard
const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  component: Dashboard,
});

// Admin categories
const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/categories",
  component: CategoriesPage,
});

// Admin content list
const adminContentRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/content",
  component: ContentPage,
});

// Admin content editor
const adminContentEditorRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/content/$contentId",
  component: ContentEditorPage,
});

// Build the route tree
const routeTree = rootRoute.addChildren([
  homeRoute,
  adminLayoutRoute.addChildren([
    adminDashboardRoute,
    adminCategoriesRoute,
    adminContentRoute,
    adminContentEditorRoute,
  ]),
]);

// Create the router
export const router = createRouter({ routeTree });

// Register the router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Router component
export function AppRouter() {
  return <RouterProvider router={router} />;
}
