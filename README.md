# Vortex Creative Labs - Freelance Graphic Designer & Video Editor CRM

Production-ready, full-stack CRM and Client Review Portal tailored specifically for freelance Graphic Designers, 3D Motion Artists, and Video Editors. Built with a high-end creative studio aesthetic, parallax hero sections, and real-time collaboration features.

---

## 🚀 Key Features

### 1. Dual Portal Architecture & Authentication
- **Admin Portal (Studio Director)**:
  - Secure credential login (`admin@studiovortex.com` / `admin123`) with optional 2-Factor Authentication.
  - Complete control over clients, projects, high-res assets, invoices, payments, and studio branding.
- **Client Portal (Client Hub)**:
  - System-generated **Unique Client ID** (e.g., `CL-2026-0042`, `CL-2026-0089`, `CL-2026-0104`).
  - Clients see **only** their own projects, files, invoices, receipts, and direct chat threads.
  - "Forgot password" flow & "change password on first login" self-serve controls.
  - Admin can activate, deactivate, or reset client access anytime.

### 2. File Upload & Interactive Client Review (Core Feature)
- **Image Pin-to-Point Feedback**: Click anywhere on design drafts to leave exact `(x%, y%)` coordinates comments with author badges.
- **Video Player with Frame-Accurate Timestamps**: Pause video playback at any second (e.g. `00:08`, `00:42`) and post timestamped revision requests; clicking any comment marker jumps the video player to that exact frame.
- **Version Control & Side-by-Side Comparison**: Switch between V1, V2, V3 or compare them side-by-side with comparison overlays.
- **Watermarking & Download Lock**: Toggle draft watermarking overlay ("DRAFT PREVIEW • NOT FINAL") and lock high-res downloads until payment is cleared.
- **One-Click Sign-Offs**: "Approve Artwork" (with celebratory feedback) and "Request Changes" workflows logged to audit trail.

### 3. Admin Dashboard & Financial Analytics
- Total Revenue earned (all-time, this month, this year).
- Outstanding pending collections & Overdue invoices highlighted in bold red badges with days overdue countdown.
- Interactive SVG/Canvas charts: Monthly revenue bar chart, Paid vs. Pending donut chart, Top 5 Clients by revenue.
- Pipeline status distribution pills: *Brief Received* → *In Progress* → *Draft Shared* → *Revisions* → *Approved* → *Final Delivered*.
- Upcoming 7-day deadlines widget with countdown indicators.
- Live Studio Activity Feed tracking logins, views, comments, approvals, and payments with exact date/time.

### 4. Client Management & CRM
- Auto-generated Unique Client IDs (`CL-2026-XXXX`).
- Client branding cards with contact info, WhatsApp links, GSTIN, acquisition source, and tags (`VIP`, `Retainer`, `High-Priority`, `One-time`).
- Client profile drawers showcasing linked projects, invoices, payments, total billed, total paid, and balance due.
- Search, filter, status toggles, password reset, and **CSV/Excel export**.

### 5. Work & Project Pipelines
- Kanban board with drag-and-drop / select status transitions across all 6 production stages.
- List view and interactive Calendar view for deadline management.
- Production checklist inside each project with interactive completion toggles.
- Revisions used vs. allowed tracking (e.g., `1/3` revisions).

### 6. Professional Invoices & Quotations
- Auto-numbered invoices (`INV-2026-0105`) and Quotations/Estimates (`EST-2026-XXXX`).
- 1-click conversion from Quotation/Estimate into an official Invoice.
- Dynamic line items (service, description, quantity, rate, amount).
- GST/tax calculation support (18% GST, CGST+SGST, IGST, VAT, or exempt).
- Flat or percentage discounts.
- Professional **client-side and server-side PDF generator** with studio logo, banking details, and authorized signature.
- One-click WhatsApp invoice share links.

### 7. Payments & Financial Ledger
- Record incoming settlements with date, exact time, payment mode (UPI, Bank Transfer, Card, Cash, PayPal, Razorpay), transaction UTR reference, and receipt proof.
- Client-wise outstanding balance breakdown.
- Support for partial advance payments and auto-updating invoice status.
- Auto-generated **Official Payment Receipts (PDF)** with digital transaction stamps.
- Payment reminder simulation trigger.

### 8. Studio Operations & Settings
- Studio branding profile (Name, Logo, Director signature, GSTIN).
- UPI ID & Bank settlement details (HDFC/ICICI IFSC, account numbers).
- Dark / Light mode instant toggle.
- Full JSON database dump export & restore capability.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Styling**: Tailwind CSS with custom glassmorphism, glowing creative accents, and dark studio theme
- **Icons**: Lucide React
- **PDF Generation**: jsPDF + autoTable
- **State & Data Store**: Persistent JSON Database (`data/crm_store.json`) with unified REST API routes

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 🔑 Demo Personas & Credentials

| Role | Name | Identifier | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin Director** | Sourav Roy | `admin@studiovortex.com` | `admin123` | Full studio CRM, invoices, payments, settings |
| **Client 1** | Alex Rivers (Zenith Tech) | `CL-2026-0042` | `zenith2026` | Keynote Launch Video, V2 review, Invoices |
| **Client 2** | Priya Sharma (Lumina Fashion) | `CL-2026-0089` | `lumina2026` | 5x Reels & Lookbook, Video timestamp review |
| **Client 3** | Marcus Vance (Pulse Energy) | `CL-2026-0104` | `pulse2026` | 3D Can Motion reveal, Overdue invoice record |
| **Client 4** | Nathan Drake (Hyperion Esports) | `CL-2026-0112` | `hyperion2026` | Rebranding Kit, Approved files, Paid ledger |

*(You can also use the one-click persona switcher button in the top navigation bar to test any role instantly without re-typing!)*

