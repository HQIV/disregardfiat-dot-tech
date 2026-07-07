<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { brandKitGuide } from '../content/sponsors'
import { uploadBrandKit } from '../lib/sponsorApi'

const props = defineProps<{
  claimToken: string
  tier: string
  recognition: string
  initialName?: string
}>()

const emit = defineEmits<{
  published: []
}>()

const displayName = ref(props.initialName ?? '')
const url = ref('')
const logoPreview = ref<string | null>(null)
const logoBase64 = ref<string | null>(null)
const logoFilename = ref<string | null>(null)
const status = ref<'idle' | 'uploading' | 'done' | 'error'>('idle')
const errorMsg = ref('')
const logoRequired = ref(props.recognition === 'logo')

onMounted(async () => {
  try {
    const res = await fetch(`/api/v1/sponsors/claim/${props.claimToken}`)
    if (res.ok) {
      const data = await res.json()
      displayName.value = data.display_name || displayName.value
      logoRequired.value = data.brand_kit?.logo_required ?? logoRequired.value
    }
  } catch {
    /* use props */
  }
})

function onFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 512 * 1024) {
    errorMsg.value = 'Logo must be 512 KB or smaller.'
    return
  }
  const ext = file.name.toLowerCase()
  if (!ext.endsWith('.svg') && !ext.endsWith('.png') && !ext.endsWith('.webp')) {
    errorMsg.value = 'Use SVG, PNG, or WebP.'
    return
  }
  errorMsg.value = ''
  logoFilename.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    const result = String(reader.result || '')
    logoBase64.value = result
    logoPreview.value = result
  }
  reader.readAsDataURL(file)
}

async function submit() {
  status.value = 'uploading'
  errorMsg.value = ''
  try {
    await uploadBrandKit({
      claim_token: props.claimToken,
      display_name: displayName.value.trim(),
      url: url.value.trim(),
      logo_base64: logoBase64.value ?? undefined,
      logo_filename: logoFilename.value ?? undefined,
    })
    status.value = 'done'
    emit('published')
  } catch (e) {
    status.value = 'error'
    errorMsg.value = e instanceof Error ? e.message.replace(/_/g, ' ') : 'Upload failed'
  }
}
</script>

<template>
  <section
    class="rounded-2xl border border-sky-800/60 bg-gradient-to-br from-sky-950/30 via-slate-900/50 to-slate-900/30 p-6 sm:p-8"
    aria-labelledby="brand-kit-heading"
  >
    <h2 id="brand-kit-heading" class="text-xl font-medium text-white">
      {{ brandKitGuide.title }}
    </h2>
    <p class="mt-2 max-w-2xl text-sm text-slate-400">
      Payment received — publish your recognition on the supporters roll now. Changes appear
      immediately after you submit.
    </p>

    <div
      v-if="status === 'done'"
      class="mt-6 rounded-xl border border-emerald-700/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100"
      role="status"
    >
      Published — thank you! Your entry is live on the roll below.
    </div>

    <form v-else class="mt-6 grid gap-5 sm:grid-cols-2" @submit.prevent="submit">
      <div class="sm:col-span-2">
        <label for="brand-name" class="block text-xs font-medium text-slate-300"
          >Display name</label
        >
        <input
          id="brand-name"
          v-model="displayName"
          type="text"
          required
          maxlength="120"
          class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600/50"
        />
      </div>

      <div class="sm:col-span-2">
        <label for="brand-url" class="block text-xs font-medium text-slate-300">Website URL</label>
        <input
          id="brand-url"
          v-model="url"
          type="url"
          required
          placeholder="https://your-lab.example"
          class="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600/50"
        />
      </div>

      <div class="sm:col-span-2">
        <label for="brand-logo" class="block text-xs font-medium text-slate-300">
          Logo {{ logoRequired ? '(required)' : '(optional — adds gallery tile)' }}
        </label>
        <input
          id="brand-logo"
          type="file"
          accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
          class="mt-1.5 block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-sky-700"
          @change="onFileChange"
        />
        <ul class="mt-3 space-y-1 text-xs text-slate-500">
          <li v-for="(tip, i) in brandKitGuide.tips" :key="i">· {{ tip }}</li>
        </ul>
        <div
          v-if="logoPreview"
          class="mt-4 inline-flex rounded-xl border border-slate-700 bg-slate-950/80 p-4"
        >
          <img :src="logoPreview" alt="Logo preview" class="max-h-20 max-w-[12rem] object-contain" />
        </div>
      </div>

      <div class="sm:col-span-2 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          class="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-500 disabled:opacity-60"
          :disabled="status === 'uploading'"
        >
          {{ status === 'uploading' ? 'Publishing…' : 'Publish on site' }}
        </button>
        <p v-if="status === 'error'" class="text-sm text-red-300">{{ errorMsg }}</p>
      </div>
    </form>
  </section>
</template>
