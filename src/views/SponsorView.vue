<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PayPalDonatePanel from '../components/PayPalDonatePanel.vue'
import SponsorRoll from '../components/SponsorRoll.vue'
import SponsorClaimPanel from '../components/SponsorClaimPanel.vue'
import SiteFooter from '../components/SiteFooter.vue'
import {
  sponsorTiers,
  cryptoWallets,
  contactInterestOptions,
  sponsorIntro,
  donationNotes,
  SPONSOR_CONTACT_API,
  SPONSOR_CONTACT_EMAIL,
  type ContactInterest,
  type SponsorTierId,
} from '../content/sponsors'
import {
  clearStoredSession,
  openPayPalTierCheckout,
  readPayPalReturnTxn,
  readStoredSession,
  stripSponsorReturnParams,
  syncSponsorPayment,
} from '../lib/sponsorApi'

const tierTone: Record<
  SponsorTierId,
  { ring: string; chip: string; accent: string; price: string }
> = {
  supporter: {
    ring: 'ring-slate-700/60',
    chip: 'bg-slate-800/80 text-slate-200 border-slate-600/60',
    accent: 'text-slate-300',
    price: 'text-slate-200',
  },
  partner: {
    ring: 'ring-amber-600/70',
    chip: 'bg-amber-900/50 text-amber-100 border-amber-600/60',
    accent: 'text-amber-300',
    price: 'text-amber-200',
  },
  principal: {
    ring: 'ring-emerald-600/60',
    chip: 'bg-emerald-900/40 text-emerald-100 border-emerald-700/60',
    accent: 'text-emerald-300',
    price: 'text-emerald-200',
  },
}

const copiedSymbol = ref<string | null>(null)

async function copyAddress(symbol: string, address: string) {
  if (!address) return
  try {
    await navigator.clipboard.writeText(address)
    copiedSymbol.value = symbol
    window.setTimeout(() => {
      if (copiedSymbol.value === symbol) copiedSymbol.value = null
    }, 2000)
  } catch {
    copiedSymbol.value = null
  }
}

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr
  return `${addr.slice(0, 8)}…${addr.slice(-8)}`
}

const form = ref({
  name: '',
  email: '',
  interest: 'sponsorship' as ContactInterest,
  tier: '' as SponsorTierId | '',
  message: '',
  website: '', // honeypot
})

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'
const formStatus = ref<FormStatus>('idle')
const formError = ref('')

async function submitContact() {
  if (form.value.website) return
  formStatus.value = 'submitting'
  formError.value = ''

  try {
    const res = await fetch(SPONSOR_CONTACT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.value.name.trim(),
        email: form.value.email.trim(),
        interest: form.value.interest,
        tier: form.value.tier || null,
        message: form.value.message.trim(),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      formStatus.value = 'error'
      formError.value =
        typeof data.error === 'string'
          ? data.error.replace(/_/g, ' ')
          : 'Something went wrong. Try email instead.'
      return
    }
    formStatus.value = 'success'
    form.value = {
      name: '',
      email: '',
      interest: 'sponsorship',
      tier: '',
      message: '',
      website: '',
    }
  } catch {
    formStatus.value = 'error'
    formError.value = 'Could not reach the server. Email us directly.'
  }
}

function scrollToContact(tier?: SponsorTierId) {
  if (tier) form.value.tier = tier
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const paypalThanks = ref(false)
const syncPending = ref(false)
const tierOpening = ref<SponsorTierId | null>(null)
const rollRef = ref<{ refresh: () => void } | null>(null)

const claim = ref<{
  claimToken: string
  tier: string
  recognition: string
  displayName: string
} | null>(null)

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function payWithPayPal(tier: SponsorTierId, amountUsd: number) {
  tierOpening.value = tier
  try {
    await openPayPalTierCheckout(tier, amountUsd)
  } finally {
    tierOpening.value = null
  }
}

async function handlePayPalReturn() {
  const params = new URLSearchParams(location.search)
  if (params.get('sponsor_return') !== '1') return

  syncPending.value = true
  const stored = readStoredSession()
  const txn = readPayPalReturnTxn()

  for (let i = 0; i < 12; i++) {
    try {
      const result = await syncSponsorPayment({
        session_id: stored?.session_id,
        txn_id: txn ?? undefined,
      })
      if (result.pending) {
        await sleep(2000)
        continue
      }
      clearStoredSession()
      stripSponsorReturnParams()
      if (result.needs_brand_kit && result.claim_token) {
        claim.value = {
          claimToken: result.claim_token,
          tier: result.tier ?? 'partner',
          recognition: result.recognition ?? 'link',
          displayName: result.display_name ?? '',
        }
      } else {
        paypalThanks.value = true
        rollRef.value?.refresh()
      }
      syncPending.value = false
      return
    } catch {
      await sleep(2000)
    }
  }
  syncPending.value = false
}

function onBrandPublished() {
  claim.value = null
  paypalThanks.value = true
  rollRef.value?.refresh()
}

onMounted(() => {
  handlePayPalReturn()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="relative overflow-hidden border-b border-slate-800">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.12),transparent)]"
        aria-hidden="true"
      />
      <div class="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div class="flex items-center gap-4">
          <img
            src="/hqiv-icon.png"
            alt="HQIV logo"
            width="64"
            height="64"
            class="h-14 w-14 rounded-xl ring-1 ring-slate-700/80"
          />
          <div>
            <p class="text-xs font-medium uppercase tracking-widest text-amber-300/90">
              {{ sponsorIntro.eyebrow }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Transparent tiers · PayPal, crypto, or contact · no ads on the science
            </p>
          </div>
        </div>
        <h1 class="mt-6 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">
          {{ sponsorIntro.title }}
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-relaxed text-slate-300">
          {{ sponsorIntro.lead }}
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-500"
            @click="scrollToContact()"
          >
            Get in touch
          </button>
          <a
            href="#paypal"
            class="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
          >
            Donate with PayPal
          </a>
          <a
            href="#crypto"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800"
          >
            Donate in crypto
          </a>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl space-y-14 px-4 py-12">
      <div
        v-if="syncPending"
        class="rounded-xl border border-sky-700/50 bg-sky-950/30 px-4 py-3 text-sm text-sky-100"
        role="status"
      >
        Confirming your PayPal gift…
      </div>

      <div
        v-else-if="paypalThanks && !claim"
        class="rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100"
        role="status"
      >
        Thank you — you're on the supporters roll.
      </div>

      <SponsorClaimPanel
        v-if="claim"
        :claim-token="claim.claimToken"
        :tier="claim.tier"
        :recognition="claim.recognition"
        :initial-name="claim.displayName"
        @published="onBrandPublished"
      />

      <SponsorRoll ref="rollRef" />

      <!-- Tiers -->
      <section aria-labelledby="tiers-heading">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="tiers-heading" class="text-xl font-medium text-white">Sponsorship tiers</h2>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Suggested monthly levels in USD equivalent. Custom arrangements — including
              one-time grants and in-kind compute — are handled case by case.
            </p>
          </div>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-3">
          <article
            v-for="tier in sponsorTiers"
            :key="tier.id"
            class="relative flex flex-col rounded-2xl border bg-slate-900/40 p-6 ring-1"
            :class="[
              tier.highlighted
                ? 'border-amber-800/60 bg-gradient-to-b from-amber-950/25 to-slate-900/40'
                : 'border-slate-800',
              tierTone[tier.id].ring,
            ]"
          >
            <span
              v-if="tier.highlighted"
              class="absolute -top-3 left-6 rounded-full border border-amber-600/60 bg-amber-900/80 px-3 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-100"
            >
              Most popular
            </span>

            <span
              class="inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider"
              :class="tierTone[tier.id].chip"
            >
              {{ tier.name }}
            </span>

            <p v-if="tier.suggestedMonthlyUsd != null" class="mt-4">
              <span class="text-3xl font-semibold" :class="tierTone[tier.id].price">
                ${{ tier.suggestedMonthlyUsd.toLocaleString() }}
              </span>
              <span class="text-sm text-slate-500"> / month suggested</span>
            </p>
            <p v-else class="mt-4 text-lg font-medium text-slate-200">Custom</p>

            <p class="mt-3 text-sm leading-relaxed" :class="tierTone[tier.id].accent">
              {{ tier.tagline }}
            </p>

            <ul class="mt-5 flex-1 space-y-2.5 text-sm leading-snug text-slate-300">
              <li v-for="(b, i) in tier.benefits" :key="i" class="flex gap-2">
                <span class="mt-0.5 text-emerald-400" aria-hidden="true">✓</span>
                <span>{{ b }}</span>
              </li>
            </ul>

            <div class="mt-6 flex flex-col gap-2">
              <button
                v-if="tier.suggestedMonthlyUsd != null"
                type="button"
                class="w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition disabled:opacity-60"
                :class="
                  tier.highlighted
                    ? 'bg-amber-600 text-slate-950 hover:bg-amber-500'
                    : 'bg-sky-700 text-white hover:bg-sky-600'
                "
                :disabled="tierOpening != null"
                @click="payWithPayPal(tier.id, tier.suggestedMonthlyUsd)"
              >
                {{
                  tierOpening === tier.id
                    ? 'Opening PayPal…'
                    : `Pay $${tier.suggestedMonthlyUsd.toLocaleString()} with PayPal`
                }}
              </button>
              <button
                type="button"
                class="w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition"
                :class="
                  tier.highlighted
                    ? 'border-amber-700/60 bg-transparent text-amber-100 hover:bg-amber-950/30'
                    : 'border-slate-600 bg-slate-800/70 text-slate-100 hover:bg-slate-800'
                "
                @click="scrollToContact(tier.id)"
              >
                Discuss {{ tier.name }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <PayPalDonatePanel />

      <!-- Crypto -->
      <section
        id="crypto"
        class="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8"
        aria-labelledby="crypto-heading"
      >
        <h2 id="crypto-heading" class="text-xl font-medium text-white">Donate in crypto</h2>
        <p class="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          Send to the addresses below. Include an optional memo in your wallet note or follow up
          via the contact form so we can thank you on the supporters roll.
        </p>

        <ul class="mt-8 grid gap-4 sm:grid-cols-2">
          <li
            v-for="w in cryptoWallets"
            :key="w.symbol"
            class="rounded-xl border border-slate-800 bg-slate-950/50 p-5"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-white">{{ w.name }}</p>
                <p class="mt-0.5 font-mono text-xs text-amber-300/90">{{ w.symbol }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ w.network }}</p>
              </div>
              <span
                class="rounded-md bg-slate-800/80 px-2 py-1 font-mono text-[0.65rem] text-slate-400"
              >
                {{ w.symbol }}
              </span>
            </div>

            <div v-if="w.address" class="mt-4">
              <p
                class="break-all rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-2 font-mono text-xs leading-relaxed text-slate-200"
              >
                {{ w.address }}
              </p>
              <button
                type="button"
                class="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-800"
                @click="copyAddress(w.symbol, w.address)"
              >
                {{
                  copiedSymbol === w.symbol
                    ? 'Copied!'
                    : `Copy ${truncateAddress(w.address)}`
                }}
              </button>
            </div>
            <p v-else class="mt-4 text-sm text-slate-400">
              Address not published yet —
              <button
                type="button"
                class="text-amber-300 underline-offset-2 hover:underline"
                @click="scrollToContact()"
              >
                request via contact form
              </button>
              or email
              <a
                :href="`mailto:${SPONSOR_CONTACT_EMAIL}?subject=${encodeURIComponent(`${w.symbol} donation address`)}`"
                class="text-amber-300 underline-offset-2 hover:underline"
                >{{ SPONSOR_CONTACT_EMAIL }}</a
              >.
            </p>

            <p v-if="w.note" class="mt-3 text-xs leading-relaxed text-slate-500">{{ w.note }}</p>
          </li>
        </ul>

        <ul class="mt-8 space-y-2 border-t border-slate-800 pt-6 text-xs leading-relaxed text-slate-500">
          <li v-for="(note, i) in donationNotes" :key="i" class="flex gap-2">
            <span aria-hidden="true" class="text-slate-600">·</span>
            <span>{{ note }}</span>
          </li>
        </ul>
      </section>

      <!-- Contact -->
      <section
        id="contact"
        class="rounded-2xl border border-emerald-900/40 bg-gradient-to-br from-emerald-950/20 via-slate-900/40 to-slate-900/20 p-6 sm:p-8"
        aria-labelledby="contact-heading"
      >
        <h2 id="contact-heading" class="text-xl font-medium text-white">Contact</h2>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Sponsorship, collaboration, press, or a question about HQIV — send a message here or
          email
          <a
            :href="`mailto:${SPONSOR_CONTACT_EMAIL}`"
            class="text-emerald-300 underline-offset-2 hover:underline"
            >{{ SPONSOR_CONTACT_EMAIL }}</a
          >.
        </p>

        <div
          v-if="formStatus === 'success'"
          class="mt-6 rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100"
          role="status"
        >
          Message received — thank you. We will reply to your email within a few business days.
        </div>

        <form
          v-else
          class="mt-8 grid gap-5 sm:grid-cols-2"
          @submit.prevent="submitContact"
        >
          <!-- Honeypot -->
          <div class="hidden" aria-hidden="true">
            <label for="website">Website</label>
            <input id="website" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
          </div>

          <div>
            <label for="contact-name" class="block text-xs font-medium text-slate-300">Name</label>
            <input
              id="contact-name"
              v-model="form.name"
              type="text"
              required
              maxlength="120"
              autocomplete="name"
              class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
              placeholder="Your name"
            />
          </div>

          <div>
            <label for="contact-email" class="block text-xs font-medium text-slate-300"
              >Email</label
            >
            <input
              id="contact-email"
              v-model="form.email"
              type="email"
              required
              maxlength="254"
              autocomplete="email"
              class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="contact-interest" class="block text-xs font-medium text-slate-300"
              >Topic</label
            >
            <select
              id="contact-interest"
              v-model="form.interest"
              class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
            >
              <option
                v-for="opt in contactInterestOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="contact-tier" class="block text-xs font-medium text-slate-300"
              >Tier (optional)</label
            >
            <select
              id="contact-tier"
              v-model="form.tier"
              class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
            >
              <option value="">Not sure yet</option>
              <option v-for="t in sponsorTiers" :key="t.id" :value="t.id">
                {{ t.name }}
              </option>
            </select>
          </div>

          <div class="sm:col-span-2">
            <label for="contact-message" class="block text-xs font-medium text-slate-300"
              >Message</label
            >
            <textarea
              id="contact-message"
              v-model="form.message"
              required
              rows="5"
              minlength="10"
              maxlength="5000"
              class="mt-1.5 w-full resize-y rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
              placeholder="Tell us about your interest, timeline, or organisation…"
            />
          </div>

          <div class="sm:col-span-2 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="formStatus === 'submitting'"
            >
              {{ formStatus === 'submitting' ? 'Sending…' : 'Send message' }}
            </button>
            <p v-if="formStatus === 'error'" class="text-sm text-red-300" role="alert">
              {{ formError }}
              <a
                :href="`mailto:${SPONSOR_CONTACT_EMAIL}`"
                class="ml-1 underline-offset-2 hover:underline"
                >Email instead</a
              >
            </p>
          </div>
        </form>
      </section>

      <!-- What funding supports -->
      <section class="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 sm:p-8">
        <h2 class="text-xl font-medium text-white">Where sponsorship goes</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-3">
          <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-emerald-300">
              Formal verification
            </p>
            <p class="mt-2 text-sm text-slate-300">
              Lean 4 maintenance, CI, and proof debt reduction across hqiv-lean.
            </p>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-amber-300">
              Public infrastructure
            </p>
            <p class="mt-2 text-sm text-slate-300">
              Hosting, Arena API, calculator Pyodide wheels, and Zenodo curation time.
            </p>
          </div>
          <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-violet-300">
              Open problems
            </p>
            <p class="mt-2 text-sm text-slate-300">
              Benchmark witnesses, reproducible notebooks, and workshop space on Discord.
            </p>
          </div>
        </div>
      </section>
    </main>

    <SiteFooter show-resources-link />
  </div>
</template>
