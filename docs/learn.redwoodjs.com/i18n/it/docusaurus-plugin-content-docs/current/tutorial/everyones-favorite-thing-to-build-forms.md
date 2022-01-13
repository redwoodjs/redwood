---
id: everyones-favorite-thing-to-build-forms
title: "La tua parte preferita: Formulari"
sidebar_label: "La tua parte preferita: Formulari"
---

Aspetta un attimo, non andartene! Sapevi che prima o poi questa parte doveva arrivare, no? E probabilmente ti sarai anche reso conto che non avremmo nemmeno incluso questa sezione all'interno del tutorial nel caso Redwood non avesse escogitato un metodo per migliorare le solite difficoltà che circondano i formulari. Infatti, Redwood potrebbe persino farti _amare_ i formulari. Beh, amare è forse una parola grossa. Farti _piacere_ i formulari? O almeno farti _tollerare_ il loro sviluppo?

La terza parte del video tutorial riprende da qui:

> **Avviso di contenuto obsoleto**
> 
> Questi video sono stati realizzati con una versione precedente di Redwood e molti comandi sono ormai obsoleti. Se vuoi veramente creare l'applicazione per il blog dovrai proseguire con il testo che manteniamo aggiornato con le versioni correnti.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/eT7iIy0F8Tk?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

In realtà abbiamo già un paio di formulari all'interno della nostra app; ti ricordi degli scaffold relativi ai post? Funzionavano abbastanza bene, no? Quanto può essere difficile? (Se non hai ancora sbirciato quel codice, ciò che verrà nella prossima sezione ti sorprenderà).

Costruiamo il formulario più semplice possibile che abbia comunque senso per il nostro blog, un formulario "contattaci".

### La Pagina

    yarn rw g page contact

Dopo aver eseguito questo comando, possiamo aggiungere un link verso Contacts all'interno del nostro layout:

```javascript {17-19}
// web/src/layouts/BlogLayout/BlogLayout.js

import { Link, routes } from '@redwoodjs/router'

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
  )
}

export default BlogLayout
```

In seguito, possiamo utilizzare il `BlogLayout` per la `ContactPage`, assicurandoci che sia ben incapsulato dal medesimo `<Set>` usato dalle altre pagine all'interno del file delle rotte:

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

Controlla che tutto sia ok, poi possiamo passare alla roba buona.

### Introduzione alle funzioni ausiliarie per formulari

I formulari tradizionali di React sono notoriamente fastidiosi da implementare. Esistono i [Controlled Components](https://reactjs.org/docs/forms.html#controlled-components), gli [Uncontrolled Components](https://reactjs.org/docs/uncontrolled-components.html), [librerie di terze parti](https://jaredpalmer.com/formik/) e molte altre alternative che hanno tutte lo scopo di semplificare i formulari React (come originariamente inteso dalla loro specificazione HTML: un campo `<input>`, caratterizzato da un attributo `nome` che viene trasmesso da qualche parte quando clicchi sul bottone apposito).

Pensiamo che Redwood faccia un passo avanti da questo punto di vista: non solo ti evita di dover scrivere manualmente tutto il codice relative ai componenti controllati (controlled components), ma si occupa anche di affrontare automaticamente le validazioni ed errori eventuali. Vediamo come funziona.

Prima di iniziare, aggiungiamo un paio di classi CSS per rendere il layout predefinito del formulario un po' più pulito ed anche per poter evitare di scrivere un sacco di attributi `style` che potrebbero rendere i nostri esempi più difficili da seguire. Per ora li inseriremo nel file root `index.css`, all'interno della cartella `web/src`:

```css
/* web/src/index.css */

button, input, label, textarea {
  display: block;
  outline: none;
}

label {
  margin-top: 1rem;
}

.error {
  color: red;
}

input.error, textarea.error {
  border: 1px solid red;
}
```

Per ora non faremo dialogare il nostro formulario di contatto con il database, perciò non è necessario implementare una cellula. Possiamo dunque implementare il formulario direttamente nella pagina stessa. I formulari di Redwood possono essere invocati tramite... rullo di tamburi... il tag `<Form>`:

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

Beh, che dire, finora niente di che. Non possiamo nemmeno vederlo nel browser. Aggiungiamo dunque un campo al formulario in modo da far visualizzare qualcosa. Redwood supporta molteplici tipologie di input, includendo anche il campo di testo `<TextField>`. Questi campi sono caratterizzati da un attributo `nome` che permette di identificare facilmente gli input, soprattutto in formulari complessi:

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

Finalmente qualcosa è apparso! Ancora piuttosto noioso purtroppo. Che ne dici di aggiungere un pulsante "invio"?

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

E con questo otteniamo un vero e proprio formulario! Prova a scrivere qualcosa e premere sul bottone "Invio". Per fortuna non è esploso nulla, ma al contempo non abbiamo ricevuto alcuna indicazione riguardo all'invio dei dati inseriti (anche se potresti aver notato un error nella console del browser). Quindi, nella prossima sezione ci occuperemo di come recuperare i dati a partire dal formulario.

### onSubmit

In maniera analoga ad un formulario HTML, assegneremo un "_handler_" `onSubmit` al nostro `<Form>`. Questo handler verrà invocato tramite un singolo argomento: un oggetto contenente tutti i campi compilati del formulario.

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

Proviamo ora a scrivere qualche parole e premere "invio":

<img src="https://user-images.githubusercontent.com/300/80258293-c08cd600-8637-11ea-92fb-93d3ca1db3cf.png" />

Molto bene! Ora cerchiamo di rendere il formulario più utile tramite l'aggiunta di un paio di campi. Prima di tutto, rinominiamo quello esistente in `name` ed aggiungiamo i campi `email` e `message`:

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

Noterai che il componente `<TextAreaField>` qui presente genera una `<textarea>` HTML ed al tempo stesso gli dona i benefici dei formulari Redwood:

<img src="https://user-images.githubusercontent.com/300/80258346-e4e8b280-8637-11ea-908b-06a1160b932b.png" />

Andiamo ora ad aggiungere qualche etichetta accanto ai campi:

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

Prova ora a compilare ed inviare il formulario. Dovresti ricevere un messaggio nella console contenente i tre campi.

### Validazione

"D'accordo, autore del tutorial di Redwood", ti starai dicendo, "qual è la gran novità"? Abbiamo programmato le funzioni ausiliarie per i formulari Redwood come fossero "la prossima grande cosa", ma esistono già una miriade di librerie che permettono di gestire gli input manualmente. E quindi? Hai ragione! Chiunque può compilare un formulario _correttamente_ (anche se questa affermazione potrebbe essere contestata dal team del controllo qualità), ma cosa accadrebbe quando l'utente fa un errore, si dimentica di compilare un campo, o cerca di manomettere il nostro formulario? Chi sarà lì ad aiutarci? Redwood!

Dovremo dunque indicare all'utente che questi tre campi devono essere compilati obbligatoriamente per poter inviare correttamente il formulario di contatto. Perciò, imponiamo questa regola tramite l'attributo HTML `required`:

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

D'ora in poi, quando l'utente proverà ad inviare il formulario, riceverà un messaggio d'avviso accanto ad i campi non compilati correttamente. Questi messaggi sono meglio di niente, ma non possono essere modificati o personalizzati. Possiamo fare di meglio?

Si! Sostituiamo dunque l'attributo `required` con un oggetto che passeremo ad una funzione ausiliaria dei formulari Redwood chiamata `validation`:

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

Grazie a queste modifiche, quando inviamo un formulario contenente dei campi vuoti, il loro nome verrà evidenziato opportunamente. Noioso. In realtà, tutto ciò non è altro che il primo elemento della nostra prossima sorpresa! Abbiamo infatti un'ulteriore funzione ausiliaria da aggiungere, che sia in grado di visualizzare gli errori corrispondenti ad un campo. E, guarda caso, si tratta di semplice codice HTML che possiamo personalizzare come vogliamo!

### `<FieldError>`

Procediamo dunque ad aggiungere un `<FieldError>` (non dimenticare di includerlo nel tuo `import` in cima al file):

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

Osserva che l'attributo `name` corrisponde al `name` appartenente al campo appena sopra. In questo modo, Redwood saprà quali campi necessitano visualizzare un errore. Prova ad inviare un formulario di nuovo.

<img src="https://user-images.githubusercontent.com/300/80258694-ac95a400-8638-11ea-904c-dc034f07b12a.png" />

Ma questo è soltanto l'inizio. Assicuriamoci che gli utenti riescano facilmente a capire che si tratta di messaggi d'errore. Ti ricordi della classe CSS `.error` che abbiamo definito precedentemente in `index.css`? Nota l'attributo `className` all'interno di `<FieldError>`:

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

Sai cosa sarebbe ancora meglio? Se l'input stesso potesse in qualche modo indicare che è avvenuto un errore. Nota gli attributi `errorClassName` all'interno degli input:

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

E se anche l'_etichetta_ potesse cambiare? Questo è possibile tramite il componente di Redwood `<Label>`. Nota che l'attributo `htmlFor` della `<label>` diventa la proprietà `name`, proprio come gli altri componenti di Redwood. Ricordati anche dell'import:

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

> **Errori di stile**
> 
> Oltre al `className` ed al `errorClassName` poi anche utilizzare `style` ed `errorStyle`. Dai un'occhiata alla [documentazione dei formulari](https://redwoodjs.com/docs/form) per avere più dettagli sulla personalizzazione di questi errori.

### Validazione del formato degli input

Dovremmo assicurarci che che il campo email contiene effettivamente un email valida:

```html {7-9}
// web/src/pages/ContactPage/ContactPage.js

<TextField
  name="email"
  validation={{
    required: true,
    pattern: {
      value: /[^@]+@[^.]+\..+/,
    },
  }}
  errorClassName="error"
/>
```

Ok, quest'esempio non è forse la crème de la crème delle validazioni email, ma assumiamo che sia a prova di proiettile per il momento. Cambiamo anche il messaggio in modo che sia un po' più amichevole:

```html {9}
// web/src/pages/ContactPage/ContactPage.js

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
```

<img src="https://user-images.githubusercontent.com/300/80259139-bd92e500-8639-11ea-99d5-be278dc67afc.png" />

Potresti aver notato che inviare un formulario con errori non stamperà nulla all'interno della console. Non viene inviato affatto. È una cosa positiva! L'utente correggerà gli eventuali errori e tutto funzionerà correttamente.

> **Validazione istantanea dei campi (lato client)**
> 
> Quando viene visualizzato un errore di validazione, esso _scomparirà_ non appena l'utente corregge il campo. Non è necessario premere "Invio" di nuovo per rimuovere i messaggi d'errore.

Per concludere, sapresti cosa sarebbe _davvero_ bello? Validare i campi non appena l'utente finisce di completarli, cosicché gli utenti procedano a compilare l'intero formulario ed inviarlo soltanto per poi veder apparire un mucchio di errori. Facciamolo:

```html
// web/src/pages/ContactPage/ContactPage.js

<Form onSubmit={onSubmit} validation={{ mode: 'onBlur' }}>
```

Beh, cosa ne pensi? Ne è valsa la pena? Con appena un paio di componenti aggiuntivi hai la possibilità di creare formulari capaci di gestire la validazione degli input ed incapsulare i dati immessi in un comodo oggetto!

> **Informazioni aggiuntive sui Formulari Redwood**
> 
> I formulari di Redwood sono costruiti a partire dai [React Hook Form](https://react-hook-form.com/) e sono quindi in grado di provvedere altre funzionalità che non abbiamo necessariamente documentato qui. Visita la [documentazione dei formulari](https://redwoodjs.com/docs/form) per impararne di più.

Redwood possiede un ulteriore asso nella manica per quanto riguarda i formular, ma aspetteremo di rivelarlo finché non dovremo effettivamente inviarne uno al server.

Avere un formulario di contatto funzionante è ottimo, ma soltanto se riusciamo a conservare e consultare i messaggi inviati dai visitatori. Nella prossima sezione procederemo dunque ad implementare una tabella nel database per salvare tali dati e creeremo la nostra prima mutazione GraphQL.

