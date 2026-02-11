
import { Product, FeedbackTicket } from '../types';

// NOTE: Once Supabase is connected, replace these exports with calls to services/backendService.ts

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Riz Parfumé 25kg - Dinor',
    category: 'Alimentaire',
    price: 18500,
    originalPrice: 22000,
    stock: 50,
    status: 'INVENDU',
    expiryDate: '2025-12-01',
    location: 'Abidjan - Yopougon',
    image: 'https://picsum.photos/400/400?random=1',
    description: 'Sac de riz parfumé de qualité supérieure. Surplus de stock distributeur.',
    supplier: 'Central d\'Achat Abidjan',
    reviews: [
      { id: 'r1', userName: 'Moussa K.', rating: 5, comment: 'Excellent prix pour du Dinor !', date: '2024-03-10' },
      { id: 'r2', userName: 'Awa D.', rating: 4, comment: 'Livraison un peu lente mais produit top.', date: '2024-03-08' }
    ]
  },
  {
    id: '2',
    name: 'Lait Concentré Sucré (Lot de 24)',
    category: 'Laiterie',
    price: 12000,
    originalPrice: 18000,
    stock: 15,
    status: 'DATE_COURTE',
    expiryDate: '2024-06-30',
    location: 'Abidjan - Cocody',
    image: 'https://picsum.photos/400/400?random=2',
    description: 'Lait concentré sucré. Date de durabilité minimale proche. Parfait pour pâtisserie.',
    supplier: 'Supermarché Pro',
    reviews: [
      { id: 'r3', userName: 'Patisserie Délices', rating: 5, comment: 'Parfait pour mes gâteaux, je recommande.', date: '2024-03-12' }
    ]
  },
  {
    id: '3',
    name: 'Huile de Palme 5L - Aya',
    category: 'Huiles',
    price: 6500,
    originalPrice: 8500,
    stock: 20,
    status: 'ABIME',
    expiryDate: '2025-05-15',
    location: 'Yamoussoukro',
    description: 'Bidon légèrement déformé mais hermétiquement scellé. Contenu intact.',
    image: 'https://picsum.photos/400/400?random=3',
    supplier: 'Grossiste Yopougon',
    reviews: []
  },
  {
    id: '4',
    name: 'Pâtes Spaghetti 500g (Carton)',
    category: 'Alimentaire',
    price: 9000,
    originalPrice: 11000,
    stock: 100,
    status: 'INVENDU',
    expiryDate: '2026-01-01',
    location: 'Abidjan - Treichville',
    image: 'https://picsum.photos/400/400?random=4',
    description: 'Carton de 20 paquets de pâtes. Déstockage fin de série.',
    supplier: 'Importateur Zone 4',
    reviews: [
      { id: 'r4', userName: 'Maquis le Résistant', rating: 4, comment: 'Bonne affaire pour le stock de la semaine.', date: '2024-03-01' }
    ]
  },
  {
    id: '5',
    name: 'Tomate Concentrée (Boîte 2.2kg)',
    category: 'Conserves',
    price: 3500,
    originalPrice: 5000,
    stock: 40,
    status: 'DATE_COURTE',
    expiryDate: '2024-07-15',
    location: 'San Pedro',
    image: 'https://picsum.photos/400/400?random=5',
    description: 'Grand format pour restaurateurs. DLUO courte.',
    supplier: 'Central d\'Achat Abidjan',
    reviews: []
  },
  {
    id: '6',
    name: 'Jus de Fruits Mix (Pack 6L)',
    category: 'Boissons',
    price: 4000,
    originalPrice: 6500,
    stock: 12,
    status: 'ABIME',
    expiryDate: '2024-11-20',
    location: 'Abidjan - Marcory',
    image: 'https://picsum.photos/400/400?random=6',
    description: 'Emballage carton extérieur déchiré. Bouteilles intactes.',
    supplier: 'Supermarché Pro',
    reviews: [
      { id: 'r5', userName: 'Jean-Marc', rating: 3, comment: 'Le carton était vraiment en mauvais état, mais le jus est bon.', date: '2024-02-20' }
    ]
  }
];

export const MOCK_TICKETS: FeedbackTicket[] = [
  {
    id: 't1',
    userId: 'u1',
    userRole: 'STORE_ADMIN',
    type: 'FEATURE',
    subject: 'Ajout de paiement par QR Code direct',
    description: 'Il serait utile de pouvoir scanner le QR code client directement depuis l\'interface vendeur pour valider.',
    status: 'IN_PROGRESS',
    date: '2024-03-15'
  },
  {
    id: 't2',
    userId: 'u2',
    userRole: 'PARTNER_ADMIN',
    type: 'BUG',
    subject: 'Erreur import CSV',
    description: 'L\'import échoue quand le fichier dépasse 5MB.',
    status: 'PENDING',
    date: '2024-03-16'
  },
  {
    id: 't3',
    userId: 'u1',
    userRole: 'STORE_ADMIN',
    type: 'NEED',
    subject: 'Besoin de formation équipe',
    description: 'Pouvons-nous organiser une session pour mes nouveaux caissiers ?',
    status: 'RESOLVED',
    date: '2024-03-10'
  }
];
