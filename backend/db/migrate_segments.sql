ALTER TABLE segments
  ADD COLUMN IF NOT EXISTS path GEOMETRY(LineString, 3857),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE segment_efforts
  ADD CONSTRAINT segment_efforts_segment_id_activity_id_key
    UNIQUE (segment_id, activity_id);

CREATE INDEX IF NOT EXISTS idx_segments_path ON segments USING GIST(path);

CREATE OR REPLACE FUNCTION decode_polyline_to_geom(encoded TEXT)
RETURNS GEOMETRY(LineString, 3857) AS $$
  SELECT ST_Transform(ST_LineFromEncodedPolyline(encoded), 3857);
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION update_segment_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.polyline IS NOT NULL THEN
    NEW.path := decode_polyline_to_geom(NEW.polyline);
    NEW.distance := COALESCE(NEW.distance, ST_Length(NEW.path));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_segment_path ON segments;
CREATE TRIGGER trg_update_segment_path
BEFORE INSERT OR UPDATE ON segments
FOR EACH ROW EXECUTE FUNCTION update_segment_path();
