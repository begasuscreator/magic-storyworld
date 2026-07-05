import React, { useState, useEffect } from 'react';
import LanguageSwitcher from './components/LanguageSwitcher';
import BookCard from './components/BookCard';
import Flipbook from './components/Flipbook';
import CharacterList from './components/CharacterList';
import FaqSection from './components/FaqSection';
import NewsletterForm from './components/NewsletterForm';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [data, setData] = useState(null);
  const [lang, setLang] = useState('it'); // Default to Italian, can switch to English
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [activeFlipbookBook, setActiveFlipbookBook] = useState(null);
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('manage') === 'true' || params.get('admin') === 'true') {
      setShowAdminLink(true);
    }
  }, []);

  // Fetch website data from public/data.json
  useEffect(() => {
    fetch('/data.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load website configuration.');
        return res.json();
      })
      .then((json) => {
        setData(json);
        applyTheme(json.settings.theme);
        
        // Set default book for flipbook preview
        const latest = json.books.find(b => b.isLatest) || json.books[0];
        setActiveFlipbookBook(latest);
        
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Apply theme variables dynamically from data.json config
  const applyTheme = (theme) => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.primaryColor || '#2d6a4f');
    root.style.setProperty('--color-secondary', theme.secondaryColor || '#d4a373');
    root.style.setProperty('--color-bg', theme.backgroundColor || '#fefae0');
    root.style.setProperty('--color-text', theme.textColor || '#1b4332');
    root.style.setProperty('--color-accent', theme.accentColor || '#e9d8a6');
    if (theme.fontFamily) {
      root.style.setProperty('--font-body', theme.fontFamily);
    }
  };

  // Callback when admin saves changes
  const handleAdminSave = (newData) => {
    setData(newData);
    applyTheme(newData.settings.theme);
    
    // Maintain active book if it still exists
    if (activeFlipbookBook) {
      const updatedActive = newData.books.find(b => b.id === activeFlipbookBook.id);
      setActiveFlipbookBook(updatedActive || newData.books[0]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fefae0', flexDirection: 'column', gap: '15px' }}>
        <div style={{ width: '50px', height: '50px', border: '5px solid #2d6a4f', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <div style={{ fontFamily: 'sans-serif', fontWeight: 'bold', color: '#2d6a4f' }}>Loading Magic Storyworld...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf0ed', color: '#dc3545', flexDirection: 'column', gap: '10px', padding: '20px', textAlign: 'center' }}>
        <h2>Error Loading Site Data</h2>
        <p>{error}</p>
        <button style={{ padding: '10px 20px', background: '#dc3545', color: '#fff', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    );
  }

  const { settings, books, characters, faqs } = data;
  const latestBook = books.find((b) => b.isLatest) || books[0];
  const teaserBook = books.find((b) => b.isTeaser);
  const regularBooks = books.filter((b) => !b.isTeaser);

  // Translations helpers
  const t = {
    latestRelease: { en: 'Latest Release', it: 'Ultima Uscita' },
    exploreEcosystem: { en: 'Explore the Ecosystem', it: 'Esplora l\'Ecosistema' },
    listenSpotify: { en: 'Listen on Spotify', it: 'Ascolta su Spotify' },
    watchYouTube: { en: 'Watch on YouTube', it: 'Guarda su YouTube' },
    buyAmazon: { en: 'Get on Amazon', it: 'Acquista su Amazon' },
    readAudible: { en: 'Listen on Audible', it: 'Ascolta su Audible' },
    previewBook: { en: 'Flipbook Preview', it: 'Anteprima Sfogliabile' },
    previewBookText: { en: 'Get a sneak peek inside our magical books. Turn the pages to experience the adventure!', it: 'Dai uno sguardo all\'interno dei nostri libri magici. Gira le pagine per vivere l\'avventura!' },
    booksTitle: { en: 'All Stories & Books', it: 'Tutti i Nostri Libri' },
    booksSubtitle: { en: 'Discover educational illustrated storybooks, coloring pages, and soundscapes.', it: 'Scopri libri illustrati educativi, album da colorare e paesaggi sonori rilassanti.' },
    charTitle: { en: 'Meet the Characters', it: 'Incontra i Personaggi' },
    charSubtitle: { en: 'Get to know the wonderful animals living in our worlds, grouped by book story.', it: 'Conosci i meravigliosi animali che popolano le nostre storie, suddivisi per libro.' },
    faqTitle: { en: 'Frequently Asked Questions', it: 'Domande Frequenti (FAQ)' },
    faqSubtitle: { en: 'Bilingual questions and resource guides optimized for AEO and parents.', it: 'Domande bilingue e guide alle risorse ottimizzate per AEO e genitori.' },
    funnelTitle: { en: 'Join Maya Springs\' Newsletter', it: 'Iscriviti alla Newsletter di Maya Springs' },
    funnelSubtitle: { en: 'Enter your email to receive a dynamic download link for your free bonus gift, hosted on short.io. Plus, get updates on upcoming book releases!', it: 'Inserisci la tua email per ricevere un link di download dinamico su short.io per il tuo regalo gratuito, e rimani aggiornato sulle prossime uscite!' },
    comingSoon: { en: 'Coming Soon!', it: 'In Arrivo!' },
    teaserHeadline: { en: 'Our Next Journey...', it: 'Il Nostro Prossimo Viaggio...' },
    quickChannels: { en: 'Find Us On', it: 'Trovaci Su' },
    navHome: { en: 'Home', it: 'Home' },
    navBooks: { en: 'Books', it: 'Libri' },
    navCharacters: { en: 'Characters', it: 'Personaggi' },
    navFaq: { en: 'FAQs', it: 'Domande Frequenti' },
    allRights: { en: 'All rights reserved.', it: 'Tutti i diritti riservati.' }
  };

  const getTranslation = (key) => t[key]?.[lang] || t[key]?.['en'] || '';

  return (
    <div className="app">
      {/* Navigation Header */}
      <header className="header">
        <div className="container header-container">
          <a href="#" className="logo">
            <span className="logo-icon">✨</span>
            <span>{settings.title}</span>
          </a>
          
          <nav className="nav">
            <a href="#home" className="nav-link">{getTranslation('navHome')}</a>
            <a href="#books" className="nav-link">{getTranslation('navBooks')}</a>
            {characters.length > 0 && <a href="#characters" className="nav-link">{getTranslation('navCharacters')}</a>}
            <a href="#faq" className="nav-link">{getTranslation('navFaq')}</a>
          </nav>

          <div className="header-actions">
            <LanguageSwitcher lang={lang} setLang={setLang} />
          </div>
        </div>
      </header>

      {/* Hero Section (Features the Latest Book) */}
      <section id="home" className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="hero-badge">{getTranslation('latestRelease')}</span>
            <h1 className="hero-title">{latestBook?.title[lang] || latestBook?.title['en']}</h1>
            <p className="hero-subtitle">{latestBook?.description[lang] || latestBook?.description['en']}</p>
            
            <div className="hero-buttons">
              {latestBook?.links?.amazon && (
                <a href={latestBook.links.amazon} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  🛒 {getTranslation('buyAmazon')}
                </a>
              )}
              {latestBook?.links?.spotify && (
                <a href={latestBook.links.spotify} target="_blank" rel="noopener noreferrer" className="btn btn-accent">
                  🎵 {getTranslation('listenSpotify')}
                </a>
              )}
              {latestBook?.links?.youtube && (
                <a href={latestBook.links.youtube} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  📺 {getTranslation('watchYouTube')}
                </a>
              )}
            </div>
          </div>
          
          <div className="hero-image-wrapper">
            <div className="hero-blob"></div>
            {latestBook?.cover && (
              <img 
                src={latestBook.cover} 
                alt={latestBook.title[lang] || latestBook.title['en']} 
                className="hero-cover"
              />
            )}
          </div>
        </div>
      </section>

      {/* Quick Channels Channels Funnel Banner */}
      <section className="channels">
        <div className="container">
          <div className="channels-list">
            <a href={settings.socials.youtube} target="_blank" rel="noopener noreferrer" className="channel-item">
              <span className="channel-icon">🎬</span> YouTube Channel
            </a>
            <a href={settings.socials.spotify} target="_blank" rel="noopener noreferrer" className="channel-item">
              <span className="channel-icon">🎧</span> Spotify Music
            </a>
            <a href={settings.socials.amazon} target="_blank" rel="noopener noreferrer" className="channel-item">
              <span className="channel-icon">📖</span> Amazon Books
            </a>
            <a href={settings.socials.audible} target="_blank" rel="noopener noreferrer" className="channel-item">
              <span className="channel-icon">🔊</span> Audible Audiobooks
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Flipbook Section */}
      {activeFlipbookBook && activeFlipbookBook.flipbookPages && activeFlipbookBook.flipbookPages.length > 0 && (
        <section id="flipbook" className="flipbook-section">
          <div className="container">
            <h2 className="section-title">{getTranslation('previewBook')}</h2>
            <p className="section-subtitle">{getTranslation('previewBookText')}</p>
            
            {/* Dropdown to select book preview if there are multiple */}
            {regularBooks.filter(b => b.flipbookPages && b.flipbookPages.length > 0).length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <select 
                  className="form-select" 
                  value={activeFlipbookBook.id}
                  onChange={(e) => setActiveFlipbookBook(regularBooks.find(b => b.id === e.target.value))}
                  style={{ width: '100%', maxWidth: '300px' }}
                >
                  {regularBooks.filter(b => b.flipbookPages && b.flipbookPages.length > 0).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title[lang] || b.title['en']}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Flipbook book={activeFlipbookBook} lang={lang} />
          </div>
        </section>
      )}

      {/* Books Catalogue Grid */}
      <section id="books" className="books-section">
        <div className="container">
          <h2 className="section-title">{getTranslation('booksTitle')}</h2>
          <p className="section-subtitle">{getTranslation('booksSubtitle')}</p>
          
          <div className="books-grid">
            {regularBooks.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                lang={lang} 
                onOpenPreview={(b) => {
                  setActiveFlipbookBook(b);
                  document.getElementById('flipbook')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Teaser Section (Next Upcoming Book Preview) */}
      {teaserBook && (
        <section id="teaser" style={{ background: 'rgba(212, 163, 115, 0.08)' }}>
          <div className="container hero-grid">
            <div className="hero-image-wrapper">
              {teaserBook.cover && (
                <img 
                  src={teaserBook.cover} 
                  alt={teaserBook.title[lang] || teaserBook.title['en']} 
                  className="hero-cover"
                  style={{ transform: 'rotate(2deg)', maxWidth: '280px' }}
                />
              )}
            </div>
            <div className="hero-content">
              <span className="hero-badge">{getTranslation('comingSoon')}</span>
              <h2 className="hero-title" style={{ fontSize: '2.5rem' }}>{getTranslation('teaserHeadline')}</h2>
              <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-primary)', fontSize: '1.8rem' }}>
                {teaserBook.title[lang] || teaserBook.title['en']}
              </h3>
              <p className="hero-subtitle" style={{ fontSize: '1.05rem' }}>
                {teaserBook.description[lang] || teaserBook.description['en']}
              </p>
              <div>
                <a href="#newsletter" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.95rem' }}>
                  🔔 {lang === 'it' ? 'Avvisami all\'uscita' : 'Notify me on release'}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Character Biographies */}
      {characters.length > 0 && (
        <section id="characters" className="characters-section">
          <div className="container">
            <h2 className="section-title">{getTranslation('charTitle')}</h2>
            <p className="section-subtitle">{getTranslation('charSubtitle')}</p>
            <CharacterList books={books} characters={characters} lang={lang} />
          </div>
        </section>
      )}

      {/* n8n Email Capture Funnel */}
      <section id="newsletter" className="funnel-section">
        <div className="container funnel-container">
          <div className="funnel-content">
            <h2>{getTranslation('funnelTitle')}</h2>
            <p>{getTranslation('funnelSubtitle')}</p>
            
            <div className="funnel-perks">
              <div className="perk-item">
                <span className="perk-icon">🎁</span>
                <span>{lang === 'it' ? 'Disegni da Colorare Stampabili Gratis' : 'Free Printable Coloring Pages'}</span>
              </div>
              <div className="perk-item">
                <span className="perk-icon">📖</span>
                <span>{lang === 'it' ? 'Ministorie Esclusive per la Buonanotte' : 'Exclusive Bedtime Mini-Stories'}</span>
              </div>
              <div className="perk-item">
                <span className="perk-icon">💌</span>
                <span>{lang === 'it' ? 'Newsletter con le Novità di Maya Springs' : 'Newsletter with Maya Springs Updates'}</span>
              </div>
            </div>
          </div>
          
          <div className="funnel-form-wrapper">
            <NewsletterForm webhookUrl={settings.n8nWebhookUrl} lang={lang} />
          </div>
        </div>
      </section>

      {/* Bilingual AEO FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="container">
          <h2 className="section-title">{getTranslation('faqTitle')}</h2>
          <p className="section-subtitle">{getTranslation('faqSubtitle')}</p>
          <FaqSection faqs={faqs} lang={lang} />
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3 className="footer-logo">✨ {settings.title}</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                {settings.authorBio[lang] || settings.authorBio['en']}
              </p>
            </div>
            
            <div className="footer-links">
              <h4 className="footer-link-title">{lang === 'it' ? 'Esplora' : 'Explore'}</h4>
              <a href="#home">{getTranslation('navHome')}</a>
              <a href="#books">{getTranslation('navBooks')}</a>
              <a href="#faq">{getTranslation('navFaq')}</a>
            </div>

            <div className="footer-links">
              <h4 className="footer-link-title">{getTranslation('quickChannels')}</h4>
              <div className="footer-socials">
                <a href={settings.socials.youtube} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="YouTube">
                  📹
                </a>
                <a href={settings.socials.spotify} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Spotify">
                  🎵
                </a>
                <a href={settings.socials.amazon} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Amazon">
                  🛒
                </a>
                <a href={settings.socials.audible} target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Audible">
                  🔊
                </a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div>
              &copy; {new Date().getFullYear()} {settings.author} &bull; Magic Storyworld. {getTranslation('allRights')}
            </div>
            {showAdminLink && (
              <div>
                <button className="admin-link" onClick={() => setIsAdminOpen(true)}>
                  🔐 Dashboard Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Admin CMS Modal */}
      {isAdminOpen && (
        <AdminDashboard 
          data={data} 
          onSave={handleAdminSave} 
          onClose={() => setIsAdminOpen(false)} 
        />
      )}
    </div>
  );
}
