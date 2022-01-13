---
id: redwood-file-structure
title: "Struttura dei file di Redwood"
sidebar_label: "Struttura dei file di Redwood"
---

Diamo un'occhiata ai file e alle directory che sono stati creati per noi (i file di configurazione sono stati esclusi per il momento):

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

Al primo livello abbiamo due directory, `api` e `web`. Redwood separa ciò che riguarda il backend (`api`) da ciò che riguarda il frontend (`web`) nei propri percorsi nel codebase. ([Yarn si riferisce a questi come "workspace"](https://yarnpkg.com/lang/en/docs/workspaces/). In Redwood, ci riferiamo a loro come "side".) Quando si aggiungono packages, sarà necessario specificare in quale workspace devono fare parte. Ad esempio (non eseguire questi comandi, stiamo solo esaminando la sintassi):

    yarn workspace web add marked
    yarn workspace api add better-fs

### La Directory /api

All'interno di `api` ci sono due directory:

- `db` contiene gli assi portanti del database:

  - `schema.prisma` contiene lo schema del database (tabelle e colonne)
  - `seed.js` è usato per popolare il tuo database con tutti i dati che devono esistere perché la tua app possa funzionare (ad esempio un utente amministratore o una configurazione del sito).

  Dopo aver aggiunto la nostra prima tabella di database ci sarà anche un file SQLite chiamato `dev.db` e una directory chiamata `migrations`. `migrations` contiene i file che fungono da snapshot dello schema del database man mano che cambia nel tempo.

- `src` contiene tutto il resto del codice del backend. `api/src` contiene altre quattro directory:
  - `functions` conterrà tutte le [lambda function](https://docs.netlify.com/functions/overview/) di cui avrà bisogno la tua app oltre al file `graphql.js` auto-generato da Redwood. Questo file è necessario per utilizzare l'API GraphQL.
  - `graphql` contiene lo schema GraphQL scritto in Schema Definition Language (i file avranno estensione `.sdl.js`).
  - `lib` contiene un file, `db.js`, che istanzia il client del database Prisma. Sei libero di aggiungere ulteriori opzioni, se necessario. È possibile utilizzare questa directory per altro codice relativo alle API che non rientra in `functions` o `services`.
  - `services` contiene la business logic relativa ai tuoi dati. Quando stai effettuando una query o una mutation sui dati per GraphQL, quel codice finisce qui dentro, ma in un formato riutilizzabile in altri punti della tua applicazione.

Questo è tutto per il backend.

### La Directory /web

- `src` contiene varie directory:
  - `components` contiene i classici component React oltre alle _Cell_ di Redwood (di cui diremo di più a breve).
  - `layouts` contiene HTML/component che eseguono un wrap dei contenuti e sono condivisi tra _Page_.
  - `pages` contengono component e sono opzionalmente racchiuse all'interno di _Layout_ e sono le "landing page" per un determinato URL (un URL come `/articles/hello-world` verrà mappato su una pagina e `/contact-us` su un'altra). Ci sono due pagine incluse in una nuova app:
    - `NotFoundPage.js` sarà mostrato quando non viene individuato nessun altro percorso (vedi `Routes.js` sotto).
    - `FatalErrorPage.js` verrà mostrato quando c'è un errore non gestito che non permette un ripristino dell'applicazione e che altrimenti causerebbe un crash dell'applicazione (normalmente restituendo una pagina vuota).
  - `index.css` è un punto generico per inserire il tuo CSS, ma ci sono molte altre opzioni.
  - `index.html` è il punto di partenza standard di React per la nostra app.
  - `App.js` il codice di bootstrap per eseguire la nostra app Redwood.
  - `Routes.js` definisce le rotte della nostra app che mappano un URL su una _Page_.
- `public` contiene asset non utilizzati da component React (verranno copiati nella root directory dell'app finale senza essere modificati):
  - `favicon.png` è l'icona che sarà adottata da un tab del browser quando la pagina è aperta (le app mostreranno il logo RedwoodJS di default).
  - `robots.txt` può essere utilizzato per controllare quali indicizzatori web sono [autorizzati](https://www.robotstxt.org/robotstxt.html).
  - `README.md` spiega come, e quando, utilizzare la directory `public` per gli asset statici. Esso descrive anche le best practice per l'import di asset all'interno dei component tramite Webpack. Puoi anche [leggere questo file README.md su GitHub](https://github.com/redwoodjs/create-redwood-app/tree/main/web/public).

