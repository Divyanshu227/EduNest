import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-navy-950 pt-20 pb-10 border-t border-navy-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <img src="/logo.png" alt="EduNest" className="h-12 w-auto object-contain" />
            </Link>
            <p className="text-navy-300 text-sm leading-relaxed mb-8 pr-4">
              Premium 1-to-1 online tutoring platform dedicated to providing personalized attention and fostering academic excellence for students of Classes VI to X.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-navy-400 hover:bg-gold-500 hover:text-navy-900 transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-navy-400 hover:bg-gold-500 hover:text-navy-900 transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-navy-400 hover:bg-gold-500 hover:text-navy-900 transition-all">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center text-navy-400 hover:bg-gold-500 hover:text-navy-900 transition-all">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link href="#home" className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> Home</Link></li>
              <li><Link href="#courses" className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> Subjects</Link></li>
              <li><Link href="#why-edunest" className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> Why Choose Us</Link></li>
              <li><Link href="#faq" className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gold-600"></span> FAQ</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg">Support</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="text-navy-300 hover:text-gold-400 transition-colors text-sm">Student Login</Link></li>
              <li><Link href="#" className="text-navy-300 hover:text-gold-400 transition-colors text-sm">Parent Portal</Link></li>
              <li><Link href="#" className="text-navy-300 hover:text-gold-400 transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="text-navy-300 hover:text-gold-400 transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="#" className="text-navy-300 hover:text-gold-400 transition-colors text-sm">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold mb-6 text-lg" id="contact">Contact Us</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">hello@edunest.com</p>
                  <p className="text-navy-400 text-xs mt-1">Online support 24/7</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">New Delhi, India</p>
                  <p className="text-navy-400 text-xs mt-1">100% Online Classes Globally</p>
                </div>
              </li>
            </ul>
          </div>
          
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-navy-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-navy-400 text-sm">
            © {new Date().getFullYear()} EduNest. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="text-navy-400 hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="text-navy-400 hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="text-navy-400 hover:text-white transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
