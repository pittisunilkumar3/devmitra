// Migration: 002_create_seed_data
// Created at: 2024-01-01

import { query, insert } from '../config/database';
import bcrypt from 'bcryptjs';

export async function up(): Promise<void> {
  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  const superAdminId = await insert(
    `INSERT INTO users (email, password, name, role, status, email_verified) VALUES (?, ?, ?, 'superadmin', 'active', TRUE)`,
    ['admin@bookadeveloper.com', superAdminPassword, 'Super Admin']
  );
  console.log('✅ Super Admin created (email: admin@bookadeveloper.com, password: admin123)');

  // Create sample developer
  const devPassword = await bcrypt.hash('dev123456', 10);
  const devUserId = await insert(
    `INSERT INTO users (email, password, name, role, status, email_verified) VALUES (?, ?, ?, 'developer', 'active', TRUE)`,
    ['developer@example.com', devPassword, 'John Developer']
  );

  await insert(
    `INSERT INTO developers (user_id, skills, experience, hourly_rate, availability, bio, phone, country, timezone, job_title, weekly_hours, github_url, linkedin_url, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`,
    [
      devUserId,
      JSON.stringify(['JavaScript', 'TypeScript', 'React', 'Node.js', 'MySQL']),
      5,
      50.00,
      true,
      'Experienced full-stack developer with expertise in React and Node.js',
      '+1234567890',
      'United States',
      'America/New_York',
      'Senior Full Stack Developer',
      40,
      'https://github.com/johndeveloper',
      'https://linkedin.com/in/johndeveloper'
    ]
  );
  console.log('✅ Sample Developer created (email: developer@example.com, password: dev123456)');

  // Create sample user
  const userPassword = await bcrypt.hash('user123456', 10);
  await insert(
    `INSERT INTO users (email, password, name, role, status, email_verified) VALUES (?, ?, ?, 'user', 'active', TRUE)`,
    ['user@example.com', userPassword, 'Jane User']
  );
  console.log('✅ Sample User created (email: user@example.com, password: user123456)');

  // Create sample payment gateways
  await insert(
    `INSERT INTO payment_gateways (name, display_name, is_active, is_test_mode, platform_fee_percent) VALUES ('stripe', 'Stripe', TRUE, TRUE, 10.00)`
  );
  await insert(
    `INSERT INTO payment_gateways (name, display_name, is_active, is_test_mode, platform_fee_percent) VALUES ('razorpay', 'Razorpay', FALSE, TRUE, 10.00)`
  );
  console.log('✅ Payment gateways created');

  // Create sample email provider
  await insert(
    `INSERT INTO email_providers (name, display_name, is_active, is_test_mode) VALUES ('sendgrid', 'SendGrid', FALSE, TRUE)`
  );
  console.log('✅ Email providers created');

  console.log('✅ Migration 002_create_seed_data completed');
}

export async function down(): Promise<void> {
  await query(`DELETE FROM email_providers`);
  await query(`DELETE FROM payment_gateways`);
  await query(`DELETE FROM developers`);
  await query(`DELETE FROM users WHERE role != 'superadmin'`);
  await query(`DELETE FROM users WHERE email = 'admin@bookadeveloper.com'`);
  console.log('✅ Migration 002_create_seed_data rolled back');
}
