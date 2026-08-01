'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const floatingAnimation = {
  y: ['-10px', '10px'],
  transition: {
    duration: 2,
    repeat: Infinity,
    repeatType: "reverse" as const,
    ease: "easeInOut" as const
  }
};

export function HeroSection() {
  return (
    <section id="home" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full bg-gold-100/50 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 rounded-full bg-navy-100/50 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 border border-navy-100 text-navy-800 text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse"></span>
              Admissions Open for 2026-27
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-[var(--font-heading)] font-bold text-navy-900 leading-[1.1] mb-6">
              Personalized 1-to-1 Online Classes for <span className="text-gold-500 relative">
                Classes VI to X
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-gold-300" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-navy-600 mb-8 leading-relaxed">
              Learn Better. Score Higher. Personal attention, stronger concepts, and measurable improvement from top educators.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button asChild size="lg" className="bg-navy-900 hover:bg-navy-800 text-white rounded-full h-14 px-8 shadow-lg shadow-navy-900/20 text-lg font-semibold">
                <Link href="/contact">
                  Enquiry Form
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-full h-14 px-8 shadow-lg shadow-gold-500/30 text-lg flex items-center gap-2">
                <Link href="/login">
                  Open Dashboard <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "100% One-to-One Classes",
                "Live Interactive Sessions",
                "Regular Tests",
                "Personalized Feedback",
                "Own Learning App"
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-navy-700 font-medium">
                  <CheckCircle className="w-5 h-5 text-gold-500 flex-shrink-0" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Imagery */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:ml-auto"
          >
            <div className="relative w-full max-w-lg mx-auto aspect-square">
              {/* Main Image Container */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden flex items-end justify-center">
                 {/* Image will go here */}
              </div>

              {/* Floating Elements */}
              <motion.div animate={floatingAnimation} className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-navy-50">
                <div className="text-3xl sm:text-4xl">🎓</div>
              </motion.div>
              
              <motion.div animate={floatingAnimation} transition={{...floatingAnimation.transition, delay: 0.5}} className="absolute -bottom-6 -right-2 sm:-bottom-8 sm:-right-4 bg-white p-3 sm:p-4 rounded-2xl shadow-xl border border-navy-50 flex items-center gap-2 sm:gap-3">
                 <div className="bg-green-100 p-2 rounded-full">
                    <span className="text-lg sm:text-xl">📈</span>
                 </div>
                 <div>
                   <p className="text-[10px] sm:text-xs text-navy-500 font-medium">Average Score</p>
                   <p className="text-base sm:text-lg font-bold text-navy-900">95%+</p>
                 </div>
              </motion.div>

              <motion.div animate={floatingAnimation} transition={{...floatingAnimation.transition, delay: 1}} className="absolute top-1/2 -right-2 sm:-right-10 bg-white p-2 sm:p-3 rounded-2xl shadow-xl border border-navy-50">
                <div className="text-2xl sm:text-3xl">📐</div>
              </motion.div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
