import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Apikey, X-Client-Info',
  'Access-Control-Max-Age': '86400',
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

const getRequester = async (req: Request) => {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    console.log('admin-users: no token');
    return null;
  }
  if (!SUPABASE_ANON_KEY) {
    console.log('admin-users: SUPABASE_ANON_KEY missing');
    return null;
  }
  const clientAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await clientAnon.auth.getUser(token);
  if (error) {
    console.log('admin-users getUser error:', error.message);
    return null;
  }
  if (!data?.user) {
    console.log('admin-users: no user in response');
    return null;
  }
  return data.user;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const { action, userId, email, password, role, full_name, phone, business_name, location, status } = body;

    const requester = await getRequester(req);
    if (!requester) {
      return json({ success: false, message: "Non autorisé." }, 401);
    }

    const { data: requesterProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single();

    if (requesterProfile?.role !== 'SUPER_ADMIN') {
      return json({ success: false, message: "Accès refusé." }, 403);
    }

    if (action === 'create_admin') {
      if (!email || !password || !role) {
        return json({ success: false, message: "email, password ou role manquant." }, 400);
      }
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || 'Admin',
          role,
          phone: phone || null,
          business_name: business_name || null,
          location: location || null
        }
      });
      if (error || !data?.user) {
        return json({ success: false, message: error?.message || "Création échouée." }, 400);
      }
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        full_name: full_name || 'Admin',
        role,
        email,
        phone: phone || null,
        business_name: business_name || null,
        location: location || null,
        status: 'ACTIVE'
      });
      return json({ success: true, userId: data.user.id });
    }

    if (action === 'update_user') {
      if (!userId) return json({ success: false, message: "userId manquant." }, 400);
      const updates: Record<string, unknown> = {};
      if (role !== undefined) updates.role = role;
      if (business_name !== undefined) updates.business_name = business_name;
      if (status !== undefined) updates.status = status;
      if (full_name !== undefined) updates.full_name = full_name;
      if (Object.keys(updates).length === 0) return json({ success: false, message: "Aucune modification." }, 400);
      await supabaseAdmin.from('profiles').update(updates).eq('id', userId);
      return json({ success: true });
    }

    if (!userId) {
      return json({ success: false, message: "userId manquant." }, 400);
    }

    if (action === 'soft_delete') {
      await supabaseAdmin.from('profiles').update({ status: 'DELETED', deleted_at: new Date().toISOString() }).eq('id', userId);
      return json({ success: true });
    }

    if (action === 'reactivate') {
      await supabaseAdmin.from('profiles').update({ status: 'ACTIVE', deleted_at: null }).eq('id', userId);
      return json({ success: true });
    }

    if (action === 'revoke_access') {
      await supabaseAdmin.from('profiles').update({ status: 'SUSPENDED' }).eq('id', userId);
      return json({ success: true });
    }

    if (action === 'reset_password') {
      if (!email) {
        return json({ success: false, message: "email manquant." }, 400);
      }
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
      } as any);
      if (error) {
        return json({ success: false, message: error.message }, 400);
      }
      return json({ success: true, action_link: data?.properties?.action_link });
    }

    return json({ success: false, message: "Action invalide." }, 400);
  } catch (_err) {
    return json({ success: false, message: "Erreur serveur." }, 500);
  }
});
