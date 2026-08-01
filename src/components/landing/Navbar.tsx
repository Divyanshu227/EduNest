'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { InstallAppButton } from './InstallAppButton';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-navy-100"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="EduNest" className="h-10 sm:h-12 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">Home</Link>
            <Link href="/#courses" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">Courses</Link>
            <Link href="/#why-edunest" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">Why EduNest</Link>
            <Link href="/#faq" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">FAQ</Link>
            <Link href="/#contact" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">Contact</Link>
            <InstallAppButton variant="navbar" />
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Button asChild className="bg-navy-900 hover:bg-navy-800 text-white rounded-full px-6 shadow-md font-semibold">
              <Link href="/contact">
                Enquiry Form
              </Link>
            </Button>
            <Button asChild className="bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-full px-8 shadow-lg shadow-gold-500/20 font-bold">
              <Link href="/login">
                Login
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-navy-900 hover:text-gold-500 focus:outline-none p-2"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-navy-100 overflow-hidden shadow-xl"
          >
            <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2.5 text-base font-medium text-navy-900 hover:text-gold-600 hover:bg-navy-50 rounded-xl transition-colors">Home</Link>
              <Link href="/#courses" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2.5 text-base font-medium text-navy-900 hover:text-gold-600 hover:bg-navy-50 rounded-xl transition-colors">Courses</Link>
              <Link href="/#why-edunest" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2.5 text-base font-medium text-navy-900 hover:text-gold-600 hover:bg-navy-50 rounded-xl transition-colors">Why EduNest</Link>
              <Link href="/#faq" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2.5 text-base font-medium text-navy-900 hover:text-gold-600 hover:bg-navy-50 rounded-xl transition-colors">FAQ</Link>
              <Link href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2.5 text-base font-medium text-navy-900 hover:text-gold-600 hover:bg-navy-50 rounded-xl transition-colors">Contact</Link>
              
              <div className="pt-2 pb-2 px-3">
                <InstallAppButton variant="navbar" />
              </div>

              <div className="grid grid-cols-2 gap-4 px-3 pt-5 border-t border-navy-100 mt-2">
                <Button asChild className="bg-navy-900 hover:bg-navy-800 text-white rounded-full w-full shadow-md font-semibold">
                  <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                    Enquiry
                  </Link>
                </Button>
                <Button asChild className="bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-full w-full shadow-lg font-bold">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
