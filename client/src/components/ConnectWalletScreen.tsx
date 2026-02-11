import { Wallet, Zap } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface ConnectWalletScreenProps {
  title: string;
  description: string;
}

export default function ConnectWalletScreen({ title, description }: ConnectWalletScreenProps) {
  const { openChainSelect } = useWallet();

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Title and Description */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">{title}</h2>
            <p className="text-base sm:text-lg text-white/60">
              {description}
            </p>
          </div>

          {/* Connect Wallet Button */}
          <div className="flex justify-center">
            <button
              onClick={openChainSelect}
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all duration-200 text-lg flex items-center gap-3"
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-white/40">or</span>
            </div>
          </div>

          {/* Demo Mode Button */}
          <div className="text-center space-y-3">
            <p className="text-sm text-white/40">Try demo mode first</p>
            <button
              onClick={() => {
                localStorage.setItem('demoMode', 'true');
                window.location.reload();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500/20 to-primary/20 hover:from-purple-500/30 hover:to-primary/30 text-white rounded-lg font-medium transition-all duration-200 border border-white/10 flex items-center justify-center gap-2 group"
            >
              <Zap className="h-5 w-5 text-purple-400 group-hover:text-primary transition-colors" />
              Enter Demo Mode
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">100x</div>
              <div className="text-xs text-white/40 mt-1">Leverage</div>
            </div>
            <div className="text-center border-x border-white/10">
              <div className="text-2xl font-bold text-primary">$0</div>
              <div className="text-xs text-white/40 mt-1">Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">24/7</div>
              <div className="text-xs text-white/40 mt-1">Trading</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
