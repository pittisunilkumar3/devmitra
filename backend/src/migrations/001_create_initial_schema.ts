// Migration: 001_create_initial_schema
// Created at: 2024-01-01

import { execute } from '../config/database';

export async function up(): Promise<void> {
  // 1. Users Table
  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      role ENUM('superadmin', 'developer', 'user') NOT NULL DEFAULT 'user',
      status ENUM('active', 'inactive', 'blocked') NOT NULL DEFAULT 'active',
      profile_image VARCHAR(500),
      google_id VARCHAR(255),
      email_verified BOOLEAN DEFAULT FALSE,
      reset_token VARCHAR(255),
      reset_token_expiry TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_status (status),
      INDEX idx_reset_token (reset_token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Developers Table
  await execute(`
    CREATE TABLE IF NOT EXISTS developers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      skills JSON,
      experience INT DEFAULT 0,
      hourly_rate DECIMAL(10, 2) DEFAULT 0.00,
      availability BOOLEAN DEFAULT TRUE,
      portfolio TEXT,
      rating DECIMAL(3, 2) DEFAULT 0.00,
      total_projects INT DEFAULT 0,
      bio TEXT,
      phone VARCHAR(20),
      country VARCHAR(100),
      timezone VARCHAR(100),
      job_title VARCHAR(255),
      weekly_hours INT DEFAULT 40,
      github_url VARCHAR(500),
      linkedin_url VARCHAR(500),
      other_urls JSON,
      approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      rejected_reason TEXT,
      approved_by INT,
      approved_at TIMESTAMP NULL,
      rejection_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_approval_status (approval_status),
      INDEX idx_availability (availability)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Bookings Table
  await execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id VARCHAR(50) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      developer_id INT NOT NULL,
      status ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed') DEFAULT 'pending',
      project_title VARCHAR(255) NOT NULL,
      project_description TEXT,
      project_type VARCHAR(100),
      budget DECIMAL(15, 2) DEFAULT 0.00,
      platform_fee DECIMAL(15, 2) DEFAULT 0.00,
      developer_earnings DECIMAL(15, 2) DEFAULT 0.00,
      deadline DATE,
      started_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      cancelled_at TIMESTAMP NULL,
      cancelled_by INT,
      cancellation_reason TEXT,
      admin_notes TEXT,
      priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
      payment_status ENUM('pending', 'paid', 'refunded', 'partial') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE,
      FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_booking_id (booking_id),
      INDEX idx_user_id (user_id),
      INDEX idx_developer_id (developer_id),
      INDEX idx_status (status),
      INDEX idx_payment_status (payment_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Booking Milestones Table
  await execute(`
    CREATE TABLE IF NOT EXISTS booking_milestones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      amount DECIMAL(15, 2) DEFAULT 0.00,
      status ENUM('pending', 'in_progress', 'completed', 'approved') DEFAULT 'pending',
      due_date DATE,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      INDEX idx_booking_id (booking_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Booking Files Table
  await execute(`
    CREATE TABLE IF NOT EXISTS booking_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      uploaded_by INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url VARCHAR(500) NOT NULL,
      file_type VARCHAR(100),
      file_size INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_booking_id (booking_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 6. Booking History Table
  await execute(`
    CREATE TABLE IF NOT EXISTS booking_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      action VARCHAR(255) NOT NULL,
      performed_by INT NOT NULL,
      old_status VARCHAR(50),
      new_status VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_booking_id (booking_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 7. Messages Table
  await execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      sender_id INT NOT NULL,
      receiver_id INT NOT NULL,
      message TEXT NOT NULL,
      has_contact_info BOOLEAN DEFAULT FALSE,
      is_flagged BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_booking_id (booking_id),
      INDEX idx_is_flagged (is_flagged)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 8. Support Tickets Table
  await execute(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id VARCHAR(50) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      user_role ENUM('user', 'developer') NOT NULL,
      subject VARCHAR(255) NOT NULL,
      category ENUM('general', 'booking_issue', 'payment_issue', 'dispute', 'technical', 'other') DEFAULT 'general',
      priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
      status ENUM('open', 'in_progress', 'waiting_reply', 'resolved', 'closed') DEFAULT 'open',
      assigned_to INT,
      related_booking_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      closed_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (related_booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
      INDEX idx_ticket_id (ticket_id),
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 9. Support Ticket Messages Table
  await execute(`
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      sender_id INT NOT NULL,
      sender_role ENUM('user', 'developer', 'superadmin') NOT NULL,
      message TEXT NOT NULL,
      attachments JSON,
      is_internal BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_ticket_id (ticket_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 10. Transactions Table
  await execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      user_id INT NOT NULL,
      developer_id INT NOT NULL,
      amount DECIMAL(15, 2) DEFAULT 0.00,
      platform_fee DECIMAL(15, 2) DEFAULT 0.00,
      status ENUM('pending', 'completed', 'refunded') DEFAULT 'pending',
      payment_id VARCHAR(255),
      payment_gateway VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE,
      INDEX idx_booking_id (booking_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 11. Reviews Table
  await execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT NOT NULL,
      user_id INT NOT NULL,
      developer_id INT NOT NULL,
      rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE,
      UNIQUE KEY unique_review (booking_id, user_id),
      INDEX idx_developer_id (developer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 12. Admin Logs Table
  await execute(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_id INT NOT NULL,
      action VARCHAR(255) NOT NULL,
      target_type VARCHAR(50),
      target_id INT,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_admin_id (admin_id),
      INDEX idx_action (action)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 13. Payment Gateways Table
  await execute(`
    CREATE TABLE IF NOT EXISTS payment_gateways (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100) NOT NULL,
      api_key TEXT,
      api_secret TEXT,
      webhook_secret TEXT,
      is_active BOOLEAN DEFAULT FALSE,
      is_test_mode BOOLEAN DEFAULT TRUE,
      platform_fee_percent DECIMAL(5, 2) DEFAULT 10.00,
      additional_config JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 14. SMS Providers Table
  await execute(`
    CREATE TABLE IF NOT EXISTS sms_providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100) NOT NULL,
      api_key TEXT,
      api_secret TEXT,
      sender_id VARCHAR(50),
      is_active BOOLEAN DEFAULT FALSE,
      is_test_mode BOOLEAN DEFAULT TRUE,
      additional_config JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 15. Email Providers Table
  await execute(`
    CREATE TABLE IF NOT EXISTS email_providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(100) NOT NULL,
      api_key TEXT,
      smtp_host VARCHAR(255),
      smtp_port INT,
      smtp_username VARCHAR(255),
      smtp_password TEXT,
      from_email VARCHAR(255),
      from_name VARCHAR(255),
      is_active BOOLEAN DEFAULT FALSE,
      is_test_mode BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ Migration 001_create_initial_schema completed');
}

export async function down(): Promise<void> {
  // Drop tables in reverse order
  await execute('DROP TABLE IF EXISTS email_providers');
  await execute('DROP TABLE IF EXISTS sms_providers');
  await execute('DROP TABLE IF EXISTS payment_gateways');
  await execute('DROP TABLE IF EXISTS admin_logs');
  await execute('DROP TABLE IF EXISTS reviews');
  await execute('DROP TABLE IF EXISTS transactions');
  await execute('DROP TABLE IF EXISTS support_ticket_messages');
  await execute('DROP TABLE IF EXISTS support_tickets');
  await execute('DROP TABLE IF EXISTS messages');
  await execute('DROP TABLE IF EXISTS booking_history');
  await execute('DROP TABLE IF EXISTS booking_files');
  await execute('DROP TABLE IF EXISTS booking_milestones');
  await execute('DROP TABLE IF EXISTS bookings');
  await execute('DROP TABLE IF EXISTS developers');
  await execute('DROP TABLE IF EXISTS users');

  console.log('✅ Migration 001_create_initial_schema rolled back');
}
