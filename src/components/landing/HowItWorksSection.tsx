'use client';

import { motion } from 'framer-motion';
import { CalendarCheck, Video, FileEdit, TrendingUp, Trophy } from 'lucide-react';

const steps = [
  {
    title: "Request Demo Class",
    description: "Schedule a paid trial class at your preferred time.",
    icon: CalendarCheck,
  },
  {
    title: "Meet Teacher",
    description: "Interact 1-on-1 and discuss learning goals.",
    icon: Video,
  },
  {
    title: "Personalized Plan",
    description: "Get a custom roadmap designed for your child.",
    icon: FileEdit,
  },
  {
    title: "Weekly Improvement",
    description: "Track progress with regular tests and feedback.",
    icon: TrendingUp,
  },
  {
    title: "Better Results",
    description: "Achieve higher scores and conceptual mastery.",
    icon: Trophy,
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-sm font-bold tracking-widest text-gold-600 uppercase mb-3">Simple Process</h2>
          <h3 className="text-3xl md:text-4xl font-[var(--font-heading)] font-bold text-navy-900 mb-4">
            How It Works
          </h3>
          <p className="text-lg text-navy-600">
            A seamless journey from your first inquiry to seeing tangible academic results.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-navy-100 z-0">
             <motion.div 
               className="h-full bg-gold-400"
               initial={{ width: 0 }}
               whileInView={{ width: "100%" }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 1.5, ease: "easeInOut" }}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-full bg-white border-4 border-navy-50 shadow-lg flex items-center justify-center mb-6 relative z-10 group-hover:border-gold-200 transition-colors duration-300">
                   <div className="absolute inset-0 bg-navy-900 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 -z-10" />
                   <step.icon className="w-10 h-10 text-navy-900 group-hover:text-white transition-colors duration-300" />
                   
                   {/* Step Number Badge */}
                   <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold-500 text-white font-bold flex items-center justify-center border-2 border-white shadow-sm">
                     {index + 1}
                   </div>
                </div>
                
                <h4 className="text-lg font-bold text-navy-900 mb-2">{step.title}</h4>
                <p className="text-navy-600 text-sm max-w-[200px]">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
