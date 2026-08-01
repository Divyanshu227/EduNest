'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    studentClass: '',
    board: '',
    preferredLanguage: '',
    preferredClasses: '',
    subjects: '',
    numberOfClasses: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const combinedMessage = `
Phone: ${formData.phone}
Location: ${formData.location}
Class: ${formData.studentClass}
Board: ${formData.board}
Preferred Language: ${formData.preferredLanguage}
Preferred Classes: ${formData.preferredClasses}
Subjects: ${formData.subjects}
No. of Classes: ${formData.numberOfClasses}

Message:
${formData.message}
    `.trim();

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.studentClass ? `Enquiry for Class ${formData.studentClass}` : 'General Enquiry',
          message: combinedMessage
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setFormData({
          name: '', email: '', phone: '', location: '', studentClass: '',
          board: '', preferredLanguage: '', preferredClasses: '',
          subjects: '', numberOfClasses: '', message: ''
        });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send your message. Please try again later.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-navy-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-navy-900 mb-4 font-[var(--font-heading)]">Get In Touch</h1>
            <p className="text-lg text-navy-600">
              Have questions or want to enroll? Fill out the form below and we'll get back to you shortly.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-navy-100 p-8 sm:p-10 relative overflow-hidden">
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
                <h3 className="text-2xl font-bold text-navy-900 mb-2">Message Sent!</h3>
                <p className="text-navy-600 mb-8">Thank you for reaching out. We will get back to you as soon as possible.</p>
                <Button onClick={() => setStatus('idle')} variant="outline" className="rounded-full">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-navy-900 mb-2">Full Name *</label>
                    <input
                      type="text" id="name" name="name" required value={formData.name} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-navy-900 mb-2">Email Address *</label>
                    <input
                      type="email" id="email" name="email" required value={formData.email} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-navy-900 mb-2">Phone Number *</label>
                    <input
                      type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-semibold text-navy-900 mb-2">Location / City</label>
                    <input
                      type="text" id="location" name="location" value={formData.location} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="New Delhi"
                    />
                  </div>
                  <div>
                    <label htmlFor="studentClass" className="block text-sm font-semibold text-navy-900 mb-2">Class *</label>
                    <input
                      type="text" id="studentClass" name="studentClass" required value={formData.studentClass} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="e.g. Class 10"
                    />
                  </div>
                  <div>
                    <label htmlFor="board" className="block text-sm font-semibold text-navy-900 mb-2">Board *</label>
                    <input
                      type="text" id="board" name="board" required value={formData.board} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="e.g. CBSE, ICSE"
                    />
                  </div>
                  <div>
                    <label htmlFor="subjects" className="block text-sm font-semibold text-navy-900 mb-2">Subjects Required *</label>
                    <input
                      type="text" id="subjects" name="subjects" required value={formData.subjects} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="Maths, Science"
                    />
                  </div>
                  <div>
                    <label htmlFor="preferredLanguage" className="block text-sm font-semibold text-navy-900 mb-2">Preferred Language</label>
                    <input
                      type="text" id="preferredLanguage" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="English, Hindi"
                    />
                  </div>
                  <div>
                    <label htmlFor="preferredClasses" className="block text-sm font-semibold text-navy-900 mb-2">Preferred Mode</label>
                    <input
                      type="text" id="preferredClasses" name="preferredClasses" value={formData.preferredClasses} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="e.g. 1-to-1 Online"
                    />
                  </div>
                  <div>
                    <label htmlFor="numberOfClasses" className="block text-sm font-semibold text-navy-900 mb-2">No. of Classes per Week</label>
                    <input
                      type="text" id="numberOfClasses" name="numberOfClasses" value={formData.numberOfClasses} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all text-navy-900 placeholder:text-navy-400"
                      placeholder="e.g. 3 days a week"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-navy-900 mb-2">Additional Message</label>
                  <textarea
                    id="message" name="message" rows={4} value={formData.message} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-navy-200 bg-navy-50/50 focus:bg-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 outline-none transition-all resize-none text-navy-900 placeholder:text-navy-400"
                    placeholder="Any specific requirements or questions?"
                  ></textarea>
                </div>

                <div className="pt-2">
                  <Button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-full h-14 text-lg shadow-lg shadow-navy-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Submit Enquiry'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Strata Watermark */}
            <div className="mt-8 pt-6 border-t border-navy-100 flex justify-center items-center">
              <span className="text-xs text-navy-400 flex items-center gap-1.5 font-medium">
                Powered by <span className="text-navy-900 font-bold tracking-tight">STRATA</span>
              </span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
