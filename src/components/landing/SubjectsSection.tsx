'use client';

import { motion } from 'framer-motion';
import { 
  Calculator, 
  FlaskConical, 
  Atom, 
  Dna, 
  BookType, 
  Globe2, 
  Monitor, 
  Library
} from 'lucide-react';

const subjects = [
  { name: "Mathematics", icon: Calculator, color: "text-blue-500", bg: "bg-blue-50" },
  { name: "Science", icon: FlaskConical, color: "text-emerald-500", bg: "bg-emerald-50" },
  { name: "Physics", icon: Atom, color: "text-indigo-500", bg: "bg-indigo-50" },
  { name: "Chemistry", icon: FlaskConical, color: "text-cyan-500", bg: "bg-cyan-50" },
  { name: "Biology", icon: Dna, color: "text-green-500", bg: "bg-green-50" },
  { name: "English", icon: BookType, color: "text-rose-500", bg: "bg-rose-50" },
  { name: "Social Science", icon: Globe2, color: "text-amber-500", bg: "bg-amber-50" },
  { name: "Computer", icon: Monitor, color: "text-purple-500", bg: "bg-purple-50" },
  { name: "More Subjects", icon: Library, color: "text-gray-500", bg: "bg-gray-50" },
];

export function SubjectsSection() {
  return (
    <section id="courses" className="py-24 bg-navy-50 border-t border-navy-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-gold-600 uppercase mb-3">Comprehensive Coverage</h2>
          <h3 className="text-3xl md:text-4xl font-[var(--font-heading)] font-bold text-navy-900 mb-4">
            Subjects We Cover
          </h3>
          <p className="text-lg text-navy-600">
            Expert guidance across all major subjects to ensure all-round academic excellence.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {subjects.map((subject, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 text-center shadow-sm border border-navy-100 hover:shadow-md hover:border-gold-300 transition-all cursor-pointer group"
            >
              <div className={`w-14 h-14 mx-auto rounded-full ${subject.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <subject.icon className={`w-7 h-7 ${subject.color}`} />
              </div>
              <h4 className="font-semibold text-navy-800 text-sm">{subject.name}</h4>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
