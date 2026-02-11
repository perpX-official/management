import { Link, useLocation } from "wouter";
import { Menu, X, Globe, ChevronDown, Check, MessageSquare, Shield, FileText, BookOpen, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWallet } from "@/contexts/WalletContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [location] = useLocation();
  
  // Unified wallet hook
  const { isConnected, address, activeChain, openChainSelect, disconnect } = useWallet();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const { language, setLanguage, t } = useLanguage();

  const isHomePage = location === "/";
  const isLegalPage = location === "/privacy-policy" || location === "/terms-of-service";

  const languageNames = {
    en: 'English',
    jp: '日本語',
    cn: '中文'
  };

  const moreItems = [
    { icon: MessageSquare, titleKey: 'more.feedback', descKey: 'more.feedbackDesc', href: '/feedback' },
    { icon: Shield, titleKey: 'more.vip', descKey: 'more.vipDesc', href: '/vip' },
    { icon: FileText, titleKey: 'more.api', descKey: 'more.apiDesc', href: '/api' },
    { icon: BookOpen, titleKey: 'more.documentation', descKey: 'more.documentationDesc', href: '/docs' },
    { icon: FileText, titleKey: 'more.blog', descKey: 'more.blogDesc', href: '/blog' },
    { icon: MessageCircle, titleKey: 'more.discord', descKey: 'more.discordDesc', href: 'https://discord.gg/5BUJrR3JnK', external: true },
  ];

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Chain badge color
  const chainBadge = activeChain === 'evm' ? 'bg-blue-500' : activeChain === 'tron' ? 'bg-red-500' : activeChain === 'sol' ? 'bg-purple-500' : 'bg-green-500';
  const chainLabel = activeChain === 'evm' ? 'EVM' : activeChain === 'tron' ? 'TRON' : activeChain === 'sol' ? 'SOL' : '';

  return (
    <>
      {/* Top Navigation */}
      <nav className="border-b border-white/10 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              {!isLegalPage && (
                <button
                  className="lg:hidden p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="PerpX" className="h-6 w-6" />
                <span className="text-lg sm:text-xl font-bold text-white">PerpX</span>
              </Link>
              {!isHomePage && !isLegalPage && (
                <div className="hidden lg:flex items-center gap-4 sm:gap-6 ml-4 sm:ml-8">
                  <Link href="/trade" className={`text-xs sm:text-sm transition-colors ${
                      location === "/trade" ? "text-white" : "text-white/60 hover:text-white"
                    }`}>
                    {t('nav.perpetual')}
                  </Link>
                  <Link href="/dashboard" className={`text-xs sm:text-sm transition-colors ${
                      location === "/dashboard" ? "text-white" : "text-white/60 hover:text-white"
                    }`}>
                    {t('nav.portfolio')}
                  </Link>
                  <Link href="/referral" className={`text-xs sm:text-sm transition-colors ${
                      location === "/referral" ? "text-white" : "text-white/60 hover:text-white"
                    }`}>
                    {t('nav.referral')}
                  </Link>
                  <Link href="/rewards" className={`text-xs sm:text-sm transition-colors ${
                      location === "/rewards" ? "text-white" : "text-white/60 hover:text-white"
                    }`}>
                    {t('nav.rewards')}
                  </Link>
                  <Link href="/earn" className={`text-xs sm:text-sm transition-colors ${
                      location === "/earn" ? "text-white" : "text-white/60 hover:text-white"
                    }`}>
                    {t('nav.earn')}
                  </Link>
                  <Link href="/stake" className={`text-xs sm:text-sm transition-colors ${
                      location === "/stake" ? "text-white" : "text-white/60 hover:text-white"
                    }`}>
                    {t('nav.stake')}
                  </Link>
                  <Link href="/stats" className={`text-xs sm:text-sm transition-colors ${
                      location === "/stats" ? "text-white" : "text-white/60 hover:text-white"
                    }`}>
                    {t('nav.stats')}
                  </Link>
                  
                  {/* More Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMoreOpen(!isMoreOpen)}
                      className="flex items-center gap-1 text-xs sm:text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {t('more')}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isMoreOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsMoreOpen(false)}
                        />
                        <div className="absolute top-full right-0 mt-2 w-96 glass-menu rounded-xl shadow-xl border border-white/10 overflow-hidden z-[60]">
                          <div className="grid grid-cols-2 gap-px bg-white/5">
                            {moreItems.map((item, index) => (
                              item.external ? (
                                <a
                                  key={index}
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-4 hover:bg-white/5 transition-colors flex items-start gap-3 bg-card/50"
                                  onClick={() => setIsMoreOpen(false)}
                                >
                                  <item.icon className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <div className="text-sm font-medium text-white mb-0.5">{t(item.titleKey)}</div>
                                    <div className="text-xs text-white/60">{t(item.descKey)}</div>
                                  </div>
                                </a>
                              ) : (
                                <Link key={index} href={item.href}
                                  className="p-4 hover:bg-white/5 transition-colors flex items-start gap-3 bg-card/50"
                                  onClick={() => setIsMoreOpen(false)}
                                >
                                  <item.icon className="h-5 w-5 text-primary mt-0.5" />
                                  <div>
                                    <div className="text-sm font-medium text-white mb-0.5">{t(item.titleKey)}</div>
                                    <div className="text-xs text-white/60">{t(item.descKey)}</div>
                                  </div>
                                </Link>
                              )
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg glass-card hover:bg-white/5 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isLanguageOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsLanguageOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-48 glass-menu rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
                      <div className="py-1">
                        <div className="px-3 py-2 text-xs font-medium text-white/60 flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Language
                        </div>
                        {Object.entries(languageNames).map(([code, name]) => (
                          <button
                            key={code}
                            onClick={() => {
                              setLanguage(code as 'en' | 'jp' | 'cn');
                              setIsLanguageOpen(false);
                            }}
                            className="w-full px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                          >
                            <span className={language === code ? 'text-white font-medium' : 'text-white/70'} >
                              {name}
                            </span>
                            {language === code && <Check className="h-4 w-4 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {(isHomePage || isLegalPage) ? (
                <Link href="/trade" className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap">
                  {t('button.launchApp')}
                </Link>
              ) : isConnected && address ? (
                /* Connected state - show chain badge + address */
                <button
                  onClick={openChainSelect}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-card/50 hover:bg-card/70 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
                >
                  <div className={`w-2 h-2 rounded-full ${chainBadge}`} />
                  <span className="hidden sm:inline text-white/50 text-xs">{chainLabel}</span>
                  <span>{formatAddress(address)}</span>
                </button>
              ) : (
                /* Not connected - show connect button */
                <button
                  onClick={openChainSelect}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                >
                  {t('button.connectWallet')}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && !isHomePage && !isLegalPage && (
        <div className="lg:hidden fixed inset-0 top-[57px] bg-background/95 backdrop-blur-sm z-40 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col gap-4">
              <Link href="/trade" 
                className={`text-lg font-medium py-2 ${location === "/trade" ? "text-white" : "text-white/60"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.perpetual')}
              </Link>
              <Link href="/dashboard" 
                className={`text-lg font-medium py-2 ${location === "/dashboard" ? "text-white" : "text-white/60"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.portfolio')}
              </Link>
              <Link href="/referral" 
                className={`text-lg font-medium py-2 ${location === "/referral" ? "text-white" : "text-white/60"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.referral')}
              </Link>
              <Link href="/rewards" 
                className={`text-lg font-medium py-2 ${location === "/rewards" ? "text-white" : "text-white/60"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.rewards')}
              </Link>
              <Link href="/earn" 
                className={`text-lg font-medium py-2 ${location === "/earn" ? "text-white" : "text-white/60"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.earn')}
              </Link>
              <Link href="/stake" 
                className={`text-lg font-medium py-2 ${location === "/stake" ? "text-white" : "text-white/60"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.stake')}
              </Link>
              <Link href="/stats" 
                className={`text-lg font-medium py-2 ${location === "/stats" ? "text-white" : "text-white/60"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.stats')}
              </Link>
              
              <div className="border-t border-white/10 pt-4 mt-2">
                <div className="text-sm text-white/40 mb-3">{t('more')}</div>
                {moreItems.map((item, index) => (
                  item.external ? (
                    <a
                      key={index}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-3 text-white/60 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      <span>{t(item.titleKey)}</span>
                    </a>
                  ) : (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex items-center gap-3 py-3 text-white/60 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
