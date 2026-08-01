'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    content: "My son used to struggle with Mathematics, but after joining EduNest, his concepts are crystal clear. His grades improved from B to A+ in just 3 months. The personalized attention makes a huge difference.",
    author: "Priya Sharma",
    role: "Mother of Class 9 Student",
    rating: 5,
    initial: "P"
  },
  {
    content: "The teachers are exceptionally qualified. Anand Sir's way of explaining Science concepts is brilliant. My daughter actually looks forward to her classes now instead of dreading them.",
    author: "Rajesh Verma",
    role: "Father of Class 10 Student",
    rating: 5,
    initial: "R"
  },
  {
    content: "We tried group tuitions before, but she would never ask her doubts. In EduNest's 1-to-1 setup, she is much more confident. The weekly progress reports keep us perfectly informed.",
    author: "Anita Desai",
    role: "Mother of Class 8 Student",
    rating: 5,
    initial: "A"
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 bg-navy-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-gold-600 uppercase mb-3">Parent Success Stories</h2>
          <h3 className="text-3xl md:text-4xl font-[var(--font-heading)] font-bold text-navy-900 mb-4">
            Trusted by Parents
          </h3>
          <p className="text-lg text-navy-600">
            Don't just take our word for it. Hear what parents have to say about the EduNest experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-navy-100 relative group hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-16 h-16 text-navy-900" />
              </div>
              
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-gold-500 text-gold-500" />
                ))}
              </div>
              
              <p className="text-navy-700 leading-relaxed mb-8 relative z-10 text-sm">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-900 font-bold text-lg">
                  {testimonial.initial}
                </div>
                <div>
                  <h4 className="font-bold text-navy-900">{testimonial.author}</h4>
                  <p className="text-xs text-navy-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
