---
id: authentication
title: "Authentification"
sidebar_label: "Authentification"
---

"Authentification" est un mot-valise pour tout ce qui se rapporte au fait de s'assurer que l'utilisateur, souvent identifié à l'aide d'un couple email/mot de passe, est autorisé à accéder à quelque chose. L'authentification peut être parfois [délicate à mettre en oeuvre](https://www.rdegges.com/2017/authentication-still-sucks/) techniquement et vous causer de sérieux maux de tête.

Heureusement, Redwood est là pour vous! L'authentification n'est pas une chose qu'il vous faut écrire en partant de zero, c'est un problème identifié et résolu qui ne devrait au contraire vous causer que peu de soucis. A ce jour, Redwood s'intégre avec :

- [Netlify Identity](https://docs.netlify.com/visitor-access/identity/)
- [Netlify GoTrue-JS](https://github.com/netlify/gotrue-js)
- [Auth0](https://auth0.com/)
- [Magic Links - Magic.js](https://github.com/MagicHQ/magic-js)
- [GoogleAuthProvider de Firebase](https://firebase.google.com/docs/reference/js/firebase.auth.GoogleAuthProvider)
- [Supabase](https://supabase.io/docs/guides/auth)
- [Ethereum](https://github.com/oneclickdapp/ethereum-auth)

Puisque nous avons déjà commecé à déployer notre application sur Netlify, nous allons ici découvrir ensemble Netlify Identity.

> **Authentification vs. Autorisation**
> 
> Voici comment Redwood utilise ces termes:
> 
> * Authentification (**Authentication** en anglais)
> * Autorisation (**Authorization** en anglais)
> 
> Voici comment Redwood utilise ces termes :
> 
> * **Authentification** se rapporte au fait de savoir dans quelle mesure une personne est bien celle qu'elle prétend être. Celà prend généralement la forme d'un formulaire de Login avec un email et un mot de passe, ou un fournisseurs OAuth tiers comme Google.
> * **Autorisation** se rapporte au fait de savoir si un utilisateur (qui en général s'est déjà authentifié) est autorisé à effectuer ou non une action. Celà recouvre en général une combinaison de roles et de permissions qui sont évaluées avant de donner ou refuser l'accès à une URL du site.
> 
> Cette section du didacticiel se concentre en particulier sur l'**authentification**. Voir [la partie 2 du tutoriel](https://learn.redwoodjs.com/docs/tutorial2/role-based-authorization-control-rbac) pour en apprendre plus sur l'Autorisation dans Redwood !

### Netlify Identity Setup

Avant de pouvoir activer Netlify Identity nous devons configurer un nouveau site Netlify avec notre application. [Netlify](https://netlify.com) est une plate-forme d'hébergement qui prend votre code d'un dépôt git, puis construit et déploie les fichiers générés sur leur CDN et fournit des *endpoints* de fonctions serverless auxquelles votre interface peut accéder. En termes plus rudimentaires : cela transforme le côté web en HTML, CSS et JS simple et transforme le côté api en une véritable API accessible à la fois par le web et par Internet en général.

La façon la plus simple de configurer un site sur Netlify est de le déployer. Vous n'entendez pas souvent les termes "simple" et "déployer" ensemble dans la même phrase (à moins que cette phrase ne soit "on ne déploie pas simplement du code sur Internet"), mais Netlify facilite la tâche ! (Notez que le déploiement ne se terminera pas avec succès parce que nous n'avons pas de base de données avec laquelle notre application de production peut communiquer. Mais nous allons corriger cela plus tard — pour l'instant, nous avons juste besoin de suffisamment de configuration dans Netlify pour pouvoir activer Identity.)

Il n'y a qu'une modification à faire pour que notre application soit prête à être déployée et bien entendu, nous avons un générateur pour ça :

```terminal
yarn rw setup deploy netlify
```

L'exécution de cette commande va créer un fichier `/netlify.toml` contenant les commandes et les chemins de fichiers dont Netlify a besoin afin de construire l'application.

Avant que nous ne poursuivions, assurez-vous que tous les commits soient faits et bien envoyés sur GitHub, GitLab or BitBucket. En effet, nous allons lier Netlify à notre dépôt Git de façon à ce tout nouveau push sur la branch `main` permette de re-déployer le site. Si vous n'avez jamais travaillé auparavant avec une application Jamstack, préparez-vous à une sympatique expérience!

En supposant que vous avez complété toutes les étapes précédentes, vous disposez déjà d'un compte Netlify ainsi que d'une application fonctionelle. Une fois que vous vous êtes inscrit et vérifié, il vous suffit de cliquer sur le bouton **New site from Git** en haut à droite :

<img src="https://user-images.githubusercontent.com/300/73697486-85f84a80-4693-11ea-922f-0f134a3e9031.png" />

Donnez l'autorisation à Netlify de se connecter à votre fournisseur d'hébergement Git, et sélectionnez le dépôt de votre application. Laissez les paramètres par défaut et cliquez sur **Deploy site**.

Netlify va alors construire votre application (cliquez sur **Deploying your site** pour prendre connaissance des logs) puis retournera "Site is live", mais rien ne fonctionnera. C'est pas grave ! Dans ce cas, rendez-vous sur Netlify à l'onglet **Identity** et cliquez sur le boutton **Enable Identity** :

![Netlify Identity screenshot](https://user-images.githubusercontent.com/300/82271191-f5850380-992b-11ea-8061-cb5f601fa50f.png)

Nous allons connecter les côtés Web et API ci-dessous pour nous assurer qu'un utilisateur ne fait que les choses qu'il est autorisé à faire.

![Netlify invite user screenshot](https://user-images.githubusercontent.com/300/82271302-439a0700-992c-11ea-9d6d-004adef3a385.png)

Nous aurons besoin de cet email de confirmation très bientôt, mais pour le moment continuons la mise en place de l'authentification.

### Génération de l'Authentification

Quelques modifications doivent être effectuées sur le code pour mettre en place l'authentification. Fort heureusement, Redwood peut le faire pour nous car un générateur est prévu pour ça:

```terminal
yarn rw setup auth netlify
```

Observez le contenu du fichier `api/src/lib/auth.js` qui vient d'être créé (les commentaires ont été supprimé pour plus de clarté):

```javascript
// api/src/lib/auth.js

import { AuthenticationError } from '@redwoodjs/api'

export const getCurrentUser = async (decoded, { token, type }) => {
  return decoded
}

export const requireAuth = () => {
  if (!context.currentUser) {
    throw new AuthenticationError("You don't have permission to do that.")
  }
}
```

Par défaut, le système d'authentification va retourner uniquement les données connues par le fournisseur tiers (c'est ce qui se trouve dans l'objet `jwt`). Dans le cas de Netlify Identity, il s'agit d'une adresse email, d'un nom (optionnel), et d'un tableau de roles (optionnel également). En général, vous disposez de votre propre modélisation de ce qu'est un utilisateur dans votre base de données. Vous pouvez modifier `getCurrentUser` de façon à retourner cet utilisateur plutôt que les détails enregistrés par le fournisseur d'authentification. Les commentaires présents en haut du fichier vous montrent un exemple permettant de rechercher un utilisateur à partir de l'adresse email récupérée. Redwood fournit également par défaut la fonction `requireAuth()`, une implémentation simple pour s'assurer qu'un utilisateur est bien authentifié afin d'accéder à un service. Le cas échéant, une erreur sera lancée de telle façon que GraphQL sache quoi faire si un utilisateur non authentifié essaye de faire quelque chose qu'il ne devrait pas pourvoir effectuer.

Les fichiers qui ont été modifiés par le générateur sont les suivants :

* `web/src/`— Entoure le routeur au sein du composant `<AuthProvider>`, ce qui fait que les routes elles-mêmes sont soumises à authentification. Cela donne également accès au "hook" `useAuth()` qui expose quelques fonctions permettant à l'utilisateur de se connecter, se déconnecter, vérifier le statut courant, etc...
* `api/src/functions/graphql.js`— Rend disponible `currentUser` pour la partie API de l'application, de telle façon que vous puissez verifier si un utilisateur est autorisé ou non à faire quelque chose. Si vous ajoutez une implémentation à `getCurrentUser()` dans `api/src/lib/auth.js`, alors ce sera ce qui sera retourné par `currentUser`, dans le cas contraire `currentUser` contiendra `null`. S'ils ne sont pas du tout connectés, `currentUser` vaudra `null`.

Essayez de cliquer sur le lien Login:

### Authentification côté API

Commençons par verrouiller l'API afin que nous puissions être sûrs que seuls les utilisateurs autorisés peuvent créer, mettre à jour et supprimer une publication. Ouvrez le service Post et ajoutons une vérification:

```javascript {4,17,24,32}
// web/src/Routes.js

import { Router, Route, Private } from "@redwoodjs/router";

const Routes = () => {
    return (
        <Router>
            <Route path="/contact" page={ContactPage} name="contact" />
            <Route path="/about" page={AboutPage} name="about" />
            <Route path="/" page={HomePage} name="home" />
            <Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
            <Private unauthenticated="home">
                <Route path="/admin/posts/new" page={NewPostPage} name="newPost" />
                <Route path="/admin/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />
                <Route path="/admin/posts/{id:Int}" page={PostPage} name="post" />
                <Route path="/admin/posts" page={PostsPage} name="posts" />
            </Private>
            <Route notfound page={NotFoundPage} />
        </Router>
    );
};

export default Routes;
```

Essayez maintenant de créer, de modifier ou de supprimer un article de nos pages d'administration. Il ne se passe rien! Devrions-nous afficher une sorte de message d'erreur convivial? Dans ce cas, probablement pas - nous allons verrouiller complètement les pages d'administration afin qu'elles ne soient pas accessibles par un navigateur. La seule façon pour quelqu'un de déclencher ces erreurs dans l'API est de tenter d'accéder directement au point de terminaison GraphQL, sans passer par notre interface utilisateur. L'API renvoie déjà un message d'erreur (ouvrez l'inspecteur Web dans votre navigateur et essayez à nouveau de créer / modifier / supprimer), nous sommes donc couverts.

> **Utilisez-vous la dernière version de Redwood?**
> 
> Notez que nous mettons les vérifications d'authentification dans le service et non la vérification dans l'interface GraphQL (dans les fichiers SDL). Redwood a créé le concept de **services** en tant que conteneurs pour votre logique métier qui peuvent être utilisés par d'autres parties de votre application en plus de l'API GraphQL.
> 
> En plaçant des contrôles d'authentification ici, vous pouvez être sûr que tout autre code qui tente de créer / mettre à jour / supprimer une publication tombera sous les mêmes contrôles d'authentification. En fait, Apollo (la bibliothèque GraphQL utilisée par Redwood) [est d'accord avec nous](https://www.apollographql.com/docs/apollo-server/security/authentication/#authorization-in-data-models)!

### Authentification côté Web

Nous allons maintenant restreindre complètement l'accès aux pages d'administration, sauf si vous êtes connecté. La première étape consistera à indiquer les itinéraires qui nécessiteront que vous soyez connecté. Pour ce faire, ajouter la balise `<Private>`:

```javascript {3,16,23}
// web/src/Routes.js

import { Router, Route, Set, Private } from '@redwoodjs/router'
import BlogLayout from 'src/layouts/BlogLayout'
import PostsLayout from 'src/layouts/PostsLayout'

const Routes = () => {
  return (
    <Router>
      <Set wrap={BlogLayout}>
        <Route path="/blog-post/{id:Int}" page={BlogPostPage} name="blogPost" />
        <Route path="/contact" page={ContactPage} name="contact" />
        <Route path="/about" page={AboutPage} name="about" />
        <Route path="/" page={HomePage} name="home" />
      </Set>
      <Private unauthenticated="home">
        <Set wrap={PostsLayout}>
          <Route path="/admin/posts/new" page={NewPostPage} name="newPost" />
          <Route path="/admin/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />
          <Route path="/admin/posts/{id:Int}" page={PostPage} name="post" />
          <Route path="/admin/posts" page={PostsPage} name="posts" />
        </Set>
      </Private>
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
```

Entourez les routes que vous voulez protéger par l'authentification, et ajoutez éventuellement l'attribut `unauthenticated` qui répertorie le nom d'une autre route vers laquelle rediriger si l'utilisateur n'est pas connecté. Dans ce cas, nous reviendrons à la page d'accueil.

Essayez cela dans votre navigateur. Si vous cliquez sur http://localhost:8910/admin/posts, vous devez immédiatement revenir à la page d'accueil.

Il ne reste plus qu'à laisser l'utilisateur se connecter! Si vous avez déjà créé une authentification, vous savez que cette partie est généralement un frein, mais Redwood en fait une gentille promenade au parc. La majeure partie de la plomberie a été gérée par le générateur d'authentification, nous pouvons donc nous concentrer sur les parties que l'utilisateur voit réellement. Tout d'abord, ajoutons un lien **Login** qui déclenchera une fenêtre modale à partir du [widget Netlify Identity](https://github.com/netlify/netlify-identity-widget). Supposons que nous souhaitons obtenir cela sur toutes les pages publiques, nous allons donc le mettre dans le `BlogLayout`:

```javascript {4,7,22-26}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from "@redwoodjs/router";
import { useAuth } from "@redwoodjs/auth";

const BlogLayout = ({ children }) => {
    const { logIn } = useAuth();

    return (
        <div>
            <h1>
                <Link to={routes.home()}>Redwood Blog</Link>
            </h1>
            <nav>
                <ul>
                    <li>
                        <Link to={routes.about()}>About</Link>
                    </li>
                    <li>
                        <Link to={routes.contact()}>Contact</Link>
                    </li>
                    <li>
                        <a href="#" onClick={logIn}>
                            Log In
                        </a>
                    </li>
                </ul>
            </nav>
            <main>{children}</main>
        </div>
    );
};

export default BlogLayout;
```

Essayez de cliquer sur le lien Login:

![Netlify Identity Widget modal](https://user-images.githubusercontent.com/300/82387730-aa7ef500-99ec-11ea-9a40-b52b383f99f0.png)

Nous devons informer le widget de l'URL de notre site afin qu'il sache où aller pour obtenir les données des utilisateurs et confirmer qu'ils peuvent se connecter. De retour sur Netlify, vous pouvez l'obtenir à partir de l'onglet **Identity**:

![Netlify site URL](https://user-images.githubusercontent.com/300/82387937-28430080-99ed-11ea-91b7-a4e10f14aa83.png)

Vous avez besoin du protocole et du domaine, pas du reste du chemin. Collez-le dans la fenêtre modale et cliquez sur le bouton **Set site's URL**. La fenêtre modale devrait se recharger et afficher maintenant une vraie boîte de connection:

![Netlify identity widget login](https://user-images.githubusercontent.com/300/82388116-97205980-99ed-11ea-8fb4-13436ee8e746.png)

#### Accepter les invitations

Avant de pouvoir nous connecter, vous rappelez-vous cet e-mail de confirmation de Netlify? Allez le trouver et cliquez sur le lien **Accept the invite** . Cela vous amènera à votre site en production, où rien ne se passera. Mais si vous regardez l'URL, elle se terminera par quelque chose comme `#invite_token=6gFSXhugtHCXO5Whlc5V`. Copiez-le (y compris le `#`) et ajoutez-le à votre URL localhost: http://localhost:8910/#invite_token=6gFSXhugtHCXO5Whlc5Vg. Appuyez sur Entrée, puis revenez dans l'URL et appuyez à nouveau sur Entrée pour qu'il recharge la page. Maintenant, la fenêtre modale affichera **Complete your signup** et vous donnera la possibilité de définir votre mot de passe:

![Netlify identity set password](https://user-images.githubusercontent.com/300/82388369-54ab4c80-99ee-11ea-920e-9df10ee0cac2.png)

Une fois que vous faites cela, la fenêtre modale devrait se mettre à jour et dire que vous êtes connecté! Ça a marché! Cliquez sur le X en haut à droite pour fermer la fenêtre modale.

> Nous savons que ce workfow d'acceptation des invitations est loin d'être idéal. La bonne nouvelle est que, lorsque déployez à nouveau votre site avec authentification, les futures invitations fonctionneront automatiquement - le lien ira à la production qui aura désormais le code nécessaire pour lancer le modal et vous permettra d'accepter l'invitation.

Cependant, nous n'avons actuellement aucune indication sur notre site que nous sommes connectés. Pourquoi ne pas changer le bouton **Log In** en **Log Out** lorsque vous êtes authentifié:

```javascript {7,23-24}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from "@redwoodjs/router";
import { useAuth } from "@redwoodjs/auth";

const BlogLayout = ({ children }) => {
    const { logIn, logOut, isAuthenticated } = useAuth();

    return (
        <div>
            <h1>
                <Link to={routes.home()}>Redwood Blog</Link>
            </h1>
            <nav>
                <ul>
                    <li>
                        <Link to={routes.about()}>About</Link>
                    </li>
                    <li>
                        <Link to={routes.contact()}>Contact</Link>
                    </li>
                    <li>
                        <a href="#" onClick={isAuthenticated ? logOut : logIn}>
                            {isAuthenticated ? "Log Out" : "Log In"}
                        </a>
                    </li>
                </ul>
            </nav>
            <main>{children}</main>
        </div>
    );
};

export default BlogLayout;
```

`useAuth ()` nous apporte quelques aides supplémentaires, dans le cas présent `isAuthenticated` retournera`true` ou `false` en fonction de votre statut de connexion, et`logOut ()` déconnectera l'utilisateur. Cliquez maintenant sur **Log Out** pour vous déconnecter et changer le lien en **Log In** sur lequel vous pouvez cliquer pour ouvrir la fenêtre modale et vous reconnecter.

Lorsque vous _êtes_ connecté, vous devriez pouvoir accéder à nouveau aux pages d'administration: http://localhost:8910/admin/posts

> Si vous commencez à travailler sur une autre application Redwood qui utilise Netlify Identity, vous devrez effacer manuellement votre stockage local, où est stockée l'URL du site que vous avez entrée la première fois que vous avez vu la fenêtre modale. Le stockage local est lié à votre domaine et à votre port, qui par défaut seront les mêmes pour toute application Redwood lors du développement local. Vous pouvez effacer votre stockage local dans Chrome en allant dans l'inspecteur Web, puis dans l'onglet **Application**, puis à gauche, ouvrez **Local Storage** et cliquez sur http://localhost:8910. Vous verrez les clés stockées sur la droite et pourrez toutes les supprimer.

Encore un détail: montrons l'adresse e-mail de l'utilisateur connecté. Nous pouvons obtenir le `currentUser` par le "hook" `useAuth()`. Il contiendra les données que notre bibliothèque d'authentification tierce stocke pour l'utilisateur actuellement connecté:

```javascript {7,27}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from "@redwoodjs/router";
import { useAuth } from "@redwoodjs/auth";

const BlogLayout = ({ children }) => {
    const { logIn, logOut, isAuthenticated, currentUser } = useAuth();

    return (
        <div>
            <h1>
                <Link to={routes.home()}>Redwood Blog</Link>
            </h1>
            <nav>
                <ul>
                    <li>
                        <Link to={routes.about()}>About</Link>
                    </li>
                    <li>
                        <Link to={routes.contact()}>Contact</Link>
                    </li>
                    <li>
                        <a href="#" onClick={isAuthenticated ? logOut : logIn}>
                            {isAuthenticated ? "Log Out" : "Log In"}
                        </a>
                    </li>
                    {isAuthenticated && <li>{currentUser.email}</li>}
                </ul>
            </nav>
            <main>{children}</main>
        </div>
    );
};

export default BlogLayout;
```

![Logged in email](https://user-images.githubusercontent.com/300/82389433-05b2e680-99f1-11ea-9d01-456cad508c80.png)

> **En savoir plus sur Netlify Identity**
> 
> Consultez les paramètres d'identité sur Netlify pour plus d'options, notamment permettre aux utilisateurs de créer des comptes plutôt que d'avoir à être invités, ajouter des boutons de connexion tiers pour Bitbucket, GitHub, GitLab et Google, recevoir des webhooks lorsque quelqu'un se connecte, etc... !

Croyez-le ou non, c'est tout! L'authentification avec Redwood est un jeu d'enfant et nous ne faisons que commencer. Attendez-vous à plus de magie bientôt!

