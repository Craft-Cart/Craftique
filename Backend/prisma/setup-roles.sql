-- Database role setup for Craftique application
-- Creates a limited role with only SELECT, INSERT, UPDATE, DELETE permissions
-- Revokes DROP, ALTER, and other DDL privileges

-- Create the application role
CREATE ROLE craftique_app WITH LOGIN PASSWORD 'craftique_app_password_change_in_production';

-- Grant CONNECT permission to the database
GRANT CONNECT ON DATABASE craftique TO craftique_app;

-- Grant USAGE on schema
GRANT USAGE ON SCHEMA public TO craftique_app;

-- Grant SELECT, INSERT, UPDATE, DELETE on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO craftique_app;

-- Grant USAGE and SELECT on sequences (for auto-incrementing IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO craftique_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO craftique_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO craftique_app;

-- Revoke dangerous permissions explicitly
REVOKE CREATE ON SCHEMA public FROM craftique_app;
REVOKE DROP ON DATABASE craftique FROM craftique_app;
REVOKE ALTER ON DATABASE craftique FROM craftique_app;

-- Note: This script should be run by a superuser after database creation
-- The application should connect using the craftique_app role instead of craftique