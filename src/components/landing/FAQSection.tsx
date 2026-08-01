'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "Which classes do you teach?",
    answer: <>We provide personalized <strong>1-to-1 online tuition exclusively for students of Classes VI to X</strong>.</>
  },
  {
    question: "Which subjects do you offer?",
    answer: <>We offer <strong>Mathematics, Science, Physics, Chemistry, Biology, English, Social Science, Computer Science</strong>, depending on the student's class and curriculum.</>
  },
  {
    question: "Are the classes one-to-one or in batches?",
    answer: <>All our classes are <strong>strictly one-to-one</strong>, ensuring every student receives individual attention and a focused learning experience.</>
  },
  {
    question: "Do you provide homework and study notes?",
    answer: <>Yes. We provide <strong>homework, well-structured study notes, and regular practice questions</strong> to help students strengthen their understanding of each topic.</>
  },
  {
    question: "How are the classes conducted?",
    answer: <>Classes are conducted <strong>online through live interactive sessions</strong>, allowing students to learn comfortably from home.</>
  },
  {
    question: "Can I choose a convenient class timing?",
    answer: <>Yes. We offer <strong>flexible class timings</strong>, subject to teacher availability, so students can learn at a time that suits them best.</>
  },
  {
    question: "How can I contact EduNest or enroll?",
    answer: <>You can reach us by filling out the <strong>Enquiry Form</strong> on our website or by sending us an <strong>email</strong>. Our team will get back to you as soon as possible.</>
  },
  {
    question: "Which boards do you cover?",
    answer: <>We currently teach students following the <strong>CBSE and ICSE</strong> curriculum.</>
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
