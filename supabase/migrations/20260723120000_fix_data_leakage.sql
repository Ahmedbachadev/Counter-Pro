-- Fix Data Leakage and Privilege Escalation

-- 1. Secure `get_current_workspace_id`
-- Remove reliance on `user_metadata` to prevent users from manipulating their workspace context
-- Force the function to securely look up the user's workspace_id from public.users
CREATE OR REPLACE FUNCTION get_current_workspace_id()
RETURNS UUID AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  -- Always fetch the trusted workspace_id directly from the users table.
  -- SECURITY DEFINER ensures this bypasses RLS and can read the public.users table securely.
  SELECT workspace_id INTO v_workspace_id FROM public.users WHERE id = auth.uid();
  
  RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- 2. Fix Privilege Escalation on User Profile Updates
-- Prevent users from updating their own `workspace_id` or `role` to elevate privileges
-- Drop the existing insecure update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create the new secure policy with WITH CHECK to ensure they don't modify restricted columns
-- Since they can't see the OLD row directly in WITH CHECK without triggers, we enforce
-- that they can only update their profile if the new role and workspace_id matches what's already in the database
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND workspace_id = (SELECT workspace_id FROM public.users WHERE id = auth.uid()) 
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
  );
