---
id: saving-data
title: "Salvataggio dei dati"
sidebar_label: "Salvataggio dei dati"
---

Cominciamo con l'aggiungere una nuova tabella al database. Apri il file `api/db/schema.prisma` ed aggiungi il modello Contact appena dopo il modello Post:

```javascript
// api/db/schema.prisma

model Contact {
  id        Int @id @default(autoincrement())
  name      String
  email     String
  message   String
  createdAt DateTime @default(now())
}
```

> **Sintassi Prisma per campi facoltativi**
>
> Per contrassegnare un campo come facoltativo (cioè, consentire `NULL` come valore) è sufficiente accodare il datatype rispettivo con un punto interrogativo. Per esempio, `name String?`. Questo permetterà al valore di variabile `name` di essere una `String` oppure `NULL`.

In seguito, creiamo ed eseguiamo la migrazione:

    yarn rw prisma migrate dev

Possiamo chiamarla "creare contatti".

Ora creeremo l'interfaccia GraphQL in grado di accedere questa tabella. Finora, non abbiamo ancora utilizzato il commando `generate` (escludendo il fatto che `scaffold` lo abbia utilizzato dietro le quinte):

    yarn rw g sdl contact

Proprio come il comando `scaffold`, questa operazione creerà due nuovi file nella cartella `api`:

1. `api/src/graphql/contacts.sdl.js`: definisce gli schemi GraphQL
2. `api/src/services/contacts/contacts.js`: contiene la logica di business della tua app.

Apri `api/src/graphql/contacts.sdl.js` e dovresti vedere che i tipi `Contact`, `CreateContactInput` e `UpdateContactInput` sono già stati definiti per noi: il comando `generate sdl` ha ispezionato lo schema e creato un tipo `Contact` contenente ogni campo del database, un tipo `Query` e la richiesta `contacts` che ritorna un array di tipo `Contact`:

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
`
```

Cosa sono gli input `CreateContactInput` e `UpdateContactInput`? Redwood segue le linee guida di GraphQL ed utilizza gli [Input Types](https://graphql.org/graphql-js/mutations-and-input-types/) all'interno delle mutazioni piuttosto che elencare ogni campo esplicitamente. Ogni campo richiesto in `schema.prisma` è obbligatorio anche in `CreateContactInput` (questo impedirà ad un utente di creare record invalidi), ma nulla è necessario per `UpdateContactInput`. Questo è perché potresti voler aggiornare soltanto un singolo campo, un paio di campi, o tutto il formulario. L'alternativa sarebbe creare tipi di input separati per ogni permutazione di campi che desideri aggiornare. Pensiamo che avere soltanto un tipo di input per gli aggiornamenti, anche se non è forse il modo più **corretto** di creare un'API GraphQL, fosse un buon compromesso per un esperienza di sviluppo ottimale.

> Redwood assume che il tuo codice non proverà ad impostare un valore su nessun campo chiamato `id` o `createdAt`, quindi sono stati esclusi dai tipi di input. Tuttavia, nel caso il tuo database permettesse di utilizzarli, puoi aggiungerli manualmente a `CreateContactInput` e/o `UpdateContactInput`.

Dato che nel file `schema.prisma` tutte le colonne del database erano obbligatorie, sono state contrassegnate dal suffisso `!` (per esempio `name: String!`).

> **Sintassi GraphQL per i campi obbligatori**
>
> La sintassi SDL di GraphQL's necessita di un `!` supplementare quando un campo _è_ obbligatorio. Ricorda: la sintassi `schema.prisma` richiede un carattere `?` quando un campo _non_ è richiesto.

Come descritto nella [Missione secondaria: Funzionamento di Redwood con i dati](side-quest-how-redwood-works-with-data), non esistono resolvers esplicitamente definiti all'interno del file SDL. Infatti, Redwood segue una semplice convenzione: ogni campo appartenente ai tipi `Query` e `Mutation` nel file `sdl` (`api/src/graphql/contacts.sdl.js`) mappa ad una funzione omonima nel file `servizi` (`api/src/services/contacts/contacts.js`).

In questo case creeremo una semplice `Mutation` che chiameremo `createContact`. Aggiungi questo codice nel file SDL (prima dell'accento grave di chiusura):

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
`
```

La mutazione `createContact` accetta una singola variabile chiamata `input`: un oggetto conforme a quello definito in `CreateContactInput` (cioè `{ name, email, message }`).

Questo è tutto per il file SDL, ora passiamo al definire il servizio che si occuperà effettivamente di salvare i dati all'interno del database. Il servizio include una funzione di default chiamata `contacts` per ottenere tutti i contatti dal database. Aggiungiamo la nostra mutazione per creare un nuovo contatto:

```javascript {9-11}
// api/src/services/contacts/contacts.js

import { db } from 'src/lib/db'

export const contacts = () => {
  return db.contact.findMany()
}

export const createContact = ({ input }) => {
  return db.contact.create({ data: input })
}
```

Grazie a Prisma ci vuole davvero pochissimo codice per salvare qualcosa nel database! Questa è una chiama asincrona ma non abbiamo dovuto preoccuparci di eventuali `Promises` o `async/await`. Apollo se ne occuperà per noi!

Prima di aggiornare l'interfaccia per l'utilizzatore, diamo un'occhiata all'elegante GUI che puoi adoperare tramite il comando `yarn redwood dev`.

### GraphQL Playground

È spesso utile poter sperimentare ed invocare la nostra API tramite una forma più "cruda" prima di andare troppo fino in fondo all'implementazione per poi rendersi conto di aver dimenticato qualche cosa. C'è un errore di battitura nel livello dell'API o nel livello web? Scopriamolo accedendo per ora soltanto al livello API.

Quando hai eseguito il comando `yarn redwood dev`, in realtà hai avviato anche un secondo processo dietro le quinte. Infatti, apri una nuova pagina nel tuo browser e dirigiti verso http://localhost:8911/graphql Si tratta del [GraphQL Playground](https://www.apollographql.com/docs/apollo-server/testing/graphql-playground/) di Apollo Server, una GUI accessibile sul web in grado di manipolare API GraphQL:

<img src="https://user-images.githubusercontent.com/300/70950852-9b97af00-2016-11ea-9550-b6983ce664e2.png" />

Niente di emozionante per ora, ma dai un'occhiata alla linguetta "Docs" all'estrema destra:

<img src="https://user-images.githubusercontent.com/300/73311311-fce89b80-41da-11ea-9a7f-2ef6b8191052.png" />

Qui troverai lo schema completo definito dai nostri file SDL! La Playground analizzerà queste definizioni e ti proporrà suggerimenti, nel tentativo di aiutarti a costruire delle query a partire da zero. Prova a richiedere gli ID di tutti i post presenti nel database: scrivi la query a sinistra e poi clicca sul bottone "Play" per eseguirla:

<img src="https://user-images.githubusercontent.com/300/70951466-52e0f580-2018-11ea-91d6-5a5712858781.png" />

La GraphQL Playground è una maniera eccellente per sperimentare con la tua API o per diagnosticare una query o mutation che non si comporta come dovrebbe.

### Creare un Contatto

La nostra mutazione GraphQL è pronta per quanto riguarda il lato backend, non ci resta che invocarla nel frontend. Tutto ciò che riguarda il formulario si trova nella `ContactPage`, perciò sarà proprio qui che andremo ad invocare la mutazione. Prima di tutto, definiamo la mutazione come una costante che chiameremo in seguito (questo può essere svolto all'esterno del componente stesso, appena dopo le dichiarazioni degli `import`):

```javascript
// web/src/pages/ContactPage/ContactPage.js

const CREATE_CONTACT = gql`
  mutation CreateContactMutation($input: CreateContactInput!) {
    createContact(input: $input) {
      id
    }
  }
`
```

Referenziamo la mutazione `createContact` che abbiamo definito nella SDL Contatti e passiamola come oggetto in `input` contenente il nome, email, e messaggio effettivi.

Poi, chiameremo l'"hook" `useMutation` fornito da Apollo, che ci permetterà di eseguire la mutazione quando saremo pronti (non dimenticare la dichiarazione `import`):

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

`create` è una funzione che invoca una mutazione e riceve un oggetto dotato di una chiave `variables`, contenente un altro oggetto con chiave `input`. Per esempio:

```javascript
create({
  variables: {
    input: {
      name: 'Rob',
      email: 'rob@redwoodjs.com',
      message: 'I love Redwood!',
    },
  },
})
```

Se ti ricordi, i `<Form>` ritornano tutti i loro campi all'interno di un oggetto ben costruito: le chiavi corrispondono ai nomi del campi, il che significa che l'oggetto `data` che riceviamo durante `onSubmit` è già nel formato necessario per l'`input`!

Ora possiamo aggiornare la funzione `onSubmit` per invocare la mutazione con i dati che riceve:

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

Prova a riempire il formulario ed a inviarlo. Dovresti aver creato un nuovo contatto nel database! Puoi verificarlo tramite GraphQL Playground:

![immagine](https://user-images.githubusercontent.com/300/76250632-ed5d6900-6202-11ea-94ce-bd88e3a11ade.png)

### Migliorare il formulario di contatto

Il nostro formulario di contatto funziona correttamente, ma ha anche un paio di problemi:

- Cliccare il bottone "invio" più volte comporterà numerosi invii del formulario
- L'utente non ha alcuna idea se l'invio è avvenuto con successo o meno
- Se un errore accadesse sul server, non abbiamo alcun modo per informare l'utilizzatore

Cerchiamo di risolvere questi problemi.

L' "hook" `useMutation` ritorna un paio di elementi aggiuntivi insieme alla funzione che permette di invocarlo. Possiamo scomporli come il secondo elemento ritornato dall'array. I due che ci interessano sono `loading` ed `error`:

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

Ora possiamo sapere se una chiamata verso il database è ancora in corso tramite `loading`. Per risolvere in maniera semplice il nostro problema degli invii multipli, potremmo disabilitare il bottone di invio fintantoché la risposta dal database non viene ricevuta. Questo è possibile attivando l'attributo `disabled` del bottone "Save" durante la fase di `loading`:

```javascript {5}
// web/src/pages/ContactPage/ContactPage.js

return (
  // ...
  <Submit disabled={loading}>Save</Submit>
  // ...
)
```

Potrebbe risultare difficile vedere una differenza durante la fase di sviluppo perché l'invio è davvero veloce. Tuttavia, tramite il Web Inspector di Chrome, è possibile rallentare volutamente le risorse di rete in modo da simulare una connessione lenta:

<img src="https://user-images.githubusercontent.com/300/71037869-6dc56f80-20d5-11ea-8b26-3dadb8a1ed86.png" />

Noterai che il bottone "Save" verrà disabilitato per un paio di secondi mentre si è in attesa della risposta.

In seguito, notifichiamo l'utente in caso l'invio sia avvenuto con successo. Redwood include [react-hot-toast](https://react-hot-toast.com/) per visualizzare rapidamente una notifica sulla pagina.

`useMutation` possiede un secondo argomento opzionale che è in grado di accettare delle opzioni. Una di queste è la funzione di "callback" chiamata `onCompleted`, che verrà invocata quando la mutazione termina con successo. Utilizzeremo tale callback per invocare una funzione `toast()`, che mostrerà un messaggio di notifica tramite il **&lt;Toaster&gt;**.

Aggiungi la callback `onCompleted` nella `useMutation` ed includi il componente **&lt;Toaster&gt;** nel nostro `return`, appena prima del **&lt;Form&gt;**. Abbiamo anche bisogno di incapsulare il tutto in un frammento (&lt;&gt;&lt;/&gt;) perché siamo autorizzati a ritornare soltanto un elemento:

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

Puoi leggere la documentazione completa relativa ai Toast [qui](https://redwoodjs.com/docs/toast-notifications).

### Visualizzare gli errori del server

A questo punto, ci occuperemo di informare l'utente di eventuali errori provenienti dal server. Finora, abbiamo avvisato l'utente soltanto degli errori del client _client_ errors, per esempio quando un campo era assente o formattato in modo errato. Anche nel caso avessimo delle restrizioni che il componente `<Form>` ignora, dobbiamo comunque poter informare l'utilizzatore.

Abbiamo già implementato una validazione dell'email sul client, ma ogni sviluppatore di rispetto sa che [_non bisogna mai fidarsi ciecamente del client_](https://www.codebyamir.com/blog/never-trust-data-from-the-browser). Implementiamo dunque una validazione delle email sul nostro server (lato API), in modo tale da essere certi che nessun dato invalido può essere salvato all'interno del database (anche se in qualche modo l'utente riesca a scavalcare i controlli che effettuiamo sul client).

> **Nessuna validazione lato server?**
>
> Perché non è necessario implementare una validazione lato server per assicurarci che nome, email e messaggio siano ben compilati? Perché è il database che se ne occupa per noi. Ti ricordi della `String!` nella nostra dichiarazione SDL? Conteneva proprio un vincolo che garantisce che tale campo non può essere `null`. Infatti, nel caso un valore `null` riuscisse ad arrivare al database, quest'ultimo rifiuterebbe l'operazione di `insert/update` e GraphQL ritornerebbe un errore al client.
>
> Non esiste alcun tipo di dati `Email!` e dovremmo quindi validarlo da soli.

Abbiamo già parlato di business logic in precedenza, in particolare al riguardo dei nostri file di servizi. Aggiungiamo quindi una funzione `validate` al nostro servizio `contacts`:

```javascript {3,7-15,22}
// api/src/services/contacts/contacts.js

import { UserInputError } from '@redwoodjs/graphql-server'

import { db } from 'src/lib/db'

const validate = (input) => {
  if (input.email && !input.email.match(/[^@]+@[^.]+\..+/)) {
    throw new UserInputError("Can't create new contact", {
      messages: {
        email: ['is not formatted like an email address'],
      },
    })
  }
}

export const contacts = () => {
  return db.contact.findMany()
}

export const createContact = ({ input }) => {
  validate(input)
  return db.contact.create({ data: input })
}
```

Perciò quando `createContact` verrà chiamata gli input verrano validati e, soltanto nel caso non ci siano errori, continuerà a creare il record effettivo nel database.

Stiamo già catturando qualsiasi errore possibile tramite la costante `error` che abbiamo ottenuto grazie a `useMutation`, perciò _potremmo_ manualmente far visualizzare tali errori in una casella dedicata, ad esempio in cima al formulario:

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

> Nel caso desideri gestire gli errori manualmente, puoi procedere così:
>
> ```javascript {3-8}
> // web/src/pages/ContactPage/ContactPage.js
> const onSubmit = async (data) => {
>   try {
>     await create({ variables: { input: data } })
>     console.log(data)
>   } catch (error) {
>     console.log(error)
>   }
> }
> ```

Per fare in modo che venga generato un errore sul server, rimuoviamo la validazione dell'email dal client:

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

Ora prova a compilare un formulario con un indirizzo email invalido:

<img src="https://user-images.githubusercontent.com/16427929/98918425-e394af80-24cd-11eb-9056-58c295cf0d5c.PNG" />

Non è carino, ma funziona. Sarebbe bello se il campo stesso fosse evidenziato come quando era in atto la validazione inline...

Ti ricordi quando abbiamo detto che i `<Form>` avevano un altro asso nella manica? Eccolo qui!

Sostituisci la visualizzazione dell'errore inline che abbiamo appena aggiunto (`{ error && ...}`) con `<FormError>`, passando la costante `error`che abbiamo ricevuto da `useMutation` ed utilizzando un pò di styling a `wrapperStyle` (non dimenticare l'`import` relativo). Passeremo anche l'`error` al `<Form>` in modo che possa contestualizzarlo:

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

Ora invia un messaggio con un email invalida:

<img src="https://user-images.githubusercontent.com/300/80259553-c46e2780-863a-11ea-9441-54a9112b9ce5.png" />

Ora otteniamo un messaggio in cima alla pagina che specifica cosa è andato storto in parole che chiunque può capire _e_ il campo invalido corrispondente viene evidenziato, proprio come accade nella validazione inline! Il messaggio in cima potrebbe essere un po' eccessivo per un formulario breve come questo, ma potrebbe essere essenziale nel caso di un formulario che si estende su diverse schermate. In questo modo l'utente ottiene una lista di tutti gli errori in un posto unico, risparmiandogli di doverli cercare manualmente. In questo caso possiamo rimuovere questa casella, semplicemente rimuovendo `<FormError>` ed il campo verrà comunque evidenziato come previsto.

> **`<FormError>` opzioni di stile**
>
> `<FormError>` ha diverse opzioni di stile che sono associate a diverse parti del messaggio:
>
> - `wrapperStyle` / `wrapperClassName`: è il contenitore del messaggio intero
> - `titleStyle` / `titleClassName`: è il titolo "Can't create new contact"
> - `listStyle` / `listClassName`: è l'`<ul>` che contiene la lista degli errori
> - `listItemStyle` / `listItemClassName`: `<li>` rappresenta un singolo errore

### Un'ultima cosa ...

Siccome non ridirigiamo l'utente dopo che il formulario è stato inviato, dovremmo almeno resettare i campi. Ciò richiede che la funzione `reset()` (che fa parte di `react-hook-form`) sia accessibile. Tuttavia, tramite un semplice `<Form>` come quello che stiamo usando, questa funzione non è accessibile.

`react-hook-form` possiede un hook chiamato `useForm()`, che viene normalmente invocato per noi all'interno del `<Form>`. Perciò per resettare il formulario dovremo invocare tale hook manualmente. E chiaramente, le funzioni che `useForm()` fornisce devono essere ancora utilizzabili dal `Form`. Ecco come si fa.

Iniziamo con l'importare lo `useForm`:

```javascript
// web/src/pages/ContactPage/ContactPage.js

import { useForm } from 'react-hook-form'
```

Ed ora chiamiamolo all'interno del nostro componente:

```javascript {4}
// web/src/pages/ContactPage/ContactPage.js

const ContactPage = () => {
  const formMethods = useForm()
  //...
```

Infine, diciamo al `<Form>` di utilizzare i `formMethods` che abbiamo appena dichiarata invece di farlo lui stesso:

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

Ora possiamo chiamare `reset()` sui `formMethods` appena dopo `toast()`:

```javascript {6}
// web/src/pages/ContactPage/ContactPage.js

const [create, { loading, error }] = useMutation(CREATE_CONTACT, {
  onCompleted: () => {
    toast.success('Thank you for your submission!')
    formMethods.reset()
  },
})
```

<img alt="Screenshot del modulo di contatto con messaggio di successo toast" src="https://user-images.githubusercontent.com/300/112360362-7a008b00-8c8f-11eb-8649-76d00be920b7.png" />

> Ora puoi rimettere la validazione dell'email nella `<TextField>`. Per precauzione, però, mantienila nel lato server.

Ecco il contenuto finale della pagina `ContactPage.js`:

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

Questo è quanto! [React Hook Form](https://react-hook-form.com/) fornisce un sacco di [funzionalità](https://react-hook-form.com/api) che `<Form>` non vengono esposte. Quando vuoi utilizzarle, sarà sufficiente chiamare `useForm()`, assicurandoti di passare l'oggetto ritornato (quello che abbiamo chiamato `formMethods`) come una proprietà del `<Form>` in modo che la validazione e le altre funzionalità continuino a funzionare.

> Potresti aver notato che la validazione del form 'onBlur' abbia smesso di funzionare una volta che hai iniziato a chiamare `useForm()`. Questo è dovuto al fatto che Redwood chiama `useForm()` dietro le quinte e lo passa alla proprietà di `validation` che hai assegnato al `<Form>`. Redwood non chiama più `useForm()` per te, perciò se necessiti di ulteriori opzioni dovrai implementarle manualmente:
>
> ```javascript
> const formMethods = useForm({ mode: 'onBlur' })
> ```

Finalmente la parte pubblica del sito non è affatto male. Cosa ne dici se ora ci concentriamo ad implementare delle funzioni per gli amministratori (per esempio per creare ed editare i post)? Dovremmo spostarle in una sorta di sezione amministrativa protetta da una schermata di login, nel tentativo di impedire ad utilizzatori malintenzionati manipolare gli URLs e riuscire eventualmente a creare annunci indesiderabili o spam.
