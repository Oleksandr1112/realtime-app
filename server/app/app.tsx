import JSX from './jsx/jsx.js'
import type { index } from '../../template/index.html'
import { loadTemplate } from '../template.js'
import express from 'express'
import { getContext } from './context.js'
import type { ExpressContext, WsContext } from './context.js'
import type { attrs, ComponentFn, Element } from './jsx/types'
import { flagsToClassName, nodeToHTML } from './jsx/html.js'
import { sendHTML } from './express.js'
import { Switch } from './components/router.js'
import { mapArray } from './components/fragment.js'
import { OnWsMessage } from '../ws/wss.js'
import { dispatchUpdate } from './jsx/dispatch.js'
import { Home } from './pages/home.js'
import { About } from './pages/about.js'
import { NotMatch } from './pages/not-match.js'
import { Link } from './components/router.js'
import { Thermostat } from './pages/thermostat.js'
import { Style } from './components/style.js'
import { DemoForm } from './pages/demo-form.js'

let template = loadTemplate<index>('index')

export function Menu(attrs: attrs) {
  let context = getContext(attrs)
  return (
    <>
      {Style(`
        #menu > a {
          margin: 0.25em;
          text-decoration: none;
          border-bottom: 1px solid black;
        }
        #menu > a.selected {
          border-bottom: 2px solid black;
        }
    `)}
      <div id="menu">
        {mapArray(
          [
            '/',
            '/home',
            '/about',
            '/some/page/that/does-not/exist',
            '/thermostat',
            '/form',
          ],
          link => (
            <Link
              href={link}
              class={flagsToClassName({
                selected:
                  context.url.startsWith(link) ||
                  (context.url === '/' && link === '/home'),
              })}
            >
              {link.substr(1)}
            </Link>
          ),
        )}
      </div>
    </>
  )
}

export function App(): Element {
  return [
    'div.app',
    {},
    [
      <>
        <h1>ts-liveview Demo</h1>
        <p>This page is powered by Server-Side-Rendered JSX Components</p>
        <Menu />

        <fieldset>
          <legend>Router Demo</legend>
          {Switch(
            {
              '/': [Home],
              '/home': [Home],
              '/about': [About],
              '/thermostat': [Thermostat as ComponentFn],
              '/thermostat/:cmd': [Thermostat as ComponentFn],
              '/form': [DemoForm as ComponentFn],
              '/form/:key': [DemoForm as ComponentFn],
            },
            <NotMatch />,
          )}
        </fieldset>
      </>,
    ],
  ]
}

export let expressRouter = express.Router()
expressRouter.use((req, res, next) => {
  let context: ExpressContext = {
    type: 'express',
    req,
    res,
    next,
    url: req.url,
  }
  let page = req.url.split('/')[1] || 'Home Page'
  page = page[0].toUpperCase() + page.slice(1)
  let html = template({
    title: `${page} - LiveView Demo`,
    description: 'TODO',
    app: nodeToHTML(<App />, context),
  })
  sendHTML(res, html)
})

export let onWsMessage: OnWsMessage = (event, ws, wss) => {
  console.log('ws message:', event)
  // TODO handle case where event[0] is not url
  let [url, ...args] = event
  let context: WsContext = {
    type: 'ws',
    ws,
    wss,
    url,
    args,
  }
  if (url[0] !== '/') {
    context.event = url
  }
  dispatchUpdate(<App />, context)
}