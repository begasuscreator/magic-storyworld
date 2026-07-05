import React, { useState } from 'react';

export default function FaqSection({ faqs, lang }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFaq = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div className="faq-container" itemScope itemType="https://schema.org/FAQPage">
      {faqs.map((faq, index) => {
        const question = faq.question[lang] || faq.question['en'];
        const answer = faq.answer[lang] || faq.answer['en'];
        const isActive = activeIndex === index;

        return (
          <div 
            key={faq.id} 
            className={`faq-item ${isActive ? 'active' : ''}`}
            itemScope 
            itemProp="mainEntity" 
            itemType="https://schema.org/Question"
          >
            <button 
              className="faq-question-btn"
              onClick={() => toggleFaq(index)}
              aria-expanded={isActive}
              aria-controls={`faq-answer-${faq.id}`}
            >
              <h3 className="faq-question" itemProp="name">{question}</h3>
              <span className="faq-icon" aria-hidden="true">▼</span>
            </button>
            
            <div 
              id={`faq-answer-${faq.id}`}
              className="faq-answer"
              style={{ maxHeight: isActive ? '300px' : '0px' }}
              itemScope 
              itemProp="acceptedAnswer" 
              itemType="https://schema.org/Answer"
            >
              <div className="faq-answer-inner" itemProp="text">
                <p>{answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
