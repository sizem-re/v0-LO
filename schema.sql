-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  privacy TEXT NOT NULL DEFAULT 'private',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL,
  fid INTEGER
);

-- Create places table
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  type TEXT,
  website TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL,
  fid INTEGER
);

-- Create places_lists junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS places_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID REFERENCES places(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT NOT NULL,
  UNIQUE(place_id, list_id)
);

-- Create RLS policies
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE places_lists ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can create their own lists" 
ON lists FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own lists" 
ON lists FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR privacy = 'public');

CREATE POLICY "Users can update their own lists" 
ON lists FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own lists" 
ON lists FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Places policies
CREATE POLICY "Users can create places" 
ON places FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view places" 
ON places FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own places" 
ON places FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own places" 
ON places FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Places_lists policies
CREATE POLICY "Users can add places to lists" 
ON places_lists FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their places_lists" 
ON places_lists FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their places_lists" 
ON places_lists FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());
