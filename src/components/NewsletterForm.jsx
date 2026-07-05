import React, { useState, useEffect } from 'react';

export default function NewsletterForm({ webhookUrl, lang, bonuses = [], selectedBonusId, setSelectedBonusId }) {
  const [email, setEmail] = useState('');
  const [bonusType, setBonusType] = useState('bonus-coloring-book');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  // Sync state if parent changes selected bonus
  useEffect(() => {
    if (selectedBonusId) {
      setBonusType(selectedBonusId);
    } else if (bonuses.length > 0) {
      setBonusType(bonuses[0].id);
    }
  }, [selectedBonusId, bonuses]);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setBonusType(val);
    if (setSelectedBonusId) {
      setSelectedBonusId(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      // Send data to the n8n webhook
      // If no live webhook URL is configured yet, simulate a successful call
      if (!webhookUrl || webhookUrl.includes('your-n8n-webhook-url.com')) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setStatus('success');
        setMessage(
          lang === 'it' 
            ? 'Successo! (Simulazione) Riceverai a breve una mail da Maya Springs con il tuo bonus.' 
            : 'Success! (Simulation) You will receive an email from Maya Springs with your bonus shortly.'
        );
        setEmail('');
        return;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          bonusType,
          language: lang,
          signupDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage(
          lang === 'it' 
            ? 'Registrazione completata! Controlla la tua email per il tuo link bonus.' 
            : 'Registration completed! Check your email for your bonus link.'
        );
        setEmail('');
      } else {
        throw new Error('Server responded with an error');
      }
    } catch (error) {
      console.error('Webhook signup error:', error);
      setStatus('error');
      setMessage(
        lang === 'it' 
          ? 'Si è verificato un errore. Per favore riprova più tardi o contatta il supporto.' 
          : 'An error occurred. Please try again later or contact support.'
      );
    }
  };

  return (
    <form className="funnel-form-card" onSubmit={handleSubmit}>
      <h3 className="form-title">
        {lang === 'it' ? 'Scarica il tuo Regalo Gratuito!' : 'Download Your Free Gift!'}
      </h3>
      
      <div className="form-group">
        <label className="form-label" htmlFor="email-input">
          {lang === 'it' ? 'Il tuo indirizzo email' : 'Your Email Address'}
        </label>
        <input 
          id="email-input"
          type="email" 
          className="form-input"
          placeholder="example@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="bonus-select">
          {lang === 'it' ? 'Scegli il tuo bonus' : 'Choose Your Bonus'}
        </label>
        <select 
          id="bonus-select"
          className="form-select"
          value={bonusType}
          onChange={handleSelectChange}
          disabled={status === 'loading'}
        >
          {bonuses.length > 0 ? (
            bonuses.map(b => {
              const title = b.title[lang] || b.title['en'];
              return (
                <option key={b.id} value={b.id}>
                  🎁 {title}
                </option>
              );
            })
          ) : (
            <>
              <option value="bonus-coloring-book">
                {lang === 'it' ? '🎨 Libro da colorare digitale (PDF)' : '🎨 Digital Coloring Book (PDF)'}
              </option>
              <option value="bonus-mini-stories">
                {lang === 'it' ? '📖 Raccolta di Ministorie illustrate' : '📖 Illustrated Mini-Stories Collection'}
              </option>
            </>
          )}
        </select>
      </div>

      <button 
        type="submit" 
        className="funnel-submit-btn"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <>
            <span className="spinner">⏳</span> {lang === 'it' ? 'Invio in corso...' : 'Sending...'}
          </>
        ) : (
          lang === 'it' ? 'Ottieni il Bonus Gratis!' : 'Get Free Bonus!'
        )}
      </button>

      {status === 'success' && (
        <div className="form-message success">{message}</div>
      )}
      {status === 'error' && (
        <div className="form-message error">{message}</div>
      )}
    </form>
  );
}
