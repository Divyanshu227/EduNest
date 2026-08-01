'use client';

import { motion } from 'framer-motion';
import { 
  User, 
  Map, 
  BarChart, 
  BookOpen, 
  Brain, 
  MessageSquare, 
  FileText, 
  Clock 
} from 'lucide-react';

const features = [
  {
    title: "One Student One Teacher",
    description: "100% undivided attention ensuring your child's specific learning needs are met.",
    icon: User,
  },
  {
    title: "Personalized Study Plan",
    description: "Customized curriculum paced perfectly to match your child's learning speed.",
    icon: Map,
  },
  {
    title: "Weekly Progress Reports",
    description: "Detailed analytics and insights shared with parents to track improvement.",
    icon: BarChart,
  },
  {
    title: "Homework Support",
    description: "Guided assistance to complete school assignments with deep conceptual clarity.",
    icon: BookOpen,
  },
  {
    title: "Concept Building",
    description: "Focus on fundamental understanding rather than rote memorization.",
    icon: Brain,
  },
  {
    title: "Doubt Solving",
    description: "Instant clarification of queries without hesitation or fear of judgment.",
    icon: MessageSquare,
  },
  {
    title: "Exam Preparation",
    description: "Targeted practice, mock tests, and strategies to excel in school exams.",
    icon: FileText,
  },
  {
    title: "Flexible Timings",
    description: "Schedule classes at your convenience, fitting perfectly into your routine.",
    icon: Clock,
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
