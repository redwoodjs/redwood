---
id: administration
title: "Amministrazione"
sidebar_label: "Amministrazione"
---

Collocare l'interfaccia amministrativa ad `/admin` sembra ragionevole. Per fare in modo che questo accada, aggiorniamo le quattro routes coinvolte cominciando col sostituire `/posts` in `/admin/posts`:

```html
// web/src/Routes.js

<Route path="/admin/posts/new" page={NewPostPage} name="newPost" />
<Route path="/admin/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />
<Route path="/admin/posts/{id:Int}" page={PostPage} name="post" />
<Route path="/admin/posts" page={PostsPage} name="posts" />
```

Dirigiti verso http://localhost:8910/admin/posts e la nostra pagina di scaffold generata in precedenza dovrebbe apparire. Grazie al fatto che le routes hanno un nome proprio, non è necessario aggiornare manualmente nessuno dei `<Link>` generati dagli scaffold dato che il `nome` delle pagine non è cambiato!

Collocare gli amministratori a questo nuovo indirizzo è un'ottima idea, però nulla impedisce ad altri utenti di navigare a tale indirizzo ed interferire con i post del nostro blog. Come facciamo a mantenere lontani gli sguardi indiscreti?

