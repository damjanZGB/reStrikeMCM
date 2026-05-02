import React, { useEffect } from 'react'

export type ToastKind = 'info' | 'error'
export interface Toast { id: number; kind: ToastKind; message: string }

interface ItemProps { toast: Toast; onDismiss(id: number): void }

function ToastItem({ toast, onDismiss }: ItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])
  return (
    <div className={`toast toast-${toast.kind}`}>
      <span>{toast.message}</span>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>✕</button>
    </div>
  )
}

interface ListProps { toasts: Toast[]; onDismiss(id: number): void }

export function ToastList({ toasts, onDismiss }: ListProps) {
  if (!toasts.length) return null
  return (
    <div className="toast-list">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}
