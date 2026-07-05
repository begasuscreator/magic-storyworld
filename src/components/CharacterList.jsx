import React, { useState } from 'react';

export default function CharacterList({ books, characters, lang }) {
  // Find books that have characters
  const booksWithCharacters = books.filter(b => 
    characters.some(c => c.bookId === b.id)
  );

  // Set default book filter to the first book that has characters
  const [selectedBookId, setSelectedBookId] = useState(
    booksWithCharacters.length > 0 ? booksWithCharacters[0].id : 'all'
  );

  const filteredCharacters = selectedBookId === 'all' 
    ? characters 
    : characters.filter(c => c.bookId === selectedBookId);

  if (characters.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
        {lang === 'it' ? 'Nessun personaggio inserito.' : 'No characters added yet.'}
      </div>
    );
  }

  return (
    <div className="character-list-container">
      {/* Book Filters */}
      {booksWithCharacters.length > 1 && (
        <div className="char-book-filter">
          <button 
            className={`filter-btn ${selectedBookId === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedBookId('all')}
          >
            {lang === 'it' ? 'Tutti i Personaggi' : 'All Characters'}
          </button>
          
          {booksWithCharacters.map(book => {
            const title = book.title[lang] || book.title['en'];
            return (
              <button 
                key={book.id}
                className={`filter-btn ${selectedBookId === book.id ? 'active' : ''}`}
                onClick={() => setSelectedBookId(book.id)}
              >
                {title}
              </button>
            );
          })}
        </div>
      )}

      {/* Characters Grid */}
      <div className="characters-grid">
        {filteredCharacters.map(char => {
          const bio = char.bio[lang] || char.bio['en'];
          // Find associated book title
          const associatedBook = books.find(b => b.id === char.bookId);
          const bookTitle = associatedBook ? (associatedBook.title[lang] || associatedBook.title['en']) : '';

          return (
            <div key={char.id} className="char-card">
              <div className="char-img-wrapper">
                <img 
                  src={char.image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80'} 
                  alt={char.name} 
                  className="char-img"
                  loading="lazy"
                />
              </div>
              <div className="char-content">
                <h3 className="char-name">{char.name}</h3>
                {selectedBookId === 'all' && bookTitle && (
                  <span className="hero-badge" style={{ fontSize: '0.75rem', padding: '3px 8px', alignSelf: 'flex-start', margin: '4px 0' }}>
                    {bookTitle}
                  </span>
                )}
                <p className="char-bio">{bio}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
