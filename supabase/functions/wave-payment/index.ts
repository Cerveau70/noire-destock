// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const BASE_URL = 'https://api.geniuspay.com/v1';
const GENIUSPAY_API_KEY = Deno.env.get('GENIUSPAY_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const applyTopup = async (ref: string) => {
  if (!supabase) return;
  const { data: txs } = await supabase
    .from('wallet_transactions')
    .select('id, user_id, amount, status')
    .eq('payment_ref', ref);

  for (const tx of txs || []) {
    if (tx.status === 'COMPLETED') continue;
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', tx.user_id)
      .single();
    const newBalance = Number(profile?.wallet_balance || 0) + Number(tx.amount || 0);
    await supabase.from('profiles').update({ wallet_balance: newBalance }).eq('id', tx.user_id);
    await supabase.from('wallet_transactions').update({ status: 'COMPLETED' }).eq('id', tx.id);
  }
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action, amount, phoneNumber, orderId, transactionId, reference, status } = body;

    if (!GENIUSPAY_API_KEY) {
      return new Response(JSON.stringify({ success: false, message: "Clé API GeniusPay manquante." }), { headers: { "Content-Type": "application/json" }, status: 500 });
    }

    if (action === 'initiate') {
      const formattedPhone = (phoneNumber || '').replace(/\s/g, '').replace('+225', '');

      const payload = {
        amount,
        currency: 'XOF',
        payment_method: 'wave',
        phone_number: `225${formattedPhone}`,
        reference: orderId,
        description: `Commande IvoireDestock #${orderId}`,
        return_url: 'https://ivoiredestock.com/payment/callback',
      };

      const response = await fetch(`${BASE_URL}/payin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GENIUSPAY_API_KEY}`,
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ success: false, message: errorText || 'Erreur API GeniusPay' }), { headers: { "Content-Type": "application/json" }, status: 400 });
      }

      const data = await response.json();
      return new Response(JSON.stringify({
        success: true,
        message: 'Paiement initié avec succès.',
        transactionId: data?.id || data?.transaction_id,
        paymentUrl: data?.payment_url
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (action === 'verify') {
      const response = await fetch(`${BASE_URL}/payin/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GENIUSPAY_API_KEY}`,
  }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({ success: false, message: errorText || 'Erreur API GeniusPay' }), { headers: { "Content-Type": "application/json" }, status: 400 });
      }

      const data = await response.json();
      const status = (data?.status || '').toLowerCase();
      const isPaid = ['paid', 'success', 'completed'].includes(status);

      if (isPaid && supabase && orderId) {
        if (String(orderId).startsWith('TOPUP-')) {
          await applyTopup(String(orderId));
        }
        const { data: orders } = await supabase
          .from('orders')
          .select('id, seller_amount')
          .or(`id.eq.${orderId},payment_ref.eq.${orderId}`);

        for (const o of orders || []) {
          await supabase.from('orders').update({
            status: 'PAID',
            payout_status: 'ESCROW',
            escrow_amount: o.seller_amount || 0
          }).eq('id', o.id);
        }
      }

      return new Response(JSON.stringify({
        success: isPaid,
        message: isPaid ? 'Paiement confirmé.' : 'Paiement en attente.',
        transactionId,
        status: data?.status
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (action === 'callback') {
      const ref = orderId || reference;
      const normalizedStatus = (status || '').toLowerCase();
      const isPaid = ['paid', 'success', 'completed'].includes(normalizedStatus);

      if (isPaid && supabase && ref) {
        if (String(ref).startsWith('TOPUP-')) {
          await applyTopup(String(ref));
        }
        const { data: orders } = await supabase
          .from('orders')
          .select('id, seller_amount')
          .or(`id.eq.${ref},payment_ref.eq.${ref}`);

        for (const o of orders || []) {
          await supabase.from('orders').update({
            status: 'PAID',
            payout_status: 'ESCROW',
            escrow_amount: o.seller_amount || 0
          }).eq('id', o.id);
        }
      }

      return new Response(JSON.stringify({
        success: isPaid,
        message: isPaid ? 'Paiement confirmé via callback.' : 'Paiement non confirmé.',
        reference: ref
      }), { headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, message: "Action invalide." }), { headers: { "Content-Type": "application/json" }, status: 400 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "Erreur serveur." }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/wave-payment' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODQ1ODM1MTZ9.n6TXGnBSDQ_MBByjql6gnhqC_ihHlwe34Yrdz76I3qtUjHtfiOspN4Jovgqkp6sIfKuqcQjSKtE7_SiPx-eTDw' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
