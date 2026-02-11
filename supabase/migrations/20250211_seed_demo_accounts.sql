-- Seed des comptes démo : Admin, Client, Centrale
-- Crée les utilisateurs dans auth.users + auth.identities, puis les profils dans public.profiles.
-- Mot de passe commun pour les 3 comptes : Password123!
-- À exécuter une seule fois (idempotent : n'ajoute que si l'email n'existe pas).

create extension if not exists "pgcrypto";

-- Helper : crée un utilisateur auth + identité + profil si l'email n'existe pas
do $$
declare
  v_user_id uuid;
  v_encrypted_pw text := crypt('Password123!', gen_salt('bf'));
  v_instance_id uuid := '00000000-0000-0000-0000-000000000000';
  v_app_meta jsonb := '{"provider":"email","providers":["email"]}'::jsonb;
begin
  -- 1. Admin (SUPER_ADMIN)
  if not exists (select 1 from auth.users where email = 'admin@gmail.com') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_user_id, v_instance_id, 'authenticated', 'authenticated', 'admin@gmail.com', v_encrypted_pw, now(), v_app_meta, '{"full_name":"Admin"}'::jsonb, now(), now());
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (v_user_id, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', 'admin@gmail.com'), 'email', v_user_id::text, now(), now(), now());
    insert into public.profiles (id, full_name, email, role, wallet_balance, status)
    values (v_user_id, 'Admin', 'admin@gmail.com', 'SUPER_ADMIN', 0, 'ACTIVE')
    on conflict (id) do update set full_name = 'Admin', role = 'SUPER_ADMIN', email = 'admin@gmail.com';
  else
    update public.profiles set full_name = 'Admin', role = 'SUPER_ADMIN', email = 'admin@gmail.com'
    where id = (select id from auth.users where email = 'admin@gmail.com' limit 1);
  end if;

  -- 2. Client (BUYER)
  if not exists (select 1 from auth.users where email = 'client@gmail.com') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_user_id, v_instance_id, 'authenticated', 'authenticated', 'client@gmail.com', v_encrypted_pw, now(), v_app_meta, '{"full_name":"Client"}'::jsonb, now(), now());
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (v_user_id, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', 'client@gmail.com'), 'email', v_user_id::text, now(), now(), now());
    insert into public.profiles (id, full_name, email, role, wallet_balance, status)
    values (v_user_id, 'Client', 'client@gmail.com', 'BUYER', 0, 'ACTIVE')
    on conflict (id) do update set full_name = 'Client', role = 'BUYER', email = 'client@gmail.com';
  else
    update public.profiles set full_name = 'Client', role = 'BUYER', email = 'client@gmail.com'
    where id = (select id from auth.users where email = 'client@gmail.com' limit 1);
  end if;

  -- 3. Accès Grossiste (PARTNER_ADMIN)
  if not exists (select 1 from auth.users where email = 'central@gmail.com') then
    v_user_id := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_user_id, v_instance_id, 'authenticated', 'authenticated', 'central@gmail.com', v_encrypted_pw, now(), v_app_meta, '{"full_name":"Centrale"}'::jsonb, now(), now());
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (v_user_id, v_user_id, jsonb_build_object('sub', v_user_id::text, 'email', 'central@gmail.com'), 'email', v_user_id::text, now(), now(), now());
    insert into public.profiles (id, full_name, email, role, wallet_balance, status)
    values (v_user_id, 'Centrale', 'central@gmail.com', 'PARTNER_ADMIN', 0, 'ACTIVE')
    on conflict (id) do update set full_name = 'Centrale', role = 'PARTNER_ADMIN', email = 'central@gmail.com';
  else
    update public.profiles set full_name = 'Centrale', role = 'PARTNER_ADMIN', email = 'central@gmail.com'
    where id = (select id from auth.users where email = 'central@gmail.com' limit 1);
  end if;
end $$;
