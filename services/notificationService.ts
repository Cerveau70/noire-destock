
import { supabase } from './supabaseClient';

/**
 * SERVICE DE NOTIFICATIONS (Twilio / WhatsApp / Push)
 * Ce service appelle des "Edge Functions" Supabase qui contiennent la logique serveur sécurisée.
 * Ne JAMAIS mettre les clés API Twilio directement ici côté client.
 */

interface NotificationPayload {
  to: string; // Numéro de téléphone (+225...)
  message: string;
  channel: 'SMS' | 'WHATSAPP';
}

export const sendNotification = async (payload: NotificationPayload) => {
  console.log(`[Simulation] Envoi ${payload.channel} à ${payload.to}: ${payload.message}`);
  
  // En Production, décommentez ceci pour appeler votre Edge Function Supabase :
  /*
  const { data, error } = await supabase.functions.invoke('send-notification', {
    body: payload,
  });

  if (error) {
    console.error('Erreur envoi notification:', error);
    return false;
  }
  return true;
  */

  // Pour la démo, on simule un succès
  return new Promise((resolve) => setTimeout(() => resolve(true), 1000));
};

export const sendOTP = async (phoneNumber: string) => {
  // Supabase Auth gère nativement l'OTP mobile si configuré
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
  });
  
  return { data, error };
};

export const verifyOTP = async (phoneNumber: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token: token,
    type: 'sms',
  });

  return { data, error };
};

// Fonction utilitaire pour le B2B (Gros Volumes)
export const notifyWholesaleOrder = async (orderDetails: any) => {
  // Notifier l'admin vendeur sur WhatsApp
  await sendNotification({
    to: '+22507000000', // Numéro du vendeur (mock)
    channel: 'WHATSAPP',
    message: `Nouvelle commande B2B Reçue ! Montant: ${orderDetails.total} FCFA. Client: ${orderDetails.clientName}`
  });

  // Notifier le client par SMS
  await sendNotification({
    to: orderDetails.clientPhone,
    channel: 'SMS',
    message: `IVOIREDESTOCK: Votre commande de gros #${orderDetails.id} est en attente de validation.`
  });
};
