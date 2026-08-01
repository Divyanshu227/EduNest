'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  Compass, 
  Clock, 
  BookOpen 
} from 'lucide-react';

const features = [
  {
    title: "Separate Portal for Parents",
    description: "Dedicated access for parents to track progress, view reports, and stay involved.",
    icon: Users,
  },
  {
    title: "Guidance Sessions on Demand",
    description: "Personalized mentoring and counseling sessions for academic and personal growth.",
    icon: Compass,
  },
  {
    title: "Flexible Schedule",
    description: "Schedule and manage classes at your convenience to balance school and tuition.",
    icon: Clock,
  },
  {
    title: "Homework & Notes",
    description: "Organized digital notes and centralized tracking for all school assignments.",
    icon: BookOpen,
  }
];

export function FeaturesSection() {
  return (
    <section id="why-edunest" className="py-24 bg-navy-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-gold-600 uppercase mb-3">Why Choose Us</h2>
          <h3 className="text-3xl md:text-4xl font-[var(--font-heading)] font-bold text-navy-900 mb-4">
            Why Parents Choose EduNest
          </h3>
          <p className="text-lg text-navy-600">
            We provide a premium, focused learning environment designed to bring out the best in every student.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-navy-100 hover:shadow-xl hover:border-gold-300 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center mb-6 group-hover:bg-gold-50 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-navy-900 group-hover:text-gold-600" />
              </div>
              <h4 className="text-xl font-bold text-navy-900 mb-3">{feature.title}</h4>
              <p className="text-navy-600 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
