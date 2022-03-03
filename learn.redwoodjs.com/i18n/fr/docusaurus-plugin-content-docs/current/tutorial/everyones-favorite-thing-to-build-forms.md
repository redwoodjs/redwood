---
id: everyones-favorite-thing-to-build-forms
title: "Votre partie préférée: Les Formulaires"
sidebar_label: "Votre partie préférée: Les Formulaires"
---

Attendez, ne fermez pas votre navigateur ! Vous deviez bien vous douter que ça allait venir, non? Et vous vous êtes probablement rendu compte maintenant que nous n'aurions même pas cette section dans le tutoriel à moins que Redwood n'ait trouvé un moyen astucieux de faire les choses. En fait, Redwood pourrait même vous faire _aimer_ les formulaires. Bon, aimer est peut-être un peu fort. Disons _apprécier_ travailler avec les formulaires, ou à tout le moins les _tolérer_? Ou à tout le moins les _tolérer_?

La troisième partie du didacticiel en video commence ici:

> **Avis : contenu ancien**
> 
> Ces vidéos ont été enregistrées avec une version antérieure de Redwood et de nombreuses commandes sont maintenant obsolètes. Si vous voulez vraiment construire l'application de blog, vous devrez suivre avec le texte que nous gardons à jour avec les dernières versions.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/eT7iIy0F8Tk?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

Nous avons déjà un formulaire ou deux dans notre application; vous rappellez-vous notre _scaffolding_ avec les articles? Ils fonctionnaient plus bien, non? Alors, a quel point est-ce difficile de reproduire ces formulaires? (Si vous n'avez pas encore eu la curiosité d'aller voir le code généré, ce qui va suivre va vous surprendre)

Construisons donc le formulaire le plus élémentaire qui soit pour notre blog, et utile de surcroît, celui qui permettra à vos lecteurs de vous contacter.

### La Page

    yarn rw g page contact

Après avoir exécuté cette commande, nous pouvons ajouter un lien vers Contact dans notre Layout:

```javascript {17-19}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from "@redwoodjs/router";

const BlogLayout = ({ children }) => {
    return (
        <>
            <header>
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
                    </ul>
                </nav>
            </header>
            <main>{children}</main>
        </>
    );
};

export default BlogLayout;
```

Puis utilisez le `BlogLayout` pour la page `ContactPage` en vous assurant qu'elle soit encapsulée par le même `<Set>` que les autres pages, dans le fichier des Routes :

```javascript {5}
// web/src/Routes.js

<Router>
  <Set wrap={BlogLayout}>
    <Route path="/contact" page={ContactPage} name="contact" />
    <Route path="/about" page={AboutPage} name="about" />
    <Route path="/" page={HomePage} name="home" />
  </Set>
  <Route notfound page={NotFoundPage} />
</Router>
```

Vérifiez que tout fonctionne correctement, puis passons aux réjouïssances.

### Présentation des Form Helpers

Les formulaires avec React sont surtout connus pour être particulièrement agaçants à construire. Il existes les [Controlled Components](https://reactjs.org/docs/forms.html#controlled-components), les [Uncontrolled Components](https://reactjs.org/docs/uncontrolled-components.html), diverses [librairies tierces](https://jaredpalmer.com/formik/) et enfin pas mal d'astuces diverses pour essayer de les rendre aussi simples qu'ils sont sensés être selon les spécifications HTML: un champ `<input>` avec un attribut `name` qui sera envoyé quelque part lorsque l'utilisateur clique sur un bouton.

Nous pensons que Redwood fait quelques pas dans la bonne direction, non seulement en vous libérant d'avoir à écrire un tans de code relatif aux composants controllés (controlled components), mais aussi en s'occupant de gérer automatiquement les validations et éventuelles erreurs. Regardons ensemble comment tout celà fonctionne.

Avant de commencer, ajoutons quelques classes CSS pour que les formulaires par défaut s'affichent correctement sans que nous ayons à alourdir notre code avec des attributs `style` un peu partout. Pour le moment nous écrirons ces règles dans le fichier `index.css` situé dans le répertoire `web/src`:

```css
/* web/src/index.css */

button,
input,
label,
textarea {
    display: block;
    outline: none;
}

label {
    margin-top: 1rem;
}

.error {
    color: red;
}

input.error,
textarea.error {
    border: 1px solid red;
}
```

Pour l'instant nous n'allons pas faire dialoguer notre formulaire de contact avec la base de données, raison pour laquelle nous ne générons pas une Cell. Nous allons simplement ajouter le formulaire à notre page. Dans Redwood, la création d'un formulaire débute par... attention à la surprise...une balise `<Form>`:

```javascript {3,7}
// web/src/pages/ContactPage/ContactPage.js

import { Form } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form></Form>
  )
}

export default ContactPage
```

OK, ça n'était pas la chose la plus impressionnante qui soit. Vous ne pouvez même pas le voir dans le navigateur... Ajoutons un premier champ que l'on puisse au moins afficher quelque chose. Redwood propose une variété de type de champs parmi lesquels se trouve `<TextField>`. Il possède un attribut `name` de telle façon que lorsqu'un formulaire contient de multiples champs, il soit possible de savoir lequel contient telle ou telle donnée.

```javascript {3,8}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form>
      <TextField name="input" />
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80258121-4f4d2300-8637-11ea-83f5-c667e05aaf74.png" />

Enfin quelque chose s'affiche! Pas encore très intéressant toutefois. Ajoutons un bouton "envoyer".

```javascript {3,9}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField, Submit } from '@redwoodjs/forms'

const ContactPage = () => {
  return (
    <Form>
      <TextField name="input" />
      <Submit>Save</Submit>
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80258188-7572c300-8637-11ea-9583-1b7636f93be0.png" />

Nous obtenons ce qu'on peut considérer comme un véritable et authentique formulaire! Essayez de saisir quelque chose et cliquez sur le bouton. Rien n'explose, mais nous n'avons aucune indication que le formulaire à bien été envoyé (et vous aurez noté l'apparition d'une erreur dans la console). Voyons à présent comment récupérer les données depuis nos champs de formulaire.

### onSubmit

De façon similaire à un formulaire HTML, une balise `<Form>` possède un "_handler_" `onSubmit`. Ce handler sera appelé avec un seul argument: un unique objet contenant l'ensemble des champs du formulaire.

```javascript {4-6,9}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <TextField name="input" />
      <Submit>Save</Submit>
    </Form>
  )
}
```

Essayons maintenant de saisir quelques mots puis soumettre ce formulaire:

<img src="https://user-images.githubusercontent.com/300/80258293-c08cd600-8637-11ea-92fb-93d3ca1db3cf.png" />

Extra! Rendons le formulaire un peu plus utile en ajoutant quelques champs supplémentaires. Nous renommons ainsi notre premier champ en `name` puis ajoutons les champs `email` et `message`:

```javascript {3,12-14}
// web/src/pages/ContactPage/ContactPage.js

import { Form, TextField, TextAreaField, Submit } from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <TextField name="name" />
      <TextField name="email" />
      <TextAreaField name="message" />
      <Submit>Save</Submit>
    </Form>
  )
}

export default ContactPage
```

Remarquez le nouveau composant `<TextAreaField>` qui génère une balise HTML `<textarea>` contenant quelques spécificités utiles propres à Redwood:

<img src="https://user-images.githubusercontent.com/300/80258346-e4e8b280-8637-11ea-908b-06a1160b932b.png" />

Ajoutons également quelques étiquettes en face des champs:

```javascript {5,8,11}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField name="name" />

    <label htmlFor="email">Email</label>
    <TextField name="email" />

    <label htmlFor="message">Message</label>
    <TextAreaField name="message" />

    <Submit>Save</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258431-15c8e780-8638-11ea-8eca-0bd222b51d8a.png" />

Essayez donc de soumettre à nouveau le formulaire, vous devriez obtenir dans la console un message avec le contenu des trois champs.

### Validation

"D'accord, cher auteur du tutoriel Redwood," dites-vous, "C'est quoi le truc? Il y a pléthore de bibliothèques qui me permettent de créer des champs dans un formulaire. Et alors ?! Vous avez raison! N'importe qui peut remblir un formulaire _correctement_, mais que se passe-t-il lorsqu'un utilisateur fait une erreur, oubli un champ, voire tente de jouer les hackers? Qui va vous aider à gérer cette situation? Redwood va le faire.

Tout d'abord, ce trois champs devraient être obligatoirement remplis pour pouvoir soumettre le formulaire. Rendons cette règle obligatoire en utilisant l'attribut HTML standard `required`:

```javascript {6,9,12}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField name="name" required />

    <label htmlFor="email">Email</label>
    <TextField name="email" required />

    <label htmlFor="message">Message</label>
    <TextAreaField name="message" required />

    <Submit>Save</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258542-5163b180-8638-11ea-8450-8a727de177ad.png" />

Désormais, lorsque vous essayez de soumettre le formulaire, un message s'affiche dans votre navigateur. C'est mieux que rien, mais l'apparence de ce message ne peut être modifiée. Peut-on faire mieux?

Oui! Remplaçons cet attribut `required` par un object que nous passons à un attribut nommé `validation`, spécifique à Redwood:

```javascript {6,9,12}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField name="name" validation={{ required: true }} />

    <label htmlFor="email">Email</label>
    <TextField name="email" validation={{ required: true }} />

    <label htmlFor="message">Message</label>
    <TextAreaField name="message" validation={{ required: true }} />

    <Submit>Save</Submit>
  </Form>
)
```

Et maintenant, lorsque nous soumettons le formulaire avec des champs vides...le champ Name prend le focus. OK, pas franchement impressionnant. Mais ce n'est qu'un premier élément qui avant notre prochaine révélation! Nous avons un autre composant à ajouter : celui qui affiche des erreurs sur un champ. Et au passage, puisqu'il s'agit simplement de code HTML, nous pouvons lui appliquer exactement le style que nous souhaitons!

### `<FieldError>`

Pour celà, voici le composant `<FieldError>` (n'oubliez pas d'inclure l'`import` associé en haut du fichier):

```javascript {8,20,24,28}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
} from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
      <label htmlFor="name">Name</label>
      <TextField name="name" validation={{ required: true }} />
      <FieldError name="name" />

      <label htmlFor="email">Email</label>
      <TextField name="email" validation={{ required: true }} />
      <FieldError name="email" />

      <label htmlFor="message">Message</label>
      <TextAreaField name="message" validation={{ required: true }} />
      <FieldError name="message" />

      <Submit>Save</Submit>
    </Form>
  )
}

export default ContactPage
```

Observez que l'attribut `name` correspond à celui du champ au dessus. De cette manière, Redwood sait où afficher le message d'erreur d'un champ. Essayez de soumettre ce formulaire maintenant.

<img src="https://user-images.githubusercontent.com/300/80258694-ac95a400-8638-11ea-904c-dc034f07b12a.png" />

Mais c'est juste le début. Maintenant faisons en sorte que nos utilisateurs sachent qu'il s'agisse bien d'un message d'erreur. Vous rappellez-vous la classe CSS `.error` que nous avions définie dans `index.css`? Indiquons-la à l'attribut `className` de nos composants `<FieldError>`:

```javascript {7,11,15}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField name="name" validation={{ required: true }} />
    <FieldError name="name" className="error" />

    <label htmlFor="email">Email</label>
    <TextField name="email" validation={{ required: true }} />
    <FieldError name="email" className="error" />

    <label htmlFor="message">Message</label>
    <TextAreaField name="message" validation={{ required: true }} />
    <FieldError name="message" className="error" />

    <Submit>Save</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/73306040-3cf65100-41d0-11ea-99a9-9468bba82da7.png" />

Vous savez ce qui serez bien? Que le champ lui-même indique qu'il y a eu une erreur. Remarquez ici l'utilisation de l'attribut `errorClassName`:

```javascript {9,17,25}
// web/src/pages/ContactPage/ContactPage.js

return (
  <Form onSubmit={onSubmit}>
    <label htmlFor="name">Name</label>
    <TextField
      name="name"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="name" className="error" />

    <label htmlFor="email">Email</label>
    <TextField
      name="email"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="email" className="error" />

    <label htmlFor="message">Message</label>
    <TextAreaField
      name="message"
      validation={{ required: true }}
      errorClassName="error"
    />
    <FieldError name="message" className="error" />

    <Submit>Save</Submit>
  </Form>
)
```

<img src="https://user-images.githubusercontent.com/300/80258907-39d8f880-8639-11ea-8816-03a11c69e8ac.png" />

Oooo, que se passe-t-il si le _libellé_ pouvait également changer ? Pour celà utilisons le composant `<Label>` fourni par Redwood. Notez que l'attribut `for` de `<label>` devient la propriété `name`, comme pour les autres composants de formulaire de Redwood. N'oubliez pas également d'importer le composant:

```javascript {9,19-21,29-31,39-41}
// web/src/pages/ContactPage/ContactPage.js

import {
  Form,
  TextField,
  TextAreaField,
  Submit,
  FieldError,
  Label,
} from '@redwoodjs/forms'

const ContactPage = () => {
  const onSubmit = (data) => {
    console.log(data)
  }

  return (
    <Form onSubmit={onSubmit}>
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
        validation={{ required: true }}
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

      <Submit>Save</Submit>
    </Form>
  )
}

export default ContactPage
```

<img src="https://user-images.githubusercontent.com/300/80259003-70af0e80-8639-11ea-97cf-b6b816118fbf.png" />

> **Erreur de style**
> 
> En plus de `className` et `errorClassName` vous pouvez également utiliser `style` et `errorStyle` En plus de `className` et `errorClassName` vous pouvez également utiliser `style` et `errorStyle` Consultez la [documentation portant sur les formulaires](https://redwoodjs.com/docs/form) pour plus de détails sur le style des erreurs. En plus de `className` et `errorClassName` vous pouvez également utiliser `style` et `errorStyle` Consultez la [documentation portant sur les formulaires](https://redwoodjs.com/docs/form) pour plus de détails sur le style des erreurs.

### Validation du Format des Champs

Nous devrions nous assurer que le champ email contient bien...

```html {7-9}
// web/src/pages/ContactPage/ContactPage.js <TextField name="email" validation={{ required: true, pattern: { value:
/[^@]+@[^.]+\..+/, }, }} errorClassName="error" />
```

OK, ça n'est pas la validation ultime pour un champ email, mais pour le moment faisons comme si. Modifions également le message affiché en cas d'échec de la validation:

```html {9}
// web/src/pages/ContactPage/ContactPage.js <TextField name="email" validation={{ required: true, pattern: { value:
/[^@]+@[^.]+\..+/, message: 'Please enter a valid email address', }, }} errorClassName="error" />
```

<img src="https://user-images.githubusercontent.com/300/80259139-bd92e500-8639-11ea-99d5-be278dc67afc.png" />

Vous avez peut-être remarqué qu'essayer d'envoyer le formulaire alors que sont présentes des erreurs de validation n'affiche rien dans la console. C'est en réalité une bonne chose car celà vous indique que le formulaire n'a pas été envoyé. Corrigez la valeur des champs concernés, et tout fonctionne correctement.

> **Validation instantanée des champs côté client**
> 
> Lorsqu'un message lié à une erreur lors de la validation d'un champ s'affiche, il disparaît dès que la valeur est corrigée. Vous n'avez pas à cliquer à nouveau sur "Submit" pour supprimer les messages d'erreur.

Finalement, savez-vous ce qui serait _vraiment_ sympa? Ce serait de faire en sorte que les champs soient validés dès que l'utilisateur quitte un champ. De cette manière l'utilisateur n'a pas besoin de remplir l'ensemble des champs et envoyer le formulaire pour voir toutes les erreurs s'afficher. Voyons comment faire:

```html
// web/src/pages/ContactPage/ContactPage.js <Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }}>
```

Alors, qu'en pensez-vous? Est-ce que ça valait la peine? Quelques nouveaux composants et vous avez des formulaires qui gèrent la validation et enveloppent les valeurs soumises dans un bel objet de données!

> **En savoir plus sur les formulaires dans Redwood**
> 
> Les formulaires de Redwood sont construits à partir de la librairie [React Hook Form](https://react-hook-form.com/). Celle-ci contient d'autres fonctionalités très utiles que nous n'avons pas documenté ici.

Redwood a encore plus d'un tour dans son sac pour ce qui concerne les formulaires, mais nous allons garder ça pour une étape ultérieure.

Avoir un formulaire de contact, c'est bien. Mais conserver les message qu'on vous envoie, c'est mieux! Procédons maintenant à la création de la table en base de données pour y enregistrer ces informations. Ce faisant nous allons créer notre première mutation GraphQL!

