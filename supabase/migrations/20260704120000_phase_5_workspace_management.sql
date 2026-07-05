-- Phase 5.2: Workspace Management, Access Periods, License History

-- Update workspaces table
ALTER TABLE public.workspaces 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS access_period VARCHAR(50) DEFAULT '1 Month',
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT FALSE;

-- Migrate existing is_active logic to status
UPDATE public.workspaces SET status = 'Active' WHERE is_active = true;
UPDATE public.workspaces SET status = 'Suspended' WHERE is_active = false;

-- Create License History Table
CREATE TABLE IF NOT EXISTS public.license_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.license_history ENABLE ROW LEVEL SECURITY;

-- Platform Super Admin policies for license_history (For now, let's allow all authenticated users if it's admin or workspace owner)
CREATE POLICY "Super Admins can manage license history" ON public.license_history
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'Platform Super Admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid() AND u.role = 'Platform Super Admin'
    )
);

-- Workspace owners can view their own license history
CREATE POLICY "Workspace owners can view license history" ON public.license_history
FOR SELECT
TO authenticated
USING (
    workspace_id IN (
        SELECT workspace_id FROM public.users WHERE id = auth.uid() AND role IN ('Owner', 'Admin')
    )
);

-- Backend logic for workspace expiry handling
CREATE OR REPLACE FUNCTION public.check_and_update_workspace_expiry()
RETURNS void AS $$
BEGIN
    UPDATE public.workspaces
    SET status = 'Expired'
    WHERE is_lifetime = false 
      AND status = 'Active' 
      AND expiry_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to invalidate sessions when workspace expires (Prepared logic)
CREATE OR REPLACE FUNCTION public.invalidate_expired_workspace_sessions()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'Expired' AND OLD.status = 'Active' THEN
        -- In a real Supabase environment with access to auth.sessions, 
        -- you would invalidate sessions here, or use an Edge Function.
        -- DELETE FROM auth.sessions WHERE user_id IN (SELECT id FROM public.users WHERE workspace_id = NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_workspace_expired ON public.workspaces;
CREATE TRIGGER on_workspace_expired
AFTER UPDATE OF status ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.invalidate_expired_workspace_sessions();
