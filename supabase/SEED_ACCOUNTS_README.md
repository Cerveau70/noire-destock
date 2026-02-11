# Comptes démo (Admin, Client, Centrale)

## Pourquoi les comptes n’apparaissent pas ?

La requête qui fait uniquement :

```sql
INSERT INTO public.profiles (...)
SELECT id, ... FROM auth.users WHERE email = 'admin@gmail.com'
```

**ne crée aucun profil** tant que les utilisateurs n’existent pas dans **Auth** (`auth.users`).  
Si `admin@gmail.com` / `client@gmail.com` / `central@gmail.com` ne sont pas créés dans **Authentication**, le `SELECT` ne renvoie aucune ligne et aucun profil n’est inséré.

## Solution 1 : Migration (recommandé en local)

La migration **`20250211_seed_demo_accounts.sql`** :

1. Crée les 3 utilisateurs dans `auth.users` (avec mot de passe hashé)
2. Crée les entrées dans `auth.identities` (pour que la connexion fonctionne)
3. Crée ou met à jour les lignes dans `public.profiles` avec les bons rôles

**Mot de passe commun pour les 3 comptes : `Password123!`**

- Appliquer les migrations : `supabase db reset` (local) ou déployer les migrations sur le projet Supabase.
- En local, les comptes seront créés automatiquement.

## Solution 2 : Supabase hébergé (si la migration n’a pas le droit d’écrire dans `auth`)

1. **Créer les 3 utilisateurs à la main**  
   Dashboard Supabase → **Authentication** → **Users** → **Add user** :
   - `admin@gmail.com`
   - `client@gmail.com`
   - `central@gmail.com`  
   Choisir un mot de passe pour chacun (ou le même, ex. `Password123!`).

2. **Puis exécuter le SQL des profils** dans **SQL Editor** (voir ci‑dessous).

## SQL à exécuter si les utilisateurs existent déjà (Auth)

Si les 3 comptes sont déjà créés dans **Authentication**, exécuter ceci dans le **SQL Editor** du Dashboard pour créer/mettre à jour les profils :

```sql
-- 1. Admin (SUPER_ADMIN)
INSERT INTO public.profiles (id, full_name, email, role, wallet_balance, status)
SELECT id, 'Admin', 'admin@gmail.com', 'SUPER_ADMIN', 0, 'ACTIVE'
FROM auth.users WHERE email = 'admin@gmail.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'Admin', role = 'SUPER_ADMIN', email = 'admin@gmail.com';

-- 2. Client (BUYER)
INSERT INTO public.profiles (id, full_name, email, role, wallet_balance, status)
SELECT id, 'Client', 'client@gmail.com', 'BUYER', 0, 'ACTIVE'
FROM auth.users WHERE email = 'client@gmail.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'Client', role = 'BUYER', email = 'client@gmail.com';

-- 3. Centrale (PARTNER_ADMIN)
INSERT INTO public.profiles (id, full_name, email, role, wallet_balance, status)
SELECT id, 'Centrale', 'central@gmail.com', 'PARTNER_ADMIN', 0, 'ACTIVE'
FROM auth.users WHERE email = 'central@gmail.com'
ON CONFLICT (id) DO UPDATE SET full_name = 'Centrale', role = 'PARTNER_ADMIN', email = 'central@gmail.com';
```

## Récap des comptes

| Email             | Rôle            | Mot de passe (si créés par la migration) |
|-------------------|-----------------|-------------------------------------------|
| admin@gmail.com   | SUPER_ADMIN     | Password123!                              |
| client@gmail.com  | BUYER           | Password123!                              |
| central@gmail.com | PARTNER_ADMIN   | Password123!                              |
