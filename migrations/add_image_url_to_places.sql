-- Add image_url column to places table if it doesn't exist
ALTER TABLE places ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN places.image_url IS 'URL to the place image stored in Supabase Storage';

-- Update the updated_at timestamp when image_url is modified
CREATE OR REPLACE FUNCTION update_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_places_updated_at ON places;
CREATE TRIGGER trigger_update_places_updated_at
    BEFORE UPDATE ON places
    FOR EACH ROW
    EXECUTE FUNCTION update_places_updated_at(); 