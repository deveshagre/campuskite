# CampusKite 🪁
**Group Expense Sharing and Debt Settlement Platform for College Students & Flatmates**

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Design System](https://img.shields.io/badge/Design_System-Neobrutalism-yellow.svg)]()
[![Vitest](https://img.shields.io/badge/Tests-93%20Passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)]()

---

> **IMPORTANT ARCHITECTURAL NOTICE**  
> CampusKite is a **frontend-only, browser-local multi-account demonstration platform**. All financial databases, account credentials, receipt blobs, and audit trails reside locally in browser-managed persistent storage (**IndexedDB** and **LocalStorage**). No external backend server, Node.js API, or cloud database is required. This architecture allows fully functional, zero-latency local demonstrations and unit testing while maintaining strict separation of concerns for easy future backend integration.

---

## 1. Project Introduction

**CampusKite** is a modern, high-contrast fintech web application crafted specifically for college students, flatmates, and travel groups who split everyday shared expenses. Inspired by Splitwise but built with a distinct college-centric identity and an uncompromising **Neobrutalist design language**, CampusKite eliminates awkward money conversations and mathematical disputes over rent, groceries, late-night dinners, and road trips.

Every button, calculation, form, modal, filter, and debt settlement algorithm in CampusKite is completely functional without mock placeholders.

---

## 2. Problem Statement

Living together in student apartments and dorms involves continuous micro-transactions: one roommate pays the electricity bill, another buys groceries, a third covers Wi-Fi, and a fourth pays for takeout. Standard solutions suffer from several issues:
1. **The Rounding Leak**: Splitting amounts with repeating decimals (e.g. ₹100 split 3 ways) often leads to fractions of cents or paise being lost or arbitrarily rounded.
2. **Transaction Bloat**: In a 5-person group where everyone pays for various items, settling debts directly requires dozens of pairwise peer-to-peer payments.
3. **Payer Exclusion Misconceptions**: Many apps assume the person paying the bill is always a consumer of the expense (e.g., buying a specific birthday gift or medicine for someone else).
4. **Complex Setup**: Requiring production OAuth or cloud accounts creates barriers for quick local demos and classroom presentations.

---

## 3. Objectives

- **Mathematical Precision**: Store and process all financial amounts as **integer paise** (1 Rupee = 100 paise) to guarantee that the sum of member splits always strictly reconciles to zero with zero loss of currency.
- **Transaction Minimization**: Employ a greedy graph debt-simplification algorithm that reduces pairwise settlement transactions to the minimum possible number.
- **Deterministic Remainder Allocation**: Fairly distribute leftover paise (e.g. ₹100 / 3 = 33.34, 33.33, 33.33).
- **Distinctive Visual Identity**: Present an authentic Neobrutalist design with bold black outlines, hard offset drop shadows, asymmetric color blocks, and strong editorial typography (**Space Grotesk** + **Inter**).
- **Comprehensive Local Multi-Account Experience**: Support multi-user registration, secure PBKDF2 password hashing in the browser, session switching, demo dataset population, and full JSON data backup/restore.

---

## 4. Key Features

### 👤 Local Multi-Account Authentication
- Client-side registration with full validation and duplicate email prevention.
- Cryptographic password hashing using browser **SubtleCrypto PBKDF2** (100,000 iterations, SHA-256, 16-byte random salt).
- Persistent sessions across page reloads and browser restarts.
- Profile display name updates and secure local password change with old password verification.

### 👥 Group Management & Access Control
- Create groups with custom descriptions and vibrant theme color accents.
- Auto-enrollment of group creator.
- Add members by registered account email address with instant validation.
- Real-time member balance calculation.
- Safety enforcement: prevention of member deletion or group removal if outstanding balances remain.

### 💸 Complete Expense Management
- Record shared expenses across 6 fixed categories:
  - 🍕 **Food**
  - 🛒 **Groceries**
  - 🏠 **Rent**
  - ⚡ **Utilities**
  - ✈️ **Travel**
  - 📦 **Other**
- Multi-payer selection (any group member can be marked as the payer).
- Flexible participant selection: payer can be included in or excluded from consumption.
- Category filtering, real-time search, date range filtering, and newest-first sorting.
- Creator authorization: only the original payer can delete an expense.

### ➗ Equal & Custom Expense Splitting
- **Equal Splitting**: Automatic division with deterministic remainder allocation to prevent losing single paise.
- **Custom Splitting**: Individual manual amounts with real-time discrepancy checking against total amount before submission.

### 🧾 Receipt Uploads
- Direct attachment of receipt image files (PNG, JPEG, WebP up to 2MB).
- Binary blob persistence in IndexedDB with local object URL rendering.
- Full receipt inspection in expense detail modal.

### 🤝 Debt Calculation & Greedy Settlement Minimization
- Independent calculation engine deriving exact creditor and debtor balances.
- Greedy debt minimization matching largest debtors with largest creditors.
- Interactive settlement workflow: authenticated user can record payments where they are the payer.
- Reversal/cancellation workflow for erroneous settlement records with audit logging.

### 📊 Monthly Analytics & Visual Reports
- Interactive monthly spending trends using **Recharts**.
- Category breakdown pie chart and percentage share bars.
- Filterable by month, year, and specific group or all groups.
- Real calculation of monthly total, expense count, top spending category, and average expense.

### ⚙️ Demo Data & Portability
- Built-in one-click realistic Demo Data generator (Alice, Bob, Charlie, Diana; 3 groups, 15+ expenses, active settlements).
- Full JSON export of all database stores.
- Validated JSON import with overwrite warnings.
- One-click factory reset to clear all browser-stored data.

---

## 5. Technology Stack

| Layer | Technology |
|---|---|
| **Core Framework** | React 19, Vite 6, JavaScript (ES2022) |
| **Routing** | React Router DOM v7 |
| **Storage Engine** | IndexedDB (via `idb` wrapper) + LocalStorage (sessions) |
| **Icons & Charts** | Lucide React, Recharts |
| **Typography** | Space Grotesk (Headings), Inter (Body) |
| **Styling** | Vanilla CSS3, CSS Custom Properties (Design Tokens), Responsive Grid/Flexbox |
| **Testing Harness** | Vitest, JSDOM, Testing Library (React & DOM) |

---

## 6. Project Architecture

```
campuskite/
├── public/
│   ├── favicon.svg             # Stylized geometric yellow kite icon
├── src/
│   ├── assets/                 # Brand assets
│   ├── components/
│   │   ├── common/             # Reusable UI primitives
│   │   │   ├── Button.jsx      # Neobrutalist buttons (primary, secondary, danger, mint)
│   │   │   ├── Input.jsx       # Bordered input fields with labels & error states
│   │   │   ├── Modal.jsx       # Keyboard-accessible dialog with backdrop lock
│   │   │   ├── ConfirmDialog.jsx # Danger confirmation modals
│   │   │   ├── Toast.jsx       # Non-intrusive alert notification provider
│   │   │   ├── Badge.jsx       # Category and status indicator badges
│   │   │   ├── EmptyState.jsx  # Contextual empty screens with CTAs
│   │   │   └── Loader.jsx      # Hard-bordered spinner loaders
│   │   ├── layout/             # Shell architecture
│   │   │   ├── AppLayout.jsx   # Topbar + Sidebar + Main view
│   │   │   ├── Sidebar.jsx     # Desktop navigation with active route highlights
│   │   │   ├── Topbar.jsx      # Breadcrumb & quick actions bar
│   │   │   └── MobileNavigation.jsx # Touch-friendly bottom tab bar
│   │   ├── dashboard/          # Metric summary cards & recent activities
│   │   │   ├── BalanceCard.jsx # Asymmetric color-coded balance indicators
│   │   │   ├── RecentActivity.jsx # Feed of recent group expenditures
│   │   │   └── GroupOverview.jsx # Quick stats per group
│   │   ├── groups/             # Group management
│   │   │   ├── GroupCard.jsx   # Interactive group tiles
│   │   │   ├── CreateGroupModal.jsx # Group creation dialog
│   │   │   ├── AddMemberModal.jsx # Email-based member invite modal
│   │   │   └── MemberList.jsx  # Member roster with individual net balances
│   │   ├── expenses/           # Financial logging
│   │   │   ├── ExpenseList.jsx # Filterable, searchable expense feed
│   │   │   ├── ExpenseRow.jsx  # Expandable expense row
│   │   │   ├── AddExpenseModal.jsx # Dual-mode split expense authoring
│   │   │   ├── ExpenseDetailsModal.jsx # Detailed view with receipt inspection
│   │   │   ├── ReceiptUploader.jsx # Drag-and-drop 2MB image uploader
│   │   │   └── SplitPreview.jsx # Real-time mathematical split reconciliation
│   │   ├── settlements/        # Debt resolution
│   │   │   ├── BalanceList.jsx # Who owes whom balance breakdown
│   │   │   ├── SettlementSuggestions.jsx # Minimized settlement transaction cards
│   │   │   └── SettlementHistory.jsx # Completed & reversed transaction audit logs
│   │   └── reports/            # Data visualization
│   │       ├── SpendingChart.jsx # Monthly expense trend bar chart
│   │       ├── CategoryBreakdown.jsx # Donut category distribution chart
│   │       └── MonthlySummary.jsx # Key spending metrics overview
│   ├── pages/                  # Top-level view routes
│   │   ├── Login.jsx           # Local login page
│   │   ├── Register.jsx        # User registration with password hashing
│   │   ├── Dashboard.jsx       # Main financial overview
│   │   ├── Groups.jsx          # User groups directory
│   │   ├── GroupDetails.jsx    # Tabbed group workspace (Expenses, Members, Balances)
│   │   ├── Settlements.jsx     # Global debt settlement hub
│   │   ├── Reports.jsx         # Monthly analytical spending reports
│   │   ├── Settings.jsx        # User profile, password, demo data, JSON import/export
│   │   └── NotFound.jsx        # Neobrutalist 404 page
│   ├── context/
│   │   ├── AuthContext.jsx     # Current authenticated user state & methods
│   │   └── AppContext.jsx      # Reactive group & expense cache synchronizer
│   ├── services/               # Pure business & storage logic (No UI dependencies)
│   │   ├── database.js         # IndexedDB store schema initialization & raw CRUD
│   │   ├── storageService.js   # High-level database abstraction & data export/import
│   │   ├── authService.js      # PBKDF2 cryptography & session management
│   │   ├── groupService.js     # Group CRUD & member association
│   │   ├── expenseService.js   # Expense authoring & split allocation
│   │   ├── settlementService.js# Settlement recording & cancellation audits
│   │   ├── reportService.js    # Monthly aggregations & category summing
│   │   └── demoDataService.js  # Realistic 4-user, 3-group mock dataset generator
│   ├── hooks/
│   │   ├── useAuth.js          # Authentication hook
│   │   ├── useGroups.js        # Group operation abstractions
│   │   └── useExpenses.js      # Expense query & mutation hooks
│   ├── utils/
│   │   ├── calculations.js     # Pure balance calculations & greedy minimization
│   │   ├── currency.js         # Indian Rupee (₹) formatting & integer paise converters
│   │   ├── validation.js       # Form & file constraint validators
│   │   └── date.js             # Timezone-safe date formatters
│   ├── styles/
│   │   ├── tokens.css          # Neobrutalist design variables (colors, borders, shadows)
│   │   ├── global.css          # CSS reset, font imports, typography rules
│   │   ├── components.css      # Reusable neobrutalist class styles
│   │   └── responsive.css      # Responsive media query adaptations
│   ├── App.jsx                 # Routing configuration & protected route wrappers
│   └── main.jsx                # Application root mounting
├── tests/                      # Automated Vitest test suites (93 passing tests)
│   ├── setup.js                # Jest-DOM matchers setup
│   ├── styles.test.js          # Design system token validation
│   ├── utils.test.js           # Math, currency, validation & minimization algorithms
│   ├── services.test.js        # Complete database, auth, and CRUD integration
│   ├── layout_and_auth.test.jsx# Layout, navigation & auth component tests
│   ├── groups.test.jsx         # Group & membership management tests
│   ├── expenses.test.jsx       # Split math, validation, and receipt tests
│   ├── settlements.test.jsx    # Settlement suggestions & confirmation tests
│   ├── reports.test.jsx        # Chart rendering & aggregation tests
│   └── settings.test.jsx       # Settings, password change & export/import tests
├── package.json
└── vite.config.js
```

---

## 7. Design System — Neobrutalism

CampusKite adheres strictly to a high-contrast **Neobrutalist** visual philosophy:

### 🎨 Color Palette
- **Canvas Background**: `#F5F0E8` (warm cream)
- **Surface**: `#FFFFFF`
- **Primary Yellow**: `#FFDE59` (dominant brand accent)
- **Mint Green**: `#B8E0D2` (positive balances / credits)
- **Coral**: `#FF8066` (debts / negative balances / destructive actions)
- **Dark Text / Borders**: `#171717`
- **Muted Text**: `#77736B`
- **Success**: `#4D9868`
- **Danger**: `#D85D52`

### 📐 Geometry & Borders
- **Standard Borders**: `2px solid #171717`
- **Prominent Outlines**: `3px solid #171717`
- **Border Radius**: Sharp, restrained values (`0px` to `8px`).

### 🌑 Shadow System
- **Standard Shadows**: `5px 5px 0px #171717`
- **Large Panels & Modals**: `7px 7px 0px #171717`
- **Button Interactions**: On hover, buttons translate `2px 2px` toward the shadow with reduced offset (`3px 3px 0px`), creating a tactile click sensation.

---

## 8. Financial Calculation Engine & Debt Minimization

### 1. Integer Paise Standard
Computers represent IEEE-754 floating-point numbers with precision limits (e.g., `0.1 + 0.2 === 0.30000000000000004`). In CampusKite:
- **All monetary calculations and database amounts are strictly stored as integer paise** (e.g., ₹100.00 is stored as `10000`).
- Conversions to Rupees are only performed when formatting values for display.

### 2. Equal Split Remainder Allocation
When an amount cannot be evenly divided among $N$ participants, the remainder is distributed 1 paisa each to the first $R$ members:
$$\text{base} = \lfloor \text{totalPaise} / N \rfloor, \quad \text{remainder} = \text{totalPaise} \pmod N$$
$$\text{amount}_i = \begin{cases} \text{base} + 1 & \text{if } i < \text{remainder} \\ \text{base} & \text{otherwise} \end{cases}$$
*Example: Splitting ₹100 (10000 paise) among 3 people yields 3334 paise, 3333 paise, and 3333 paise ($\sum = 10000$).*

### 3. Net Balance Invariant
For each user in a group:
$$\text{Balance} = (\sum \text{Expenses Paid}) - (\sum \text{Split Shares Owed}) + (\sum \text{Settlements Received}) - (\sum \text{Settlements Sent})$$
Because all expenses are fully allocated among group members:
$$\sum_{u \in \text{Members}} \text{Balance}(u) = 0$$

### 4. Greedy Debt Minimization Algorithm
To reduce the number of individual bank transactions required to resolve debts across a group:
1. Identify all members with positive balances (**creditors**) and negative balances (**debtors**). Members with zero balance are ignored.
2. Sort creditors descending by credit amount, and debtors descending by debt magnitude.
3. Greedily match the largest debtor with the largest creditor.
4. Transfer:
   $$\text{TransferAmount} = \min(\text{debtor.amount}, \text{creditor.amount})$$
5. Deduct $\text{TransferAmount}$ from both. Remove either party once their remaining balance reaches zero.
6. Repeat until all balances reconcile to zero.

*Example:*
- **Debtors**: Alice owes ₹500, Bob owes ₹300.
- **Creditor**: Charlie is owed ₹800.
- **Result**: Alice pays Charlie ₹500; Bob pays Charlie ₹300. (Total transactions: 2, rather than chaotic pairwise splits).

---

## 9. Installation & Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or later
- npm v9.0.0 or later

### Setup Instructions
1. Clone or navigate to the repository directory:
   ```bash
   cd campuskite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 10. Exploring with Demo Data

To instantly experience CampusKite with pre-populated multi-user interactions:
1. Navigate to **Settings** (`/settings`) from the sidebar.
2. In the **Demo Data** section, click **"Load Demo Data"**.
3. Confirm the dialog. This automatically provisions:
   - **4 Sample Accounts** (Password for all: `demo123`):
     - `alice@campus.edu` (Alice Johnson)
     - `bob@campus.edu` (Bob Smith)
     - `charlie@campus.edu` (Charlie Brown)
     - `diana@campus.edu` (Diana Ross)
   - **3 Groups**: *Apartment 4B*, *Road Trip Squad*, *Study Group*.
   - **15+ Realistic Expenses** across Food, Utilities, Rent, Travel, and Groceries.
   - **4 Active/Cancelled Settlement Records**.
4. Log out and log in as any of the users above to view their perspectives, debts, and settlement suggestions!

---

## 11. Automated Testing

CampusKite includes an extensive automated test suite run via **Vitest** covering all calculation logic, cryptographic operations, database CRUD, and UI components.

To execute all unit and integration tests:
```bash
npm test
```

To run a production build verification:
```bash
npm run build
```

---

## 12. Current Limitations

- **Single-Browser Multi-Account Scope**: Because data is stored in the browser's IndexedDB, accounts and expenses are private to the local browser installation. Two different physical devices cannot currently synchronize data in real-time.
- **Client-Side Hashing Security**: While passwords are hashed with 100,000 rounds of PBKDF2 + SHA-256 before writing to IndexedDB, true zero-trust security requires an external authentication server.
- **Single Receipt Per Expense**: The current schema supports attaching one high-resolution receipt image (up to 2MB) per expense item.

---

## 13. Future Scope

1. **Cloud Backend Synchronizer**: Connect an optional Node.js/PostgreSQL backend with WebSocket sync for real-time collaborative updates across roommates' devices.
2. **UPI & Payment Gateway Deep Links**: Generate instant UPI QR codes or deep-links (Google Pay, PhonePe, Paytm) prefilled with the calculated settlement amount and receiver's VPA.
3. **Multi-Currency Support**: Add real-time exchange rate conversions for international study-abroad groups and vacation trips.
4. **OCR Receipt Parsing**: Integrate client-side receipt text recognition to automatically extract totals and line items from uploaded receipt photos.

---

## License

This project is licensed under the MIT License.
