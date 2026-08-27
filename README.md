# Jolirêve — Guide de mise en ligne

Ce document explique, étape par étape, comment rendre le site opérationnel.
Comptez environ 45 minutes à 1h pour l'ensemble, en suivant dans l'ordre.

Aucune de ces étapes ne nécessite de savoir coder : il s'agit de créer des
comptes, copier-coller des clés, et cliquer sur des boutons.

---

## Vue d'ensemble de ce qui a été construit

- **Le site vitrine** : présentation, galerie photo (48 photos), les deux
  formules, avis, accès.
- **Le moteur de réservation** : calendrier interactif, calcul automatique
  du prix et de l'acompte (30 %), paiement sécurisé par carte bancaire (Stripe).
- **La page d'administration** (`/admin.html`) : pour bloquer vous-même des
  dates (travaux, usage personnel) et consulter les réservations, sans avoir
  besoin de moi à chaque fois.
- Tout est hébergé gratuitement sur **Netlify** (hors commission Stripe sur
  les paiements, environ 1,5 % + 0,25 €).

---

## Étape 1 — Créer un dépôt GitHub (5 min)

GitHub est l'endroit où le code du site est stocké ; Netlify ira le chercher
là pour le publier.

1. Allez sur **github.com** → créez un compte gratuit si vous n'en avez pas.
2. Cliquez sur **New repository**.
3. Nommez-le `jolireve-site`, laissez-le en **Private** (privé), cliquez sur
   **Create repository**.
4. Sur la page qui s'affiche, cliquez sur **uploading an existing file**.
5. Glissez-déposez **tout le contenu du dossier** que je vous ai fourni
   (tous les fichiers, y compris les dossiers `netlify/` et `images/`).
6. Cliquez sur **Commit changes**.

---

## Étape 2 — Créer votre compte Stripe (si pas déjà fait)

Suivez les instructions que je vous ai données précédemment dans la
conversation (stripe.com → créer un compte → renseigner SIRET et IBAN).
Gardez la page **Développeurs → Clés API** ouverte, vous en aurez besoin
à l'étape 4.

---

## Étape 3 — Connecter le site à Netlify (10 min)

1. Allez sur **netlify.com** → **Sign up** → connectez-vous avec votre
   compte GitHub (le plus simple).
2. Cliquez sur **Add new site → Import an existing project**.
3. Choisissez **GitHub**, puis sélectionnez le dépôt `jolireve-site`.
4. Netlify détecte automatiquement la configuration (grâce au fichier
   `netlify.toml`). Laissez les réglages par défaut.
5. Cliquez sur **Deploy site**.
6. Après 1 à 2 minutes, votre site est en ligne à une adresse provisoire du
   type `nom-aleatoire.netlify.app`. Vous pouvez déjà cliquer dessus pour
   voir le site (le calendrier et le paiement ne fonctionneront pas encore
   à ce stade, c'est normal, il manque les clés).

### Renommer le site (optionnel mais conseillé)
Dans **Site settings → General → Site details**, cliquez sur
**Change site name** pour choisir quelque chose comme `jolireve` (donnera
`jolireve.netlify.app`) en attendant votre nom de domaine définitif.

---

## Étape 4 — Configurer les clés secrètes (10 min)

Dans Netlify : **Site settings → Environment variables → Add a variable**.
Ajoutez une par une les variables suivantes :

| Nom de la variable      | Valeur                                                        |
|--------------------------|----------------------------------------------------------------|
| `STRIPE_SECRET_KEY`      | Votre clé secrète Stripe (commence par `sk_test_...` pour tester, puis `sk_live_...` une fois prête) |
| `STRIPE_WEBHOOK_SECRET`  | Voir étape 5 ci-dessous — à ajouter après avoir créé le webhook |
| `ADMIN_PASSWORD`         | Un mot de passe de votre choix pour accéder à `/admin.html`   |
| `SITE_URL`               | L'adresse de votre site, ex. `https://jolireve.netlify.app` (ou votre futur domaine) |

Après chaque ajout, Netlify propose de **redéployer** le site — acceptez.

---

## Étape 5 — Connecter le webhook Stripe (5 min)

Le "webhook" est ce qui permet à Stripe de prévenir automatiquement le site
qu'un paiement a bien été reçu, pour confirmer la réservation.

1. Dans le Dashboard Stripe → **Développeurs → Webhooks → Add endpoint**.
2. URL du endpoint : `https://VOTRE-SITE.netlify.app/.netlify/functions/webhook`
   (remplacez par votre vraie adresse Netlify ou votre domaine).
3. Événement à écouter : cherchez et cochez **checkout.session.completed**.
4. Cliquez sur **Add endpoint**.
5. Stripe affiche une **clé de signature** (commence par `whsec_...`) —
   copiez-la.
6. Retournez dans Netlify → **Environment variables** → complétez la
   variable `STRIPE_WEBHOOK_SECRET` avec cette valeur.
7. Redéployez le site (Netlify vous le proposera automatiquement).

---

## Étape 6 — Tester une réservation (10 min)

**Avant de passer en mode réel**, testez avec une carte de test Stripe pour
vérifier que tout fonctionne, sans débiter personne.

1. Vérifiez que `STRIPE_SECRET_KEY` utilise bien la clé **test**
   (`sk_test_...`).
2. Allez sur votre site → section réservation → choisissez des dates →
   cliquez sur **Payer l'acompte et réserver**.
3. Sur la page Stripe qui s'ouvre, utilisez cette carte de test :
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future, ex. `12/28`
   - CVC : n'importe quel 3 chiffres, ex. `123`
4. Vous devez arriver sur la page de confirmation, et voir la réservation
   apparaître dans `/admin.html` (avec le mot de passe défini à l'étape 4)
   avec le statut **"Réservé (payé)"**.
5. Vérifiez aussi dans le Dashboard Stripe → **Paiements** que le paiement
   test apparaît.

Si tout fonctionne : bravo, le site est prêt !

---

## Étape 7 — Passer en mode réel

1. Dans Stripe, activez votre compte (vérification d'identité si pas déjà
   fait) puis basculez en mode **Live** (bouton en haut à droite du
   Dashboard).
2. Récupérez vos clés **live** (`sk_live_...`) dans **Développeurs → Clés API**.
3. Recréez le webhook en mode Live (répétez l'étape 5, les webhooks test et
   live sont séparés) et récupérez le nouveau `whsec_...`.
4. Dans Netlify, remplacez `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET`
   par les valeurs live. Redéployez.

À partir de ce moment, les paiements sont réels.

---

## Étape 8 — Acheter et brancher votre nom de domaine

### 8a — Acheter le nom de domaine (5-10 min)

Un nom de domaine (ex. `jolireve.fr`) coûte environ 8 à 15 € par an. Deux
options simples, au choix :

**Option A — directement chez Netlify (le plus simple)**
1. Dans Netlify : **Domain settings → Add a domain → Search for a domain**.
2. Tapez `jolireve.fr` (ou une variante si déjà pris) et suivez l'achat.
   Netlify configure alors tout automatiquement, sans étape DNS manuelle —
   passez directement à l'étape 8b.

**Option B — chez un registrar français (OVH, Gandi...)**
1. Allez sur **ovh.com** ou **gandi.net** → recherchez `jolireve.fr`.
2. Achetez-le (comptez d'ajouter la protection des données personnelles
   "Whois privé", souvent gratuite ou à faible coût).
3. Une fois l'achat confirmé, passez à l'étape 8b — vous devrez revenir
   ici ajouter quelques lignes DNS chez OVH/Gandi.

### 8b — Connecter le domaine à Netlify

1. Netlify → **Domain settings → Add a domain**, entrez `jolireve.fr`.
2. Si acheté chez OVH/Gandi (Option B) : Netlify affiche 1 ou 2 lignes DNS
   à recopier dans l'espace **Zone DNS** de votre registrar (un enregistrement
   de type `A` et/ou `CNAME`). Copiez-collez exactement ce qui est affiché.
   La propagation prend de quelques minutes à 24h.
3. Netlify fournit ensuite un certificat de sécurité (https) automatiquement
   et gratuitement — rien à faire, ça se déclenche tout seul une fois le
   domaine reconnu.
4. Pensez à mettre à jour la variable d'environnement `SITE_URL` avec
   `https://jolireve.fr`, et à recréer le webhook Stripe (étape 5) pointant
   vers cette nouvelle adresse plutôt que `netlify.app`.

---

## Utilisation au quotidien

### Bloquer des dates (vacances, travaux, usage personnel)
Allez sur `VOTRE-SITE/admin.html`, entrez votre mot de passe, renseignez
les dates à bloquer. Elles apparaîtront grisées dans le calendrier public.

### Voir les réservations
La même page liste toutes les réservations confirmées, avec le nom, le
nombre de voyageurs et le montant de l'acompte réglé.

### Modifier les tarifs
Les prix sont regroupés à un seul endroit dans le fichier `script.js`
(objet `CONFIG` en haut du fichier) **et** dupliqués dans
`netlify/functions/create-checkout.js` pour la sécurité des calculs — les
deux doivent être modifiés ensemble. N'hésitez pas à revenir vers moi si
vous voulez changer un tarif, ça prend deux minutes.

### Ajouter des photos
Déposez les nouvelles photos dans le dossier `images/`, puis ajoutez une
ligne correspondante dans le tableau `GALLERY` du fichier `script.js`.
Là aussi, je peux le faire pour vous en quelques instants.

---

## À compléter avant la mise en ligne définitive

- **`cgv.html`** et **`mentions-legales.html`** contiennent des modèles
  avec des [informations entre crochets] à remplacer (SIRET, adresse,
  conditions d'annulation). Je vous recommande un rapide passage par un
  syndicat de loueurs (Gîtes de France, Clévacances) ou une CCI pour
  valider les conditions d'annulation.
- L'adresse e-mail `contact@jolireve.fr` utilisée dans le pied de page est
  un exemple — remplacez-la par votre vraie adresse de contact.
- Les photos manquantes que vous n'avez pas encore envoyées (s'il y en a)
  peuvent être ajoutées à tout moment, la structure du site n'a pas besoin
  de changer.

---

## Une question, un blocage ?

Revenez vers moi dans cette conversation avec le message d'erreur exact ou
une capture d'écran : je pourrai vous dire précisément quoi faire.
