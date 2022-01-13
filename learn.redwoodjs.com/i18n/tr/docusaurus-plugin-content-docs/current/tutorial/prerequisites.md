---
id: prerequisites
title: "Ön Koşullar"
sidebar_label: "Ön Koşullar"
---

Bu eğitici, birkaç temel kavram hakkında zaten bilgi sahibi olduğunuzu varsaymaktadır:

- [React](https://reactjs.org/)
- [GraphQL](https://graphql.org/)
- [Jamstack](https://jamstack.org/)

Bu teknolojiler hakkında hiçbir şey bilmeden bu eğitim üzerinde çalışabilirsiniz. Fakat kendinizi, açıklamak için zaman ayıramadığımız ve sizi durduramadığımız bir teknoloji içerisinde kaybolmuş halde bulabilirsiniz. Ayrıca, bu size React içerisinde yerleşik olan özellikler ile Redwood'un ortaya getirdiği ekstra özellikler arasındaki çizginin nerede olduğunu bilmenize yardımcı olur.

### Redwood Sürümleri

Eğitimi tamamlayabilmek için Redwood v0.25 veya daha yüksek bir sürümde olmanız gerekmektedir. Eğer Redwood'u ilk defa kullanıyorsanız endişelenmeyiniz: Uygulamanızın temelini ilk oluşturduğunuzda en son sürüm olarak yüklenecektir! Hali hazırda versiyon 0.25'ten daha önceki bir sürümle oluşturulmuş bir siteniz var ise, yükseltmeniz gerekmektedir. Bu komutu uygulamanızın kök dizininde çalıştırınız ve komutları izleyiniz:

```bash
yarn redwood upgrade
```

### Node.js ve Yarn Sürümleri

Kurulum esnasında RedwoodJS, sisteminizin Node ve Yarn için sürüm gereksinimlerini karşılayıp karşılamadığını kontrol etmektedir:

- node: "=14.x"
- yarn: ">=1.15"

Sistemdeki sürümleriniz her iki gereksinimi de karşılamıyorsa, _kurulum esnasında bir HATA ile meydana gelecektir._ Kontrol etmek için lütfen komut satırınızda aşağıdakileri çalıştırın:

```
node --version
yarn --version
```

Lütfen bunlara bağlı olarak yükseltme yapınız. Ardından, hazır olduğunuzda Redwood kurulumuna geçiniz!

> **Node ve Yarn Kurulumu**
> 
> Node.js ve Yarn'ı kurmanın ve kullanmanın birçok yolu vardır. Eğer ilk kez kuruyorsanız, aşağıdakileri öneririz:
> 
> **Yarn**
> 
> - [Yarnpkg.com'da verilen talimatları](https://classic.yarnpkg.com/en/docs/install/) izlemenizi öneririz.
> 
> **Node.js**
> 
> - **Linux** ve **Mac** kullanıcıları için, sistemde birden çok Node sürümünü yönetmek için `nvm` harika bir araçtır. Kurmak ve öğrenmek belki biraz daha fazla çaba gerektirecektir, ancak [Nodejs.org'dan en son yüklemeyi almak](https://nodejs.org/en/) daha iyi sonuç verecektir. 
>     - **Mac** kullanıcıları için, sisteminizde zaten Homebrew yüklüyse, [`nvm`'i yükleyebilmek](https://formulae.brew.sh/formula/nvm) için kullanabilirsiniz. Bunun dışında, [`nvm` adresinden kurulum talimatlarını](https://github.com/nvm-sh/nvm#installing-and-updating) izleyiniz.
>     - **Linux** kullanıcıları için, [`nvm` adresinden kurulum talimatlarını](https://github.com/nvm-sh/nvm#installing-and-updating) izleyiniz.
> - **Windows** kullanıcıları içinse, kurulum için [Nodejs.org](https://nodejs.org/en/) adresini ziyaret etmesini öneririz.
> 
> Mevcut iki Node sürümünden hangisini kullanacağınız konusunda kafanız karışıyor ise, şu anda v14 olan en yeni LTS'yi kullanmanızı öneririz.

