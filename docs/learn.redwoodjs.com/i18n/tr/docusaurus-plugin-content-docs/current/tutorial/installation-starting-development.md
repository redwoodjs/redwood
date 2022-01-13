---
id: installation-starting-development
title: "Kurulum & Başlangıç"
sidebar_label: "Kulum & Başlangıç"
---

Uygulamamızın temel yapısını oluşturmak için yarn ([yarn](https://yarnpkg.com/en/docs/install) gereklidir) paket yöneticisini kullanacağız:

    yarn create redwood-app ./redwoodblog

Birkaç klasör ve dosyalar içeren yeni bir `redwoodblog` klasörünüz oluşacak. Bu klasöre girin ve veritabanını oluşturalım, ardından geliştirme sunucusunu başlatalım:

    cd redwoodblog
    yarn redwood dev

Varsılayan tarayıcınızda otomatik olarak http://localhost:8910 adresi açılmalıdır ve Redwood karşılama sayfasını göreceksiniz:

![Redwood Hoşgeldin Sayfası](https://user-images.githubusercontent.com/300/73012647-97a43d00-3dcb-11ea-8554-42df29c36e4a.png)

> Port numarasını hatırlamak, saymak kadar kolaydır: 8-9-10!

### İlk Commit

Artık Redwood uygulamamızın iskeletine sahip olduğumuza göre, her ihtimale karşı uygulamanın mevcut durumunu kaydetmek iyi bir fikirdir.

    git init
    git add .
    git commit -m 'İlk Commit'

