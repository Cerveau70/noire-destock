import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const getRequester = async (req: Request) => {
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader) return null;
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data } = await supabaseAuth.auth.getUser();
  return data?.user || null;
};

Deno.serve(async (req) => {
  try {
    const { action, userId, email, password, role, full_name, phone, business_name, location } = await req.json();

    const requester = await getRequester(req);
    if (!requester) {
      return new Response(JSON.stringify({ success: false, message: "Non autorisé." }), { status: 401 });
    }

    const { data: requesterProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single();

    if (requesterProfile?.role !== 'SUPER_ADMIN') {
      return new Response(JSON.stringify({ success: false, message: "Accès refusé." }), { status: 403 });
    }

    if (action === 'create_admin') {
      if (!email || !password || !role) {
        return new Response(JSON.stringify({ success: false, message: "email, password ou role manquant." }), { status: 400 });
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
        return new Response(JSON.stringify({ success: false, message: error?.message || "Création échouée." }), { status: 400 });
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
      return new Response(JSON.stringify({ success: true, userId: data.user.id }), { status: 200 });
    }

    if (!userId) {
      return new Response(JSON.stringify({ success: false, message: "userId manquant." }), { status: 400 });
    }

    if (action === 'soft_delete') {
      await supabaseAdmin.from('profiles').update({ status: 'DELETED', deleted_at: new Date().toISOString() }).eq('id', userId);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'reactivate') {
      await supabaseAdmin.from('profiles').update({ status: 'ACTIVE', deleted_at: null }).eq('id', userId);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'revoke_access') {
      await supabaseAdmin.from('profiles').update({ status: 'SUSPENDED' }).eq('id', userId);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (action === 'reset_password') {
      if (!email) {
        return new Response(JSON.stringify({ success: false, message: "email manquant." }), { status: 400 });
      }
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
      } as any);
      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 400 });
      }
      return new Response(JSON.stringify({ success: true, action_link: data?.properties?.action_link }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, message: "Action invalide." }), { status: 400 });
  } catch (_err) {
    return new Response(JSON.stringify({ success: false, message: "Erreur serveur." }), { status: 500 });
  }
});
