-- Enable RLS on all necessary tables
ALTER TABLE community ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Community Policies
-- Allow anyone to view communities
CREATE POLICY "Anyone can view communities"
ON community
FOR SELECT
USING (true);

-- Posts Policies
-- Allow anyone to view posts
CREATE POLICY "Anyone can view posts"
ON posts
FOR SELECT
USING (true);

-- Allow authenticated users to create posts
CREATE POLICY "Authenticated users can create posts"
ON posts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts"
ON posts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Comments Policies
-- Allow anyone to view comments
CREATE POLICY "Anyone can view comments"
ON comments
FOR SELECT
USING (true);

-- Allow authenticated users to create comments
CREATE POLICY "Authenticated users can create comments"
ON comments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
ON comments
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments"
ON comments
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Likes Policies
-- Allow anyone to view likes
CREATE POLICY "Anyone can view likes"
ON likes
FOR SELECT
USING (true);

-- Allow authenticated users to create likes
CREATE POLICY "Authenticated users can create likes"
ON likes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to remove their own likes
CREATE POLICY "Users can remove their own likes"
ON likes
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Follows Policies
-- Allow anyone to view follows
CREATE POLICY "Anyone can view follows"
ON follows
FOR SELECT
USING (true);

-- Allow authenticated users to follow
CREATE POLICY "Authenticated users can follow"
ON follows
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to unfollow
CREATE POLICY "Users can unfollow"
ON follows
FOR DELETE
TO authenticated
USING (user_id = auth.uid()); 