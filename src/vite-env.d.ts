/// <reference types="vite/client" />

interface PayPalDonationButtonConfig {
  env?: 'production' | 'sandbox'
  hosted_button_id?: string
  business?: string
  item_name?: string
  image?: { src: string; title?: string; alt?: string }
  onComplete?: (params: Record<string, string>) => void
}

interface PayPalDonationSdk {
  Button: (config: PayPalDonationButtonConfig) => { render: (selector: string | HTMLElement) => void }
}

interface PayPalGlobal {
  Donation: PayPalDonationSdk
}

declare global {
  interface Window {
    PayPal?: PayPalGlobal
  }
}

export {}
