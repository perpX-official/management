import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { TrendingUp, Zap, Shield, BarChart3, Coins, Network } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState, useRef } from "react";

export default function Home() {

  const { t } = useLanguage();
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Apple-style scroll animations
      const elements = document.querySelectorAll('.apple-fade-in');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top < windowHeight * 0.75) {
          el.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate parallax values
  const heroParallax = scrollY * 0.5;
  const imageParallax = scrollY * -0.3;
  const heroOpacity = Math.max(1 - scrollY / 500, 0);
  const heroScale = Math.max(1 - scrollY / 2000, 0.95);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient Motion Background */}
      <div className="fixed inset-0 gradient-motion-fast opacity-20 pointer-events-none"></div>
      
      <Header />

      {/* Hero Section with Apple-style Parallax */}
      <section 
        ref={heroRef}
        className="relative overflow-hidden min-h-screen flex items-center"
        style={{
          transform: `translateY(${heroParallax}px)`,
          opacity: heroOpacity,
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-12 sm:py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div 
              className="space-y-6 sm:space-y-8 relative z-10 apple-fade-in"
              style={{
                transform: `scale(${heroScale})`,
              }}
            >
              <div className="space-y-4 sm:space-y-6">
                <p className="text-xs sm:text-sm font-medium text-white/60 tracking-wider uppercase">
                  {t('home.nextGen')}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                  {t('home.heroTitle')}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-white/70 max-w-xl">
                  {t('home.heroSubtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/trade">
                  <Button className="neuro-button micro-bounce micro-glow text-white font-medium px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full sm:w-auto">
                    {t('home.startTrading')} →
                  </Button>
                </Link>
                <Button variant="outline" className="glass-card border-white/20 text-white hover:bg-white/10 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full sm:w-auto micro-bounce">
                  {t('home.learnMore')}
                </Button>
              </div>

              {/* Stats with Glassmorphism */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-8">
                <div className="glass-card p-3 sm:p-4 rounded-xl apple-fade-in" style={{transitionDelay: '0.1s'}}>
                  <div className="text-xs sm:text-sm text-white/60 mb-1">{t('home.24hVolume')}</div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">$3.37B</div>
                </div>
                <div className="glass-card p-3 sm:p-4 rounded-xl apple-fade-in" style={{transitionDelay: '0.2s'}}>
                  <div className="text-xs sm:text-sm text-white/60 mb-1">{t('home.cumulativeVolume')}</div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">$139.20B</div>
                </div>
                <div className="glass-card p-3 sm:p-4 rounded-xl apple-fade-in" style={{transitionDelay: '0.3s'}}>
                  <div className="text-xs sm:text-sm text-white/60 mb-1">{t('home.addresses')}</div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">147,278</div>
                </div>
              </div>
            </div>

            {/* Background Image - Behind Text, Right-Aligned */}
            <div 
              className="absolute right-0 top-0 bottom-0 flex items-center justify-end pointer-events-none z-0 lg:w-1/2"
              style={{ 
                transform: `translateY(${imageParallax}px)`,
              }}
            >
              <img 
                src="/hero-bg.jpg" 
                alt="Background" 
                className="h-full w-auto max-w-none opacity-30 lg:opacity-40"
                style={{
                  filter: 'blur(0px)',
                  objectFit: 'contain',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* High-Performance Section with Apple-style Animation */}
      <section 
        ref={featuresRef}
        className="py-12 sm:py-16 lg:py-24 bg-card/30 relative"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-12 sm:mb-16 apple-fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              {t('home.highPerformance')}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-white/70 max-w-2xl mx-auto">
              {t('home.highPerformanceDesc')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Feature Cards with Apple-style stagger */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 hover-reveal apple-fade-in" style={{transitionDelay: '0.1s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 micro-bounce">
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 hover-reveal-text">{t('home.ultraDeepLiquidity')}</h3>
              <p className="text-xs sm:text-sm text-white/60">{t('home.ultraDeepLiquidityDesc')}</p>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 hover-reveal apple-fade-in" style={{transitionDelay: '0.2s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 micro-bounce">
                <Zap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 hover-reveal-text">{t('home.highPerformanceTitle')}</h3>
              <p className="text-xs sm:text-sm text-white/60">{t('home.highPerformanceDesc2')}</p>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 hover-reveal apple-fade-in" style={{transitionDelay: '0.3s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 micro-bounce">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 hover-reveal-text">{t('home.provenSecurity')}</h3>
              <p className="text-xs sm:text-sm text-white/60">{t('home.provenSecurityDesc')}</p>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 hover-reveal apple-fade-in" style={{transitionDelay: '0.4s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 micro-bounce">
                <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 hover-reveal-text">{t('home.leverage')}</h3>
              <p className="text-xs sm:text-sm text-white/60">{t('home.leverageDesc')}</p>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 hover-reveal apple-fade-in" style={{transitionDelay: '0.5s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 micro-bounce">
                <Coins className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 hover-reveal-text">{t('home.earnYield')}</h3>
              <p className="text-xs sm:text-sm text-white/60">{t('home.earnYieldDesc')}</p>
            </div>

            <div className="glass-card rounded-2xl p-6 sm:p-8 hover-reveal apple-fade-in" style={{transitionDelay: '0.6s'}}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center mb-4 sm:mb-6 micro-bounce">
                <Network className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 hover-reveal-text">{t('home.multiChain')}</h3>
              <p className="text-xs sm:text-sm text-white/60">{t('home.multiChainDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section with Vertical Scroll Animation */}
      <section className="py-12 sm:py-16 lg:py-24 relative bg-card/20">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="text-center mb-12 sm:mb-16 apple-fade-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              {t('home.roadmapTitle')}
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-white/70 max-w-2xl mx-auto">
              {t('home.roadmapDesc')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Q1 2026 */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 border-l-4 border-[#0ABAB5] apple-fade-in hover-reveal" style={{transitionDelay: '0.1s'}}>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#0ABAB5] mb-4 sm:mb-6">
                {t('roadmap.q1.title')}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#0ABAB5] flex-shrink-0"></span>
                  <span>{t('roadmap.q1.item1')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#0ABAB5] flex-shrink-0"></span>
                  <span>{t('roadmap.q1.item2')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#0ABAB5] flex-shrink-0"></span>
                  <span>{t('roadmap.q1.item3')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#0ABAB5] flex-shrink-0"></span>
                  <span>{t('roadmap.q1.item4')}</span>
                </li>
              </ul>
            </div>

            {/* Q2 2026 */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 border-l-4 border-[#A855F7] apple-fade-in hover-reveal" style={{transitionDelay: '0.2s'}}>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#A855F7] mb-4 sm:mb-6">
                {t('roadmap.q2.title')}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7] flex-shrink-0"></span>
                  <span>{t('roadmap.q2.item1')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7] flex-shrink-0"></span>
                  <span>{t('roadmap.q2.item2')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7] flex-shrink-0"></span>
                  <span>{t('roadmap.q2.item3')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7] flex-shrink-0"></span>
                  <span>{t('roadmap.q2.item4')}</span>
                </li>
              </ul>
            </div>

            {/* Q3 2026 */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 border-l-4 border-[#FFD700] apple-fade-in hover-reveal" style={{transitionDelay: '0.3s'}}>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#FFD700] mb-4 sm:mb-6">
                {t('roadmap.q3.title')}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] flex-shrink-0"></span>
                  <span>{t('roadmap.q3.item1')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] flex-shrink-0"></span>
                  <span>{t('roadmap.q3.item2')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] flex-shrink-0"></span>
                  <span>{t('roadmap.q3.item3')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700] flex-shrink-0"></span>
                  <span>{t('roadmap.q3.item4')}</span>
                </li>
              </ul>
            </div>

            {/* Q4 2026 */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 border-l-4 border-[#10B981] apple-fade-in hover-reveal" style={{transitionDelay: '0.4s'}}>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#10B981] mb-4 sm:mb-6">
                {t('roadmap.q4.title')}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0"></span>
                  <span>{t('roadmap.q4.item1')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0"></span>
                  <span>{t('roadmap.q4.item2')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0"></span>
                  <span>{t('roadmap.q4.item3')}</span>
                </li>
                <li className="flex items-center gap-3 text-sm sm:text-base text-white/70">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0"></span>
                  <span>{t('roadmap.q4.item4')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Apple-style reveal */}
      <section 
        ref={ctaRef}
        className="py-12 sm:py-16 lg:py-24 relative"
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="glass-card rounded-3xl p-8 sm:p-12 lg:p-16 text-center apple-fade-in relative overflow-hidden">
            <div className="absolute inset-0 gradient-motion opacity-20"></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
                {t('home.readyToStart')}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
                {t('home.readyToStartDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link href="/trade">
                  <Button className="neuro-button micro-bounce micro-glow text-white font-medium px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full sm:w-auto">
                    {t('button.launchApp')}
                  </Button>
                </Link>
                <Button variant="outline" className="glass-card border-white/20 text-white hover:bg-white/10 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base w-full sm:w-auto micro-bounce">
                  {t('home.viewDocs')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Glassmorphism */}
      <footer className="border-t border-white/10 py-8 sm:py-12 glass-menu">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-white/60">{t('footer.copyright')}</p>
            <div className="flex gap-4 sm:gap-6">
              <Link href="/privacy-policy" className="text-xs sm:text-sm text-white/60 hover:text-white hover-reveal-text transition-colors">{t('footer.privacyPolicy')}</Link>
              <Link href="/terms-of-service" className="text-xs sm:text-sm text-white/60 hover:text-white hover-reveal-text transition-colors">{t('footer.termsOfService')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

