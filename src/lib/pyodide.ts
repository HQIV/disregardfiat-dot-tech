import type { PyodideInterface } from '../types/pyodide'

const PYODIDE_VERSION = '0.26.4'
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

export type PyodideStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface PyodideState {
  status: PyodideStatus
  message: string
  log: string[]
}

type Listener = (state: PyodideState) => void

const state: PyodideState = {
  status: 'idle',
  message: 'Click “Load pyhqiv engine” to start (Pyodide WASM, ~15 MB first time).',
  log: [],
}

const listeners = new Set<Listener>()
let pyodide: PyodideInterface | null = null
let loadPromise: Promise<PyodideInterface> | null = null

function emit() {
  for (const fn of listeners) fn({ ...state, log: [...state.log] })
}

function setStatus(message: string, status: PyodideStatus = 'loading') {
  state.status = status
  state.message = message
  emit()
}

function appendLog(msg: string) {
  state.log.push(msg)
  emit()
}

export function subscribePyodide(fn: Listener): () => void {
  listeners.add(fn)
  fn({ ...state, log: [...state.log] })
  return () => listeners.delete(fn)
}

export function getPyodideState(): PyodideState {
  return { ...state, log: [...state.log] }
}

async function loadPyodideScript(): Promise<void> {
  if (window.loadPyodide) return

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-pyodide="${PYODIDE_VERSION}"]`)
    if (existing) {
      if (window.loadPyodide) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load pyodide.js')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `${PYODIDE_BASE}pyodide.js`
    script.dataset.pyodide = PYODIDE_VERSION
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load pyodide.js'))
    document.head.appendChild(script)
  })
}

async function resolveWheelUrl(): Promise<string> {
  const manifestUrl = new URL('/calculator/wheels/manifest.json', window.location.origin)
  try {
    const res = await fetch(manifestUrl, { cache: 'no-store' })
    if (res.ok) {
      const m = (await res.json()) as { wheel?: string }
      if (m.wheel) {
        return new URL(`/calculator/wheels/${m.wheel}`, window.location.origin).href
      }
    }
  } catch {
    /* fall through */
  }

  return 'https://disregardfiat.github.io/pyhqiv/wheels/pyhqiv-0.4.3.dev15+gcef87cabf.d20260603-py3-none-any.whl'
}

function pyResultToJs(res: unknown): unknown {
  if (res == null || typeof res !== 'object') return res
  const pd = pyodide
  if (pd?.toPy) {
    try {
      return pd.toPy(res).toJs({ dict_converter: Object.fromEntries })
    } catch {
      return res
    }
  }
  return res
}

/** Boot sequence aligned with hqvmpy/web/main.js (proven on GitHub Pages). */
async function bootPyodide(): Promise<PyodideInterface> {
  setStatus('Loading Pyodide runtime…')
  appendLog(`Fetching Pyodide ${PYODIDE_VERSION}`)

  await loadPyodideScript()
  appendLog('Initializing Pyodide…')
  const pd = await window.loadPyodide({ indexURL: PYODIDE_BASE })

  appendLog('Loading numpy + scipy…')
  setStatus('Loading numpy + scipy (10–30 s first time)…')
  await pd.loadPackage(['numpy', 'scipy'])

  appendLog('Loading micropip…')
  await pd.loadPackage('micropip')

  const wheelUrl = await resolveWheelUrl()
  appendLog(`Installing pyhqiv from ${wheelUrl}`)
  setStatus('Installing pyhqiv wheel…')

  // Match hqvmpy/web/main.js: pyimport after loadPackage('micropip').
  const micropip = pd.pyimport('micropip')
  await micropip.install(wheelUrl)

  appendLog('Importing pyhqiv modules…')
  setStatus('Importing pyhqiv…')
  await pd.runPythonAsync(`
import pyhqiv.lightcone
import pyhqiv.metric
import pyhqiv.auxiliary_field
import pyhqiv.modified_maxwell
import pyhqiv.thermodynamic_fundamentals
import pyhqiv.quantum_optics.horizon_qed
import pyhqiv.so8_generators
import pyhqiv.scale_witness
import importlib.metadata as _im
print("pyhqiv", _im.version("pyhqiv"), "ready")
`)

  setStatus('pyhqiv ready — same code as the Python package', 'ready')
  appendLog('HQIV calculator ready in browser (Pyodide WASM)')
  return pd
}

export async function ensurePyodide(): Promise<PyodideInterface> {
  if (pyodide) return pyodide
  if (loadPromise) return loadPromise

  loadPromise = bootPyodide()
    .then((pd) => {
      pyodide = pd
      return pd
    })
    .catch((err: Error) => {
      loadPromise = null
      pyodide = null
      setStatus(`Failed: ${err.message}`, 'error')
      appendLog(`ERROR: ${err.message}`)
      throw err
    })

  return loadPromise
}

export async function runAtlasPython(code: string): Promise<unknown> {
  const pd = await ensurePyodide()
  const res = await pd.runPythonAsync(code)
  return pyResultToJs(res)
}
