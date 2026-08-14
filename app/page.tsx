import { PublicHeader } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { HeroSection } from '@/components/landing/hero-section';
import { TrustContext } from '@/components/landing/trust-context';
import { ServicesSection } from '@/components/landing/services-section';
import { TherapyProcessSection } from '@/components/landing/therapy-process-section';
import { AboutSection } from '@/components/landing/about-section';
import { PatientPortalSection } from '@/components/landing/patient-portal-section';
import { TestimonialSection } from '@/components/landing/testimonial-section';
import { FaqSection } from '@/components/landing/faq-section';
import { ContactSection } from '@/components/landing/contact-section';
import { FinalCtaSection } from '@/components/landing/final-cta-section';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <HeroSection />
        <TrustContext />
        <ServicesSection />
        <TherapyProcessSection />
        <AboutSection />
        <PatientPortalSection />
        <TestimonialSection />
        <FaqSection />
        <ContactSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
