import Header from "@/components/Header";
import { Calendar, User, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Blog() {
  const { t } = useLanguage();
  const posts = [
    {
      title: "Introducing PerpX: The Future of Perpetual Trading",
      excerpt: "We're excited to announce the launch of PerpX, a next-generation perpetual DEX designed for traders who demand speed, security, and simplicity.",
      date: "2025-10-20",
      author: "PerpX Team",
      image: "/blog-placeholder.png"
    },
    {
      title: "How to Maximize Your Trading Rewards",
      excerpt: "Learn strategies to earn more rewards through trading volume, referrals, and liquidity provision on PerpX.",
      date: "2025-10-18",
      author: "Trading Team",
      image: "/blog-placeholder.png"
    },
    {
      title: "Understanding Perpetual Futures",
      excerpt: "A comprehensive guide to perpetual futures contracts, funding rates, and how they differ from traditional futures.",
      date: "2025-10-15",
      author: "Education Team",
      image: "/blog-placeholder.png"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('blog.title')}</h1>
          <p className="text-white/60">{t('blog.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {posts.map((post, index) => (
            <div key={index} className="glass-card rounded-xl overflow-hidden hover-reveal">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <img src={post.image} alt={post.title} className="w-48 opacity-50" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
                <p className="text-white/60 mb-4">{post.excerpt}</p>
                <a href="#" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
                  {t('blog.readMore')}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
