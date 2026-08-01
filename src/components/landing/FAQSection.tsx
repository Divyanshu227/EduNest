'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "How are classes conducted?",
    answer: "All classes are conducted live online via our custom learning platform. We use high-quality video, interactive whiteboards, and digital notes to make the experience seamless and engaging."
  },
  {
    question: "How many classes per week?",
    answer: "The number of classes is completely customizable based on the student's needs and the subjects chosen. Typically, students opt for 2 to 3 sessions per subject per week."
  },
  {
    question: "Which boards are covered?",
    answer: "We cover all major boards including CBSE, ICSE, and State Boards for Classes VI to X. Our curriculum is tailored to match your specific school syllabus perfectly."
  },
  {
    question: "Can I change timings?",
    answer: "Yes, flexibility is one of our core advantages. You can easily request a reschedule or change your regular class timings by informing your teacher in advance."
  },
  {
    question: "Do you provide notes?",
    answer: "Absolutely. Along with live teaching, we provide chapter-wise digital notes, practice worksheets, and mock test papers directly through the EduNest app."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          <div className="sticky top-32">
            <h2 className="text-sm font-bold tracking-widest text-gold-600 uppercase mb-3">Got Questions?</h2>
            <h3 className="text-3xl md:text-4xl font-[var(--font-heading)] font-bold text-navy-900 mb-6">
              Frequently Asked Questions
            </h3>
            <p className="text-lg text-navy-600 mb-8 max-w-md">
              Everything you need to know about our 1-to-1 personalized tutoring platform. Can't find the answer you're looking for? Reach out to our support team.
            </p>
            
            <div className="bg-navy-50 rounded-2xl p-6 border border-navy-100 flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">
                  💬
               </div>
               <div>
                 <p className="font-semibold text-navy-900">Still have questions?</p>
                 <a href="#contact" className="text-gold-600 font-medium hover:underline">Contact our support →</a>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${openIndex === index ? 'border-gold-300 bg-gold-50/30' : 'border-navy-100 bg-white hover:border-navy-200'}`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex items-center justify-between w-full p-6 text-left focus:outline-none"
                >
                  <span className="font-semibold text-navy-900 pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-navy-500 transition-transform duration-300 flex-shrink-0 ${openIndex === index ? 'rotate-180 text-gold-600' : ''}`} 
                  />
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-navy-600 text-sm leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}
