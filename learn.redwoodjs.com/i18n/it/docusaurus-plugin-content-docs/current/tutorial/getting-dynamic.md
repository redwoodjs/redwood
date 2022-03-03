---
id: getting-dynamic
title: "Dinamismo"
sidebar_label: "Dinamismo"
---

La seconda parte del video tutorial riprende da qui:

> **Avviso di contenuto obsoleto**
>
> Questi video sono stati realizzati con una versione precedente di Redwood e molti comandi sono ormai obsoleti. Se vuoi veramente creare l'applicazione per il blog dovrai proseguire con il testo che manteniamo aggiornato con le versioni correnti.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/SP5vbsWf5Yg?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

Queste due pagine sono bellissime, ma dove sono i post veri e propri di questo blog? Ora ci occuperemo di loro.

Ai fini del nostro tutorial, recupereremo i post sul blog da un database. Poiché i database relazionali sono ancora i cavalli di battaglia di molte applicazioni web complesse (o non così complesse), abbiamo reso l'accesso SQL un cittadino di prima classe. Per le applicazioni Redwood, tutto inizia con lo schema.

### Creazione dello schema del database

Dobbiamo decidere quali dati ci serviranno per un post sul blog. Ci dilungheremo su questo più avanti, ma almeno vorremo iniziare con:

- `id` l'identificatore univoco per questo post del blog (tutte le tabelle del nostro database ne avranno uno)
- `title`
- `body` il contenuto del post
- `createdAt` un timestamp di quando questo record è stato creato

Usiamo [Prisma](https://www.prisma.io/) per comunicare con il database. Prisma ha un'altra libreria chiamata [Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) che ci permette di aggiornare lo schema del database in modo controllabile ed effettua degli snapshot per ciascuno di questi cambiamenti. Ogni cambiamento è chiamato _migration_ e Migrate ne creerà uno quando apporteremo modifiche al nostro schema.

Prima di tutto, definiamo la struttura dei dati per un post nel database. Apri `api/db/schema.prisma` e aggiungi la definizione della nostra tabella Post (rimuovi tutti i model "sample" presenti nel file, come il model `UserExample`). Una volta che hai finito, l'intero file schema dovrebbe assomigliare a:

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

Questo indica che desideriamo una tabella chiamata `Post` che dovrebbe avere:

- Una colonna `id` di tipo `Int` permette a Prisma di sapere che è questa la colonna che dovrebbe usare come `@id` (per creare relazioni con altre tabelle) e che il valore `@default` dovrebbe essere lo special method di Prisma `autoincrement()` che consente di sapere che il DB dovrebbe impostarlo automaticamente quando vengono creati nuovi record
- Un campo `title` che conterrà un valore `String`
- Un campo `body` che conterrà una `String` (salvata come `text` nel database), che permetterà di inserire un testo di lunghezza arbitraria invece dei solito massimo di 255 bytes caratteristico della tipo `varchar` della maggior parte dei database (SQLite permette di default 1 miliardo di bytes nei campi `TEXT`, poco meno di un gigabyte)
- Un campo `createdAt` che sarà un `DateTime` e avrà come `@default` un `now()` che corrisponde al momento nel quale creiamo un nuovo record (quindi non sarà necessario impostarlo manualmente nella nostra app)

> **ID Integer versus IDs String**
>
> Per il tutorial manteniamo le cose semplici utilizzando un numero intero per la nostra colonna ID. Tuttavia, alcune app potrebbero voler utilizzare un CUID o un UUID che Prisma supporta. In tal caso, si utilizzerebbe `String` per il datatype invece di `Int` e `cuid()` o `uuid()` invece di `autoincrement()`:
>
> `id String @id @default(cuid())`
>
> Gli integer risultano anche in URL più leggibili come https://redwoodblog.com/posts/123 invece di https://redwoodblog.com/posts/eebb026c-b661-42fe-93bf-f1a373421a13.
>
> Dai un'occhiata alla documentazione ufficiale [Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-schema/data-model#defining-an-id-field) per ulteriori informazioni sui campi ID.

### Migrazioni

Bene, questo è stato semplice. Ora desideriamo salvare un snapshot tramite una migrazione:

    yarn rw prisma migrate dev

> **Abbreviazione `redwood`**
>
> D'ora in poi, utilizzeremo l'abbreviazione `rw` invece di `redwood`.

Ti verrà chiesto di dare un nome a questa migrazione. Sarebbe l'ideale utilizzare qualcosa che la descrive, per esempio "create posts" (senza le virgolette, naturalmente). Questa operazione è pensata per te: a Redwood non interessa il nome delle migrazioni. È semplicemente un riferimento da utilizzare quando si sta cercando fra le vecchie migrazioni, nel tentativo di trovare quella relativa ad una creazione o modifica particolare che hai effettuato in passato.

In seguito al completamento del comando, vedrai una nuova sottocartella creata a `api/db/migrations` caratterizzata da un timestamp e dal nome che hai assegnato alla migrazione. Conterrà un singolo file chiamato `migration.sql` che a sua volta include il codice SQL necessario per aggiornare la struttura del database con ciò che era specificato all'interno dello `schema.prisma` al momento della creazione della migrazione. A questo punto, avrai un singolo file `schema.prisma` che definisce la struttura del database *attuale* e le migrazioni tengono traccia della cronologia dei cambiamenti avvenuti per giungere allo stato corrente. È una sorta di version control per la struttura del database, che può essere molto utile.

Oltre a creare il file di migrazione, il comando sopracitato si occuperà anche dell'esecuzione del codice SQL sul database, che "applica" concretamente la migrazione definita in precedenza. Il risultato finale è una nuova tabella nel database chiamata `Post` caratterizzata dai campi che abbiamo definito sopra.

### Creazione di un Post Editor

Non abbiamo ancora deciso il look definitivo del nostro sito, ma non sarebbe fantastico se potessimo sbizzarrirci con i post senza dover costruire un sacco di pagine che probabilmente verranno scartate dal team di design? Fortunatamente per noi, "Eccellente" è il secondo nome di Redwood! Non ha un cognome però.

Generiamo tutto il necessario per eseguire tutti le azioni CRUD (Create, Retrieve, Update, Delete) sui post, in modo da non solo verificare che abbiamo i campi corretti nel database, ma anche per creare alcuni post di esempio. Questi ultimi ci saranno utili per poter iniziare a lavorare sul layout vedere apparire un pò di contenuto reale. Redwood ha un generatore adatto per l'occasione:

    yarn rw g scaffold post

Navighiamo con il browser verso `http://localhost:8910/posts` e vediamo cosa abbiamo ottenuto:

<img src="https://user-images.githubusercontent.com/300/73027952-53c03080-3de9-11ea-8f5b-d62a3676bbef.png" />

Beh, questo è poco più di quanto abbiamo realizzato quando abbiamo generato una pagina. Cosa succede se clicchiamo sul pulsante "Nuovo Post"?

<img src="https://user-images.githubusercontent.com/300/73028004-72262c00-3de9-11ea-8924-66d1cc1fceb6.png" />

Ok, ora stiamo facendo progressi. Riempi i campi relativi al titolo ed al corpo del testo e clicca "Save".

<img src="https://user-images.githubusercontent.com/300/73028757-08a71d00-3deb-11ea-8813-046c8479b439.png" />

Abbiamo appena creato un post nel database? E poi abbiamo anche mostrato quel post qui su questa pagina? Sì, ci siamo riusciti. Prova a creare un altro:

<img src="https://user-images.githubusercontent.com/300/73028839-312f1700-3deb-11ea-8e83-0012a3cf689d.png" />

Ma cosa succede se clicchiamo su "Edit" su uno di quei post?

<img src="https://user-images.githubusercontent.com/300/73031307-9802ff00-3df0-11ea-9dc1-ea9af8f21890.png" />

Ok, e se clicchiamo su "Elimina"?

<img src="https://user-images.githubusercontent.com/300/73031339-aea95600-3df0-11ea-9d58-475d9ef43988.png" />

Quindi, Redwood ha appena creato tutte le pagine, componenti e servizi necessari per eseguire tutte le azioni CRUD sulla nostra tabella posts. Non è stato necessario aprire una GUI del database o accedere tramite un terminale e scrivere SQL da zero. Redwood chiama questo processo _scaffolds_.

Ecco cosa è successo quando abbiamo eseguito il commando `yarn rw g scaffold post`:

- Aggiunto un file _SDL_ per definire diverse queries GraphQL e mutazioni in `api/src/graphql/posts.sdl.js`
- Aggiunto un file _services_ in `api/src/services/posts/posts.js` che effettua delle calls al client Prisma per esportare ed importare informazioni nel database
- Creato diverse _pagine_ in `web/src/pages`:
  - `EditPostPage` per editare un post
  - `NewPostPage` per creare un nuovo post
  - `PostPage` per mostrare i dettagli di un post
  - `PostsPage` per elencare tutti i posts
- Creato file _layouts_ in `web/src/layouts/PostsLayout/PostsLayout.js` che funge da contenitore per pagine con elementi comuni come heading della pagina e button "New Posts"
- Creato routes wrappate nel component `Set` e con il layout `PostsLayout` per le pagine in `web/src/Routes.js`
- Creato tre _cell_ in `web/src/components`:
  - `EditPostCell` recupera il post da modificare nel database
  - `PostCell` recupera il post da visualizzare
  - `PostsCell` recupera tutti i post
- Creato quattro _component_ anche in `web/src/components`:
  - `NewPost` visualizza il form per creare un nuovo post
  - `Post` visualizza un singolo post
  - `PostForm` è il form utilizzato sia dal component New che Edit
  - `Posts` visualizza la table di tutti i post

> **Convenzioni di denominazione dei Generator**
>
> Noterai che alcune delle parti generate hanno nomi in plurale ed altre in singolare. Questa convenzione è presa in prestito da Ruby on Rails, che utilizza una convenzione di nomi più "umana": se hai a che fare con un multiplo di qualcosa (come l'elenco di tutti i post) verrà utilizzato un nome plurale. Se hai a che fare con una cosa singola (come creare un nuovo post), il nome sarà singolare. Infatti, se ci fai caso, questo schema suona naturale anche quando parliamo: "mostrami una lista di tutti i posts" e "Creerò un nuovo post."
>
> Per quanto riguarda i generatori:
>
> - I nomi dei file dei servizi sono sempre plurali.
> - I metodi nei servizi saranno al singolare o al plurale a seconda se si prevede che restituiscano più post o un singolo post (`posts` vs. `createPost`).
> - I nomi dei file SDL sono plurali.
> - Le pagine fornite con scaffolds sono al plurale or al singolare, a seconda se hanno ha che fare un singolo o molteplici posts. Quando si utilizza il generatore `page`, si affiderà al nome che specificherai nel comando stesso.
> - I layout usano il nome che gli assegni nella riga di comando.
> - Componenti e celle, come le pagine, saranno al plurali o al singolare a seconda del contesto utilizzato dal generatore di scaffold, altrimenti useranno il nome assegnatoli dalla riga di comando.
>
> Inoltre, nota anche che è la parte del nome della tabella del database che è singolare o plurale, non l'intera parola. Quindi è `PostsCell`, non `PostCells`.
>
> Anche se non è necessario che tu segua questa convenzione una volta che inizi a creare le tue proprie componenti, si consiglia comunque di farlo. La comunità di Ruby on Rails ha imparato ad adorare questa nomenclatura, anche se molte persone si sono inizialmente lamentate quando l'hanno sperimentata per la prima volta. [Give it five minutes](https://signalvnoise.com/posts/3124-give-it-five-minutes).

### Creare una Homepage

Possiamo iniziare col sostituire queste pagine una per una man mano che otteniamo i relativi design, oppure possiamo semplicemente spostarle nella sezione amministrativa del nostro sito e costruire da zero le nostre proprie pagine da visualizzare. D'altronde, il fronte pubblico del sito non permetterà certamente ai visitatori di creare, modificare o eliminare i post. Quindi, che cosa _possono effettivamente_ fare gli utenti?

1. Visualizzare un elenco dei post (senza link per modificarli/eliminarli)
2. Visualizzare un singolo post

Dato che vorremo probabilmente mantenere un modo di creare ed in seguito modificare dei posts, conserviamo le pagine generate dallo scaffolding tali e quali e creiamone di nuove per i due punti sopracitati.

Abbiamo già la `HomePage`, quindi non c'è bisogno di crearla di nuovo. Desideriamo mostrare all'utente una lista dei post, quindi dovremo aggiungere tale logica. Abbiamo bisogno di recuperare il contenuto dal database, e dato che non desideriamo che l'utente resti di fronte ad una schermata bianca durante il tempo necessario al caricamento (ad es. condizioni di rete scarse, server geograficamente distante, ecc.), desidereremo dunque mostrare qualche tipo di messaggio di caricamento o un'animazione. Inoltre, nel caso si verifichi un errore, dovremo gestire anche tale situazione. E cosa dovrebbe accadere quando pubblicheremo il codice open-source di questo blog e qualcuno lo utilizzerà senza aver alcun contenuto nel loro database? Sarebbe ideale se ci fosse una sorta di messaggio che indichi la presenza di una tabula rasa.

Oh cavolo, siamo solamente alla nostra prima pagina con dati e dobbiamo già preoccuparci degli stati di caricamento, errori, pagine in bianco... oppure no?
