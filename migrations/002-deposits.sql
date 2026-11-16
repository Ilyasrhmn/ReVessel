ALTER TABLE "user" ALTER COLUMN role SET DEFAULT 'resident';
UPDATE "user" SET role = 'resident' WHERE role IS NULL;
ALTER TABLE "user" ALTER COLUMN role SET NOT NULL;
ALTER TABLE "user" ADD CONSTRAINT user_role_check CHECK (role IN ('resident', 'reviewer'));

CREATE TABLE collection_points (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  address text NOT NULL CHECK (length(trim(address)) BETWEEN 1 AND 500),
  materials text[] NOT NULL CHECK (
    cardinality(materials) > 0
    AND materials <@ ARRAY['Botol parfum', 'Botol kosmetik', 'Jar kaca']::text[]
  ),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE reviewer_assignments (
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  point_slug text NOT NULL REFERENCES collection_points(slug) ON DELETE CASCADE,
  PRIMARY KEY (user_id, point_slug)
);

CREATE TABLE deposits (
  code text PRIMARY KEY CHECK (code ~ '^RV-[A-F0-9]{8}$'),
  owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  point_slug text NOT NULL REFERENCES collection_points(slug),
  request_id uuid NOT NULL,
  material text NOT NULL CHECK (material IN ('Botol parfum', 'Botol kosmetik', 'Jar kaca')),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'accepted', 'adjustment', 'cancelled')),
  reason text,
  reviewer_id text REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, request_id),
  CHECK ((status = 'adjustment') = (reason IS NOT NULL))
);

CREATE INDEX deposits_owner_created_idx ON deposits (owner_id, created_at DESC);
