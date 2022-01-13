---
id: getting-dynamic
title: "Devenir Dynamique"
sidebar_label: "Devenir Dynamique"
---

La seconde partie du didacticiel est disponible en video ici:

> **Avis : contenu ancien**
> 
> Ces vidéos ont été enregistrées avec une version antérieure de Redwood et de nombreuses commandes sont maintenant obsolètes. Si vous voulez vraiment construire l'application de blog, vous devrez suivre avec le texte que nous gardons à jour avec les dernières versions.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/SP5vbsWf5Yg?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

Ces deux pages sont plutôt sympas, mais un blog sans article c'est tout de même un peu léger! Travaillons sur ce point à présent.

Pour les besoins de ce didacticiel, nous allons récupérer nos articles depuis la base de données. Puisque les bases de données relationelles sont encore aujourd'hui au coeur de beaucoup d'applications complexes (ou moins complexes d'ailleurs), nous avons fait en sorte de réserver un traitement de première classe aux accès SQL. Dans une application Redwood, tout part du schéma.

### Créer le schéma de la base de données

Nous devons identifier quelles données seront nécessaires pour un article. Plus tard nous ajouterons d'autres éléments, mais pour commencer nous avons besoin de ceci:

- `ìd` l'identifiant unique pour un article (chaque table de notre base de données aura également un identifiant tel que celui-ci)
- `title le titre de l'article`
- `body` le contenu de l'article
- `createdAt` un 'timestamp' correspondant au moment où l'article est enregistré dans la base de données

Nous utilisons [Prisma Client JS](https://github.com/prisma/prisma-client-js) pour parler vac la base de données. Prisma possède aun autre librairie, appellée [Migrate](https://github.com/prisma/migrate), qui nous permet de mettre à jour le schéma de la base de données en capturant chaque changement successif. Chacun de ces changement est appelé _migration_, et cette librairie Migrate en créé un nouveau à chaque modification du schéma.

Tout d'abord, définissons la structure d'un article de notre blog dans la base de données. Ouvrez `api/prisma/schema.prisma` et ajoutez la définition de la table `Post` (supprimez au passage tous les modèles présents par défaut dans ce fichier). Une fois terminé, le fichier se présente ainsi:

```plaintext {13-18}
// api/db/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  createdAt DateTime @default(now())
}
```

Cette série d'instructions signifie que nous voulons créer une table `Post` avec les éléments suivants:

- Un champ `id` de type `Int`, nous précisions à Prisma que cette colonne constitue un identifiant `@id` (de façon à pouvoir créer des relations avec d'autres tables) et que la valeur par `@default` correspond à la fonction Prisma `autoincrement()` impliquant que la base de données insèrera une nouvelle valeur automatiquement lorsqu'un enregistrement est créé
- Un champ `title` de type `String`
- Un champ `body` également de type `String`
- Un champ `createdAt` de type `DateTime` avec une valeur par `@default` égale à `now()` pour chaque nouvel enregistrement (ainsi nous n'avons pas à nous en charger dans l'application, la base de données le fera pour nous)

> **Raccourçi `redwood`**
> 
> Pour le didacticiel, nous resterons simple et utiliserons un identifiant de type Integer. Ceci étant, une application plus évoluée pourra utiliser un identifiant de type CUID ou UUID. Tous deux sont pris en charge par Prisma. Dans ce cas, vous utiliseriez un champ de type `String` au lieu de `Int`, et `cuid()` ou `uuid()` au lieu de `autoincrement()`:
> 
> `id String @id @default(cuid())`
> 
> Notez que l'utilisation d'un identifiant de type Integer permet d'obtenir des url plus simples comme https://redwoodblog.com/posts/123 instead of https://redwoodblog.com/posts/eebb026c-b661-42fe-93bf-f1a373421a13.
> 
> Allez voir la [documentation officielle de Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema/data-model#defining-an-id-field) pour plus de détails sur les champs identifiants.

### Migrations

C'était simple. Maintenant nous souhaitons faire un snapshot de notre migration :

    yarn redwood db save create posts

> **Générateurs et conventions de nommage**
> 
> Désormais, nous utiliserons dans nos commandes la forme courte `rw` à la place de `redwood`.

Vous serez invité à donner un nom à cette migration. Idéalement le nom décrira ce qu'il se passe, en l'occurrence "créer des publications" (sans les guillemets, bien sûr). C'est à votre avantage : Redwood ne se soucie pas du nom de la migration, c'est juste une référence lorsque vous regardez les anciennes migrations et essayez de trouver quand vous avez créé ou modifié quelque chose de spécifique.

Une fois la commande exécutée, vous pourrez constater la création d'un nouveau sous-répertoire dans `api/prisma/migrations` avec un _timestamp_ et le nom que vous avez donné votre migration. Il contiendra un seul fichier nommé `migration.sql` qui contient le SQL nécessaire pour mettre à jour la structure de la base de données pour correspondre au `schema.prisma` au moment où la migration a été créée. Vous avez donc un seul fichier `schema.prisma` qui décrit la structure de la base de données telle qu'elle est *sur l'instant* et les migrations qui retracent l'historique des modifications pour parvenir à cette structure. C'est une sorte de contrôle de version pour la structure de votre base de données, qui peut être assez pratique.

En plus de créer le fichier de migration, la commande ci-dessus exécutera également le SQL sur la base de données, appliquant ainsi la migration. L'exécution de cette commande permet à Prisma d'appliquer les changements sur la base de données, en l'espèce la création d'une nouvelle table `Post` avec les champs définis plus haut.

### Créer une Interface d'Édition d'un Article

Nous n'avons pas encore décidé du look de notre site, mais ne serait-il pas extra si nous pouvions commencer à manipuler nos articles de blog, commencer à créer quelques pages rapidement le temps que l'équipe chargée du design rende sa copie? Heureusement pour nous, "Incroyable" est le petit nom de Redwood :) Il n'a pas de nom de famille.

Générons tout ce sont nous avons besoin pour réaliser un CRUD (Create, Retrieve, Update, Delete) (Créer, Récupérer, Mettre à jour, Supprimer) sur nos articles. Redwood a justement un generateur spécialement fait pour ça :

    yarn rw g scaffold post

Ouvrons la page `http://localhost:8910/posts` et constatons le résultat:

<img src="https://user-images.githubusercontent.com/300/73027952-53c03080-3de9-11ea-8f5b-d62a3676bbef.png" />

Humm.. ça n'est pas beaucoup plus que ce que nous avions obtenu losque nous avions créé notre première page. Que se passe-t-il lorsque nous cliquons sur le bouton "New Post" (Nouvel Article) ?

<img src="https://user-images.githubusercontent.com/300/73028004-72262c00-3de9-11ea-8924-66d1cc1fceb6.png" />

Ok, on progresse. Remplissez les champs "title" et "body" puis cliquez sur "Enregistrer".

<img src="https://user-images.githubusercontent.com/300/73028757-08a71d00-3deb-11ea-8813-046c8479b439.png" />

Avons-nous juste créé un article dans la base de données? Puis affiché cet article ici sur cette page? Oui, oui, nous l'avons fait! Essayez-donc d'en créer d'autres.

<img src="https://user-images.githubusercontent.com/300/73028839-312f1700-3deb-11ea-8e83-0012a3cf689d.png" />

Et maintenant, que se passe-t-il lorsqu'on clique sur "Edit" (éditer) pour l'un de ces articles?

<img src="https://user-images.githubusercontent.com/300/73031307-9802ff00-3df0-11ea-9dc1-ea9af8f21890.png" />

D'accord, et en cliquant sur le bouton "Delete" (supprimer)?

<img src="https://user-images.githubusercontent.com/300/73031339-aea95600-3df0-11ea-9d58-475d9ef43988.png" />

Oui c'est bien ça, en une seule commande, Redwood à créé l'ensemble des pages, composants et services nécessaires aux opérations usuelles de manipulation des articles. Pas même besoin d'ouvrir le gestionnaire de base de données. Redwood appelle ceci des _scaffolds_.

Voici dans le détail ce qui arrive lorsqu'on execute la commande `yarn rw g scaffold post` :

- Ajout d'un fichier _SDL_ pour définir quelques requêtes et mutations GraphQL dans `api/src/graphql/posts.sdl.js`
- Ajout d'un fichier _service_ `api/src/services/posts/posts.js` qui permet au client Javascript Prisma de manipuler la base de données
- Ajout de quelques _pages_ dans `web/src/pages`:
  - `EditPostPage` pour éditer un article
  - `NewPostPage` pour créer un nouvel article
  - `PostPage` pour montrer les détails d'un article
  - `PostsPage` pour lister tous les articles
- Crée un fichier _layouts_dans `web/src/layouts/PostsLayout/PostsLayout.js` qui sert de conteneur pour les pages avec des éléments communs comme le titre de la page et le bouton "Nouveaux posts"
- Routes créées encapsulées dans le composant `Set` avec la mise en page comme `PostsLayout` pour ces pages dans `web/src/Routes.js`
- Ajout de trois _cells_ dans `web/src/components`:
  - `EditPostCell` reçoit le message à éditer dans la base de données
  - `PostCell` reçoit le message à afficher
  - `PostsCell` reçoit tous les messages
- Quatre composants _créés_ également dans `web/src/composants`:
  - `NewPost` affiche le formulaire permettant la création d'un nouvel article
  - `Le message` affiche un seul message
  - `PostForm` le formulaire utilisé à la fois par les composants de création et d'édition d'un article
  - `Les messages` affichent la table de tous les messages

> **Générateurs et conventions de nommage**
> 
> Vous remarquerez que certains fichiers générés ont un nom au pluriel, et d'autres au singulier. Cette convention est empruntée au framework Ruby on Rails. Lorsque vous avez à traiter d'un multiple de quelque chose (comme par exemple une liste d'articles), on utilisera le pluriel. Dans le cas contraire (par exemple la création d'un nouvel article), on utilisera le singulier. C'est aussi plus naturel lorsque l'on parle: "montre moi une liste d'articles" vs. "je vais créer un nouvel article".
> 
> Pour ce qui concerne les générateurs:
> 
> - Les fichiers de Services sont toujours au pluriel.
> - Les méthodes dans les Services sont au singulier ou au pluriel selon qu'ils retournent plusieurs articles ou un seul article (`posts` vs. `createPost`).
> - les fichiers SDL sont toujours au pluriel.
> - Les pages générées par une commande de scaffold sont au pluriel ou au singulier selon que la page manipule plusieurs ou un seul article. Notez que lorsque vous utilisez vous-même un commande `page` en dehors d'un scaffold, le nom utilisé sera simplement celui que vous donnerez.
> - Les Layouts utilisent le nom que vous leur donnez
> - Les composants et les cellules sont au pluriel ou au singulier selon le contexte lorsqu'ils sont générés par scaffolding.
> 
> Remarquez également que seul le nom de la table en base de données et au singulier ou au pluriel, et pas le mot complet. Ainsi on a `PostsCell`, et non `PostCells`.
> 
> Vous n'avez pas à suivre cette convention de façon obligatoire lorsque vous créez vos propres composants, pages, etc... Ceci étant nous vous le recommandons chaudement. Au bout du compte, la communauté Ruby on Rails a fini par s'attacher à cette convention, et ce même si au départ de nombreuses personnes s'y étaient opposées. "[Give it five minutes](https://signalvnoise.com/posts/3124-give-it-five-minutes)" comme disent les anglo-saxons.

### Créer la page d'accueil

Nous pouvons commencer à remplacer ces pages les unes après les autres au fur et à mesure que l'équipe chargée du design nous donne des éléments, ou bien nous pouvons simplement les déplacer dans la partie "administration" de notre site, et commencer à créer nos propres pages. Ceci étant, la partie publique du site ne va certainement pas autoriser les utilisateurs à créer, éditer ou supprimer les articles. Que peuvent donc faire les utilisateurs?

1. Voir la liste des articles (sans liens pour éditer ou supprimer)
2. Voir le détail d'un article

Puisque nous voudront probablement conserver un moyen de créer et éditer des articles plus tard, conservons les pages générées par scaffolding et créons-en de nouvelles pour ces deux cas de figure.

Nous avons déjà la `HomePage`, pas besoin de créer celle-ci donc. Nous souhaitons afficher une liste d'articles à l'utilisateur donc nous allons devoir ajouter ça. Nous avons besoin de récupérer le contenu depuis la base de données, et nous ne voulons pas que l'utilisateur soit face à une page blanche le temps du chargement (conditions réseau dégradées, serveur géographiquement distant, etc...), donc nous voudrons montrer une sorte de message de chargement et/ou une animation. D'autre part, si une erreur se produit, nous devrons faire en sorte de la prendre en charge. D'autre part, que va-t-il se passer lorsque nous publierons ce moteur de blog en open-source et qu'une personne l'initialisera sans aucun contenu dans la base de données? Ce serait sympa s'il y avait une sorte de message indiquant que le blog ne comporte encore aucun article.

Oh là là, notre première page avec des données et il semble que nous ayons déjà à nous soucier du chargement des états, des erreurs… ou peut-être pas?
