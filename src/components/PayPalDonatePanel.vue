<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  PAYPAL_BUSINESS_EMAIL,
  PAYPAL_HOSTED_BUTTON_ID,
  PAYPAL_ME_HANDLE,
  paypalDonateUrl,
  paypalDonateUrlSimple,
  sponsorTiers,
  type SponsorTierId,
} from '../content/sponsors'
import { startSponsorSession } from '../lib/sponsorApi'

const mainContainer = ref<HTMLElement | null>(null)
const sdkReady = ref(false)
const sdkError = ref(false)
const opening = ref<SponsorTierId | null>(null)

let sdkPromise: Promise<void> | null = null

function loadPayPalDonateSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise
  sdkPromise = new Promise((resolve, reject) => {
    if (window.PayPal?.Donation?.Button) {
      resolve()
      return
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-donate-sdk]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('PayPal SDK failed')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://www.paypalobjects.com/donate/sdk/donate-sdk.js'
    script.dataset.paypalDonateSdk = '1'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('PayPal SDK failed'))
    document.head.appendChild(script)
  })
  return sdkPromise
}

async function openTierCheckout(tier: SponsorTierId, amountUsd: number) {
  opening.value = tier
  try {
    const { custom } = await startSponsorSession(tier)
    const url = paypalDonateUrl({ tier, amountUsd, custom })
    window.location.href = url
  } catch {
    window.location.href = paypalDonateUrlSimple({ amountUsd, itemName: `${tier} sponsorship` })
  } finally {
    opening.value = null
  }
}

async function openCustomCheckout() {
  opening.value = 'supporter'
  try {
    const { custom } = await startSponsorSession('supporter')
    const url = new URL(paypalDonateUrlSimple())
    url.searchParams.set('custom', custom)
    window.location.href = url.toString()
  } catch {
    window.location.href = paypalDonateUrlSimple()
  } finally {
    opening.value = null
  }
}

onMounted(async () => {
  try {
    await loadPayPalDonateSdk()
    const Button = window.PayPal?.Donation?.Button
    if (!Button || !mainContainer.value) {
      sdkError.value = true
      return
    }

    const config: Record<string, unknown> = {
      env: 'production',
      item_name: 'HQIV sponsorship',
    }
    if (PAYPAL_HOSTED_BUTTON_ID) {
      config.hosted_button_id = PAYPAL_HOSTED_BUTTON_ID
    } else {
      config.business = PAYPAL_BUSINESS_EMAIL
    }

    Button(config).render(mainContainer.value)
    sdkReady.value = true
  } catch {
    sdkError.value = true
  }
})
</script>

<template>
  <section
    id="paypal"
    class="rounded-2xl border border-sky-900/50 bg-gradient-to-br from-sky-950/25 via-slate-900/40 to-slate-900/20 p-6 sm:p-8"
    aria-labelledby="paypal-heading"
  >
    <h2 id="paypal-heading" class="text-xl font-medium text-white">Donate with PayPal</h2>
    <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
      Checkout opens on PayPal with the amount and tier pre-filled. Enter your
      <strong class="font-medium text-slate-300">display name</strong> in the note field — supporter
      names publish automatically; partner and principal tiers continue to the brand kit after
      payment.
    </p>

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <button
        v-for="tier in sponsorTiers.filter((t) => t.suggestedMonthlyUsd != null)"
        :key="tier.id"
        type="button"
        class="flex flex-col rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-3 text-left transition hover:border-sky-600/60 hover:bg-slate-950/80 disabled:opacity-60"
        :disabled="opening != null"
        @click="openTierCheckout(tier.id, tier.suggestedMonthlyUsd!)"
      >
        <span class="text-xs font-medium uppercase tracking-wider text-sky-300/90">{{
          tier.name
        }}</span>
        <span class="mt-1 text-lg font-semibold text-white">
          ${{ tier.suggestedMonthlyUsd!.toLocaleString() }}
        </span>
        <span class="mt-1 text-xs text-slate-500">
          {{ opening === tier.id ? 'Opening PayPal…' : 'Pre-filled checkout →' }}
        </span>
      </button>
      <button
        type="button"
        class="flex flex-col rounded-xl border border-slate-700/80 bg-slate-950/50 px-4 py-3 text-left transition hover:border-sky-600/60 hover:bg-slate-950/80 disabled:opacity-60"
        :disabled="opening != null"
        @click="openCustomCheckout()"
      >
        <span class="text-xs font-medium uppercase tracking-wider text-sky-300/90">Custom</span>
        <span class="mt-1 text-lg font-semibold text-white">Any amount</span>
        <span class="mt-1 text-xs text-slate-500">PayPal · you choose ↗</span>
      </button>
    </div>

    <div class="mt-8 flex flex-wrap items-start gap-6">
      <div class="min-w-[12rem]">
        <div ref="mainContainer" class="min-h-[2.5rem]" aria-label="PayPal donate button" />
        <p v-if="sdkReady" class="mt-2 text-xs text-slate-500">Generic popup — choose amount on PayPal</p>
        <p v-else-if="sdkError" class="mt-2 text-xs text-slate-400">
          Popup unavailable —
          <button
            type="button"
            class="text-sky-300 underline-offset-2 hover:underline"
            @click="openCustomCheckout()"
          >
            open PayPal donate page ↗
          </button>
        </p>
        <p v-else class="mt-2 text-xs text-slate-500">Loading PayPal…</p>
      </div>

      <div class="max-w-md text-xs leading-relaxed text-slate-500">
        <p>
          Fallback:
          <a
            :href="`https://paypal.me/${PAYPAL_ME_HANDLE}`"
            target="_blank"
            rel="noopener noreferrer"
            class="font-mono text-sky-300 underline-offset-2 hover:underline"
            >paypal.me/{{ PAYPAL_ME_HANDLE }}</a
          >
          (manual amount — email us your display name).
        </p>
      </div>
    </div>
  </section>
</template>
