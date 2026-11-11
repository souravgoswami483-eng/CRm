const http = require('http');

async function request(path, options = {}) {
  const url = `http://localhost:3000${path}`;
  const res = await fetch(url, options);
  let json = null;
  try {
    json = await res.json();
  } catch (e) {}
  return {
    status: res.status,
    headers: res.headers,
    data: json,
  };
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING TASK 1 & TASK 2 COMPREHENSIVE VERIFICATION');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- TASK 1: SECURITY CHECKS ---
  console.log('\n--- 1. Security & Authentication Checks ---');

  // 1.1 Anonymous request to /api/clients returns 401
  const anonClients = await request('/api/clients');
  assert(anonClients.status === 401, 'Anonymous request to /api/clients returns 401');

  // 1.2 Anonymous request to /api/invoices returns 401
  const anonInvoices = await request('/api/invoices');
  assert(anonInvoices.status === 401, 'Anonymous request to /api/invoices returns 401');

  // 1.3 Anonymous request to /api/projects returns 401
  const anonProjects = await request('/api/projects');
  assert(anonProjects.status === 401, 'Anonymous request to /api/projects returns 401');

  // 1.4 Login as Admin
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin@studiovortex.com', password: 'admin123' }),
  });
  assert(adminLogin.status === 200, 'Admin login succeeds with 200');
  const adminCookie = adminLogin.headers.get('set-cookie');
  assert(adminCookie && adminCookie.includes('vortex_session'), 'Admin session cookie issued');

  // 1.5 Verify admin response contains NO passwords or password hashes
  assert(!JSON.stringify(adminLogin.data).includes('passwordHash'), 'Admin login response contains no passwordHash');
  assert(!JSON.stringify(adminLogin.data).includes('tempPassword'), 'Admin login response contains no tempPassword');

  // 1.6 Login as Client (Alex Rivers)
  const clientLogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'alex@zenithtech.io', password: 'zenith2026' }),
  });
  assert(clientLogin.status === 200, 'Client login succeeds with 200');
  const clientCookie = clientLogin.headers.get('set-cookie');
  assert(clientCookie && clientCookie.includes('vortex_session'), 'Client session cookie issued');

  // 1.7 Client calling /api/clients returns 403 Forbidden
  const clientCallClients = await request('/api/clients', {
    headers: { Cookie: clientCookie },
  });
  assert(clientCallClients.status === 403, 'Client calling /api/clients returns 403 Forbidden');

  // 1.8 Client calling /api/invoices sees ONLY their own invoices
  const clientInvoices = await request('/api/invoices', {
    headers: { Cookie: clientCookie },
  });
  assert(clientInvoices.status === 200, 'Client calling /api/invoices returns 200');
  const clientInvoiceList = clientInvoices.data?.invoices || [];
  const onlyAlexInvoices = clientInvoiceList.every(
    (i) => i.clientCompany === 'Zenith Techworks' || i.clientId === 'client_1'
  );
  assert(
    onlyAlexInvoices && clientInvoiceList.length > 0,
    `Client sees only their scoped invoices (count: ${clientInvoiceList.length})`
  );

  // --- TASK 2: DATA INTEGRITY & BUSINESS LOGIC ---
  console.log('\n--- 2. Data Integrity & Business Logic Checks ---');

  // 2.1 Admin fetches all clients - verify NO passwords in list
  const allClientsRes = await request('/api/clients', {
    headers: { Cookie: adminCookie },
  });
  assert(allClientsRes.status === 200, 'Admin gets all clients');
  const clientsList = allClientsRes.data?.clients || [];
  const hasNoPasswordsInClients = clientsList.every((c) => !c.passwordHash && !c.tempPassword);
  assert(hasNoPasswordsInClients, 'No client record in list exposes passwordHash or tempPassword');

  // 2.2 Verify zero QA test records exist
  const hasQABrand = clientsList.some((c) => c.name?.includes('QA Test') || c.companyName?.includes('QA Test'));
  assert(!hasQABrand, 'No QA Test Brand records exist in clients');

  // 2.3 Attempt to create Project with blank clientId -> MUST be rejected with 400
  const blankClientProject = await request('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      title: 'Blank Client Project Test',
      clientId: '',
      quotedAmount: 10000,
    }),
  });
  assert(blankClientProject.status === 400, 'Server rejects project save with empty clientId (HTTP 400)');

  // 2.4 Attempt to create Invoice with blank clientId -> MUST be rejected with 400
  const blankClientInvoice = await request('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      clientId: '',
      items: [{ service: 'Test', rate: 1000, quantity: 1 }],
    }),
  });
  assert(blankClientInvoice.status === 400, 'Server rejects invoice save with empty clientId (HTTP 400)');

  // 2.5 Attempt to create Client with invalid phone "aafiahfifboioif" -> MUST be rejected with 400
  const invalidPhoneClient = await request('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Test Person',
      companyName: 'Test Brand',
      email: 'test@brand.io',
      phone: 'aafiahfifboioif',
    }),
  });
  assert(invalidPhoneClient.status === 400, 'Server rejects client with invalid phone "aafiahfifboioif" (HTTP 400)');

  // 2.6 Create a valid new client
  const uniqueName = `Alpha Corp ${Date.now().toString().slice(-4)}`;
  const createClientRes = await request('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Rohan Verma',
      companyName: uniqueName,
      email: `rohan_${Date.now()}@alphacorp.in`,
      phone: '+91 98111 22334',
      industry: 'Fintech',
    }),
  });
  assert(createClientRes.status === 200, `Created new client: ${uniqueName}`);
  const createdClient = createClientRes.data?.client;
  assert(createdClient && createdClient.clientId.startsWith('CL-2026-'), 'Client assigned valid CL-2026-XXXX ID');
  assert(createClientRes.data?.oneTimePassword, 'One-time generated password returned on creation');
  assert(!createdClient.passwordHash, 'Created client response hides passwordHash');

  // 2.7 Create a new project for this client
  const createProjRes = await request('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      title: 'Brand Explainer Video 3D',
      clientId: createdClient.id,
      quotedAmount: 75000,
      type: 'Motion Graphics',
      priority: 'High',
    }),
  });
  assert(createProjRes.status === 200, 'Created new project assigned to client');
  const createdProject = createProjRes.data?.project;
  assert(createdProject?.clientId === createdClient.id, 'Project strictly stores client ID');

  // 2.8 Create an invoice for this client - test monotonic sequence
  const createInvRes = await request('/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      clientId: createdClient.id,
      projectId: createdProject.id,
      items: [
        { service: '3D Motion Graphics Production', rate: 75000, quantity: 1 },
      ],
      taxPercent: 18,
    }),
  });
  assert(createInvRes.status === 200, 'Created new invoice for client');
  const createdInvoice = createInvRes.data?.invoice;
  assert(createdInvoice?.invoiceNumber.startsWith('INV-2026-'), `Generated invoice sequence: ${createdInvoice?.invoiceNumber}`);

  // 2.9 Test reload stability: query /api/clients, /api/invoices, /api/projects 5 times
  console.log('\n--- 3. Stability Checks (5 consecutive reloads) ---');
  let stable = true;
  let lastClientCount = 0;
  let lastProjCount = 0;
  let lastInvCount = 0;

  for (let i = 1; i <= 5; i++) {
    const cRes = await request('/api/clients', { headers: { Cookie: adminCookie } });
    const pRes = await request('/api/projects', { headers: { Cookie: adminCookie } });
    const iRes = await request('/api/invoices', { headers: { Cookie: adminCookie } });

    const cCount = cRes.data?.clients?.length || 0;
    const pCount = pRes.data?.projects?.length || 0;
    const iCount = iRes.data?.invoices?.length || 0;

    if (i === 1) {
      lastClientCount = cCount;
      lastProjCount = pCount;
      lastInvCount = iCount;
    } else {
      if (cCount !== lastClientCount || pCount !== lastProjCount || iCount !== lastInvCount) {
        stable = false;
      }
    }
  }
  assert(
    stable,
    `All 5 reloads produced identical counts: ${lastClientCount} clients, ${lastProjCount} projects, ${lastInvCount} invoices`
  );

  // 2.10 Verify Overdue Invoices are returned and accurately calculated
  const invSummaryRes = await request('/api/invoices', { headers: { Cookie: adminCookie } });
  const allInvs = invSummaryRes.data?.invoices || [];
  const overdueInvs = allInvs.filter((inv) => inv.status === 'Overdue');
  assert(overdueInvs.length >= 1, `Overdue invoices found in system: ${overdueInvs.length} overdue (INV-2026-0098)`);
  const overduePulse = overdueInvs.find((inv) => inv.clientCompany === 'Pulse Energy Drink');
  assert(
    overduePulse && overduePulse.balanceDue === 66200,
    `Pulse Energy Drink invoice INV-2026-0098 overdue balance is ₹66,200`
  );

  console.log('\n========================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
