-- Create platform_admins table
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Super Admin',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Platform Admins are visible to themselves" ON public.platform_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Platform Admins can see other platform admins" ON public.platform_admins
FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true));

-- Create the initial Platform Super Admin if not exists
DO $$
DECLARE
    new_user_id UUID;
    target_email TEXT := 'abuh68653@gmail.com';
BEGIN
    -- Check if user exists in auth.users
    SELECT id INTO new_user_id FROM auth.users WHERE email = target_email;
    
    IF new_user_id IS NULL THEN
        new_user_id := uuid_generate_v4();
        
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            new_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            target_email,
            crypt('Ahmedbacha1@#7', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{"role": "Platform Super Admin"}',
            now(),
            now(),
            '',
            '',
            '',
            ''
        );

        INSERT INTO auth.identities (
            id,
            provider_id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            new_user_id::text,
            new_user_id,
            format('{"sub":"%s","email":"%s"}', new_user_id::text, target_email)::jsonb,
            'email',
            now(),
            now(),
            now()
        );
    ELSE
        -- Update existing user metadata if needed
        UPDATE auth.users 
        SET raw_user_meta_data = '{"role": "Platform Super Admin"}'::jsonb 
        WHERE id = new_user_id;
    END IF;

    -- Upsert into platform_admins
    INSERT INTO public.platform_admins (user_id, role, is_active)
    VALUES (new_user_id, 'Super Admin', true)
    ON CONFLICT (user_id) DO UPDATE 
    SET role = 'Super Admin', is_active = true;

END $$;

