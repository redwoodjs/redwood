# Translation Guide

**IMPORTANT: Do not translate directly in this repo!**

All content is translated via our [Crowdin repo](https://crowdin.com/project/learn-redwoodjs/) so we can keep our docs from going stale.

Getting involved is easy! Crowdin lets you sign in with your Github account.

## Roles

| Role        | Description                                                  | Language Proficiency                                        |
| ----------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Translator  | Translate content in Crowdin from English to target language | English: Intermediate+ <br />Target: Native level preferred |
| Proofreader | Approve/reject translated content in Crowdin                 | English: Intermediate+ <br />Target: Advanced               |

Translators can double as proofreaders for other people's translations in their proficient language(s).

Yes, these are subjective requirements :) The goal is to make Redwood accessible by providing easy to read and engaging tutorial content.

To sign up for a role, simply request in Crowdin.

## Current Languages

| Language | Translators | Proofreaders |
| -------- | ----------- | ------------ |
| [French](https://crowdin.com/project/learn-redwoodjs/fr#)   | @Thieffen, @noire.munich, @simoncrypta, @bugsfunny  | @Thieffen    |
| [Spanish](https://crowdin.com/project/learn-redwoodjs/es-ES#)   | @pdejuan, @ brian.gastesi  | @clairefro, @pdejuan    |
| [Italian](https://crowdin.com/project/learn-redwoodjs/it#)   | @mlabate  |    |
| [Portuguese](https://crowdin.com/project/learn-redwoodjs/it#)   | @renansoares, @luispinto23  |  @renansoares   |

Want to add yourself to a translator and/or proofreader role for a language? Don't see your language here and wish to contribute?

Tag @clairefro in a new issue in this repo and we'll get it started!

## Guide for translators

In [Crowdin](https://crowdin.com/project/learn-redwoodjs), go to your target language and look for any incomplete translations. Then translate untranslated strings directly in Crowdin's interface.

### Branch

Please translate in the `main` branch folder

### Frontmatter

When translating, keep the frontmatter `id` the same as English. 

This id is used for placing items correctly in the sidebar and **must be the same for all locales of a given document**.

`title` and `sidebar_label` however **can** and **should** be translated! Use double quotes `""` - it's a habit to prevent YAML breaking on special characters like `:`.

example

English
```md
---
id: welcome-to-redwood
title: "Welcome to Redwood"
sidebar_label: "Welcome to Redwood"
---

French (`id` stays in English!)
---
id: welcome-to-redwood
title: "Bienvenue chez Redwood"
sidebar_label: "Bienvenue chez Redwood"
---
```

### Code blocks
Leave code blocks as-is. There is an icon in the input box for translation that copies the source string in one click: 

![image](https://user-images.githubusercontent.com/9841162/109427680-5c9a1300-79a8-11eb-9a0c-c28cfa781db5.png)

### Troubleshooting

Crowdin is a pretty cool tool but it has its quirks - feel free to reach out to the internet or @clairefro if you get stuck.

### Translator FAQ

**I finished translating in Crowdin... Where's the PR?!?**

Translations are only eligible for auto-PR once 100% approved. After approval, it takes ~10 minutes until the PR will sync to this repo.

**I found a typo in an existing translation, can I update it?**

Yes please!

**I see weird symbols like `<0>` in Crowdin strings... what?**

Those symbols are stand-ins for html tags like `<a></a>`. It is how Crowdin can map the tags to your translated content. In general, Crowdin tries to hide content that is not subject for translation, as to reduce clutter for translators. Do not delete these - keep them in your translation.

**Are there term glossaries to ensure consistency between translators in the same language?**

You can help us start some if you like! There is a glossary tab in Crowdin.

**This whole process is a little confusing.**

Your feedback will help us smooth things out!

## Guide for proofreaders

Navigate to the translations page for your target locale from [here](https://crowdin.com/project/learn-redwoodjs)

Look for blue! That means translated but not yet approved. Click the three dots next to any blue and select "Proofread"

![image](https://user-images.githubusercontent.com/9841162/110227528-224fda80-7eae-11eb-933f-c1b529f856e7.png)


You can now see a list of translated strings waiting to be approved.

You can either approve them in bulk by selecting all, or one by one carefully.

![image](https://user-images.githubusercontent.com/9841162/110227545-50cdb580-7eae-11eb-871d-e31b0f495d99.png)

If you see something inaccurate or strange, do not approve that string. Instead, leave a comment for the translator by clicking the comment icon in the right pane. Please leave your comment in English, except for suggested phrasing.

![image](https://user-images.githubusercontent.com/9841162/110227609-f719bb00-7eae-11eb-87a6-b422accbae48.png)

Once you finish approving all translations in a file, that file becomes 100% green. Voila!

100% green files will automatically be PRed to this repo every ~10 mins.





