'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function FinalCTASection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] bg-navy-900 overflow-hidden shadow-2xl">
          {/* Decorative Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
          </div>

          <div className="relative z-10 py-16 px-6 md:py-20 md:px-16 text-center max-w-4xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-[var(--font-heading)] font-bold text-white mb-6 leading-tight"
            >
              Give Your Child the <span className="text-gold-400 italic">Personal Attention</span> They Deserve.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-navy-200 mb-10 max-w-2xl mx-auto"
            >
              Join the growing community of parents who have seen remarkable improvements in their children's academic performance with EduNest.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button asChild size="lg" className="w-full sm:w-auto bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-full h-14 px-8 text-lg shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all hover:scale-105">
                <a href={process.env.NEXT_PUBLIC_INQUIRY_FORM_URL || "#"} target="_blank" rel="noopener noreferrer">
                  Enquiry Form
                </a>
              
              <Button asChild size="lg" className="w-full sm:w-auto bg-white hover:bg-gray-100 text-navy-900 font-bold rounded-full h-14 px-8 text-lg shadow-lg flex items-center gap-2 transition-all">
                <Link href="/login">
                  Open Dashboard <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
