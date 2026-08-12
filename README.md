# HMIS Frontend

React + TypeScript frontend for the Hospital Management Information System, consuming the Laravel API in `D:\laragon\www\hmis` (Sanctum-authenticated, versioned under `/api/v1`).

See [MODULE_MAP.md](./MODULE_MAP.md) for the full API discovery notes (auth model, permission model, response conventions, module-by-module map, and every API gap/bug found along the way).

## Status

This is a large system (408 API operations across 24 tags) built in phases against the actual Laravel controllers/resources (the Swagger doc under-specifies response shapes, so every module was cross-checked against source before implementation). Implemented:

- **Foundation** — Vite + TypeScript + React 18, routing, React Query, Zustand, Axios client, Ant Design theme, reusable design system, generic server-paginated `DataTable`, generic CRUD page factory.
- **Auth** — login, logout, session bootstrap, change password, multi-role switching, screen-permission-aware navigation.
- **Administration → HR Setup** — 9 master-data resources (currencies, education levels, employment statuses, job categories, job titles, languages, pay grades, skills, work shifts).
- **Patients** — search/list, registration, profile, visit history, referral queue.
- **Clinical workflows** — Vitals, Consultation, Laboratory, Radiology (with file upload/download), Pharmacy (prescribe → pending dispense → FEFO dispense), IPD (wards → admit → transfer → discharge), OT, Blood Bank.
- **Ambulance** — vehicles, drivers, destination hospitals, dispatch → return trips, trip reports.
- **PIM / Attendance / Leave / Payroll** — 14-tab employee profile hub, career events, attendance devices/pull/records, leave types/entitlements/applications, full payroll pipeline (allowances, deductions, tax slabs, bonuses, overtime, arrears, run).
- **Warehouse** — item catalog (categories, sub-categories, brands, units, attributes, locations, items), indent requests (FEFO issue), stock (batches, near-expiry, receive/GRN, donations, return-to-vendor), reports.
- **Procurement** — suppliers, supplier categories, brand preferences, purchase requests → quotations → approval → purchase orders, instruction set.
- **Finance** — chart of accounts, fiscal years, GL posting templates, vouchers (JV/BPV/CPV/BRV/CRV/CN), GRN-to-invoice, 5 financial reports (trial balance, balance sheet, P&L, general journal, ledger summary).
- **Approval** — generic cross-module approval-chain engine: configure a process's ordered role chain, pending-decision queue for the caller's active role, decision history.
- **Clinical Reports** — 10 report views covering all 14 reporting endpoints (registrations, visit wait times, OPD conversion funnel with patient drill-down, diseases, disease burden by ward, mortality, mortality by ward/reason, unplanned readmissions, wound infection).
- **System** — activity log (audit trail) search with request/response detail viewer.
- **Dashboard** — real counts + quick links into every module (no fabricated metrics — see "API gaps" below).

**Known gap — ACL administration UI not built.** The backend exposes a full ACL API (`/acl/roles`, `/acl/modules`, `/acl/screens`, `/acl/role-screens`, `/admin/users`) for managing roles, screen grants, and user accounts, but no dedicated admin screens were built for it in this pass — it fell outside the phase plan actually executed. The frontend consumes a minimal read-only `GET /acl/roles` lookup (used only to populate the approver-role selector on Approval Processes) but has no CRUD UI for roles, screen-permission assignment, or user management. Anyone needing to grant/revoke `screen:<route_key>` access today must do so directly against the API or a future frontend phase.

## Tech stack

React 18 · TypeScript · Vite 5 · React Router 6 · TanStack Query 5 · Zustand 4 · Axios · React Hook Form + Zod · Ant Design 5 · lucide-react · dayjs

## Getting started

```bash
npm install
cp .env.example .env   # adjust VITE_API_BASE_URL if your backend isn't at http://hmis.test
npm run dev
```

The backend must be running (Laragon vhost `hmis.test` by default) and reachable at the URL in `.env`.

### Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the Laravel API, including `/api/v1` (e.g. `http://hmis.test/api/v1`) |

### Scripts

```bash
npm run dev       # start the Vite dev server
npm run build     # type-check (tsc -b) then production build
npm run preview   # preview the production build locally
npm run lint      # ESLint
```

## Architecture

```
src/
├── app/                    # App shell wiring: providers, route guards, router
│   ├── providers/          # QueryClientProvider, AntD ConfigProvider, BrowserRouter
│   ├── guards/             # AuthGuard/GuestGuard (route auth), PermissionGuard (Can/usePermission)
│   └── router.tsx          # Route tree, lazy-loaded per feature
├── api/                    # Axios client + interceptors, React Query client, shared API types
├── components/
│   ├── common/              # PageHeader, PageContainer, StatusBadge, SearchInput, FilterBar, StatCard, DetailCard, SectionCard, ActionMenu, FileUpload
│   ├── feedback/             # EmptyState, ErrorState, LoadingState
│   ├── forms/                 # FieldConfig + GeneratedForm (schema-driven form renderer, always Controller-based — see "RHF + Ant Design" below)
│   ├── layout/                 # AppShell, Header, Sidebar
│   ├── modals/                  # FormModal
│   └── tables/                   # DataTable (generic server-paginated table)
├── lib/
│   ├── crud/                      # createCrudApi / createCrudHooks / CrudResourcePage / createSimpleNameResource / createNameDescriptionResource / InlineSubResourceCrud
│   └── workflow/                   # ReferralQueuePage (shared `/patients/queue` consumer for Consultation/Lab/Radiology/Pharmacy desks)
├── features/                        # One folder per module, each with api/ hooks/ types/ pages/
│   ├── auth/ · dashboard/ · patients/ · settings/
│   ├── administration/hr-setup/<resource>/
│   ├── clinical/{vitals,consultation,laboratory,radiology,pharmacy,ipd,ot,blood-bank}/
│   ├── ambulance/
│   ├── hr/{employees,attendance,leave,payroll}/
│   ├── warehouse/ · procurement/ · finance/
│   ├── approvals/
│   ├── reports/clinical/
│   └── system/
├── stores/                            # Zustand: authStore (session + denied-screens), uiStore (sidebar state)
├── hooks/                              # useDebounce, useConfirm, useFeedback (antd message/modal/notification)
├── constants/nav.ts                     # Data-driven sidebar (module → route → screen key)
├── styles/theme.ts                       # Design tokens + Ant Design theme config
├── types/api.ts                           # PaginatedResponse/CollectionResponse/ListParams/ApiErrorShape
└── utils/errors.ts                         # API error → RHF field-error mapping, user-facing message extraction
```

### API layer

`api/client.ts` is a single Axios instance. A request interceptor attaches the bearer token from `authStore`; a response interceptor normalizes every error into `{status, message, errors?}`, redirects to `/login` on 401, and — since a request can carry a `screenKey` (the `screens.route_key` it maps to) — records a 403 against `authStore.deniedScreens` so the sidebar can hide that item for the rest of the session (see "Permission model").

Response shapes were not fully specified in the Swagger doc, so they were confirmed against the actual Laravel controllers/resources: paginated lists return Laravel's standard `{data, links, meta}`; `per_page=0` returns `{data}` only; validation errors are the standard `422 {message, errors}`; some report endpoints return a plain array or a bespoke aggregate object rather than a resource-wrapped list — each such case is typed explicitly at its call site rather than forced through the generic pagination types.

### Permission model

The backend is fail-closed: every route requires an explicit `screens` grant for the active role (`screen:<route_key>` middleware), and there is **no self-service endpoint** for a user to fetch their own granted screens (documented as an API gap below). The frontend therefore renders navigation optimistically and lets a live 403 mark a screen as denied (`Can`/`usePermission` in `app/guards/PermissionGuard.tsx`), which then hides it from the sidebar. This is UX polish only — the `screen:` middleware on the backend is the actual security boundary.

### CRUD pattern

Dozens of near-identical master-data screens across every module share a small set of implementations rather than each being bespoke:

- `lib/crud/createCrudApi.ts` — factory for the standard list/create/update/delete/delete-bulk Axios calls given a base path and screen key.
- `lib/crud/createCrudHooks.ts` — matching React Query hooks with cache invalidation.
- `lib/crud/CrudResourcePage.tsx` — a full list+create+edit+delete+bulk-delete page driven by a config object (columns, a `FieldConfig[]` schema-driven form, Zod schema, screen key, optional `extraRowActions`).
- `lib/crud/createSimpleNameResource.tsx` / `createNameDescriptionResource.tsx` — one-line helpers for the very common `{name}` and `{name, description}` resource shapes.
- `lib/crud/InlineSubResourceCrud.tsx` — a compact variant for CRUD lists embedded inside a tab (e.g. an employee's emergency contacts).

Adding a new master-data resource is typically a 20–50 line file, not a new implementation. Complex multi-line workflow endpoints (purchase requests, stock receipts, quotations, vouchers) that accept an array of lines follow a deliberate simplification: the create form submits one line at a time (or a small fixed set of lines with add/remove), matching the pattern established by the earliest such screen (`PrescribeMedicinePage`) rather than building a bespoke dynamic-grid editor per endpoint.

### RHF + Ant Design

Ant Design's `Input`/`Select`/etc. do not expose a plain DOM ref compatible with React Hook Form's uncontrolled `register()` — using `register()` directly against an antd input silently reads `undefined` on submit despite the field visually showing typed text. Every form in this app therefore goes through `GeneratedForm`, which wires each field via RHF's `Controller`. Do not add a raw `register()`-based form against an antd input.

## API gaps and backend bugs found

Full detail in [MODULE_MAP.md](./MODULE_MAP.md); summary:

- **No self-service "my granted screens" endpoint.** `/auth/me` returns `roles` but not the active role's screen/permission grants, and the one endpoint that lists a role's screens (`/acl/roles/{role}/screens`) itself requires the `acl.role-screens` screen grant, which ordinary (non-ACL-admin) roles won't hold. Recommended: include the active role's granted `route_key`s (+ permissions) in `/auth/me`. Workaround: optimistic nav + self-healing 403 handling (see "Permission model").
- **No `departments` CRUD/lookup endpoint**, despite `department_id` being required/filterable on numerous PIM, Attendance, Leave, and Procurement endpoints. A `Department` Eloquent model exists server-side but nothing exposes it over HTTP. Workaround: every department field in this build is a raw numeric ID input with inline help text, not a name-lookup `<Select>`.
- **No `company_bank_accounts` lookup endpoint**, despite `PUT /pim/employees/{employee}/bank-details` accepting `company_bank_account_id`. Same raw-ID-input workaround.
- **No dashboard/statistics endpoints.** There is no `/dashboard` or aggregate-stats tag in the API, so the dashboard surfaces only real counts from existing list endpoints (currently: registered patient total) plus navigational quick links — no fabricated metrics.
- **Backend bug: `GET /clinical-reports/registrations` → HTTP 500 on this deployment.** `ClinicalReportService::registrationStatistics()` uses `selectRaw('date(registration_date) as day, ...')`, which is MySQL syntax; this environment runs SQL Server (`sqlsrv`), which rejects `date(...)` outright. Reproduced directly against the API. No other report in the codebase uses raw `date(...)` SQL, so this is isolated to one endpoint. The frontend's Registrations report tab calls the endpoint as documented and correctly surfaces the resulting error via a toast — this is a backend fix (driver-aware SQL, or bucket by day in PHP like every other report already does), not something fixable from the frontend.
- **No ACL administration UI built** (see "Status" above) — the API exists; the frontend screens for it don't yet.

## Verification

- `npm run build` (type-check + production build) passes cleanly.
- `npm run lint` passes with 0 errors (53 warnings, all the same `react-refresh/only-export-components` notice on files that intentionally co-export a page component alongside its `Api`/hooks — a deliberate pattern here, not an issue).
- Every module was spot-checked in a live browser session against the running backend (admin/Admin@123): list pages, create/edit modals, detail/drill-down pages, and multi-tab report pages all render against real API responses; the one genuine backend defect found (above) was confirmed by reproducing it directly against the API, not assumed from a frontend error.
