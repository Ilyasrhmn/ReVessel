ALTER TABLE "user" DROP CONSTRAINT user_role_check;
ALTER TABLE "user" ADD CONSTRAINT user_role_check CHECK (role IN ('resident', 'reviewer', 'admin'));

CREATE TABLE rewards (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  pickup text NOT NULL CHECK (length(trim(pickup)) BETWEEN 1 AND 240),
  cost integer NOT NULL CHECK (cost BETWEEN 1 AND 100000),
  stock integer NOT NULL CHECK (stock BETWEEN 0 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reward_redemptions (
  code text PRIMARY KEY CHECK (code ~ '^RW-[A-F0-9]{12}$'),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id),
  request_id uuid NOT NULL,
  cost integer NOT NULL CHECK (cost BETWEEN 1 AND 100000),
  created_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz,
  UNIQUE (owner_id, request_id)
);

CREATE INDEX reward_redemptions_owner_created_idx ON reward_redemptions (owner_id, created_at DESC);
CREATE INDEX deposits_status_created_idx ON deposits (status, created_at DESC);

CREATE VIEW point_transactions AS
  SELECT owner_id, code, quantity AS points, reviewed_at AS occurred_at, material AS description
  FROM deposits WHERE status = 'accepted'
  UNION ALL
  SELECT rr.owner_id, rr.code, -rr.cost, rr.created_at, r.name
  FROM reward_redemptions rr JOIN rewards r ON r.id = rr.reward_id;
