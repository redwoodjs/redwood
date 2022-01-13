---
id: administration
title: "Administration"
sidebar_label: "Administration"
---

Il semble raisonable de faire en sorte que les écrans d'administration soient regroupés sous un chemin `/admin`. Mettons à jour les routes de manière à ce que les quatre routes commençant par `/posts` commencent désormais paar `/admin/posts`:

```html
// web/src/Routes.js

<Route path="/admin/posts/new" page={NewPostPage} name="newPost" />
<Route path="/admin/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />
<Route path="/admin/posts/{id:Int}" page={PostPage} name="post" />
<Route path="/admin/posts" page={PostsPage} name="posts" />
```

Allez à http://localhost:8910/admin/posts et notre page générée par scaffolding devrait s'afficher. Grâce aux routes nommées, nous n'avons pas à mettre à jour les `<Link>` créés lors du scaffold puisque l'attribut `name` reste identique!

Avoir un chemin différent pour l'espace d'administration est une bonne chose, mais rien n'empêche quelqu'un de simplement y accéder et de modifier nos articles. Comment peut-on se protéger des regards/mains indiscrets?

