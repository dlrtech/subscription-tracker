-- The currency the user wants totals converted into (subscriptions keep the currency they were entered in).
ALTER TABLE users ADD COLUMN preferred_currency VARCHAR(3) NOT NULL DEFAULT 'TRY';
