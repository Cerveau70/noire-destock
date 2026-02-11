/**
 * Génère le document de livraison bêta au format .docx
 * Exécuter : node scripts/generate-livraison-doc.mjs
 */
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };

const p = (text) => new Paragraph({ children: [new TextRun(text)], spacing: { after: 100 } });
const pBold = (text) => new Paragraph({ children: [new TextRun({ text, bold: true })], spacing: { after: 100 } });
const h1 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } });
const h2 = (text) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } });
const empty = () => new Paragraph({ text: '', spacing: { after: 80 } });

const doc = new Document({
  title: 'Document de livraison bêta - IVOIRE DESTOCK',
  creator: 'Prestataire',
  sections: [{
    properties: {},
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'DOCUMENT DE LIVRAISON – VERSION BÊTA', bold: true, size: 32 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: 'Application IVOIRE DESTOCK (PWA / Mobile)', bold: true, size: 28 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '—', color: '999999' })] }),
      empty(),

      h1('1. INFORMATIONS GÉNÉRALES'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: border, bottom: border, left: border, right: border },
        rows: [
          new TableRow({ children: [new TableCell({ children: [pBold('Champ')], width: { size: 35, type: WidthType.PERCENTAGE } }), new TableCell({ children: [p('Détail')], width: { size: 65, type: WidthType.PERCENTAGE } })] }),
          new TableRow({ children: [new TableCell({ children: [p('Projet')] }), new TableCell({ children: [p('IVOIRE DESTOCK – Plateforme anti-gaspillage (catalogue, commandes, paiement, espaces client / vendeur / centrale d\'achat)')] })] }),
          new TableRow({ children: [new TableCell({ children: [p('Version livrée')] }), new TableCell({ children: [p('Version bêta (V1.0-beta)')] })] }),
          new TableRow({ children: [new TableCell({ children: [p('Date de livraison')] }), new TableCell({ children: [p('[JJ/MM/AAAA]')] })] }),
          new TableRow({ children: [new TableCell({ children: [p('Environnement')] }), new TableCell({ children: [p('PWA (web) + préparation build Android (APK/AAB)')] })] }),
        ],
      }),
      empty(), empty(),

      h1('2. PRESTATAIRE (LIVREUR) – COORDONNÉES ET PAIEMENT'),
      pBold('Livré par :'),
      p('• Nom / Raison sociale : [Votre nom ou raison sociale]'),
      p('• Email : [votre.email@exemple.com]'),
      p('• Téléphone : [+225 XX XX XX XX XX]'),
      empty(),
      pBold('Coordonnées pour le règlement :'),
      p('• Mobile Money (Wave / Orange Money / MTN MoMo) : [Numéro au format 07XXXXXXXX ou 05XXXXXXXX]'),
      p('• Carte bancaire (si applicable) : [Numéro de carte ou IBAN / compte bancaire pour virement]'),
      p('Tout paiement devra être effectué aux coordonnées ci-dessus, après accord des deux parties sur les montants et les échéances prévus au présent document.'),
      empty(), empty(),

      h1('3. CLIENT (BÉNÉFICIAIRE)'),
      pBold('Livré à :'),
      p('• Nom / Raison sociale : [Nom du client]'),
      p('• Email : [email@client.com]'),
      p('• Téléphone : [Numéro du client]'),
      empty(), empty(),

      h1('4. OBJET DE LA LIVRAISON BÊTA'),
      p('La présente livraison concerne la version bêta de l\'application IVOIRE DESTOCK. Elle inclut l\'ensemble des fonctionnalités listées ci-dessous, utilisables en l\'état, sous réserve des points « à finaliser » mentionnés au paragraphe 5.'),
      empty(), empty(),

      h1('5. CONTENU LIVRÉ (FONCTIONNALITÉS INCLUSES DANS LA BÊTA)'),
      h2('5.1 Côté utilisateur (acheteur / client)'),
      p('• Inscription et connexion (email/mot de passe et Google).'),
      p('• Espace client : tableau de bord, coordonnées, solde wallet, historique des commandes.'),
      p('• Catalogue produits avec recherche, filtres (prix, catégorie, localisation, état) et catégories (dont « Toutes »).'),
      p('• Panier, passage de commande, choix du moyen de paiement (Solde / Wallet, Wave, Orange Money, MTN MoMo).'),
      p('• Recharge du wallet depuis l\'espace client.'),
      p('• Favoris (liste et gestion).'),
      p('• Paramètres & aide : accès aux pages d\'aide, FAQ, contact, à propos, conditions, cookies, etc.'),
      p('• Profil : photo de profil (avatar) avec possibilité de mise à jour depuis l\'appareil.'),
      p('• Navigation : barre inférieure (Accueil, Catégories, Panier, Favoris, Compte), menu burger, footer.'),
      empty(),
      h2('5.2 Côté vendeur (STORE_ADMIN)'),
      p('• Connexion dédiée (Devenir Vendeur).'),
      p('• Tableau de bord : chiffre d\'affaires, ventes totales, produits actifs.'),
      p('• Gestion du catalogue : création, modification, suppression de produits (CRUD) et import Excel (centrale).'),
      p('• Réception et suivi des commandes.'),
      p('• Historique des ventes.'),
      p('• Solde vendeur, demandes de retrait (Wave, Orange Money, MTN MoMo).'),
      p('• Messages B2B, suivi des livraisons.'),
      p('• Paramètres : profil, avatar (upload depuis l\'appareil), CNI, sécurité.'),
      p('• Tickets support (création et suivi).'),
      empty(),
      h2('5.3 Côté Accès Grossiste (PARTNER_ADMIN)'),
      p('• Connexion dédiée (Accès Grossiste).'),
      p('• Tableau de bord et indicateurs.'),
      p('• Catalogue centrale, import massif (Excel), règles de déstockage.'),
      p('• Commandes, livraisons, paramètres, tickets, commission.'),
      p('• Même base fonctionnelle que le vendeur, adaptée au rôle centrale.'),
      empty(),
      h2('5.4 Côté administrateur (SUPER_ADMIN)'),
      p('• Connexion dédiée (Support & Gestion).'),
      p('• Statistiques globales (chiffre d\'affaires, ventes, produits, utilisateurs, tickets, livraisons).'),
      p('• Gestion des utilisateurs (liste, création d\'admins, réactivation, réinitialisation mot de passe).'),
      p('• Catalogue global (tous les produits).'),
      p('• Tickets globaux, audit logs.'),
      p('• Stock vendeurs, bénéfices vendeurs, produits vendeurs.'),
      p('• Payouts, configuration globale, paramètres.'),
      empty(),
      h2('5.5 Technique livré en bêta'),
      p('• Application React (Vite) + Supabase (auth, base de données, storage).'),
      p('• Préparation build Android (Capacitor) ; build APK/AAB livré en phase finale (voir § 6).'),
      p('• Intégration des écrans et flux de paiement (Wave, Orange Money, MTN) ; connexion réelle aux APIs opérateurs et finalisation des webhooks à compléter en phase 2 (§ 6).'),
      empty(), empty(),

      h1('6. RÉSERVES – ÉLÉMENTS NON FINALISÉS (HORS PÉRIMÈTRE BÊTA)'),
      p('Les éléments suivants sont exclus du périmètre de la livraison bêta et seront livrés en phase 2 (après encaissement des 80 % et avant livraison finale) :'),
      p('1. APIs de paiement : finalisation des intégrations réelles avec les opérateurs (Wave, Orange Money, MTN) : webhooks de confirmation, réconciliation des statuts de paiement, gestion des échecs et des remboursements.'),
      p('2. Notifications : mise en place des notifications push (ou équivalent) pour les événements importants (commandes, livraisons, retraits, messages).'),
      p('3. Livrables techniques finaux : fichier AAB (Android App Bundle) pour publication sur le Play Store ; fichier APK pour distribution directe si besoin.'),
      p('La bêta est livrée et acceptée sous réserve de la finalisation de ces points en phase 2. Aucun retard ou refus de paiement des 80 % ne pourra être opposé au prestataire au motif de l\'absence de ces éléments à la date de la présente livraison.'),
      empty(), empty(),

      h1('7. MODALITÉS FINANCIÈRES ET DE PAIEMENT'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: border, bottom: border, left: border, right: border },
        rows: [
          new TableRow({ children: [new TableCell({ children: [pBold('Élément')] }), new TableCell({ children: [pBold('Montant (FCFA)')] }), new TableCell({ children: [pBold('Moment')] }), new TableCell({ children: [pBold('Règlement')] })] }),
          new TableRow({ children: [new TableCell({ children: [p('Livraison bêta (80 %)')] }), new TableCell({ children: [p('400 000 F')] }), new TableCell({ children: [p('À la livraison et acceptation de la version bêta')] }), new TableCell({ children: [p('Mobile Money ou virement/carte selon coordonnées § 2')] })] }),
          new TableRow({ children: [new TableCell({ children: [p('Phase 2 – Finalisation (20 %)')] }), new TableCell({ children: [p('100 000 F')] }), new TableCell({ children: [p('Après livraison des APIs paiement + notifs + fichiers AAB/APK et acceptation par le client')] }), new TableCell({ children: [p('Idem')] })] }),
          new TableRow({ children: [new TableCell({ children: [pBold('Total projet')] }), new TableCell({ children: [pBold('500 000 F')] }), new TableCell({ children: [p('—')] }), new TableCell({ children: [p('—')] })] }),
        ],
      }),
      empty(),
      p('• Le premier versement (80 %) est dû dans un délai de [X] jours ouvrés après signature du présent document et/ou acceptation écrite (email) de la livraison bêta.'),
      p('• Le second versement (20 %) est dû dans un délai de [X] jours ouvrés après livraison et acceptation des éléments de la phase 2 (APIs paiement, notifications, AAB/APK).'),
      p('Tout retard de paiement pourra donner lieu à l\'application de pénalités de retard et à la suspension des livraisons suivantes jusqu\'à régularisation.'),
      empty(), empty(),

      h1('8. ACCEPTATION DE LA LIVRAISON BÊTA'),
      p('Le client déclare avoir pris connaissance du contenu livré (§ 5), des réserves (§ 6) et des modalités de paiement (§ 7). Il accepte la version bêta en l\'état et confirme que le premier versement (80 %) est dû conformément aux coordonnées bancaires / Mobile Money indiquées au § 2.'),
      empty(),
      pBold('Pour le prestataire :'),
      p('Nom : _________________________    Date : _________________________    Signature : _________________________'),
      empty(),
      pBold('Pour le client :'),
      p('Nom : _________________________    Date : _________________________    Signature : _________________________'),
      empty(),
      p('(Une acceptation par email (réponse explicite du client) peut tenir lieu de signature si les deux parties le conviennent.)'),
      empty(), empty(),

      h1('9. ANNEXES (OPTIONNELLES)'),
      p('• Annexe A : Captures d\'écran ou liste des écrans livrés en bêta.'),
      p('• Annexe B : Accès (URL de la PWA, identifiants de test admin / client / centrale si fournis).'),
      p('• Annexe C : Détail technique des points à finaliser en phase 2 (APIs, notifs, build).'),
      empty(), empty(),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Document établi le [JJ/MM/AAAA]. En cas de litige, les parties s\'efforceront de trouver une solution amiable avant toute action judiciaire.', italics: true, size: 22 })] }),
    ],
  }],
});

const outDir = path.join(__dirname, '..');
const outPath = path.join(outDir, 'DOCUMENT_LIVRAISON_BETA.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log('Document généré :', outPath);
}).catch((err) => {
  console.error('Erreur génération docx:', err);
  process.exit(1);
});
