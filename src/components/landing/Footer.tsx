"use client";

import Link from 'next/link';
import { InstallAppButton } from './InstallAppButton';
import { Mail, FileText, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
export function Footer() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <footer className="bg-navy-900 pt-20 pb-10 border-t border-navy-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <img src="/logo.png" alt="EduNest" className="h-12 w-auto object-contain" />
            </Link>
            <p className="text-navy-300 text-sm leading-relaxed mb-8 pr-4">
              Premium 1-to-1 online tutoring platform dedicated to providing personalized attention and fostering academic excellence for students of Classes VI to X.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> Home</Link></li>
              <li><Link href="/#courses" className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> Subjects</Link></li>
              <li><Link href="/#why-edunest" className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> Why Choose Us</Link></li>
              <li><Link href="/#faq" className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> FAQ</Link></li>
              <li><InstallAppButton variant="footer" /></li>
            </ul>
          </div>


          {/* Contact Form */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg" id="contact">Contact Us</h4>
            {isSuccess ? (
              <div className="bg-navy-800/50 rounded-xl p-6 border border-gold-500/20 flex flex-col items-center justify-center text-center h-[300px]">
                <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-gold-400" />
                </div>
                <h5 className="text-white font-medium mb-2">Message Sent!</h5>
                <p className="text-navy-300 text-sm">We'll get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Name"
                    className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Subject"
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                <textarea
                  required
                  placeholder="Your Message..."
                  rows={3}
                  className="w-full bg-navy-800 border border-navy-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-navy-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
          
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-navy-900 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-navy-400 text-sm">
            © {new Date().getFullYear()} EduNest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
