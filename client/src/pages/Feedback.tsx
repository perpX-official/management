import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRewardsState } from "@/hooks/useRewardsState";
import ConnectWalletScreen from "@/components/ConnectWalletScreen";

export default function Feedback() {
  const { t } = useLanguage();
  const { isConnected } = useRewardsState();
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Connect Wallet Screen when wallet is not connected */}
      {!isConnected && (
        <ConnectWalletScreen
          title="Connect Wallet"
          description="Connect your wallet to submit feedback and vote on community proposals."
        />
      )}

      {/* Main Content - Only show when wallet is connected */}
      {isConnected && (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('feedback.title')}</h1>
          <p className="text-white/60">{t('feedback.subtitle')}</p>
        </div>

        <div className="glass-card rounded-xl p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">{t('feedback.category')}</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white">
                <option>{t('feedback.featureRequest')}</option>
                <option>{t('feedback.bugReport')}</option>
                <option>{t('feedback.generalFeedback')}</option>
                <option>{t('feedback.other')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">{t('feedback.titleLabel')}</label>
              <input 
                type="text" 
                placeholder={t('feedback.titlePlaceholder')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">{t('feedback.description')}</label>
              <textarea 
                rows={6}
                placeholder={t('feedback.descriptionPlaceholder')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40"
              />
            </div>

            <Button className="w-full neuro-button micro-bounce micro-glow text-white font-medium py-6">
              <Send className="h-5 w-5 mr-2" />
              {t('feedback.submit')}
            </Button>
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="glass-card rounded-xl p-6 mt-8">
          <h2 className="text-xl font-bold text-white mb-6">{t('feedback.recentCommunity')}</h2>
          <div className="space-y-4">
            {[
              { title: "Add dark mode toggle", status: "In Progress", votes: 45 },
              { title: "Mobile app support", status: "Planned", votes: 32 },
              { title: "Lower trading fees", status: "Under Review", votes: 28 },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex-1">
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-sm text-white/60">{item.status}</div>
                </div>
                <div className="text-primary font-bold">{item.votes} {t('feedback.votes')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
