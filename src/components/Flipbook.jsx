import React, { useState, useEffect } from 'react';

export default function Flipbook({ book, lang }) {
  const [currentPage, setCurrentPage] = useState(0); // Index for desktop spreads (0, 2, 4...)
  const [mobilePage, setMobilePage] = useState(0);    // Index for mobile slider (0, 1, 2...)
  const [isMobile, setIsMobile] = useState(false);

  const pages = book?.flipbookPages || [];

  // Check viewport width
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (pages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
        {lang === 'it' ? 'Anteprima non disponibile' : 'Preview not available'}
      </div>
    );
  }

  // Desktop Page Handling (Spreads of 2 pages)
  // Index 0: Left empty/textured, Right: Page 0 (Cover)
  // Index 2: Left: Page 1, Right: Page 2
  // Index 4: Left: Page 3, Right: Page 4 ...
  const maxDesktopIndex = Math.ceil(pages.length / 2) * 2;

  const nextDesktop = () => {
    if (currentPage < maxDesktopIndex - 2) {
      setCurrentPage(prev => prev + 2);
    }
  };

  const prevDesktop = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 2);
    }
  };

  // Mobile Page Handling (1 page at a time)
  const nextMobile = () => {
    if (mobilePage < pages.length - 1) {
      setMobilePage(prev => prev + 1);
    }
  };

  const prevMobile = () => {
    if (mobilePage > 0) {
      setMobilePage(prev => prev - 1);
    }
  };

  // Get active images for desktop spread
  const leftPageImg = currentPage === 0 ? null : pages[currentPage - 1];
  const rightPageImg = pages[currentPage];

  return (
    <div className="flipbook-container">
      <div className="book-viewport">
        {/* Desktop View (Spread) */}
        {!isMobile && (
          <div className="book-spread">
            {/* Left Page */}
            <div 
              className="book-page-half left"
              style={{ 
                backgroundImage: leftPageImg ? `url(${leftPageImg})` : 'none',
                backgroundColor: leftPageImg ? 'transparent' : '#eee'
              }}
            >
              {!leftPageImg && (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                  📖
                </div>
              )}
            </div>

            {/* Spine */}
            <div className="book-spine"></div>

            {/* Right Page */}
            <div 
              className="book-page-half right"
              style={{ 
                backgroundImage: rightPageImg ? `url(${rightPageImg})` : 'none',
                backgroundColor: rightPageImg ? 'transparent' : '#eee'
              }}
            >
              {!rightPageImg && (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                  📖
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile View (Single Page) */}
        {isMobile && (
          <div className="book-mobile-slider">
            <div 
              className="book-mobile-page"
              style={{ backgroundImage: `url(${pages[mobilePage]})` }}
            ></div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flipbook-controls">
        <button 
          className="flipbook-btn"
          onClick={isMobile ? prevMobile : prevDesktop}
          disabled={isMobile ? mobilePage === 0 : currentPage === 0}
          aria-label="Precedente"
        >
          ←
        </button>

        <span className="flipbook-page-num">
          {isMobile 
            ? `${lang === 'it' ? 'Pagina' : 'Page'} ${mobilePage + 1} / ${pages.length}`
            : `${lang === 'it' ? 'Pagine' : 'Pages'} ${currentPage === 0 ? 'Copertina' : `${currentPage} - ${Math.min(currentPage + 1, pages.length)}`} / ${pages.length}`
          }
        </span>

        <button 
          className="flipbook-btn"
          onClick={isMobile ? nextMobile : nextDesktop}
          disabled={isMobile ? mobilePage === pages.length - 1 : currentPage >= maxDesktopIndex - 2}
          aria-label="Successivo"
        >
          →
        </button>
      </div>
    </div>
  );
}
