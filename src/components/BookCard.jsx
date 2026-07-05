import React from 'react';

export default function BookCard({ book, lang, onOpenPreview }) {
  const isTeaser = book.isTeaser;
  const title = book.title[lang] || book.title['en'];
  const desc = book.description[lang] || book.description['en'];
  
  return (
    <div className={`book-card ${isTeaser ? 'teaser' : ''}`}>
      <img 
        src={book.cover || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80'} 
        alt={title} 
        className="book-card-image"
        loading="lazy"
      />
      <div className="book-card-content">
        <h3 className="book-card-title">{title}</h3>
        {isTeaser && (
          <span className="hero-badge" style={{ fontSize: '0.8rem', padding: '4px 10px', marginTop: '4px' }}>
            {lang === 'it' ? 'In arrivo!' : 'Coming Soon!'}
          </span>
        )}
        <p className="book-card-desc">{desc}</p>
        
        {!isTeaser && (
          <div className="book-card-links">
            {book.links?.amazon && (
              <a 
                href={book.links.amazon} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="book-link-btn amazon"
              >
                Amazon
              </a>
            )}
            {book.links?.spotify && (
              <a 
                href={book.links.spotify} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="book-link-btn spotify"
              >
                Spotify
              </a>
            )}
            {book.links?.youtube && (
              <a 
                href={book.links.youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="book-link-btn"
              >
                YouTube
              </a>
            )}
            {book.links?.audible && (
              <a 
                href={book.links.audible} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="book-link-btn"
              >
                Audible
              </a>
            )}
            {book.flipbookPages && book.flipbookPages.length > 0 && (
              <button 
                onClick={() => onOpenPreview(book)}
                className="book-link-btn btn-secondary"
                style={{ gridColumn: 'span 2', padding: '8px' }}
              >
                📖 {lang === 'it' ? 'Sfoglia Anteprima' : 'Browse Preview'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
