/** Minimal Pyodide types for the Atlas calculator (CDN-loaded runtime). */
export interface PyodideInterface {
  runPythonAsync(code: string): Promise<unknown>
  loadPackage(names: string | string[]): Promise<void>
  pyimport(name: string): { install: (url: string) => Promise<void> }
  toPy?: (obj: unknown) => { toJs: (opts?: { dict_converter?: typeof Object.fromEntries }) => unknown }
}

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>
  }
}

export {}
