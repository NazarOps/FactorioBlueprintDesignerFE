import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

type ModalProps = { readonly title: string; readonly onClose: () => void; readonly children: ReactNode }

export const Modal = (props: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return <dialog ref={ref} onClose={() => { if (!ref.current?.open) props.onClose() }} aria-labelledby="modal-title"
    className="fixed inset-0 m-auto max-h-[85vh] w-[min(90vw,460px)] overflow-y-auto rounded-lg border border-line bg-panel p-6 text-ink shadow-2xl backdrop:bg-black/65">
    <div className="mb-6 flex items-center justify-between gap-4">
      <h2 id="modal-title" className="text-xl font-semibold">{props.title}</h2>
      <button onClick={props.onClose} aria-label="Close dialog" className="p-1 text-muted hover:text-ink"><Icon name="close" /></button>
    </div>
    {props.children}
  </dialog>
}
