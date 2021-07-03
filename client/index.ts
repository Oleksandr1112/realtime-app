import type { attrs, props, selector, VElement, VNode } from './jsx/types'
import {
  updateAttrs,
  updateElement,
  updateNode,
  updateProps,
} from './jsx/dom.js'
import { connectWS } from './ws/ws-lite.js'

let wsUrl = location.origin.replace('http', 'ws')
connectWS<ServerMessage>({
  createWS(protocol) {
    let status = document.querySelector('#ws_status')
    if (status) {
      status.textContent = 'connecting ws...'
    }
    return new WebSocket(wsUrl, [protocol])
  },
  attachWS(ws) {
    console.log('attach ws')

    let emit = function emit() {
      ws.send(Array.from(arguments))
      let event = window.event
      if (
        event &&
        (event.target instanceof HTMLAnchorElement ||
          event.target instanceof HTMLButtonElement)
      ) {
        console.debug('preventDefault', event)
        event.preventDefault()
      }
    } as (...args: any[]) => void
    function emitHref(a: HTMLAnchorElement, flag?: 'q') {
      let url = a.getAttribute('href')
      if (flag !== 'q') {
        let title = a.getAttribute('title') || document.title
        history.pushState(null, title, url)
      }
      emit(url)
    }
    window.onpopstate = (event: PopStateEvent) => {
      let url = location.href.replace(location.origin, '')
      emit(url)
    }
    let win = window as any
    win.emit = emit
    win.emitHref = emitHref

    ws.ws.addEventListener('open', () => {
      emit('mount', location.href.replace(location.origin, ''))
    })

    const status = document.querySelector('#ws_status')
    if (status) {
      ws.ws.addEventListener('open', () => {
        status.textContent = 'connected ws'
      })
      ws.ws.addEventListener('close', () => {
        status.textContent = 'disconnected ws'
      })
    }
  },
  onMessage(event) {
    console.log('on ws message:', event)
    onServerMessage(event)
  },
})

export type ServerMessage =
  | ['update', VElement]
  | ['update-in', selector, VNode]
  | ['update-attrs', selector, attrs]
  | ['update-props', selector, props]
  | ['batch', ServerMessage[]]

function onServerMessage(message: ServerMessage) {
  switch (message[0]) {
    case 'update':
      updateElement(message[1])
      break
    case 'update-in':
      updateNode(message[1], message[2])
      break
    case 'update-attrs':
      updateAttrs(message[1], message[2])
      break
    case 'update-props':
      updateProps(message[1], message[2])
      break
    case 'batch':
      message[1].forEach(onServerMessage)
      break
    default:
      console.log('unknown server message:', message)
  }
}