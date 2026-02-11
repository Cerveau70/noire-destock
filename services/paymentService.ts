
/**
 * SERVICE DE PAIEMENT - GENIUSPAY
 * Intégration via Supabase Edge Function
 */
import { supabase } from './supabaseClient';

// Helper pour récupérer les variables d'env quel que soit l'environnement (Vite, CRA, Next, Expo)
const getEnv = (key: string): string | undefined => {
  // 1. Support Vite (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  
  // 2. Support Create React App / Next.js (process.env)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  // 3. Support Expo Mobile
  if (typeof process !== 'undefined' && process.env && process.env[`EXPO_PUBLIC_${key.replace('REACT_APP_', '')}`]) {
    return process.env[`EXPO_PUBLIC_${key.replace('REACT_APP_', '')}`];
  }

  return undefined;
};

const GENIUSPAY_API_KEY = getEnv('REACT_APP_GENIUSPAY_API_KEY') || getEnv('VITE_GENIUSPAY_API_KEY');
const GENIUSPAY_SECRET_KEY = getEnv('REACT_APP_GENIUSPAY_SECRET_KEY') || getEnv('VITE_GENIUSPAY_SECRET_KEY');

// En mode dév, on utilise des fallbacks SI ET SEULEMENT SI aucune clé n'est trouvée, 
// mais on avertit dans la console.
const IS_DEV = process.env.NODE_ENV === 'development';
const ACTIVE_API_KEY = GENIUSPAY_API_KEY || (IS_DEV ? 'gp_Nyoe0Q7oBEnkU2j2JnqFXa0j9f3dKpgh' : '');
const ACTIVE_SECRET_KEY = GENIUSPAY_SECRET_KEY || (IS_DEV ? 'Gtav3pQa1hYGDGV9Gef3WX0jlvEanvQa' : '');

const BASE_URL = 'https://api.geniuspay.com/v1'; 

interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  paymentUrl?: string;
}

export const initiateWavePayment = async (amount: number, phoneNumber: string, orderId: string): Promise<PaymentResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('wave-payment', {
      body: {
        action: 'initiate',
        amount,
        phoneNumber,
        orderId
      }
    });
    
    if (error) throw error;
    return data as PaymentResponse;
  } catch (error: any) {
    console.error("Erreur Paiement GeniusPay:", error);
    return {
      success: false,
      message: "Échec de la communication avec le service de paiement."
    };
  }
};

export const verifyWavePayment = async (transactionId: string, orderId: string): Promise<PaymentResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('wave-payment', {
      body: {
        action: 'verify',
        transactionId,
        orderId
      }
    });

    if (error) throw error;
    return data as PaymentResponse;
  } catch (error: any) {
    console.error("Erreur Vérification GeniusPay:", error);
    return {
      success: false,
      message: "Impossible de vérifier le paiement pour le moment."
    };
  }
};
