import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TeachersSection } from '@/components/landing/TeachersSection';
import { SubjectsSection } from '@/components/landing/SubjectsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { FinalCTASection } from '@/components/landing/FinalCTASection';
import { Footer } from '@/components/landing/Footer';

export default async function HomePage() {
  const session = await auth();
  
  if (session?.user) {
    redirect(session.user.home || '/profile');
  }

  return (
    <div className="min-h-screen bg-white text-navy-900 selection:bg-gold-500/30 selection:text-navy-900">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TeachersSection />
        <SubjectsSection />
        <HowItWorksSection />
        <ComparisonSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
