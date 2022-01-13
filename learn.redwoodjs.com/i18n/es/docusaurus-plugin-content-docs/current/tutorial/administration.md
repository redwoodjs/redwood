---
id: administration
title: "Administración"
sidebar_label: "Administración"
---

Sería razonable tener las pantallas de administración en `/admin`. Para que eso suceda actualicemos las rutas que empiezan con `/posts` para que comiencen con `/admin/posts`:

```html
// web/src/Routes.js

<Route path="/admin/posts/new" page={NewPostPage} name="newPost" />
<Route path="/admin/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />
<Route path="/admin/posts/{id:Int}" page={PostPage} name="post" />
<Route path="/admin/posts" page={PostsPage} name="posts" />
```

Diríjase a http://localhost:8910/admin/posts y debería ver la página generada anteriormente. Gracias a las rutas nombradas no tenemos que actualizar ningún `<Link>`, ya que el `name` de las páginas no ha cambiado!

Administrar los contenidos desde una ruta diferente es genial, pero nada impide que alguien navegue a esa ruta y que sabotee los post de blog. ¿Cómo mantendremos alejados los ojos/dedos indiscretos?

