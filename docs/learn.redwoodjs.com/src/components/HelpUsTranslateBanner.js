import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import config from '../../docusaurus.config';

const { translationGuideUrl } = config.customFields;

// hacky method of string translation in custom components
// TODO: centralize these custom component string translations in /i18n
const t = {
  message: {
    fr: 'Voyez-vous des traductions manquantes ou incorrectes ? Aidez-nous à traduire! Consultez notre guide de traduction:',
    en: 'See any missing or incorrect translations? Help us translate! See our translation guide:',
    es: '¡Ayúdanos a traducir! Vea nuestra guía de traducción:',
  },
  hrefLabel: {
    fr: 'Guide de traduction',
    en: 'Translation Guide',
    es: 'Guía de traducción',
  },
};

function HelpUsTranslateBanner() {
  const ctx = useDocusaurusContext();
  const { currentLocale } = ctx.i18n;

  return (
    <blockquote>
      <span>{t.message[currentLocale] || t.message.en} </span>
      <a
        href={translationGuideUrl}
        rel="noreferrer noopener nofollow"
        target="_blank"
      >
        {t.hrefLabel[currentLocale] || t.message.en}
      </a>
    </blockquote>
  );
}

export default HelpUsTranslateBanner;
