/**
 * Incremental migration: Add new ticket module tables to existing database.
 * Run: npx tsx src/db/migrations/push_tickets.ts
 */
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) { console.error('DATABASE_URL is required'); process.exit(1); }

const sql = postgres(dbUrl, { ssl: 'require', max: 1 });

async function run() {
  console.log('🔄 Adding new ticket module tables...\n');

  // Create new enums (idempotent: skip if already exists)
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE "public"."ticket_order_status" AS ENUM('pending', 'completed', 'refunded', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log('  ✓ ticket_order_status enum');

  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE "public"."question_type" AS ENUM('text', 'dropdown', 'checkbox');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  console.log('  ✓ question_type enum');

  // Add new columns to existing tables (idempotent)
  await sql.unsafe(`
    ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0;
  `);
  console.log('  ✓ tickets.sort_order column');

  await sql.unsafe(`
    ALTER TABLE "attendees" ADD COLUMN IF NOT EXISTS "order_id" uuid;
    ALTER TABLE "attendees" ADD COLUMN IF NOT EXISTS "qr_code" text;
  `);
  console.log('  ✓ attendees.order_id + qr_code columns');

  // Create ticket_orders table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "ticket_orders" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
      "order_reference" text NOT NULL UNIQUE,
      "buyer_name" text NOT NULL,
      "buyer_email" text NOT NULL,
      "buyer_phone" text,
      "currency" text NOT NULL DEFAULT 'NGN',
      "total_amount" numeric(12,2) NOT NULL,
      "status" "ticket_order_status" NOT NULL DEFAULT 'pending',
      "payment_method" text,
      "payment_reference" text,
      "items" jsonb NOT NULL,
      "question_answers" jsonb,
      "metadata" jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('  ✓ ticket_orders table');

  // Create ticket_questions table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "ticket_questions" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
      "label" text NOT NULL,
      "type" "question_type" NOT NULL DEFAULT 'text',
      "required" boolean NOT NULL DEFAULT false,
      "ticket_ids" jsonb NOT NULL DEFAULT '["all"]',
      "options" jsonb DEFAULT '[]',
      "sort_order" integer NOT NULL DEFAULT 0,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('  ✓ ticket_questions table');

  // Create ticket_settings table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "ticket_settings" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE UNIQUE,
      "enable_transfers" boolean NOT NULL DEFAULT true,
      "enable_resale" boolean NOT NULL DEFAULT false,
      "resale_cap" integer DEFAULT 10,
      "refund_policy" text NOT NULL DEFAULT 'flexible',
      "support_email" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log('  ✓ ticket_settings table');

  console.log('\n✅ All ticket module tables created successfully!');
  await sql.end();
}

run().catch(e => { console.error('❌ Migration failed:', e); process.exit(1); });
