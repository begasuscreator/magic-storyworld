import React from 'react';

export default function LanguageSwitcher({ lang, setLang }) {
  return (
    <div className="lang-switcher">
      <button 
        className={`lang-btn ${lang === 'it' ? 'active' : ''}`}
        onClick={() => setLang('it')}
        aria-label="Cambia lingua in Italiano"
      >
        ITA
      </button>
      <button 
        className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
        onClick={() => setLang('en')}
        aria-label="Change language to English"
      >
        ENG
      </button>
    </div>
  );
}
