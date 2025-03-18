// app/page.tsx
import HeroSection from '../components/landing/HeroSection';
import FeatureGrid from '../components/landing/FeatureGrid';
import DashboardPreview from '../components/landing/DashboardPreview';
import ReportsShowcase from '../components/landing/ReportsShowcase';
import CTASection from '../components/landing/CTASection';
import Navbar from '../components/landing/homeNave';

export default function Home() {
  return (
    <div className="bg-gray-50">
    <Navbar />
      <HeroSection />
      <FeatureGrid />
      <DashboardPreview />
      <ReportsShowcase />
      <CTASection />
    </div>
  );
}