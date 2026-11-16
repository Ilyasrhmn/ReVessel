CREATE TABLE contact_messages (
  id uuid PRIMARY KEY,
  sender_name text NOT NULL CHECK (length(trim(sender_name)) BETWEEN 1 AND 80),
  sender_email text NOT NULL CHECK (length(sender_email) BETWEEN 3 AND 254),
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 10 AND 2000),
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contact_messages_sent_idx ON contact_messages (sent_at DESC);
CREATE INDEX contact_messages_sender_idx ON contact_messages (sender_email, sent_at DESC);
