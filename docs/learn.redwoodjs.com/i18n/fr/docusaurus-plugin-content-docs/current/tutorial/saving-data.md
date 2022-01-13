---
id: saving-data
title: "Enregistrer les Données"
sidebar_label: "Enregistrer les Données"
---

Ajoutons une nouvelle table à notre base de données. Ouvrez `api/prisma/schema.prisma` et ajoutez un nouveau modèle "Contact" à la suite du premier modèle "Post":

```javascript
// api/prisma/schema.prisma

model Contact {
  id        Int @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}
```

> **Syntaxe Prisma pour les champs facultatifs**
> 
> Pour définir une colonne comme optionnelle (c'est à dire permettre que sa valeur soit `NULL`), il suffit de suffixer le type de la donnée avec un point d'interrogation: `name String?` Cela permettra `name` d'accepter une valeur de type chaîne de caractères, ou `NULL`. Cela permettra à la valeur de `name` d'être soit de type `string`, soit `NULL`.

Nous créons ensuite notre nouvelle migration:

    yarn rw db save create contact

Enfin, nous executons la migration de façon à mettre à jour le schéma de la base de données:

Maintenant nous créeons l'interface GraphQL permettant d'accéder à cette nouvelle table. C'est la première fois que nous utilisons cette commande `generate` nous même. (la commande `scaffold` repose également dessus):

    yarn rw g sdl contact

De la même manière qu'avec la commande `scaffold`, ceci va créer deux nouveaux fichiers dans le répertoire `api`:

1. `api/src/graphql/contacts.sdl.js`: qui définit le schéma GraphQL
2. `api/src/services/contacts/contacts.js`: qui contient votre code métier

// api/src/graphql/contacts.sdl.js type Mutation { createContact(input: CreateContactInput!): Contact }

```javascript
// api/src/graphql/contacts.sdl.js

export const schema = gql`
    type Contact {
        id: Int!
    name: String!
    email: String!
    message: String!
    createdAt: DateTime!
  }

    type Query {
        contacts: [Contact!]!
  }

    input CreateContactInput {
        name: String!
    email: String!
    message: String!
  }

    input UpdateContactInput {
        name: String
        email: String
        message: String
    }
`;
```

Que sont les "input" `CreateContactInput` et `UpdateContactInput`? Redwood suit la recommandation de GraphQL d'utiliser les [Input Types](https://graphql.org/graphql-js/mutations-and-input-types/) dans les mutations plutôt que de lister tous les champs qui peuvent être définis. Tous les champs requis dans `schema.prisma` sont également requis dans `CreateContactInput` (vous ne pouvez pas créer un enregistrement valide sans eux) mais rien n'est explicitement requis dans `UpdateContactInput`. En effet, vous pouvez souhaiter mettre à jour un seul champ, deux champs ou tous les champs. L'alternative serait de créer des types d'entrée séparés pour chaque permutation de champs que vous souhaitez mettre à jour. Nous avons estimé que le fait de n'avoir qu'une seule entrée de mise à jour, bien que ce ne soit peut-être pas la manière absolument correcte de créer une API GraphQL, était un bon compromis pour faciliter le développement.

> Redwood suppose que votre code n'essaiera pas de définir une valeur sur un champ nommé `id` ou `createdAt` donc il les a laissés en dehors des types d'entrée, mais si votre base de données autorise l'un ou l'autre de ceux à définir manuellement, vous pouvez mettre à jour`CreateContactInput`ou `UpdateContactInput` et les ajouter.

Puisque toutes les colonnes de la table étaient définies comme requises dans `schema.prisma`, elles sont également définies comme requises ici (notez le suffixe `!` sur les types de données).

> **Syntaxe GraphQL pour les champs obligatoires**
> 
> La syntaxe SDL de GraphQL nécessite un `supplémentaire !` lorsqu'un champ _est_ requis. **important:** la syntaxe de `schema.prisma` requiert l'ajout d'un caractère `?` lorsqu'un champ _n'est pas_ requis, tandis que la syntaxe GraphQL requiert l'ajout d'un caractère `!` lorsqu'un champ _est_ requis.

Comme décrit dans [Quête secondaire: Fonctionnement de Redwood avec les Données](./side-quest-how-redwood-works-with-data), il n'y a pas de "resolver" définit explicitement dans le fichier SDL. Redwood suit une convention de nommage simple: chaque champ listé dans les types `Query` et `Mutation` correspondent à une fonction avec un nom identique dans les fichiers `service` et `sdl` associés (`api/src/graphql/contacts.sdl.js -> api/src/services/contacts/contacts.js`)

Dans le cas présent, nous créeons une unique `Mutation` que nous appelons `createContact`. Nous l'ajoutons à la fin de notre fichier SDL (avant le caractère 'backtick'):

```javascript {28-30}
// api/src/graphql/contacts.sdl.js

export const schema = gql`
    type Contact {
        id: Int!
    name: String!
    email: String!
    message: String!
    createdAt: DateTime!
  }

    type Query {
        contacts: [Contact!]!
  }

    input CreateContactInput {
        name: String!
    email: String!
    message: String!
  }

    input UpdateContactInput {
        name: String
        email: String
        message: String
    }

    type Mutation {
        createContact(input: CreateContactInput!): Contact
    }
`;
```

La mutation `createContact` accepte une variable unique, `input`, qui est un objet conforme à ce qu'on attend pour un `CreateContactInput`, c'est à dire `{ name, email, message }`.

C'est terminé pour le fichier SDL, définissons maintenant le service qui va réellement enregistrer les données en base. Le service inclut une fonction `contacts` permettant de récupérer l'ensemble des contacts depuis la base. Ajoutons-y une mutation pour pouvoir créer un nouveau contact:

```javascript {9-11}
// api/src/services/contacts/contacts.js

import { db } from "src/lib/db";

export const contacts = () => {
    return db.contact.findMany();
};

export const createContact = ({ input }) => {
    return db.contact.create({ data: input });
};
```

Grâce au client Prisma, il faut peu de code pour enregistrer nos données en base! Il s'agit d'un appel asynchrone, mais nous n'avons pas à nous soucier de manipuler un objet Promise ou s'arranger avec `async/await`. La librairie Apollo le fait pour nous!

Avant d'insérer tout ceci dans notre interface utilisateur, prennons un peu de temps pour utiliser un outil bien pratique en exécutant la commande `yarn redwood dev`.

### Le Bac à Sable GraphQL

Souvent, il est utile d'expérimenter notre API dans une forme un peu "brute" avant de poursuivre plus avant le développement de l'interface et s'apercevoir que l'on a oublié quelque chose. Y a-t-il une faute de frappe dans la couche API ou la couche web ? Découvrons en accédant uniquement à la couche API.

Lorsque vous avez exécuté la commande `yarn redwood dev` au début de ce didacticiel, vous avez en réalité démarré un second processus en arrière-plan. Ouvrez donc une nouvelle page de votre navigateur à cette adresse: http://localhost:8911/graphql . Il s'agit du [Bac à Sable GraphQL](https://github.com/prisma-labs/graphql-playground) fournit par la librairie Prisma, une application web permettant d'interagir avec une API GraphQL:

<img src="https://user-images.githubusercontent.com/300/70950852-9b97af00-2016-11ea-9550-b6983ce664e2.png" />

Observez en particulier l'onglet "Doc" situé sur la partie droite de l'écran:

<img src="https://user-images.githubusercontent.com/300/73311311-fce89b80-41da-11ea-9a7f-2ef6b8191052.png" />

Vous y trouverez le schema complet tel que définit dans vos fichiers SDL! L'application analyse ces définitions et vous propose ces éléments pour vous permettre de construire vos requêtes. Essayez par exemple de récupérer les ID de tous les articles en écrivant votre requête dans la partie gauche puis en cliquant sur le bouton "Play":

<img src="https://user-images.githubusercontent.com/300/70951466-52e0f580-2018-11ea-91d6-5a5712858781.png" />

Le bac à sable GraphQL est une excellente manière d'expérimenter avec votre API, et comprendre pourquoi une requête ne fonctionne pas comme prévue.

### Créer un Contact

Notre mutation GraphQL est prête pour la partie backend, tout ce qu'il reste à faire c'est l'invoquer depuis la partie frontend. Tout ce qui à trait à notre formulaire se trouve dans `ContactPage`, c'est donc l'endroit logique pour y mettre l'appel à notre nouvelle mutation. D'abord nous définissons cette mutation comme une constante que nous appellerons plus tard (ceci peut être défini en dehors du composant lui-même, juste après les lignes d'imports):

```javascript
// web/src/pages/ContactPage/ContactPage.js

const CREATE_CONTACT = gql`
    mutation CreateContactMutation($input: CreateContactInput!) {
        createContact(input: $input) {
            id
        }
    }
`;
```

Nous référençons ainsi la mutation `createContact` définie auparavant dans le fichier SDL des contacts, tout en lui passant en argument un objet `input` contenant la valeur des champs `name`, `email` et `message`.

Après quoi, nous appelons le 'hook' `useMutation` fourni par Appolo, ce qui nous permet d'exécuter la mutation lorsque le moment est venu (n'oubliez pas les imports comme à chaque fois):

```javascript {11,14}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'

const ContactPage = () => {
  const [create] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    console.log(data)
  }

  return (...)
}
```

`create` est une fonction qui invoque la mutation et prend en paramètre un objet contenant un clef `variables`. Par exemple, nous pourrions l'appeler également de cette manière:

```javascript
create({
    variables: {
        input: {
            name: "Rob",
            email: "rob@redwoodjs.com",
            message: "I love Redwood!",
        },
    },
});
```

Si votre mémoire est bonne, vous vous souvenez sans doute que la balise `<Form>` nous donne accès à l'ensemble des champs du formulaire avec un objet bien pratique dans lequel chaque clef se trouve être le nom du champ. Cela signifie donc que l'objet `data`que nous recevons dans `onSubmit` est déjà dans le format adapté pour `input`!

Maintenant nous pouvons mettre à jour la fonction `onSubmit` pour invoquer la mutation avec les données qu'elle reçoit:

```javascript {7}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const [create] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    create({ variables: { input: data }})
    console.log(data)
  }

  return (...)
}
```

Essayez-donc de remplir le formulaire et de l'envoyer. Vous devriez obtenir un nouveau contact en base de données! Vous pouvez vérifier ceci avec l'outil bac à sable de GraphQL:

![image](https://user-images.githubusercontent.com/300/76250632-ed5d6900-6202-11ea-94ce-bd88e3a11ade.png)

### Améliorer le formulaire de contact

Notre formulaire de contact fonctionne, mais il subsiste quelques problèmes:

- Cliquer sur le bouton d'enregistrement plusieurs fois à pour conséquence d'envoyer le formulaire également plusieurs fois
- L'utilisateur ne sait pas si l'envoi a bien été pris en compte
- Si une erreur devait se produire côté serveur, nous n'avons aucun moyen d'en informer l'utilisateur

Essayons d'y apporter une solution.

Le 'hook' `useMutation` retourne quelques autres éléments en plus de la fonction permettant de l'invoquer. Nous pouvons les détruire comme le deuxième élément du tableau qui est retourné. Les deux choses qui nous intéressent sont le `chargement` et `erreur`:

```javascript {4}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const [create, { loading, error }] = useMutation(CREATE_CONTACT)

  const onSubmit = (data) => {
    create({ variables: { input: data } })
    console.log(data)
  }

  return (...)
}
```

Ce faisant, nous savons si un appel à la base est toujours en cours en utilisant la valeur de `loading`. Une façon simple de résoudre le problème des soumissions multiples du même formulaire est de rendre inactif le bouton d'envoi tant que la réponse n'a pas été reçue. Nous pouvons faire celà en liant l'attribut `disabled` du bouton "save" à la valeur contanue dans `loading`:

```javascript {5}
// web/src/pages/ContactPage/ContactPage.js

return (
  // ...
  <Submit disabled={loading}>Save</Submit>
  // ...
)
```

Il peut être difficile de voir une différence en phase de développement car l'envoi est très rapide. Mais vous pouvez néanmoins activer un outil bien pratique dans le navigateur Chrome afin de simuler une connection lente:

<img src="https://user-images.githubusercontent.com/300/71037869-6dc56f80-20d5-11ea-8b26-3dadb8a1ed86.png" />

Vous verrez alors que le bouton "Save" devient inactif pendant une seconde ou deux en attendant la réponse.

Ensuite, affichons une notification pour faire savoir à l'utilisateur que son envoi a réussi. Redwood inclut [react-hot-toast](https://react-hot-toast.com/) pour afficher rapidement une notification sur une page.

`useMutation` accepte un second paramètre optionnel contenant des options. Une de ces options est une fonction callback appelée `onCompleted` qui sera invoquée lorsque la mutation sera achevée avec succès. Nous allons utiliser ce callback pour appeler une fonction `toast()` qui ajoutera un message à afficher dans un composant **&lt;Toaster&gt;**.

Ajoutez le callback `onCompleted` à `useMutation` et incluez le composant **&lt;Toaster&gt;** dans notre `return`, juste avant le **&lt;Form&gt;**. Nous avons également besoin de tout envelopper dans un fragment (`<></>`) parce que nous ne sommes autorisés à renvoyer qu'un seul élément :

```javascript {5,10-14,19,20,23}
// web/src/pages/ContactPage/ContactPage.js

// ...
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

// ...

const ContactPage = () => {
  const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
    onCompleted: () => {
      toast.success('Thank you for your submission!')
    },
  })

  // ...

  return (
    <>
      <Toaster />
      <Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }}>
      // ...
    </>
  )
```

Vous pouvez lire la documentation complète pour Toast [ici](https://redwoodjs.com/docs/toast-notifications).

### Afficher les erreurs serveur

Nous allons maintenant informer l'utilisateur des éventuelles erreurs côté serveur. Jusqu'ici nous n'avons notifié les utilisateurs quie des erreurs _côté client_ lorsqu'un champ était manquant ou formaté incorrectement. Mais si nous avons également des contraintes côté serveur que le composant `<Form>` ignore, nous devons tout de même pouvoir en informer l'utilisateur.

Ainsi, nous avons une validateur de l'email côté client, mais tout bon développeur web sait qu'il ne faut [_jamais faire confiance au client_](https://www.codebyamir.com/blog/never-trust-data-from-the-browser). Ajoutons une validation de l'email côté serveur de façon à être certain qu'aucune donnée erronée ne soit ajoutée dans la base, et ce même si un utilisateur parvenait à contourner le fonctionnement de l'application côté client.

> **Pas de validation côté serveur ?**
> 
> Pourquoi n'avons-nous pas besoin de validation côté serveur pour s'assurer que les champs name, email et message sont bien remplis? Car la base de données le fait pour nous. Vous rappellez-vous `String!` dans notre fichier SDL? Celà ajoute une contrainte en base de données de telle façon que ce champ ne puisse être `null`. Une valeur `null` serait rejetée par la base et GraphQL renverrait une erreur à la partie client.
> 
> Cependant, il n'existe pas de type `Email!`, raison pour laquelle nous devons assurer la validation nous même

Nous avons déjà évoqué le fait que la logique métier de notre application se trouve dans nos services, et il s'agit ici d'un parfait exemple. Ajoutons une fonction `validate` à notre service `contacts`:

```javascript {3,7-15,22}
// api/src/services/contacts/contacts.js

import { UserInputError } from "@redwoodjs/api";

import { db } from "src/lib/db";

const validate = (input) => {
    if (input.email && !input.email.match(/[^@]+@[^.]+\..+/)) {
        throw new UserInputError("Can't create new contact", {
            messages: {
                email: ["is not formatted like an email address"],
            },
        });
    }
};

export const contacts = () => {
    return db.contact.findMany();
};

export const createContact = ({ input }) => {
    validate(input);
    return db.contact.create({ data: input });
};
```

Ainsi, lorsque `createContact` est invoquée, la fonction commence par valider le contenu des champs du formulaire. Puis, et seulement s'il n'y a aucune erreur, l'enregistrement sera créé en base de données.

Nous capturons déjà toutes les erreurs dans la constante `error` que nous obtenons grâce au 'hook' `useMutation`. C'est pourquoi nous avons la possibilité d'afficher ces erreurs sur la page, par exemple au dessus du formulaire:

```html {4-9}
// web/src/pages/ContactPage/ContactPage.js

<Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }}>
  {error && (
    <div style={{ color: 'red' }}>
      {"We couldn't send your message: "}
      {error.message}
    </div>
  )}
  // ...
```

> Si vous avez besoin de manipuler l'objet contenant les erreurs, vous pouvez procéder ainsi:
> 
> ```javascript {3-8}
>   // web/src/pages/ContactPage/ContactPage.js
>   const onSubmit = async (data) =&#062; {
>     try {
>       await create({ variables: { input: data } })
>       console.log(data)
>     } catch (error) {
>       console.log(error)
>     }
>   }
> ```
> ```

Pour obtenir une erreur de serveur à exécuter, nous allons supprimer la validation du format de courriel afin que l'erreur côté client ne soit pas affichée :

```html
// web/src/pages/ContactPage/ContactPage.js 

<TextField
  name="email"
  validation={{
    required: true,
  }}
  errorClassName="error"
/>
```

Maintenant, essayez de remplir le formulaire avec une adresse e-mail invalide :

<img src="https://user-images.githubusercontent.com/16427929/98918425-e394af80-24cd-11eb-9056-58c295cf0d5c.PNG" />

Ce n'est pas joli, mais ça marche. Ce serait sans doute mieux si le champ lui-même était mis en surbrillance comme quand la validation en ligne était en place...

Rappelez-vous quand nous avons dit que `<Form>` avait encore un tour dans sa manche ? Voilà qui vient !

Supprimez l'affichage de l'erreur tel que nous venons de l'ajouter (`{ error && ...}`) , et remplacez-le avec `&lt;FormError&gt;` tout en passant en argument la constante `error` que nous récupérons depuis `useMutation`. Ajoutez également quelques éléments de style à `wrapperStyle`, sans oublier les `import` associés. Nous passerons également `erreur` à `<Form>` pour qu'il puisse configurer un contexte :

```javascript {10,20-24}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
  FormError,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'

// ...

return (
  <>
    <Toaster />
    <Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }} error={error}>
      <FormError
        error={error}
        wrapperStyle={{ color: 'red', backgroundColor: 'lavenderblush' }}
      />

      //...
)
```

Maintenant, soumettez un message avec une adresse e-mail invalide :

<img src="https://user-images.githubusercontent.com/300/80259553-c46e2780-863a-11ea-9441-54a9112b9ce5.png" />

Nous obtenons ce message d'erreur en haut en disant que quelque chose s'est mal passé en anglais clair _et_ le champ réel est mis en surbrillance pour nous, tout comme la validation en ligne ! Le message en haut du formulaire peut apparaître un peu lourd pour un si petit formulaire, mais vous contaterez son utilité lorsque vous construirez des formulaires de plusieurs pages; de cette façon l'utilisateur peut voir imméédiatement ce qui ne fonctionne pas sans avoir à parcourir l'ensemble du formulaire. Si vous ne souhaitez pas utiliser cet affichage, il vous suffit de supprimer `&lt;FormError&gt;`, les champs seront toujours mis en avant.

> **`<FormError>` a plusieurs options pour adapter le style d'affichage**
> 
> 
> 
> - `wrapperStyle` / `wrapperClassName`: le conteneur pour l'ensemble du message
> - `titleStyle` / `titleClassName`: le titre "Can't create new contact"
> - `listStyle` / `listClassName`: le `<ul>` qui contient la liste des erreurs
> - `listItemStyle` / `listItemClassName`: chaque `<li>` contenant chaque erreur

### Une dernière chose...

Puisque nous ne redirigeons pas l'utilisateur une fois le formulaire envoyé, nous devrions au moins remettre le formulaire à zéro. Pour celà nous devons utiliser la fonction `reset()` proposée par `react-hook-form`, mais nous n'y avons pas accès compte tenu de la manière dont nous utilisons `&lt;Form&gt;`.

`react-hook-form` possède un 'hook' appelé `useForm()` qui est en principe invoquée pour nous à l'intérieur de `&lt;Form&gt;`. De façon à réinitialiser le formulaire nous devons invoquer ce 'hook' manuellement. Mais la fonctionnalité que `useForm()` fournit doit tout de même être utilisée dans `Form`. Voici comment nous y parvenons.

Tout d'abord, nous allons importer `useForm`:

```javascript
// web/src/pages/ContactPage/ContactPage.js

import { useForm } from "react-hook-form";
```

Puis invoquons ce 'hook' dans notre composant:

```javascript {4}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const formMethods = useForm()
  //...
```

Enfin, nous allons dire à `<Form>` d'utiliser les `formMethods` que nous venons d'instancier au lieu de le faire lui-même :

```javascript {10}
// web/src/pages/ContactPage/ContactPage.js

return (
  <>
    <Toaster />
    <Form
      onSubmit={onSubmit}
      validation={{ mode: 'onBlur' }}
      error={error}
      formMethods={formMethods}
    >
    // ...
```

Maintenant nous pouvons appeler `reset()` sur `formMethods` après avoir appelé `toast()` :

```javascript {6}
// web/src/pages/ContactPage/ContactPage.js

const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
  onCompleted: () => {
    toast.success('Thank you for your submission!')
    formMethods.reset();
    },
});
```

<img alt="Capture d'écran du formulaire de Contact avec message de confirmation Toast" src="https://user-images.githubusercontent.com/300/112360362-7a008b00-8c8f-11eb-8649-76d00be920b7.png" />

> Vous pouvez maintenant réactiver la validation email côté client sur le `<TextField>`, tout en conservant la validation côté serveur.

Voici le contenu final de la page `ContactPage.js`:

```javascript
import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
  FormError,
} from '@redwoodjs/forms'
import { useMutation } from '@redwoodjs/web'
import { toast, Toaster } from '@redwoodjs/web/toast'
import { useForm } from 'react-hook-form'

const CREATE_CONTACT = gql`
  mutation CreateContactMutation($input: CreateContactInput!) {
    createContact(input: $input) {
      id
    }
  }
`

const ContactPage = () => {
  const formMethods = useForm()

  const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
    onCompleted: () => {
      toast.success('Thank you for your submission!')
      formMethods.reset()
    },
  })

  const onSubmit = (data) => {
    create({ variables: { input: data } })
    console.log(data)
  }

  return (
    <>
      <Toaster />
      <Form
        onSubmit={onSubmit}
        validation={{ mode: 'onBlur' }}
        error={error}
        formMethods={formMethods}
      >
        <FormError
          error={error}
          wrapperStyle={{ color: 'red', backgroundColor: 'lavenderblush' }}
        />
        <Label name="name" errorClassName="error">
          Name
        </Label>
        <TextField
          name="name"
          validation={{ required: true }}
          errorClassName="error"
        />
        <FieldError name="name" className="error" />

        <Label name="email" errorClassName="error">
          Email
        </Label>
        <TextField
          name="email"
          validation={{
            required: true,
            pattern: {
              value: /[^@]+@[^.]+\..+/,
              message: 'Please enter a valid email address',
            },
          }}
          errorClassName="error"
        />
        <FieldError name="email" className="error" />

        <Label name="message" errorClassName="error">
          Message
        </Label>
        <TextAreaField
          name="message"
          validation={{ required: true }}
          errorClassName="error"
        />
        <FieldError name="message" className="error" />

        <Submit disabled={loading}>Save</Submit>
      </Form>
    </>
  )
}

export default ContactPage
```

C'est tout! \[React Hook Form\](https://react-hook-form.com/) propose pas mal de fonctionalités que `&lt;Form&gt;` n'expose pas. Lorsque vous souhaitez les utiliser, appelez juste le 'hook' `useForm()` vous-même, en vous assurant de bien passer en argument l'objet retourné (`formMethods`) comme propriété de `&lt;Form&gt;` de façon à ce que la validation et les autres fonctionalités puissent continuer à fonctionner.

> Vous avez peut-être remarqué que la validation onBlur a cessé de fonctionner lorsque vous avez commencé à appeler `userForm()` par vous-même. Ceci s'explique car Redwood invoque `userForm()` et lui passe automatiquement en argument ce que vous avez passé à `<Form>`. Puisque Redwood n'appelle plus automatiquement `useForm()` à votre place, vous devez de faire manuellement:
> 
> ```javascript
> const formMethods = useForm({ mode: "onBlur" });
> ```

La partie publique du site a bon aspect. Que faire maintenant de la partie administration qui nous permet de créer et éditer les articles? Nous devrions la déplacer dans une partie réservée et la placer derrière un login, de façon à ce des utilisateurs mal intentionnés ne puissent pas créer en chaîne, par exemple, des publicités pour l'achat de médicaments en ligne...
