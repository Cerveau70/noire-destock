
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Loader2, MapPin, TrendingUp, HelpCircle } from 'lucide-react';
import { sendMessageToGemini, getGeminiApiKey } from '../services/geminiService';
import { ChatMessage, Product } from '../types';

interface AIChatProps {
  productContext?: Product[];
}

const AIChat: React.FC<AIChatProps> = ({ productContext = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Bonjour ! Je suis l\'assistant IvoireDestock. Je peux vous aider à trouver des produits à proximité ou vous conseiller pour économiser.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Prepare product context string for the AI using real data if available
  const productContextString = productContext.length > 0 
    ? productContext.map(p => `- ${p.name} (${p.category}): ${p.price} FCFA (au lieu de ${p.originalPrice}), Lieu: ${p.location}, Statut: ${p.status}`).join('\n')
    : "Aucun produit chargé actuellement.";

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(textToSend, getGeminiApiKey(), productContextString);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[1300] bg-[#064e3b] text-white p-4 rounded-full shadow-xl hover:bg-[#065f46] transition-all duration-300 transform hover:scale-105 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle size={26} />
      </button>

      {/* Chat Window */}
      <div className={`fixed inset-0 md:bottom-6 md:right-6 md:inset-auto z-[1310] w-full md:max-w-sm bg-white md:rounded-t-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="bg-[#064e3b] p-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-full">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">Assistant IA</h3>
              <p className="text-xs text-emerald-200 uppercase tracking-wider">Toujours disponible</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="h-[60vh] md:h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#064e3b] text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm flex items-center space-x-2">
                 <Loader2 size={16} className="animate-spin text-[#064e3b]" />
                 <span className="text-xs text-gray-500 font-medium">Réflexion en cours...</span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Chips */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
           <button 
             onClick={() => handleSend("Quels sont les produits disponibles à Yopougon ?")}
             className="flex-shrink-0 flex items-center gap-1 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:border-[#064e3b] hover:text-[#064e3b] transition-colors whitespace-nowrap"
           >
             <MapPin size={10} /> À proximité
           </button>
           <button 
             onClick={() => handleSend("Comment puis-je économiser sur mes achats aujourd'hui ?")}
             className="flex-shrink-0 flex items-center gap-1 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:border-[#064e3b] hover:text-[#064e3b] transition-colors whitespace-nowrap"
           >
             <TrendingUp size={10} /> Économies
           </button>
           <button 
             onClick={() => handleSend("Je suis vendeur, comment mieux écouler mon stock de produits date courte ?")}
             className="flex-shrink-0 flex items-center gap-1 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-600 hover:border-[#064e3b] hover:text-[#064e3b] transition-colors whitespace-nowrap"
           >
             <HelpCircle size={10} /> Aide Vendeur
           </button>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez votre question..."
              className="flex-1 bg-gray-100 border-none rounded-none px-4 py-3 text-sm focus:ring-2 focus:ring-[#064e3b] focus:bg-white transition-colors"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-[#064e3b] text-white rounded-none hover:bg-[#065f46] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
          {!getGeminiApiKey() && (
            <p className="text-xs text-red-500 mt-2 text-center">Clé Gemini manquante (VITE_GEMINI_API_KEY).</p>
          )}
        </div>
      </div>
    </>
  );
};

export default AIChat;
