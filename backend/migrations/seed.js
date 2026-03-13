const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');
const { v4: uuidv4 } = require('uuid');

const seedData = async () => {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database...\n');
    await client.query('BEGIN');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const agentPassword = await bcrypt.hash('agent123', 10);
    const clientPassword = await bcrypt.hash('client123', 10);

    // -----------------------------
    // USERS
    // -----------------------------
    const adminResult = await client.query(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role, email_verified, admin_approved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [uuidv4(), 'admin@esteetade.com', adminPassword, 'Admin', 'User', '+2348000000000', 'admin', true, true]
    );
    const adminId = adminResult.rows[0].id;
    console.log('✅ Admin user created');

    const agentResult = await client.query(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role, referral_code, email_verified, admin_approved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [uuidv4(), 'agent@esteetade.com', agentPassword, 'John', 'Agent', '+2348001111111', 'agent', 'EST-AGT-1234', true, true]
    );
    const agentId = agentResult.rows[0].id;
    console.log('✅ Agent user created');

    const pendingAgentResult = await client.query(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role, referral_code, email_verified, admin_approved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [uuidv4(), 'pending@esteetade.com', agentPassword, 'Pending', 'Agent', '+2348002222222', 'agent', 'EST-AGT-5678', true, false]
    );
    console.log('✅ Pending agent created');

    const client1Result = await client.query(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role, referred_by, email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [uuidv4(), 'client1@example.com', clientPassword, 'Alice', 'Johnson', '+2348003333333', 'client', agentId, true]
    );
    const client1Id = client1Result.rows[0].id;
    console.log('✅ Client 1 created');

    const client2Result = await client.query(
      `INSERT INTO users (id, email, password, first_name, last_name, phone, role, referred_by, email_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [uuidv4(), 'client2@example.com', clientPassword, 'Bob', 'Smith', '+2348004444444', 'client', null, true]
    );
    const client2Id = client2Result.rows[0].id;
    console.log('✅ Client 2 created');

    // -----------------------------
    // APPLICATIONS
    // -----------------------------
    const app1Result = await client.query(
      `INSERT INTO applications (id, client_id, agent_id, application_type, type_label, amount, currency, status, progress, documents, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [uuidv4(), client1Id, agentId, 'study', 'Study Abroad Application', 250000, 'NGN', 'pending', 25, ['passport.pdf','transcript.pdf'], 'Application under initial review']
    );
    const app1Id = app1Result.rows[0].id;
    console.log('✅ Application 1 created');

    const app2Result = await client.query(
      `INSERT INTO applications (id, client_id, agent_id, application_type, type_label, amount, currency, status, progress, documents, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [uuidv4(), client2Id, null, 'cv', 'CV / Resume Maker', 10000, 'NGN', 'completed', 100, ['cv_template.docx'], 'CV delivered successfully']
    );
    const app2Id = app2Result.rows[0].id;
    console.log('✅ Application 2 created');

    const app3Result = await client.query(
      `INSERT INTO applications (id, client_id, agent_id, application_type, type_label, amount, currency, status, progress, documents, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [uuidv4(), client1Id, agentId, 'work', 'Work Visa Application', 200000, 'NGN', 'approved', 75, ['passport.pdf','degree_certificate.pdf'], null]
    );
    const app3Id = app3Result.rows[0].id;
    console.log('✅ Application 3 created');

    // -----------------------------
    // INVOICES
    // -----------------------------
    await client.query(
      `INSERT INTO invoices (id, application_id, client_id, invoice_number, amount, currency, status, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [uuidv4(), app1Id, client1Id, 'INV-2026-001', 250000, 'NGN', 'paid', new Date()]
    );

    await client.query(
      `INSERT INTO invoices (id, application_id, client_id, invoice_number, amount, currency, status, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [uuidv4(), app2Id, client2Id, 'INV-2026-002', 10000, 'NGN', 'paid', new Date()]
    );

    await client.query(
      `INSERT INTO invoices (id, application_id, client_id, invoice_number, amount, currency, status, paid_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [uuidv4(), app3Id, client1Id, 'INV-2026-003', 200000, 'NGN', 'paid', new Date()]
    );
    console.log('✅ Invoices created');

    // -----------------------------
    // NOTIFICATIONS
    // -----------------------------
    await client.query(
      `INSERT INTO notifications (id, user_id, title, message, type, read)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), client1Id, 'Welcome to Esteetade!', 'Thank you for joining Esteetade Travels. Start your journey today!', 'success', false]
    );

    await client.query(
      `INSERT INTO notifications (id, user_id, title, message, type, read)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), client1Id, 'Application Update', 'Your Study Abroad application is now under review.', 'info', false]
    );

    await client.query(
      `INSERT INTO notifications (id, user_id, title, message, type, read)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [uuidv4(), client2Id, 'Payment Successful', 'Your payment of ₦10,000 has been received.', 'success', true]
    );
    console.log('✅ Notifications created');

    await client.query('COMMIT');
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Test Accounts:');
    console.log('  Admin: admin@esteetade.com / admin123');
    console.log('  Agent: agent@esteetade.com / agent123');
    console.log('  Client: client1@example.com / client123');
    console.log('  Client: client2@example.com / client123');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedData };