import { GoogleGenAI, Chat } from "@google/genai";

let chatSession: Chat | null = null;

// Helper pour récupérer les variables d'env (Vite, CRA, Next, Expo)
const getEnv = (key: string): string | undefined => {
  // 1. Support Vite (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  
  // 2. Support CRA / Next.js (process.env)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  // 3. Support Expo Mobile
  if (typeof process !== 'undefined' && process.env && process.env[`EXPO_PUBLIC_${key.replace('REACT_APP_', '')}`]) {
    return process.env[`EXPO_PUBLIC_${key.replace('REACT_APP_', '')}`];
  }

  return undefined;
};

export const getGeminiApiKey = (): string | undefined => {
  return getEnv('VITE_GEMINI_API_KEY') || getEnv('REACT_APP_GEMINI_API_KEY') || getEnv('EXPO_PUBLIC_GEMINI_API_KEY');
};

const BASE_SYSTEM_INSTRUCTION = `
Tu es l'assistant virtuel intelligent d'IVOIREDESTOCK, la plateforme n°1 de déstockage alimentaire en Côte d'Ivoire.
Ton rôle est d'aider les utilisateurs (acheteurs B2B/B2C et vendeurs) de manière proactive.

Règles de comportement :
1. Langue : Français (Ton respectueux, chaleureux, "Ivoirien professionnel").
2. Expertise Produit : Tu dois aider à trouver des produits en fonction de la localisation et du besoin.
3. Éducation : Explique clairement les statuts "Invendu" (Surplus), "Date Courte" (Encore bon à consommer) et "Abîmé" (Emballage seulement).
4. Pour les Vendeurs (Admins) : Donne des conseils pour mieux vendre (ex: "Baissez le prix si la DLUO est < 1 mois", "Faites un lot").
5. Pour les Acheteurs : Suggère des recettes ou des achats groupés pour économiser.
6. Localisation : Si on te demande des produits à "Yopougon" ou "Cocody", utilise le contexte fourni pour répondre.

Contexte monétaire : Toujours en Franc CFA (FCFA).
`;

export const getGeminiChat = async (apiKey: string, productContext: string = "") => {
  // If session exists, we might want to keep it, but for context updates (products changed), we might recreate or send a system update.
  // For simplicity, we'll recreate if context is provided to ensure freshness, or reuse if just chatting.
  
  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstructionWithContext = `
    ${BASE_SYSTEM_INSTRUCTION}
    
    VOICI LA LISTE DES PRODUITS DISPONIBLES ACTUELLEMENT SUR LA PLATEFORME :
    ${productContext}
    
    Utilise cette liste pour recommander des produits précis quand l'utilisateur demande "Qu'est-ce qu'il y a à Yopougon ?" ou "Je veux du riz".
  `;

  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash-preview',
    config: {
      systemInstruction: systemInstructionWithContext,
      temperature: 0.7,
    },
  });

  return chatSession;
};

export const sendMessageToGemini = async (message: string, apiKey?: string, productContext: string = ""): Promise<string> => {
  try {
    const resolvedKey = apiKey || getGeminiApiKey();
    if (!resolvedKey) {
      return "Clé API Gemini manquante. Veuillez configurer VITE_GEMINI_API_KEY.";
    }
    // We pass productContext to initialize the chat with data awareness
    const chat = await getGeminiChat(resolvedKey, productContext);
    const result = await chat.sendMessage({ message });
    return result.text || "Désolé, je n'ai pas pu traiter votre demande.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Une erreur est survenue lors de la communication avec l'assistant. Veuillez réessayer.";
  }
};