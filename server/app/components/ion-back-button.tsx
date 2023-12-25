import { o } from '../jsx/jsx.js'
import { Link } from './router.js'

export function IonBackButton(attrs: {
  href: string
  color?: string
  class?: string
  backText?: string // default: 'Back'
  buttonsSlot?: string | false // default: 'start'
}) {
  let { href, class: className, backText, buttonsSlot, ...extraAttrs } = attrs
  className = className ? className + ' ' : ''
  backText ??= 'Back'
  buttonsSlot ??= 'start'
  let button = (
    <>
      <Link
        tagName="ion-button"
        href={href}
        class={className + 'md-only'}
        {...extraAttrs}
      >
        <ion-icon name="arrow-back-outline" slot="icon-only"></ion-icon>
      </Link>
      <Link
        tagName="ion-button"
        href={href}
        class={className + 'ios-only'}
        {...extraAttrs}
      >
        <ion-icon name="chevron-back-outline"></ion-icon>
        <span>{backText}</span>
      </Link>
    </>
  )
  if (buttonsSlot) {
    return <ion-buttons slot={buttonsSlot}>{button}</ion-buttons>
  } else {
    return button
  }
}
