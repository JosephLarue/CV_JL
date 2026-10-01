Ce "projet" est une représentation de mon cursus et de mon parcours fait très rapidement en utilisant claude code. On va voir rapidement si ça produit quelque chose de propre ou non.

---

# CV technique — Joseph Larue

Landing page modulable + backoffice. React + TypeScript + Vite + Tailwind, API Express, contenu dans `data/content.json`. Bilingue FR/EN.

## Lancer en dev

```bash
npm install
npm run dev
```

- Front : http://localhost:5173
- API  : http://localhost:3001 (proxy `/api`)
- Site : `/`  — Backoffice : `/admin`

## Build / prod

```bash
npm run build   # tsc + vite build -> dist/
npm start       # Express sert dist/ + l'API (NODE_ENV=production)
```

## Contenu & modularité

`data/content.json` = source de vérité. Chaque section : `{ id, type, enabled, order, content: { fr, en } }`.
Le backoffice permet d'activer/désactiver, réordonner (↑/↓) et éditer chaque section en FR et EN, puis sauvegarde dans le JSON (écriture atomique).

## Variables d'environnement & secrets (transcrypt)

Deux fichiers, mêmes clés :

- **`.env.local`** — EN CLAIR, **gitignoré**, jamais poussé. Source locale de dev (prend le dessus).
- **`.env`** — **poussé mais chiffré** via [transcrypt](https://github.com/elasticdog/transcrypt). En clair dans le working tree une fois le dépôt déverrouillé.

Clés : `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PHONE`, `PORT`, SMTP (`SMTP_*`), Twilio (`TWILIO_*`).

### Mise en place de transcrypt (une fois)

```bash
transcrypt -c aes-256-cbc -p 'UNE_PHRASE_SECRETE'   # initialise le chiffrement du .env
git add .gitattributes .env && git commit -m "env chiffré"
```

Sur une autre machine après clone :

```bash
transcrypt -c aes-256-cbc -p 'UNE_PHRASE_SECRETE'   # déverrouille le .env
```

Afficher le secret transcrypt courant : `transcrypt --display`.

## Backoffice — authentification

- Login par mot de passe (`ADMIN_PASSWORD`). Token bearer en mémoire serveur.
- **Mot de passe oublié** : envoi d'un code à 6 chiffres par **email** (SMTP) ou **SMS** (Twilio).
  - Sans SMTP/Twilio configurés (dev), le code est affiché dans la console serveur et renvoyé à l'UI.
  - Après reset, le nouveau mot de passe est écrit dans `data/auth.json` (gitignoré) et prend le dessus sur `ADMIN_PASSWORD`. Supprimer ce fichier restaure le mot de passe de l'env.