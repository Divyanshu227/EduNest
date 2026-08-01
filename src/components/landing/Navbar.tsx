'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function Navbar() {
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
            <Link href="#home" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">Home</Link>
            <Link href="#courses" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">Courses</Link>
            <Link href="#why-edunest" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">Why EduNest</Link>
            <Link href="#faq" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">FAQ</Link>
            <Link href="#contact" className="text-navy-700 hover:text-gold-500 transition-colors font-medium">Contact</Link>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Button asChild className="bg-navy-900 hover:bg-navy-800 text-white rounded-full px-6 shadow-md font-semibold">
              <a href={process.env.NEXT_PUBLIC_INQUIRY_FORM_URL || "#"} target="_blank" rel="noopener noreferrer">
                Enquiry Form
              </a>
            </Button>
            <Button asChild className="bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-full px-8 shadow-lg shadow-gold-500/20 font-bold">
              <Link href="/login">
                Login
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button - simplified for now */}
          <div className="md:hidden flex items-center">
            <button className="text-navy-900 hover:text-gold-500 focus:outline-none p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
