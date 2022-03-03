---
id: prerequisites
title: "Prerequisiti"
sidebar_label: "Prerequisiti"
---

Questo tutorial presuppone che tu abbia già familiarità con alcuni concetti fondamentali:

- [React](https://reactjs.org/)
- [GraphQL](https://graphql.org/)
- [Jamstack](https://jamstack.org/)

Potresti affrontare questo tutorial senza conoscere nulla di queste tecnologie, ma è possibile che tu ti ritrovi spaesato con la terminologia utilizzata. Infatti, non ci soffermeremo per offrire spiegazioni al riguardo. Risulta essere di aiuto anche sapere dove è il confine tra ciò che è realizzato in React e quali feature aggiuntive Redwood mette sul tavolo.

### Versioni di Redwood

Dovrai avere la v0.25 o superiore di Redwood per completare il tutorial. Se questa è la tua prima volta con Redwood non preoccuparti: l'ultima versione verrà installata automaticamente quando crei lo scheletro dell'applicazione! Se hai un sito pre-esistente creato con una version precedente alla 0.25 avrai necessità di aggiornare. Lancia questo comando nella root della tua applicazione e segui i prompt:

```bash
yarn redwood upgrade
```

### Versioni di Node.js e Yarn

Durante l'installazione, RedwoodJS verifica se il sistema soddisfa i requisiti di versione per Node e Yarn:

- node: ">=14.x <=16.x"
- yarn: ">=1.15"

Se le versioni di sistema non soddisfano entrambi i requisiti, _il bootstrap di installazione terminerà con un ERROR._ Per verificare, esegui quanto segue dalla riga di comando del terminale:

```
node --version
yarn --version
```

Si prega di eseguire l'aggiornamento di conseguenza. Quindi procedi all'installazione di Redwood quando sei pronto!

> **Installazione di Node e Yarn**
> 
> Ci sono molti modi per installare e gestire sia Node.js che Yarn. Se stai installando per la prima volta, ti consigliamo quanto segue:
> 
> **Yarn**
> 
> - Si consiglia di seguire le [istruzioni via Yarnpkg.com](https://classic.yarnpkg.com/en/docs/install/).
> 
> **Node.js**
> 
> - Per gli utenti **Linux** e **Mac**, `nvm` è un ottimo strumento per gestire più versioni di Node su un unico sistema. Comporta un po' più di tempo per il setup e lo studio, tuttavia, in questo caso ottenere l'ultima [installazione da Nodejs.org](https://nodejs.org/en/) funziona perfettamente. 
>     - Per gli utenti **Mac**, se hai già installato Homebrew, puoi usarlo anche per [installare `nvm`](https://formulae.brew.sh/formula/nvm). Altrimenti, segui le [istruzioni di installazione da `nvm`](https://github.com/nvm-sh/nvm#installing-and-updating).
>     - Per gli utenti **Linux** puoi seguire le [istruzioni di installazione da `nvm`](https://github.com/nvm-sh/nvm#installing-and-updating).
> - Consigliamo agli utenti di **Windows** di visitare [Nodejs.org](https://nodejs.org/en/) per l'installazione.
> 
> Se sei confuso su quale delle due attuali versione di Node da usare, si consiglia di utilizzare la LTS più recente, che al momento è la [16. 3.0](https://nodejs.org/download/release/v16.13.0/).

