import Header from "@/components/Header";
import { Book, FileText, Code, HelpCircle, Zap, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Docs() {
  const { t } = useLanguage();
  const sections = [
    { icon: Book, titleKey: "docs.gettingStarted", descKey: "docs.gettingStartedDesc", link: "#" },
    { icon: Zap, titleKey: "docs.tradingGuide", descKey: "docs.tradingGuideDesc", link: "#" },
    { icon: Code, titleKey: "docs.apiReference", descKey: "docs.apiReferenceDesc", link: "#" },
    { icon: Shield, titleKey: "docs.security", descKey: "docs.securityDesc", link: "#" },
    { icon: FileText, titleKey: "docs.faq", descKey: "docs.faqDesc", link: "#" },
    { icon: HelpCircle, titleKey: "docs.support", descKey: "docs.supportDesc", link: "#" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('docs.title')}</h1>
          <p className="text-white/60">{t('docs.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sections.map((section, index) => (
            <a key={index} href={section.link} className="glass-card rounded-xl p-6 hover-reveal block">
              <section.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{t(section.titleKey)}</h3>
              <p className="text-sm text-white/60">{t(section.descKey)}</p>
            </a>
          ))}
        </div>

        <div className="glass-card rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">{t('docs.popularArticles')}</h2>
          <div className="space-y-4">
            {[
              { titleKey: "docs.firstTrade", categoryKey: "docs.gettingStarted" },
              { titleKey: "docs.leverage", categoryKey: "docs.tradingGuide" },
              { titleKey: "docs.apiKeys", categoryKey: "docs.apiReference" },
              { titleKey: "docs.twoFactor", categoryKey: "docs.security" },
            ].map((article, index) => (
              <a key={index} href="#" className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg px-4">
                <div>
                  <div className="text-white font-medium mb-1">{t(article.titleKey)}</div>
                  <div className="text-sm text-white/60">{t(article.categoryKey)}</div>
                </div>
                <FileText className="h-5 w-5 text-white/40" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
