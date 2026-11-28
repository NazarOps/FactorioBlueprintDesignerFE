import { useEffect, useRef, useState } from 'react'

export const BlueprintWorkspace = () => {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const controller = new AbortController()
    let dispose: (() => void) | undefined
    void import('../rendering/createBlueprintRenderer')
      .then(({ createBlueprintRenderer }) => createBlueprintRenderer(host, controller.signal))
      .then((cleanup) => {
        if (controller.signal.aborted) cleanup()
        else { dispose = cleanup; setStatus('ready') }
      }).catch(() => { if (!controller.signal.aborted) setStatus('error') })
    return () => { controller.abort(); dispose?.() }
  }, [])

  return (
    <div className="absolute inset-0" ref={hostRef} data-testid="workspace">
      {status === 'loading' && <p className="absolute inset-0 grid place-content-center text-muted">Preparing workspace…</p>}
      {status === 'error' && (
        <div role="alert" className="absolute inset-0 grid place-content-center gap-3 p-8 text-center">
          <p>The grid could not start. Enable WebGL in your browser and reload.</p>
          <p className="text-muted">Your saved blueprints remain in this browser.</p>
          <button className="bg-accent px-4 py-2 text-workspace" onClick={() => window.location.reload()}>Reload editor</button>
        </div>
      )}
    </div>
  )
}
