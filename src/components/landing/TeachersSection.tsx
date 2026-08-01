'use client';

import { motion } from 'framer-motion';
import { Award, BookOpen, Star, GraduationCap } from 'lucide-react';

const teachers = [
  {
    name: "Divyanshu Kumar Jha",
    role: "Mathematics Expert",
    qualification: "BTech CSE IIIT Bhopal",
    highlights: [
      "99% in CBSE Class 10",
      "Mathematics 100/100",
      "Strong conceptual teaching"
    ],
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    imagePlaceholder: "bg-blue-200"
  },
  {
    name: "Anand Kumar Jha",
    role: "All Subjects Expert",
    qualification: "MBBS",
    highlights: [
      "97.2% in ICSE Class 10",
      "Strong conceptual understanding",
      "Mentors students across all subjects"
    ],
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
    imagePlaceholder: "bg-emerald-200"
  }
];

export function TeachersSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-gold-600 uppercase mb-3">Our Educators</h2>
          <h3 className="text-3xl md:text-4xl font-[var(--font-heading)] font-bold text-navy-900 mb-4">
            Meet Your Teachers
          </h3>
          <p className="text-lg text-navy-600">
            Learn from high-achievers who understand what it takes to score top marks and build strong fundamentals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {teachers.map((teacher, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white rounded-3xl border border-navy-100 shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300"
            >
              <div className={`h-32 ${teacher.bgColor} relative`}>
                 <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 text-navy-900 shadow-sm">
                    <Star className="w-3 h-3 text-gold-500 fill-gold-500" /> Top Rated
                 </div>
              </div>
              
              <div className="px-8 pb-8 relative">
                {/* Profile Image Avatar */}
                <div className={`w-24 h-24 rounded-2xl ${teacher.imagePlaceholder} border-4 border-white shadow-md absolute -top-12 flex items-center justify-center text-navy-600 font-bold text-xl`}>
                  {teacher.name.charAt(0)}
                </div>

                <div className="pt-16">
                  <h4 className="text-2xl font-bold text-navy-900 mb-1">{teacher.name}</h4>
                  <p className="text-gold-600 font-medium mb-4">{teacher.role}</p>
                  
                  <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-navy-700 bg-navy-50 w-fit px-3 py-1.5 rounded-lg">
                    <GraduationCap className={`w-4 h-4 ${teacher.iconColor}`} />
                    {teacher.qualification}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-2">Highlights</p>
                    {teacher.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Award className={`w-5 h-5 ${teacher.iconColor} flex-shrink-0`} />
                        <span className="text-navy-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
