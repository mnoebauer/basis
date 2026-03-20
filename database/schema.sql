-- Basis hiring platform schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Core tenancy and identity
-- =========================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  company_stage TEXT,
  headquarters_location TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_memberships (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer', 'viewer')),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  PRIMARY KEY (workspace_id, user_id)
);

-- =========================
-- Onboarding and settings
-- =========================

CREATE TABLE workspace_onboarding_profiles (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_name TEXT,
  hiring_volume TEXT CHECK (hiring_volume IN ('focused', 'steady', 'scaled')),
  default_workflow_style TEXT CHECK (default_workflow_style IN ('lean', 'structured', 'panel')),
  decision_rhythm TEXT CHECK (decision_rhythm IN ('async', 'blended', 'live')),
  candidate_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  shared_inbox_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  intro_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE onboarding_target_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, role_name)
);

CREATE TABLE onboarding_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  collaborator_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, collaborator_label)
);

-- =========================
-- Hiring objects
-- =========================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE (workspace_id, name)
);

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  country_code TEXT,
  timezone TEXT,
  is_remote BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (workspace_id, name)
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'temporary')),
  workplace_type TEXT CHECK (workplace_type IN ('remote', 'hybrid', 'onsite')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'closed', 'archived')),
  min_salary NUMERIC(12, 2),
  max_salary NUMERIC(12, 2),
  salary_currency CHAR(3),
  description_md TEXT,
  requirements_md TEXT,
  hiring_manager_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, slug)
);

CREATE TABLE job_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_type TEXT NOT NULL CHECK (stage_type IN ('inbox', 'screen', 'interview', 'decision', 'offer', 'hired', 'declined', 'archive', 'custom')),
  position INTEGER NOT NULL,
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, name),
  UNIQUE (job_id, position)
);

CREATE TABLE job_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE job_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  job_board_id UUID NOT NULL REFERENCES job_boards(id) ON DELETE CASCADE,
  external_posting_id TEXT,
  external_url TEXT,
  posted_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, job_board_id)
);

-- =========================
-- Candidates and applications
-- =========================

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  location_text TEXT,
  current_company TEXT,
  current_title TEXT,
  years_experience NUMERIC(4,1),
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX candidates_workspace_email_unique_idx
ON candidates (workspace_id, LOWER(email))
WHERE email IS NOT NULL;

CREATE TABLE application_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('job_board', 'referral', 'career_page', 'direct', 'agency', 'internal', 'other')),
  source_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, source_type, source_name)
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  current_stage_id UUID REFERENCES job_stages(id) ON DELETE SET NULL,
  source_id UUID REFERENCES application_sources(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'hired', 'rejected', 'archived')),
  is_internal_referral BOOLEAN NOT NULL DEFAULT FALSE,
  referred_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  resume_url TEXT,
  cover_letter TEXT,
  application_submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, candidate_id)
);

CREATE TABLE application_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('short_text', 'long_text', 'number', 'boolean', 'url', 'single_select', 'multi_select')),
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, position)
);

CREATE TABLE application_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES application_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, question_id)
);

CREATE TABLE stage_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES job_stages(id) ON DELETE SET NULL,
  to_stage_id UUID REFERENCES job_stages(id) ON DELETE SET NULL,
  reason TEXT,
  moved_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Collaboration and comms
-- =========================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  content_md TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN ('internal', 'hiring_team', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  recommendation TEXT CHECK (recommendation IN ('strong_yes', 'yes', 'mixed', 'no', 'strong_no')),
  summary TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, reviewer_user_id)
);

CREATE TABLE review_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scorecard_id UUID NOT NULL REFERENCES review_scorecards(id) ON DELETE CASCADE,
  competency TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  UNIQUE (scorecard_id, competency)
);

CREATE TABLE interview_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES job_stages(id) ON DELETE SET NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('phone', 'video', 'onsite', 'take_home', 'panel', 'other')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL,
  calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE interview_participants (
  interview_slot_id UUID NOT NULL REFERENCES interview_slots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('interviewer', 'observer', 'coordinator')),
  PRIMARY KEY (interview_slot_id, user_id)
);

CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app')),
  subject TEXT,
  created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('candidate', 'user', 'system')),
  sender_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  body_text TEXT,
  body_html TEXT,
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  subject_template TEXT,
  body_template TEXT NOT NULL,
  created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  storage_key TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload' CHECK (source IN ('upload', 'resume_parse', 'generated', 'import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired', 'revoked')),
  base_salary NUMERIC(12, 2),
  equity_text TEXT,
  bonus_text TEXT,
  currency CHAR(3),
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  start_date DATE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- Product analytics and attribution
-- =========================

CREATE TABLE visitor_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT NOT NULL UNIQUE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  visitor_identity_id UUID REFERENCES visitor_identities(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  entry_path TEXT,
  exit_path TEXT,
  referrer_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  landing_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'bot', 'unknown')),
  country_code CHAR(2),
  region TEXT,
  city TEXT
);

CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  visitor_identity_id UUID REFERENCES visitor_identities(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  source_page TEXT,
  source_component TEXT,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  metric_value NUMERIC(14,4),
  metric_unit TEXT,
  is_conversion BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE conversion_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, name)
);

CREATE TABLE experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  visitor_identity_id UUID REFERENCES visitor_identities(id) ON DELETE CASCADE,
  experiment_key TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, experiment_key)
);

-- =========================
-- Auditing and compliance
-- =========================

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  ip_hash TEXT,
  user_agent TEXT
);

CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, object_type)
);

-- =========================
-- Indexes for performance
-- =========================

CREATE INDEX jobs_workspace_status_idx ON jobs (workspace_id, status);
CREATE INDEX applications_workspace_job_idx ON applications (workspace_id, job_id);
CREATE INDEX applications_stage_status_idx ON applications (current_stage_id, status);
CREATE INDEX applications_last_activity_idx ON applications (last_activity_at DESC);
CREATE INDEX stage_transitions_application_moved_at_idx ON stage_transitions (application_id, moved_at DESC);
CREATE INDEX notes_application_created_at_idx ON notes (application_id, created_at DESC);
CREATE INDEX messages_thread_created_at_idx ON messages (thread_id, created_at DESC);
CREATE INDEX sessions_workspace_started_at_idx ON sessions (workspace_id, started_at DESC);
CREATE INDEX analytics_events_workspace_time_idx ON analytics_events (workspace_id, occurred_at DESC);
CREATE INDEX analytics_events_name_time_idx ON analytics_events (event_name, occurred_at DESC);
CREATE INDEX analytics_events_job_time_idx ON analytics_events (job_id, occurred_at DESC);
CREATE INDEX analytics_events_props_gin_idx ON analytics_events USING GIN (properties);
CREATE INDEX audit_logs_workspace_occurred_at_idx ON audit_logs (workspace_id, occurred_at DESC);

-- =========================
-- Helpful views for analytics
-- =========================

CREATE VIEW application_funnel_daily AS
SELECT
  a.workspace_id,
  a.job_id,
  DATE(st.moved_at) AS day,
  js.name AS stage_name,
  COUNT(*) AS transitions
FROM stage_transitions st
JOIN applications a ON a.id = st.application_id
LEFT JOIN job_stages js ON js.id = st.to_stage_id
GROUP BY a.workspace_id, a.job_id, DATE(st.moved_at), js.name;

CREATE VIEW job_conversion_daily AS
SELECT
  workspace_id,
  job_id,
  DATE(occurred_at) AS day,
  COUNT(*) FILTER (WHERE event_name = 'job_viewed') AS job_views,
  COUNT(*) FILTER (WHERE event_name = 'application_started') AS applications_started,
  COUNT(*) FILTER (WHERE event_name = 'application_submitted') AS applications_submitted
FROM analytics_events
GROUP BY workspace_id, job_id, DATE(occurred_at);

-- =========================
-- Waitlist
-- =========================

CREATE TABLE waitlist (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
