-- Phase 5: Platform User Management

-- 1. Create Login History Table
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    login_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    browser VARCHAR(255),
    device VARCHAR(255),
    ip_address VARCHAR(45),
    status VARCHAR(50) DEFAULT 'Success',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_history_user ON public.login_history(user_id);
CREATE INDEX idx_login_history_workspace ON public.login_history(workspace_id);

ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform Super Admins can view all login history" ON public.login_history
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true));

-- 2. Platform Admin RPC Functions for User Management

-- Activate User
CREATE OR REPLACE FUNCTION public.admin_activate_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN
        UPDATE public.users SET status = 'Active', updated_at = NOW() WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Suspend User
CREATE OR REPLACE FUNCTION public.admin_suspend_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN
        UPDATE public.users SET status = 'Suspended', updated_at = NOW() WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disable User
CREATE OR REPLACE FUNCTION public.admin_disable_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN
        UPDATE public.users SET status = 'Disabled', updated_at = NOW() WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Soft Delete User
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN
        UPDATE public.users SET deleted_at = NOW(), status = 'Deleted', updated_at = NOW() WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Change Workspace Role
CREATE OR REPLACE FUNCTION public.admin_change_workspace_role(target_user_id UUID, new_role VARCHAR)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN
        UPDATE public.users SET role = new_role, updated_at = NOW() WHERE id = target_user_id;
        
        -- Also update raw_user_meta_data in auth.users if possible
        UPDATE auth.users 
        SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(new_role))
        WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transfer Workspace
CREATE OR REPLACE FUNCTION public.admin_transfer_user_workspace(target_user_id UUID, new_workspace_id UUID)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN
        UPDATE public.users SET workspace_id = new_workspace_id, updated_at = NOW() WHERE id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Force Logout User (Delete sessions)
CREATE OR REPLACE FUNCTION public.admin_force_logout_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN
        DELETE FROM auth.sessions WHERE user_id = target_user_id;
    ELSE
        RAISE EXCEPTION 'Unauthorized';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
