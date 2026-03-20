ALTER TABLE auth_invitations
ADD COLUMN IF NOT EXISTS full_name text;
