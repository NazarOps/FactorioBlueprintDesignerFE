const ICON_PATHS = {
  grid: 'M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18 M15 3v18',
  plus: 'M12 5v14 M5 12h14',
  select: 'm5 3 14 10-7 1-3 7z',
  hand: 'M7 12V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9c0 4-3 7-7 7-3 0-5-2-7-5l-2-4a2 2 0 0 1 3-2l1 1',
  erase: 'm4 13 9-10 8 8-9 10H9z M8 9l8 8 M12 21h9',
  rotate: 'M5 8a8 8 0 1 1-1 8 M5 3v5h5',
  undo: 'M9 5 4 10l5 5 M4 10h10a6 6 0 0 1 0 12',
  redo: 'm15 5 5 5-5 5 M20 10H10a6 6 0 0 0 0 12',
  trash: 'M4 7h16 M9 7V3h6v4 M6 7l1 14h10l1-14 M10 11v6 M14 11v6',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',
  pencil: 'm4 16 12-12 4 4L8 20H4z M13 7l4 4',
  check: 'm5 12 4 4L19 6',
  folder: 'M3 7V4h7l3 3h8v13H3z',
  fit: 'M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5 M8 8h8v8H8z',
  help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4 M12 17v1 M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
  close: 'm6 6 12 12 M18 6 6 18',
  chip: 'M7 7h10v10H7z M9 3v4 M15 3v4 M9 17v4 M15 17v4 M3 9h4 M3 15h4 M17 9h4 M17 15h4',
} as const

export type IconName = keyof typeof ICON_PATHS
type IconProps = { readonly name: IconName; readonly className?: string }
export const Icon = (props: IconProps) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round" className={props.className ?? 'size-5 shrink-0'}>
    <path d={ICON_PATHS[props.name]} />
  </svg>
)
