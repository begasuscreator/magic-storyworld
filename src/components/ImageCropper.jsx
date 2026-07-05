import React, { useState, useRef, useEffect } from 'react';

export default function ImageCropper({ imageSrc, onCrop, onCancel, lang, shape = 'circle' }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const viewportRef = useRef(null);
  const imgRef = useRef(null);

  const isCircle = shape !== 'rect';
  const VIEWPORT_W = 300;
  const VIEWPORT_H = isCircle ? 300 : 375; // aspect ratio 4:5 for rectangular book pages
  const CANVAS_W = 400;
  const CANVAS_H = isCircle ? 400 : 500;

  // Image base dimensions when fitted to viewport
  const [baseDims, setBaseDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const ratio = img.width / img.height;
      const vRatio = VIEWPORT_W / VIEWPORT_H;
      let w, h;
      if (ratio > vRatio) {
        // Image is wider than viewport ratio: fit height
        h = VIEWPORT_H;
        w = VIEWPORT_H * ratio;
      } else {
        // Image is narrower/equal: fit width
        w = VIEWPORT_W;
        h = VIEWPORT_W / ratio;
      }
      setBaseDims({ w, h });
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
  }, [imageSrc, VIEWPORT_W, VIEWPORT_H]);

  // Dragging event handlers (mouse)
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Dragging event handlers (touch)
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Crop drawing onto canvas and export base64
  const handleSaveCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');

    // Fill with white background (standard for JPEGs)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Math: Scale context up by the canvas-to-viewport ratio
    const ratio = CANVAS_W / VIEWPORT_W;
    ctx.scale(ratio, ratio);

    // 1. Move origin to viewport center
    ctx.translate(VIEWPORT_W / 2, VIEWPORT_H / 2);
    // 2. Apply drag translation
    ctx.translate(offset.x, offset.y);
    // 3. Apply zoom scale
    ctx.scale(scale, scale);
    // 4. Draw image centered
    ctx.drawImage(img, -baseDims.w / 2, -baseDims.h / 2, baseDims.w, baseDims.h);

    // Export as JPG base64
    const base64Data = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(base64Data);
  };

  return (
    <div className="admin-overlay" style={{ zIndex: 2000 }}>
      <div className="admin-modal" style={{ maxWidth: '450px', height: 'auto', padding: '24px', alignItems: 'center', gap: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-primary)', textAlign: 'center' }}>
          {shape === 'rect' 
            ? (lang === 'it' ? 'Ritaglia Pagina Libro' : 'Crop Book Page')
            : (lang === 'it' ? 'Ritaglia Viso Personaggio' : 'Crop Character Face')}
        </h3>
        <p style={{ fontSize: '0.85rem', opacity: 0.7, textAlign: 'center', margin: '-10px 0 10px 0' }}>
          {shape === 'rect'
            ? (lang === 'it' 
                ? 'Trascina per centrare la pagina del libro nel riquadro rettangolare.' 
                : 'Drag to center the book page inside the rectangular frame.')
            : (lang === 'it' 
                ? 'Trascina l\'immagine per spostarla e usa la barra sotto per ingrandire il viso nel cerchio.' 
                : 'Drag the image to move and use the slider below to zoom in on the face inside the circle.')}
        </p>

        {/* Viewport Frame Container */}
        <div 
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: `${VIEWPORT_W}px`,
            height: `${VIEWPORT_H}px`,
            borderRadius: isCircle ? '50%' : '8px',
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#eee',
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: '0 0 0 10px rgba(255, 255, 255, 0.9), var(--shadow-lg)',
            border: '2px solid var(--color-primary)'
          }}
        >
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop Source"
              draggable="false"
              style={{
                width: `${baseDims.w}px`,
                height: `${baseDims.h}px`,
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: `-${baseDims.h / 2}px`,
                marginLeft: `-${baseDims.w / 2}px`,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                pointerEvents: 'none' // Prevents browser image dragging ghost
              }}
            />
          )}

          {/* Guidelines overlay inside viewport */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '1px dashed rgba(255, 255, 255, 0.4)',
            borderRadius: isCircle ? '50%' : '8px',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Zoom Slider */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>🔍 {lang === 'it' ? 'Zoom' : 'Zoom'}</span>
            <span>{Math.round(scale * 100)}%</span>
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '10px' }}>
          <button 
            type="button" 
            className="admin-btn admin-btn-add" 
            onClick={handleSaveCrop}
            style={{ flex: 1, padding: '12px' }}
          >
            💾 {lang === 'it' ? 'Applica e Salva' : 'Apply & Save'}
          </button>
          <button 
            type="button" 
            className="admin-btn btn-secondary" 
            onClick={onCancel}
            style={{ flex: 1, padding: '12px' }}
          >
            {lang === 'it' ? 'Annulla' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
