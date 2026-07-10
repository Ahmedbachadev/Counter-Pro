import React, { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'Can Counter Pro work without internet?',
    answer: 'Yes. Counter Pro is designed with offline-first capabilities so your business can continue operating even during internet interruptions. Data synchronizes automatically when connectivity returns.'
  },
  {
    question: 'Can I manage multiple stores?',
    answer: 'Yes. Counter Pro supports multiple workspaces, allowing you to manage different stores, branches, or businesses from one platform.'
  },
  {
    question: 'Can different employees have different permissions?',
    answer: 'Absolutely. Role-based access allows you to control what each employee can view or manage.'
  },
  {
    question: 'Does Counter Pro provide analytics?',
    answer: 'Yes. Monitor sales, inventory, customer activity, employee performance, and business trends through powerful analytics dashboards.'
  },
  {
    question: 'Is my business data secure?',
    answer: 'Yes. Counter Pro is built with secure authentication, encrypted communication, and modern security practices to help protect your business information.'
  },
  {
    question: 'Which businesses can use Counter Pro?',
    answer: 'Counter Pro is suitable for retail stores, restaurants, cafés, pharmacies, clothing stores, electronics shops, supermarkets, warehouses, wholesalers, salons, and many other business types.'
  }
];

const LandingFAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="lp-section-lg relative z-10 overflow-hidden bg-white" aria-label="Frequently Asked Questions">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="lp-container-wide max-w-4xl">
        
        {/* Section Header */}
        <div className="text-center mb-16 lp-animate-fade-up">
          <h2 className="lp-heading-lg mb-6">Frequently Asked Questions</h2>
          <p className="lp-body-lg text-slate-500 max-w-2xl mx-auto">
            Find answers to the questions businesses commonly ask before using Counter Pro.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4 relative z-10">
          {faqs.map((faq, index) => {
            const isActive = activeIndex === index;
            
            return (
              <div 
                key={index} 
                className={`lp-glass rounded-2xl border transition-all duration-300 lp-animate-fade-up ${
                  isActive 
                    ? 'border-blue-500/30 shadow-lg shadow-blue-500/5 bg-slate-50/80' 
                    : 'border-slate-200/60 hover:border-slate-300'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  className="w-full text-left px-6 py-6 md:px-8 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
                  onClick={() => toggleAccordion(index)}
                  aria-expanded={isActive}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className={`text-lg md:text-xl font-bold pr-6 transition-colors duration-300 ${isActive ? 'text-blue-700' : 'text-slate-800'}`}>
                    {faq.question}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    {isActive ? <Minus size={20} /> : <Plus size={20} />}
                  </div>
                </button>
                
                <div 
                  id={`faq-answer-${index}`}
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${isActive ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                  aria-hidden={!isActive}
                >
                  <div className="px-6 pb-6 md:px-8 md:pb-8 pt-0">
                    <div className="w-full h-px bg-slate-100 mb-6"></div>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default LandingFAQ;
