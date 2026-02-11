import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet, X } from 'lucide-react'

interface WalletConnectProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function WalletConnect({ open, onOpenChange }: WalletConnectProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Connected Wallet</span>
              <button onClick={() => onOpenChange(false)} className="hover:bg-white/5 rounded p-1">
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-white/60 mb-1">Address</div>
              <div className="font-mono text-white">{formatAddress(address)}</div>
            </div>
            <Button
              onClick={() => {
                disconnect()
                onOpenChange(false)
              }}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Connect Wallet</span>
            <button onClick={() => onOpenChange(false)} className="hover:bg-white/5 rounded p-1">
              <X className="h-4 w-4" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {connectors.map((connector) => (
            <Button
              key={connector.id}
              onClick={() => {
                connect({ connector })
                onOpenChange(false)
              }}
              disabled={isPending}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4"
            >
              <Wallet className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">{connector.name}</div>
                <div className="text-xs text-white/60">
                  {connector.name === 'Injected' && 'MetaMask, Rabby, etc.'}
                  {connector.name === 'WalletConnect' && 'Scan with WalletConnect'}
                  {connector.name === 'Coinbase Wallet' && 'Connect with Coinbase'}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

