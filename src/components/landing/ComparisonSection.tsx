'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const comparisonData = [
  { feature: "Personal Attention", edunest: true, traditional: false },
  { feature: "Doubt Solving", edunest: "Instant & Hesitation-free", traditional: "Limited time, fear of judgment" },
  { feature: "Pace of Learning", edunest: "Customized to student", traditional: "Fixed batch pace" },
  { feature: "Flexible Timings", edunest: true, traditional: false },
  { feature: "Parent Involvement", edunest: "Separate Parent Portal", traditional: "Occasional PTMs" },
  { feature: "Commute Time", edunest: "Zero (Online)", traditional: "High" },
];

export function ComparisonSection() {
  return (
    <section className="py-24 bg-navy-900 text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-navy-800/50 skew-x-12 translate-x-32 z-0" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-gold-400 uppercase mb-3">The EduNest Advantage</h2>
          <h3 className="text-3xl md:text-4xl font-[var(--font-heading)] font-bold text-white mb-4">
            Why 1-to-1 is Better
          </h3>
          <p className="text-lg text-navy-200">
            See how personalized learning compares to traditional batch coaching.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-white/10 border-b border-white/10">
              <div className="p-6 font-semibold text-lg flex items-center">Features</div>
              <div className="p-6 text-center border-l border-white/10 bg-red-900/20">
                <span className="text-navy-300 font-medium block text-sm mb-1">Traditional</span>
                <span className="font-bold text-xl">Coaching</span>
              </div>
              <div className="p-6 text-center border-l border-white/10 bg-gold-500/20">
                <span className="text-gold-300 font-medium block text-sm mb-1">The</span>
                <span className="font-bold text-xl text-gold-400">EduNest Way</span>
              </div>
            </div>

            {/* Table Body */}
            <div>
              {comparisonData.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`grid grid-cols-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${index % 2 === 0 ? 'bg-black/20' : ''}`}
                >
                  <div className="p-5 flex items-center text-navy-100 font-medium">
                    {item.feature}
                  </div>
                  <div className="p-5 flex items-center justify-center text-center border-l border-white/5 text-navy-300/80 text-sm">
                    {typeof item.traditional === 'boolean' ? (
                      item.traditional ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-400/70" />
                    ) : (
                      item.traditional
                    )}
                  </div>
                  <div className="p-5 flex items-center justify-center text-center border-l border-white/5 text-white font-semibold text-sm bg-gold-500/5">
                    {typeof item.edunest === 'boolean' ? (
                      item.edunest ? <Check className="w-6 h-6 text-gold-400 drop-shadow-md" /> : <X className="w-5 h-5 text-red-500" />
                    ) : (
                      <span className="text-gold-200">{item.edunest}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
