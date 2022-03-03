---
id: installation-starting-development
title: "Installazione e avvio dello sviluppo"
sidebar_label: "Installazione e avvio dello sviluppo"
---

Utilizzeremo yarn ([yarn](https://yarnpkg.com/en/docs/install) è un requisito) per creare la struttura di base della nostra app:

    yarn create redwood-app ./redwoodblog

Avrai una nuova directory `redwoodblog` contenente diverse directory e file. Entra in quella directory e procedi col creare il database, quindi avvia il server di sviluppo:

    cd redwoodblog
    yarn redwood dev

Un browser dovrebbe aprirsi automaticamente su http://localhost:8910 e su cui vedrai la pagina di benvenuto di Redwood:

![Pagina di benvenuto di Redwood](https://user-images.githubusercontent.com/300/73012647-97a43d00-3dcb-11ea-8554-42df29c36e4a.png)

> Ricordare il numero della porta è facile come contare: 8-9-10!

### Primo Commit

Ora che abbiamo messo in piedi lo scheletro della nostra app Redwood, è una buona idea salvare lo stato attuale dell'app come primo commit... giusto per sicurezza.

    git init
    git add .
    git commit -m 'First commit'

