CREATE TYPE "public"."account_type" AS ENUM('individual', 'organization');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('NGN', 'GHS', 'ZAR', 'USD', 'GBP', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."event_phase" AS ENUM('setup', 'live', 'post-event');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'unpublished');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('Physical', 'Virtual', 'Hybrid');--> statement-breakpoint
CREATE TYPE "public"."attendee_status" AS ENUM('registered', 'checked-in', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('text', 'dropdown', 'checkbox');--> statement-breakpoint
CREATE TYPE "public"."refund_policy" AS ENUM('Refundable', 'Non-refundable');--> statement-breakpoint
CREATE TYPE "public"."ticket_order_status" AS ENUM('pending', 'completed', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('Draft', 'On Sale', 'Sold Out', 'Hidden');--> statement-breakpoint
CREATE TYPE "public"."ticket_type" AS ENUM('Single', 'Group');--> statement-breakpoint
CREATE TYPE "public"."ticket_visibility" AS ENUM('Public', 'Hidden', 'Invite Only');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'closed', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."form_type" AS ENUM('registration', 'survey', 'feedback', 'custom');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'fulfilled', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'sold-out', 'archived');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('physical', 'digital');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'active', 'paused', 'ended');--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"organization" text,
	"avatar_url" text,
	"account_type" "account_type" DEFAULT 'individual' NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" text,
	"password_reset_token" text,
	"password_reset_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"start_date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_date" text,
	"end_time" text,
	"type" "event_type" DEFAULT 'Physical' NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"phase" "event_phase" DEFAULT 'setup' NOT NULL,
	"cover_image_url" text,
	"country" text,
	"venue_location" text,
	"website_url" text,
	"subdomain" text,
	"custom_domain" text,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_config" jsonb,
	"branding" jsonb,
	"enabled_modules" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_subdomain_unique" UNIQUE("subdomain"),
	CONSTRAINT "events_custom_domain_unique" UNIQUE("custom_domain")
);
--> statement-breakpoint
CREATE TABLE "attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"order_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"order_reference" text NOT NULL,
	"qr_code" text,
	"status" "attendee_status" DEFAULT 'registered' NOT NULL,
	"checked_in_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"order_reference" text NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"status" "ticket_order_status" DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"payment_reference" text,
	"items" jsonb NOT NULL,
	"question_answers" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_orders_order_reference_unique" UNIQUE("order_reference")
);
--> statement-breakpoint
CREATE TABLE "ticket_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"label" text NOT NULL,
	"type" "question_type" DEFAULT 'text' NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"ticket_ids" jsonb DEFAULT '["all"]'::jsonb NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"enable_transfers" boolean DEFAULT true NOT NULL,
	"enable_resale" boolean DEFAULT false NOT NULL,
	"resale_cap" integer DEFAULT 10,
	"refund_policy" text DEFAULT 'flexible' NOT NULL,
	"support_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_settings_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "ticket_type" DEFAULT 'Single' NOT NULL,
	"group_size" integer,
	"is_free" boolean DEFAULT false NOT NULL,
	"price" numeric(12, 2),
	"quantity_total" integer NOT NULL,
	"quantity_sold" integer DEFAULT 0 NOT NULL,
	"status" "ticket_status" DEFAULT 'Draft' NOT NULL,
	"sales_start" text NOT NULL,
	"sales_end" text NOT NULL,
	"min_per_order" integer DEFAULT 1 NOT NULL,
	"max_per_order" integer DEFAULT 10 NOT NULL,
	"visibility" "ticket_visibility" DEFAULT 'Public' NOT NULL,
	"description" text,
	"perks" jsonb DEFAULT '[]'::jsonb,
	"allow_transfer" boolean DEFAULT false NOT NULL,
	"allow_resale" boolean DEFAULT false NOT NULL,
	"refund_policy" "refund_policy" DEFAULT 'Non-refundable' NOT NULL,
	"require_attendee_info" boolean DEFAULT false NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"track_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'talk' NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"date" text NOT NULL,
	"location" text,
	"speaker_ids" jsonb DEFAULT '[]'::jsonb,
	"capacity" integer,
	"is_break" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"title" text,
	"organization" text,
	"bio" text,
	"photo_url" text,
	"email" text,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"socials" jsonb,
	"is_featured" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"respondent_name" text,
	"respondent_email" text,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"metadata" jsonb,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "form_type" DEFAULT 'custom' NOT NULL,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"settings" jsonb,
	"share_token" text,
	"response_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "forms_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"website_url" text,
	"description" text,
	"visible" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"tier" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"order_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_reference" text,
	"shipping_address" jsonb,
	"fulfilment_notes" text,
	"fulfilled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"type" "product_type" DEFAULT 'physical' NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"sku" text,
	"category" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"has_variants" boolean DEFAULT false NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unlimited_inventory" boolean DEFAULT false NOT NULL,
	"total_stock" integer DEFAULT 0 NOT NULL,
	"reserved_stock" integer DEFAULT 0 NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"fulfilment_type" text DEFAULT 'pickup' NOT NULL,
	"digital_files" jsonb,
	"restrictions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contestants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"photo_url" text,
	"code" text,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"contestant_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"voter_identifier" text,
	"vote_count" integer DEFAULT 1 NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"payment_reference" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"start_date" text,
	"end_date" text,
	"allow_multiple_votes" boolean DEFAULT false NOT NULL,
	"votes_per_user" integer DEFAULT 1 NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"vote_price" numeric(10, 2),
	"currency" text DEFAULT 'NGN' NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voting_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_questions" ADD CONSTRAINT "ticket_questions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_settings" ADD CONSTRAINT "ticket_settings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contestants" ADD CONSTRAINT "contestants_category_id_voting_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."voting_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contestants" ADD CONSTRAINT "contestants_campaign_id_voting_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."voting_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contestants" ADD CONSTRAINT "contestants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_campaign_id_voting_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."voting_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_category_id_voting_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."voting_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_contestant_id_contestants_id_fk" FOREIGN KEY ("contestant_id") REFERENCES "public"."contestants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_campaigns" ADD CONSTRAINT "voting_campaigns_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_categories" ADD CONSTRAINT "voting_categories_campaign_id_voting_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."voting_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_categories" ADD CONSTRAINT "voting_categories_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;