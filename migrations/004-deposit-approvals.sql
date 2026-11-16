ALTER TABLE deposits ADD COLUMN approval_note text;
ALTER TABLE deposits ADD COLUMN decided_at timestamptz;
ALTER TABLE deposits ADD COLUMN decided_by text REFERENCES "user"(id) ON DELETE SET NULL;
ALTER TABLE deposits ADD COLUMN fulfillment_method text;
ALTER TABLE deposits ADD COLUMN pickup_address text;
ALTER TABLE deposits ADD COLUMN pickup_phone text;

UPDATE deposits SET fulfillment_method = 'dropoff'
WHERE status IN ('waiting', 'accepted', 'adjustment');

ALTER TABLE deposits DROP CONSTRAINT deposits_status_check;
ALTER TABLE deposits ALTER COLUMN status SET DEFAULT 'pending_approval';
ALTER TABLE deposits ADD CONSTRAINT deposits_status_check CHECK (
  status IN ('pending_approval', 'approved', 'rejected', 'waiting', 'accepted', 'adjustment', 'cancelled')
);
ALTER TABLE deposits ADD CONSTRAINT deposits_approval_note_check CHECK (
  (status = 'rejected') = (approval_note IS NOT NULL)
  AND (approval_note IS NULL OR length(trim(approval_note)) BETWEEN 1 AND 240)
);
ALTER TABLE deposits ADD CONSTRAINT deposits_fulfillment_check CHECK (
  (fulfillment_method IS NULL OR fulfillment_method IN ('dropoff', 'pickup'))
  AND (status NOT IN ('waiting', 'accepted', 'adjustment') OR fulfillment_method IS NOT NULL)
  AND (status NOT IN ('pending_approval', 'approved', 'rejected') OR fulfillment_method IS NULL)
  AND ((status = 'waiting' AND fulfillment_method IS NOT DISTINCT FROM 'pickup') = (pickup_address IS NOT NULL))
  AND ((pickup_address IS NULL) = (pickup_phone IS NULL))
  AND (pickup_address IS NULL OR length(trim(pickup_address)) BETWEEN 10 AND 400)
  AND (pickup_phone IS NULL OR pickup_phone ~ '^[+]?[0-9]{8,15}$')
);
