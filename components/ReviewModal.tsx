import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Product } from '../types';

interface ReviewModalProps {
  product: Product;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ product, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0f172a] bg-opacity-80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md p-8 relative shadow-2xl animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
          <X size={24} />
        </button>

        <h2 className="text-xl font-black text-[#0f172a] uppercase mb-1">Noter ce produit</h2>
        <p className="text-sm text-gray-500 mb-6">{product.name}</p>

        <div className="flex flex-col items-center mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Votre Note</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star 
                  size={32} 
                  className={`${star <= (hoverRating || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Votre Commentaire</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience sur la qualité, le prix..."
            className="w-full border border-gray-200 p-3 h-32 focus:ring-2 focus:ring-[#064e3b] outline-none text-sm resize-none bg-gray-50"
          ></textarea>
        </div>

        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="w-full bg-[#064e3b] text-white py-4 font-bold uppercase tracking-widest hover:bg-[#065f46] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Publier l'avis
        </button>
      </div>
    </div>
  );
};

export default ReviewModal;