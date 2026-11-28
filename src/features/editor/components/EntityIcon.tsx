import { useState } from 'react'
import type { Prototype } from '../../blueprints'
import { ENTITY_CATALOG } from '../domain/entityCatalog'

type EntityIconProps = { readonly prototype: Prototype; readonly large?: boolean }
export const EntityIcon = (props: EntityIconProps) => {
  const [failed, setFailed] = useState(false)
  const definition = ENTITY_CATALOG[props.prototype]
  return (
    <span className={`grid shrink-0 place-items-center rounded border border-line bg-workspace ${props.large ? 'size-16 text-3xl' : 'size-11 text-2xl'}`}>
      {failed ? <span aria-hidden="true" style={{ color: `#${definition.color.toString(16)}` }}>{definition.symbol}</span>
        : <img src={`${import.meta.env.BASE_URL}assets/factorio/item/${props.prototype}.png`} alt="" onError={() => setFailed(true)}
          className={props.large ? 'size-13 object-contain' : 'size-9 object-contain'} />}
    </span>
  )
}
