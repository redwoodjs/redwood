---
id: cells
title: "Cells"
sidebar_label: "Cells"
---

Ces fonctionnalités sont courantes dans la plupart des applications web. Nous voulions voir s'il y avait quelque chose que nous pouvions faire pour faciliter la vie des développeurs lorsqu'il s'agit de les ajouter à un composant standard. Nous pensons être parvenus à concevoir une proposition efficace. Nous appelons ça les _Cells_ (ou _cellules_ en français). Les Cells proposent une approche simple et déclarative pour récupérer des données au sein de vos composants. ([Lisez la documentation complète sur Cells](https://redwoodjs.com/docs/cells).)

Lorsque vous créez une nouvelle Cell, vous exportez quelques constantes, toujours nommées de façon identique, et Redwood s'appuie dessus pour mettre en place la mécanique. Une Cell ressemble typiquement à ceci:

```javascript
export const QUERY = gql`
    query {
        posts {
            id
            title
            body
            createdAt
        }
    }
`;

export const Loading = () => <div>Chargement...</div>;

export const Empty = () => <div>Aucun article disponible!</div>;

export const Failure = ({ error }) => <div>Erreur lors du chargement des articles: {error.message}</div>;

export const Success = ({ posts }) => {
    return posts.map((post) => (
        <article>
            <h2>{post.title}</h2>
            <div>{post.body}</div>
        </article>
    ));
};
```

Lorsque React affiche ce composant, Redwood va:

Il existe également quelques outils supplémentaire pour générer le cycle de vie du composant comme `beforeQuery` (pour manipuler les propriétés passées à `QUERY`) et `afterQuery` (pour manipuler les données retournées par GraphQL avant qu'elles ne soient transmises au composant `Success`)
  - Exécuter la requête `QUERY` et afficher le composant `Loading` jusqu'à ce qu'une réponse soit reçue
  - Si aucune donnée n'est retournée (c'est à dire `null` ou un tableau vide), le composant `Empty`
  - Dans le cas contraire (ni erreur, ni vide), le composant `Success`

Il existe également quelques outils supplémentaire pour générer le cycle de vie du composant comme `beforeQuery` (pour manipuler les propriétés passées à `QUERY`) et `afterQuery` (pour manipuler les données retournées par GraphQL avant qu'elles ne soient transmises au composant `Success`).

Le minimum dont vous avez besoin pour une Cell sont les exports `QUERY` et `Success`. Si vous n'exportez pas `Empty`, `Success` recevra les données vides. Si vous n'exportez pas `Failure`, les éventuelles erreurs seront envoyées à la console.

Pour déterminer dans quels cas utiliser les Cells, gardez en tête qu'elles sont utiles lorsque vos composants ont besoin de récupérer des données depuis la base, ou depuis tout autre service qui pourrait avoir un délai de réponse. Laissez Redwood se charger de jongler avec les états, de manière à pouvoir porter votre attention sur le comportement attendu de vos composants correctement affichés avec leur données.

### Notre Première Cell

La page d'accueil affichant une liste d'articles est un candidat parfait pour réaliser notre première cellule. Naturellement, nous avons prévu un générateur pour ça:

    yarn rw g cell BlogPosts

L'exécution de cette commande provoque la création d'un nouveau fichier `/web/src/components/BlogPostsCell/BlogPostsCell.js` (et son fichier de test associé) avec un peu de code par défaut pour vous faciliter la tâche:

```javascript
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
    query BlogPostsQuery {
        blogPosts {
            id
        }
    }
`;

export const Loading = () => <div>Loading...</div>;

export const Empty = () => <div>Empty</div>;

export const Failure = ({ error }) => <div>Error: {error.message}</div>;

export const Success = ({ blogPosts }) => {
    return JSON.stringify(blogPosts);
};
```

> **Indication de la multiplicité au générateur de cellules**
> 
> Lorsque vous utilisez le générateur, vous pouvez employer le type de casse qui vous plaît. Redwood fera en sorte de s'adapter pour créer une cellule avec un nom de fichier correct. Toutes ces commandes aboutissent à la création du même fichier (`web/src/components/BlogPostsCell/BlogPostsCell.js` ) :
> 
>     yarn rw g cell blog_posts
>     yarn rw g cell blog-posts
>     yarn rw g cell blogPosts
>     yarn rw g cell BlogPosts
>     
> 
> Vous aurez toutefois besoin d'indiquer _d'une manière ou d'une autre_ que vous utilisez plus d'un mot : soit en utilisant la forme snake_case (`blog_posts`), kebab-case (`blog-posts`), chamelCase (`blogPosts`) ou encore PascalCase (`BlogPosts`).
> 
> Appeler `yarn redwood g cell blogposts` sans utiliser aucune casse pour séparer "blog" et "posts" va générer un fichier `web/src/components/BlogpostsCell/BlogpostsCell.js`.

Pour vous aider à être efficace, le générateur suppose que vous utiliserez une requête racine GraphQL nommées de la même façon que votre Cell et écrit pour vous une requête minimale pour récupérer des données depuis la base. Dans le cas présent, la requête a donc été nommée `blogPosts`.

```javascript
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const Success = ({ posts }) => {
    return posts.map((post) => (
        <article key={post.id}>
            <header>
                <h2>{post.title}</h2>
            </header>
            <p>{post.body}</p>
            <div>Créé le: {post.createdAt}</div>
        </article>
    ));
};
```

Cependant, ce nom de requête n'est pas valide par rapport à ce qui a déjà été créé dans nos fichiers SDL et Service. (Pour voir d'où viennent ces fichiers, retournez à la section [Créer un éditeur de post](./getting-dynamic#creating-a-post-editor) dans la partie *Devenir dynamique*.

Nous devons donc utiliser le terme `posts` dans le nom de la requête et dans le nom de la prop de `Success`:

```javascript {5,17,18}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
    query BlogPostsQuery {
        posts {
            id
        }
    }
`;

export const Loading = () => <div>Loading...</div>;

export const Empty = () => <div>Empty</div>;

export const Failure = ({ error }) => <div>Error: {error.message}</div>;

export const Success = ({ posts }) => {
    return JSON.stringify(posts);
};
```

En plus de l'identifiant `id` qui a été ajouté dans `QUERY` par le générateur, récupérons également le titre, le contenu et la date de création de l'article:

```javascript {3,7}
// web/src/pages/HomePage/HomePage.js

import BlogPostsCell from 'src/components/BlogPostsCell'

const HomePage = () => {
  return (
    <BlogPostsCell />
  )
}

export default HomePage
```

Le navigateur devrait en principe montrer un tableau avec un peu de contenu (en supposant que vous ayez créé un article à l'étape du [scaffolding](./getting-dynamic) un peu plus tôt). Extra!

<img src="https://user-images.githubusercontent.com/300/73210519-5380a780-40ff-11ea-8639-968507a79b1f.png" />

> **Dans le composant `Success`, d'où vient donc `posts`?**
> 
> Remarquez que dans le composant `QUERY`, nous avons nommée notre requête `posts`. Quelque soit le nom de la requête, ce sera le nom de la propriété qui sera transmise au composant `Success` et qui contiendra vos données. Vous pouvez toutefois créer un alias de la façon suivante:
> 
> ```javascript
> export const QUERY = gql`
>   query BlogPostsQuery {
>     postIds: posts {
>       id
>     }
>   }
> `
> ```
> 
> ```javascript export const QUERY = gql`
    query BlogPostsQuery {
        postIds: posts {
            id
        }
    }`;

La page devrait désormais afficher un dump de l'ensemble des données pour tous les articles enregistrés:

```javascript {7-9}
De cette manière la propriété `postIds` sera transmise à `Success` au lieu de `posts`

`Success` est ni plus ni moins qu'un bon vieux composant React, vous pouvez donc le modifier simplement pour afficher chaque article dans un format un peu plus sympa et lisible:

```javascript {7-9}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const QUERY = gql`
    query BlogPostsQuery {
        posts {
            id
            title
            body
            createdAt
        }
    }
`;
```

La page devrait désormais afficher une décharge de l'ensemble des données pour tous les articles enregistrés:

<img src="https://user-images.githubusercontent.com/300/73210715-abb7a980-40ff-11ea-82d6-61e6bdcd5739.png" />

Maintenant, nous sommes dans le royaume des bons composants de React, donc construisez simplement le composant `Succès` pour afficher le message de blog dans un format plus sympa :

```javascript {4-12}
// web/src/components/BlogPostsCell/BlogPostsCell.js

export const Success = ({ posts }) => {
    return posts.map((post) => (
        <article key={post.id}>
            <header>
                <h2>{post.title}</h2>
            </header>
            <p>{post.body}</p>
            <div>Posted at: {post.createdAt}</div>
        </article>
    ));
};
```

Et ce faisant, nous avons maintenant notre blog! Ok, à ce stade c'est encore le plus basique et hideux blog jamais vu sur Internet.. mais c'est déjà quelque chose! (Pas d'inquiétude, nous avons encore un tas de fonctionnalités à ajouter)

<img src="https://user-images.githubusercontent.com/300/73210997-3dbfb200-4100-11ea-847a-602cbf59cb2a.png" />

### Résumé

En réalité, cette différentes étapes sont ni plus ni moins ce qui deviendra votre façon habituelle d'ajouter de nouvelles fonctionnalités dans une application Redwood.

1. Génération de la page d'accueil
2. Génération du Layout pour notre blog
3. Définition du schéma de la base de données
4. Application d'une migrations pour mettre à jour la base de données et créer une table
5. Réalisation d'un Scaffold pour créer une interface CRUD sur la table
6. Création d'une Cell pour charger les donner et gérer les états "loading", "empty", "failure" et enfin "success".
7. Ajout de la Cell à notre page d'accueil

En réalité, cette différentes étapes sont ni plus ni moins ce qui deviendra votre façon habituelle d'ajouter de nouvelles fonctionnalités dans une application Redwood.

Jusqu'ici, hormis un peu de code HTML, nous n'avons pas écrit grand chose à la main. En particulier, nous n'avons pratiquement pas eu à écrire de code pour récupérer les données depuis la base. Le développement web s'en trouve facilité et devient même agréable, qu'en pensez-vous?

