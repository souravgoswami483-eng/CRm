const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log('🧪 RUNNING MOBILE OPTIMIZATION & CLIENT VIEW REMOVAL CHECKS');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function check(desc, condition) {
  if (condition) {
    console.log(`✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${desc}`);
    failed++;
  }
}

// 1. Verify "Client Portal View" removal from AdminSidebar
const adminSidebarPath = path.join(__dirname, '..', 'components', 'layout', 'AdminSidebar.tsx');
const adminSidebarContent = fs.readFileSync(adminSidebarPath, 'utf8');

check(
  'AdminSidebar does not contain "Client Portal View"',
  !adminSidebarContent.includes('Client Portal View')
);

check(
  'AdminSidebar does not contain "/portal" navigation link',
  !adminSidebarContent.includes('href="/portal"')
);

check(
  'AdminSidebar has responsive "hidden lg:flex" class',
  adminSidebarContent.includes('hidden lg:flex')
);

// 2. Verify ClientSidebar responsive class
const clientSidebarPath = path.join(__dirname, '..', 'components', 'layout', 'ClientSidebar.tsx');
const clientSidebarContent = fs.readFileSync(clientSidebarPath, 'utf8');

check(
  'ClientSidebar has responsive "hidden lg:flex" class',
  clientSidebarContent.includes('hidden lg:flex')
);

// 3. Verify Navbar mobile drawer & hamburger implementation
const navbarPath = path.join(__dirname, '..', 'components', 'layout', 'Navbar.tsx');
const navbarContent = fs.readFileSync(navbarPath, 'utf8');

check(
  'Navbar contains mobile hamburger menu button with lg:hidden',
  navbarContent.includes('lg:hidden') && navbarContent.includes('Menu')
);

check(
  'Navbar contains mobile slide-out drawer state (mobileMenuOpen)',
  navbarContent.includes('mobileMenuOpen') && navbarContent.includes('setMobileMenuOpen')
);

check(
  'Navbar mobile drawer includes close button with X icon',
  navbarContent.includes('<X className="h-4 w-4" />') || navbarContent.includes('aria-label="Close navigation menu"')
);

check(
  'Navbar mobile drawer does NOT include "Client Portal View" for Admin',
  !navbarContent.includes('Client Portal View')
);

check(
  'Navbar mobile drawer contains all 9 Admin navigation items',
  navbarContent.includes('/admin/clients') &&
  navbarContent.includes('/admin/projects') &&
  navbarContent.includes('/admin/files') &&
  navbarContent.includes('/admin/invoices') &&
  navbarContent.includes('/admin/payments') &&
  navbarContent.includes('/admin/messages') &&
  navbarContent.includes('/admin/activity') &&
  navbarContent.includes('/admin/settings')
);

check(
  'Navbar mobile drawer contains all 6 Client navigation items',
  navbarContent.includes('/portal/projects') &&
  navbarContent.includes('/portal/files') &&
  navbarContent.includes('/portal/invoices') &&
  navbarContent.includes('/portal/messages') &&
  navbarContent.includes('/portal/profile')
);

check(
  'Navbar mobile drawer locks body scroll when open',
  navbarContent.includes('document.body.style.overflow')
);

check(
  'Navbar mobile drawer auto-closes on route change (pathname)',
  navbarContent.includes('setMobileMenuOpen(false)') && navbarContent.includes('pathname')
);

// 4. Verify Admin and Portal layout containers have min-w-0 for mobile responsiveness
const adminLayoutPath = path.join(__dirname, '..', 'app', 'admin', 'layout.tsx');
const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');

check(
  'AdminLayout main content container has "min-w-0" for mobile flex shrinking',
  adminLayoutContent.includes('min-w-0')
);

const portalLayoutPath = path.join(__dirname, '..', 'app', 'portal', 'layout.tsx');
const portalLayoutContent = fs.readFileSync(portalLayoutPath, 'utf8');

check(
  'ClientPortalLayout main content container has "min-w-0" for mobile flex shrinking',
  portalLayoutContent.includes('min-w-0')
);

// 5. Verify wide tables have overflow-x-auto for smooth mobile horizontal scrolling
const paymentsPagePath = path.join(__dirname, '..', 'app', 'admin', 'payments', 'page.tsx');
const paymentsPageContent = fs.readFileSync(paymentsPagePath, 'utf8');

check(
  'Admin Payments table has overflow-x-auto with min-w',
  paymentsPageContent.includes('overflow-x-auto') && paymentsPageContent.includes('min-w-[720px]')
);

const invoicesPagePath = path.join(__dirname, '..', 'app', 'admin', 'invoices', 'page.tsx');
const invoicesPageContent = fs.readFileSync(invoicesPagePath, 'utf8');

check(
  'Admin Invoices table has overflow-x-auto with min-w',
  invoicesPageContent.includes('overflow-x-auto') && invoicesPageContent.includes('min-w-[700px]')
);

const clientsPagePath = path.join(__dirname, '..', 'app', 'admin', 'clients', 'page.tsx');
const clientsPageContent = fs.readFileSync(clientsPagePath, 'utf8');

check(
  'Admin Clients table has overflow-x-auto with min-w',
  clientsPageContent.includes('overflow-x-auto') && clientsPageContent.includes('min-w-[720px]')
);

const activityPagePath = path.join(__dirname, '..', 'app', 'admin', 'activity', 'page.tsx');
const activityPageContent = fs.readFileSync(activityPagePath, 'utf8');

check(
  'Admin Activity table has overflow-x-auto with min-w',
  activityPageContent.includes('overflow-x-auto') && activityPageContent.includes('min-w-[640px]')
);

console.log('\n========================================================');
console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================');

if (failed > 0) process.exit(1);
