---
id: deployment
title: "Déploiement"
sidebar_label: "Déploiement"
---

La partie 4 de ce didacticiel en vidéo se trouve ici:

> **Avis : contenu ancien**
> 
> Ces vidéos ont été enregistrées avec une version antérieure de Redwood et de nombreuses commandes sont maintenant obsolètes. Si vous voulez vraiment construire l'application de blog, vous devrez suivre avec le texte que nous gardons à jour avec les dernières versions.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/UpD3HyuZkvY?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

La raison principale pour laquelle nous avons mis au point Redwood était de permettre aux développeurs de construire des applications web _full-stack_ plus facilement tout en adhérant à la philosophie Jamstack. Bien que techniquement nous ayons déjà déployé dans la section précédente, cela ne fonctionne pas encore. Corrigeons cela.

### La Base de Données

### La Base de Données Nous avons besoin d'une base de données quelque part sur Internet afin d'enregistrer nos données. Nous avons utilisé SQLite pendant la phase de développement, mais il s'agit d'un outil pensé pour être utilisé par un seul utilisateur. SQLite n'est pas vraiment adapté pour le type de connections concurrentes qu'une application requiert lorsqu'elle entre en production. Pour cette partie du didacticiel, nous utiliserons Postgres. (Prisma supporte à ce jour SQLite, Postgres et MySQL). Ne vous inquiétez pas si vous n'êtes pas familier de Postgres, Prisma va se charger de tout ça. Tout ce dont nous avons besoin c'est une base de données qui soit accessible depuis Internet, de telle manière que notre application puisse s'y connecter.

Tout d'abord, nous allons informer Prisma que nous souhaitons utiliser Postgres en plkus de SQLite, de telle manière que Prisma va construire un client pour ces deux bases de données. Mettez à jour l'entrée `provider` dans `schema.prisma`:

```javascript
yarn rw g deploy netlify
```

> **!!! Avis extrêmement important que vous devez lire !!!**
> 
> Prisma ne supporte qu'un seul fournisseur de base de données à la fois, et comme nous ne pouvons pas utiliser SQLite en production et qu'on *doit* basculer vers Postgres ou MySQL, Cela signifie que nous devons utiliser la même base de données sur notre système de développement local après avoir fait ce changement. Consultez notre guide [Local Postgres Setup](https://redwoodjs.com/docs/local-postgres-setup) pour vous aider à démarrer.

Il existe différents fournisseurs d'hébergement qui vous permettent de créer rapidement une base de données Postgres:

- [Railway](https://railway.app/)
- [Heroku](https://www.heroku.com/postgres)
- [Digital Ocean](https://www.digitalocean.com/products/managed-databases)
- [AWS](https://aws.amazon.com/rds/postgresql/)

Nous allons aller avec Railway pour le moment parce qu'il est a) gratuit et b) ridiculement facile à commencer, de loin le plus facile que nous ayons trouvé. Vous n'avez même pas besoin de créer un compte ! La seule limitation est que si vous *ne créez pas de compte* votre base de données sera supprimée après sept jours. Mais à moins que vous *procrastiez vraiment* vous devriez avoir bien assez de temps pour passer le reste du tutoriel !

Si vous souhaitez développer en local avec Postgres, [consultez le guide](https://redwoodjs.com/docs/local-postgres-setup).

![image](https://user-images.githubusercontent.com/300/107562787-1fa2e380-6b95-11eb-90ba-02fea7925a05.png)

Maintenant, il suffit de suivre les instructions. Tout d'abord, Cmd+k/Ctrl+k (selon votre OS) :

![image](https://user-images.githubusercontent.com/300/107562945-495c0a80-6b95-11eb-9ba8-a294669d6cb4.png)

Déplacez-vous dans la page jusqu'à faire apparaître **Heroku Postgres**:

![image](https://user-images.githubusercontent.com/300/107562989-5c6eda80-6b95-11eb-944e-34b0ad49f4ea.png)

Et croyez-le ou non, nous avons terminé! Nous avons maintenant juste besoin de l'URL de connexion. N’oubliez pas de cliquer sur le bouton **Enregistrer**. Maintenant, allez à l'onglet **Déploie** en haut et ouvrez la **liste** sur la droite. Copiez l'extrait d'URL de la base de données, celui qui commence par `postgresql://`:

![image](https://user-images.githubusercontent.com/300/107562577-da7eb180-6b94-11eb-8731-e86a1c7127af.png)

 C'est tout pour la configuration de la base de données! Maintenant, faites savoir à Netlify ce qu'il en est.

### Netlify

Retournez sur la page principale de Netlify, puis rendez-vous dans **Settings**, puis dans **Build & Deploy** > **Environment**. Cliquez sur **Edit variables**. C'est à cet endroit que nous allons coller l'URI de connection que nous avions copié depuis Heroku (notez que la valeur de **Key** est "DATABASE_URL"). Après avoir collé la valeur, ajoutez `?connection_limit=1` à la fin d'URI. Le format final de l'URI est donc: `postgres://<user>:<pass>@<url>/<db>?connection_limit=1`.

![Adding ENV var](https://user-images.githubusercontent.com/300/83188236-3e834780-a0e4-11ea-8cfa-790c2e335a92.png)

> **Limiter le nombre de connexions**
> 
> Lorsque vous configurez la base de données, vous ajouterez de préférence `?connection_limit=1` à l'URI. Il s'agit d'une [recommandation pour l'utilisation de Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/deployment#recommended-connection-limit) dans le cadre d'une utilisation Serverless.

Assurez-vous de cliquer sur le boutton **Save**. Maintenant rendez-vous sur l'onglet **Deploys**, ouvrez le champ de sélection **Trigger deploy** sur la droite et choisissez **Deploy site**:

![Trigger deploy](https://user-images.githubusercontent.com/300/83187760-835aae80-a0e3-11ea-9733-ff54969bba1f.png)

Avec un peu de chance (et de science!!), tout va fonctionner correctement! Vous pouvez cliquer sur le bouton **Preview** en haut de page avec les logs, ou revenir à la page précédente et cliquer sur l'URL de déploiement de votre site située en haut de l'écran:

![Netlify URL](https://user-images.githubusercontent.com/300/83187909-bef57880-a0e3-11ea-97dc-e557248acd3a.png)

Est-ce que ça fonctionne? Si vous voyez "Empty" sous les liens _About_ et _Contact_, c'est que ça marche! Cool! "Empty" signifie simplement que vous n'avez aucun article enregistré dans votre base de données. Allez simplement sur `/admin/posts` pour en créer quelques-un, puis revenez sur la page d'accueil de votre application pour les voir s'afficher.

> Si vous regardez le déploiement via le bouton **Preview**, remarquez que l'URL contient un hash du dernier commit. Netlify va en créer un à chaque nouveau push sur la branche `main` mais ne montrera que ce commit. Donc si vous déployez à nouveau en executant un refresh, vous ne verrez aucune modification. L'URL de déploiement de votre site (celle que vous obtenez depuis la page d'accueil de Netlify) affichera toujours le dernier déploiement. Consultez la section suivante "[Déploiement de Branche](#branch-deploys)" pour plus d'informations.

Si votre déploiement n'a pas fonctionné, consultez le log dans Netlify et voyez si vous comprenez l'erreur qui s'affiche. Si votre déploiement s'esst correctement effectué mais que le site ne s'affiche pas, essayez d'ouvrir les outils de développement de votre navigateur afin de voir si des erreurs s'affichent. Assurez-vous également de bien avoir copié _en totalité_ l'URI de connection Postgres depuis Heroku. Si véritablement vous ne parvenez pas à trouver d'où vient l'erreur, demandez-donc de l'aide à la [communauté Redwood](https://community.redwoodjs.com).

### Une remarque à propos des connections aux bases de données

Une autre fonctionnalité bien pratique de Netlify est appelée _branch deploys_. Lorsque vous créez une branche et effectuez un push sur votre dépôt Git, Netlify va contruire votre application depuis cette branche et vous retourner une URL unique de telle manière que vous puissiez tester vos modifications tout en laissant intacte le déploiement effectué depuis la branche `main`. Une fois que votre branche alternative a été _merged_ dans la branche `main`, une nouvelle construction de votre application sera effectuée en prenant en compte les modifications apportées par la branche alternative. Pour activer le déploiement de branches, allez dans **Settings**>**Continuous Deployment** puis sous la section **Deploy context** cliquez sur **Edit Settings** et modifiez **Branch Deploys** to "All". Vous pouvez également activer _Deploy previews_ qui va créer une préview pour toute _pull-request_ effectuée sur votre dépôt.

![Capture d'écran des paramètres de Netlify](https://user-images.githubusercontent.com/30793/90886476-c1016780-e3b2-11ea-851a-3014257484fd.png)

> Vous avez également la possibilité de "vérouiller" la branche `main` de telle manière que chaque push ne déclanche pas automatiquement une reconstruction de l'application. Vous devez alors demander à Netlify manuellement de déployer la dernière version présente sur le dépôt, soit en vous rendant sur le site, soit en utilisant [la CLI Netlify](https://cli.netlify.com/).

### Une remarque à propos des connections aux bases de données

#### Connexions

Dans ce didacticiel, vos fonctions lambda vont se connecter directement à la base Postgres. Étant donné que Postgres accepte un nombre limité de connexions simultanées, ceci n'évolue pas. Imaginez, un flot de trafic vers votre site qui provoque une augmentation de 100x du nombre d'appels de fonctions serverless. Netlify (et en coulisses, AWS) fera tourner avec plaisir plus de 100 instances Lambda serverless pour gérer le trafic. Le problème est que chacun ouvrira sa propre connexion à votre base de données, ce qui pourrait épuiser le nombre de connexions disponibles. La bonne solution est de mettre en place un service de "connection pooling" devant Postgres et y connecter vos fonctions lambda. Pour apprendre comment faire ça, consulter le [guide associé](https://www.redwoodjs.com/docs/connection-pooling).

#### Sécurité

Votre base de données doit être ouverte au monde parce que vous ne savez jamais quelle adresse IP une fonction serverless aura quand elle sera lancée. Vous pourriez potentiellement obtenir un bloc CIDR pour TOUTES les adresses IP dont votre hébergeur dispose et n'autoriser les connexions qu'à partir de cette liste, mais ces intervalles changent généralement au fil du temps et les garder en synchronisation n'est pas anodin. Tant que vous conservez votre nom d’utilisateur/mot de passe DB sécurisé, vous devriez être en sécurité, mais nous comprenons que ce n’est pas la solution idéale.

Au fur et à mesure que cette forme de "full-stack" Jamstack gagne en importance, nous comptons sur les fournisseurs de bases de données pour fournir des solutions plus solides et plus sûres qui répondent à ces problèmes. Notre équipe travaille en étroite collaboration avec plusieurs d’entre eux et nous espérons d'avoir de bonnes nouvelles à partager dans un avenir proche !

