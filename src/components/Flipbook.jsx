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

  // Desktop Page Handling (Spreads of 2 pages side-by-side)
  // Index 0: Left: Page 0, Right: Page 1
  // Index 2: Left: Page 2, Right: Page 3 ...
  const nextDesktop = () => {
    if (currentPage < pages.length - 2) {
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
  const leftPageImg = pages[currentPage];
  const rightPageImg = currentPage + 1 < pages.length ? pages[currentPage + 1] : null;

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
            : `${lang === 'it' ? 'Pagine' : 'Pages'} ${currentPage + 1} - ${Math.min(currentPage + 2, pages.length)} / ${pages.length}`
          }
        </span>

        <button 
          className="flipbook-btn"
          onClick={isMobile ? nextMobile : nextDesktop}
          disabled={isMobile ? mobilePage === pages.length - 1 : currentPage >= pages.length - 2}
          aria-label="Successivo"
        >
          →
        </button>
      </div>
    </div>
  );
}
