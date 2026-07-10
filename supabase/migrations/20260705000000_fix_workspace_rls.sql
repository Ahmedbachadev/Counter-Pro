-- Fix for get_current_workspace_id to remove the insecure LIMIT 1 fallback

CREATE OR REPLACE FUNCTION get_current_workspace_id()
RETURNS UUID AS $$
DECLARE
  v_workspace_id UUID;
  v_meta_workspace_id TEXT;
BEGIN
  v_meta_workspace_id := auth.jwt() -> 'user_metadata' ->> 'workspaceId';
  
  BEGIN
    v_workspace_id := v_meta_workspace_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_workspace_id := NULL;
  END;

  IF v_workspace_id IS NULL THEN
     SELECT workspace_id INTO v_workspace_id FROM public.users WHERE id = auth.uid();
  END IF;

  -- Removed the insecure fallback that returned the first workspace randomly:
  -- IF v_workspace_id IS NULL THEN
  --    SELECT id INTO v_workspace_id FROM public.workspaces LIMIT 1;
  -- END IF;

  RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
