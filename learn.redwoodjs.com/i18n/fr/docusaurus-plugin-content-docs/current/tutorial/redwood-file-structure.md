---
id: redwood-file-structure
title: "Structure d'une application Redwood"
sidebar_label: "Structure d'une application Redwood"
---

Examinons maintenant les fichiers et répertoires qui ont été créés pour nous (laissons de côté les fichiers de configuration sur lesquels nous reviendrons plus tard)

```terminal
├── api
│   ├── db
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src
│       ├── functions
│       │   └── graphql.js
│       ├── graphql
│       ├── lib
│       │   └── db.js
│       └── services
└── web
    ├── public
    │   ├── README.md
    │   ├── favicon.png
    │   └── robots.txt
    └── src
        ├── Routes.js
        ├── components
        ├── index.css
        ├── index.html
        ├── App.js
        ├── layouts
        └── pages
            ├── FatalErrorPage
            │   └── FatalErrorPage.js
            └── NotFoundPage
                └── NotFoundPage.js
```

Au premier niveau nous avons deux répertoires, `api` et `web`. Redwood sépare le backend (`api`) et le frontend (`web`) au sein du projet. ([Yarn qualifie cette séparation de "workspaces"](https://yarnpkg.com/lang/en/docs/workspaces/). Avec Redwood, on fait plutôt référence aux "côtés" web et api de l'application). Ainsi, lorsque plus tard vous serez amené à ajouter des packages, il vous faudra préciser dans quel côté ils doivent aller. Par exemple, (inutile d'exécuter ces commandes):

    yarn workspace web add marked
    yarn workspace api add better-fs

### Le Répertoire /api

A l'intérieur du répertoire `api` se trouve deux sous-répertoires :

- `prisma` contient du code d'infratructure relatif à la base de donnée

  - `schema.prisma` contient le schéma de la base de données (ses tables et ses colonnes)
  - `seeds.js` est utilisé pour initialiser la base de données avec les données de base nécessaire à votre application (utilisateur admin, configuration diverses..).

  Lorsque nous aurons créé notre première table dans la base de données, nous trouverons également à cet endroit une base de données SQLite sous la forme d’un fichier `dev.db`, ainsi qu’un répertoire `migrations` contenant des captures successives du schéma au fil de son évolution. `migrations` contient les fichiers qui sont comme des instantanés du schéma de la base de données évoluant au fil du temps.

- `src` contient l'ensemble du code côté backend. `api/src` contient quatre répertoires supplémentaires :
  - `functions` contiendra toutes les [fonctions lambda](https://docs.netlify.com/functions/overview/) utilisées par votre application en plus du fichier `graphql.js` généré automatiquement par Redwood. Ce dernier fichier est requis pour utiliser une API GraphQL.
  - `graphql` contient votre schéma GraphQL écrit au format SDL (Schema Definition Language). Les fichiers SDL se terminent par `.sdl.js`.
  - `lib` contient un seul fichier, `db.js`, qui instancie le client Prisma utilisé pour dialoguer avec la base de données. Vous pouvez parfaitement personnaliser ce fichier en ajoutant des options supplémentaires. Vous pouvez utiliser ce répertoire pour tout code relatif au côté API de votre application qui ne trouverai pas sa place dans `functions` ou `services`.
  - `services` contient la logique métier de votre application. Lorsque vous effectuez une requête ou une mutation de données via GraphQL, ce code se trouve ici dans un format réutilisable depuis d’autres endroits de votre application.

Et nous en avons terminé avec la partie backend.

### Le répertoire /web

- `src` contient plusieurs sous-répertoires :
  - `components` contient vos composants React traditionnels ainsi que les _Cells_ introduites par Redwood (nous y reviendrons bientôt en détail).
  - `layouts` contient du code HTML sous forme de composants qui viennent entourer le contenu de votre application et sont partagés par les différentes _Pages_.
  - `pages` contient des composants souvent insérés dans les _Layouts_ et qui constituent les points d'entrées de votre application pour une URL donnée (une URL comme `/articles/hello-world` correspondra ainsi à une page tandis que `/contact-us` correspondra à une autre page). Chaque nouvelle application comprend deux pages par défaut :
    - `NotFoundPage.js` qui est utilisée lorsqu’aucune route n’est trouvée par le routeur (voir `Routes.js` plus bas).
    - `FatalErrorPage.js` qui est utilisée lorsqu’une erreur survient, qu’elle n’a pas été gérée, et qu’il n’est pas possible de poursuivre plus avant sans faire exploser l’application (en général il s’agit d’une page blanche).
  - `index.css` est l'endroit par défaut où placer vos règles CSS. Il existe cependant d’autres possibilités avancées.
  - `index.html` est le point d’entrée React standard de votre application.
  - `App.js` le code d'amorçage pour mettre en marche notre application Redwood.
  - `Routes.js` contient les définitions des routes de l’application afin de faire correspondre chaque URL à une _Page_.
- `public` contient des ressources non utilisées par vos composants React (En bout de chaîne, ces ressources seront copiées sans être modifiées dans le répertoire racine de l’application finale):
  - `favicon.png` est l’icône utilisée par les onglets des navigateurs lorsqu’une page est ouverte (par défaut il s’agit du logo RedwoodJS).
  - `robots.txt` est utilisé pour controller ce que les moteurs de recherche sont [autorisé à indexer](https://www.robotstxt.org/robotstxt.html).
  - `README.md` explique comment, et quand, utiliser le répertoire `public` pour vos ressources statiques. Il mentionne également les bonnes méthodes pour importer des ressources à l'intérieur des composants via Webpack. Vous pouvez également lire à ce sujet ce [fichier README.md sur GitHub](https://github.com/redwoodjs/create-redwood-app/tree/main/web/public).

