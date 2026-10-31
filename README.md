# 🐦 Little Pigeon

**Little Pigeon** est un prototype de jeu 3D de poursuite dans une grande ville, jouable directement dans un navigateur.

## Jouer en local

1. Télécharge le dépôt depuis GitHub avec **Code → Download ZIP**, puis décompresse-le.
2. Ouvre le dossier et double-clique sur `index.html`.
3. Le jeu charge Three.js depuis jsDelivr : une connexion Internet est donc nécessaire.

Pour un serveur local (recommandé), ouvre un terminal dans le dossier et lance :

```bash
python -m http.server 8000
```

Puis ouvre **http://localhost:8000** dans ton navigateur.

## Commandes

- **ZQSD / WASD** ou **flèches** : déplacer le pigeon
- **Espace** ou **Maj** : boost
- **Échap** : pause
- Sur téléphone : boutons de déplacement et boost à l'écran

## Ce qui est inclus

- Ville 3D procédurale avec immeubles, gratte-ciels, rues, fenêtres et circulation.
- Cycle jour / soir / nuit et éclairage dynamique.
- Pigeon 3D personnalisable et nom modifiable.
- Cinq skins : Commun, Neige (rare), Rouge-pigeon (légendaire), Ailes de dragon (mythique) et Multicolore (divin).
- Pièces, score, vies, boost, poursuivants en forme de cuisses de poulet et boutique.
- Progression locale sauvegardée dans le navigateur.
- Commandes tactiles sur mobile.

## Publier avec GitHub Pages

1. Dans le dépôt GitHub, ouvre **Settings → Pages**.
2. Dans **Build and deployment**, choisis **Deploy from a branch**.
3. Choisis la branche **main** et le dossier **/(root)**, puis clique sur **Save**.
4. Attends la fin du déploiement affiché dans l'onglet Actions. GitHub Pages affichera l'adresse publique du site dans Settings → Pages.

## Notes techniques

- Aucun outil de compilation ni installation de dépendances n'est nécessaire.
- Three.js 0.160.0 est importé depuis jsDelivr via un import map.
- Les graphismes sont générés avec des formes 3D dans le navigateur : c'est une base de prototype, pas encore un monde photoréaliste ou un jeu multijoueur.
- Les pièces et apparences sont sauvegardées localement dans le navigateur du joueur.
