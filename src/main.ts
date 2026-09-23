import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'

const app = mount(App, { target: document.getElementById('app')! })

/**
 * The load reveal. `js` hides the marked elements only once we know scripting is
 * running, so a page with no JS shows everything rather than nothing. `is-ready`
 * on the next frame starts the ramp, and a failsafe clears it either way: an
 * entrance that can strand the page at opacity 0 is worse than no entrance.
 */
document.documentElement.classList.add('js')
requestAnimationFrame(() => document.documentElement.classList.add('is-ready'))
setTimeout(() => document.documentElement.classList.remove('js'), 2600)

export default app
