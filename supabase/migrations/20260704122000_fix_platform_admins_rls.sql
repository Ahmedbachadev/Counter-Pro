-- Fix recursive RLS on platform_admins

-- Drop the recursive policy
DROP POLICY IF EXISTS "Platform Admins can see other platform admins" ON public.platform_admins;

-- Create a SECURITY DEFINER function to bypass RLS when checking admin status
-- This prevents the infinite recursion error (42P17)
CREATE OR REPLACE FUNCTION public.is_platform_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.platform_admins 
        WHERE user_id = auth.uid() 
        AND is_active = true
    );
$$;

-- Create a safe policy using the helper function
CREATE POLICY "Platform Admins can see all platform admins" ON public.platform_admins
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() 
    OR 
    public.is_platform_super_admin()
);
