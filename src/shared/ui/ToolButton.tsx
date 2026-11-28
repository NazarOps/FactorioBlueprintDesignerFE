import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'

type ToolButtonProps = {
  readonly label: string
  readonly icon: IconName
  readonly active?: boolean
  readonly disabled?: boolean
  readonly onClick: () => void
  readonly children?: ReactNode
}

export const ToolButton = (props: ToolButtonProps) => (
  <button type="button" title={props.label} aria-label={props.label} aria-pressed={props.active}
    disabled={props.disabled} onClick={props.onClick}
    className={`flex h-10 min-w-10 items-center justify-center gap-2 px-2.5 transition-colors disabled:opacity-30 ${props.active
      ? 'bg-accent/15 text-accent ring-1 ring-accent/50' : 'text-muted hover:bg-raised hover:text-ink'}`}>
    <Icon name={props.icon} />{props.children}
  </button>
)
