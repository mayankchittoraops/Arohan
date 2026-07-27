import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const SHOTS = 'docs/screenshots'
mkdirSync(SHOTS, { recursive: true })
const BASE = 'http://localhost:4173/Arohan/'
const errors = []
const failed = []

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })

async function session(name, viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${name}] console: ${m.text()}`) })
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`[${name}] ${r.status()} ${r.url()}`) })
  return { ctx, page }
}

const shot = async (page, file) => {
  await page.waitForTimeout(650)
  await page.screenshot({ path: `${SHOTS}/${file}.png` })
  console.log('  shot', file)
}

/* ---------------------------------------------- iPhone: the README shots */
console.log('iPhone 15 Pro (393x852)')
const { ctx: ictx, page: ip } = await session('iphone', { width: 393, height: 852 })
await ip.goto(BASE, { waitUntil: 'networkidle' })
await ip.waitForTimeout(1200)

await ip.getByPlaceholder('Your name').fill('Mayank')
await ip.getByRole('button', { name: 'Start day one' }).click()
await ip.waitForTimeout(900)
console.log('  focus badge:', await ip.locator('text=/Today · /').first().textContent())
await shot(ip, '01-home-empty-checkin')

// Check-in, so the coach has inputs and the tiles populate.
await ip.getByRole('button', { name: /How are you doing today/ }).click()
await ip.waitForTimeout(500)
await ip.getByRole('group', { name: 'Sleep' }).getByRole('textbox').fill('7.5')
await ip.getByRole('group', { name: 'Energy' }).getByRole('button', { name: '4' }).click()
await ip.getByRole('group', { name: 'Lower back pain' }).getByRole('button', { name: '2' }).click()
await ip.getByRole('button', { name: 'Save' }).click()
await ip.waitForTimeout(900)
await shot(ip, '02-home')

// Pick a real session (today is a scheduled rest day).
await ip.getByRole('link', { name: 'Workout' }).click()
await ip.waitForTimeout(700)
const pick = ip.getByRole('button', { name: 'Pick a session' })
await (await pick.count() ? pick : ip.getByRole('button', { name: 'Change' })).click()
await ip.waitForTimeout(500)
await ip.getByRole('button', { name: /Foundation A/ }).click()
await ip.waitForTimeout(800)
await shot(ip, '03-workout-plan')

await ip.getByRole('button', { name: 'Start workout' }).click()
await ip.waitForTimeout(1000)
await shot(ip, '04-workout-runner')

await ip.getByRole('button', { name: 'Mark set 1 done' }).click()
await ip.waitForTimeout(1000)
console.log('  rest panel visible:', await ip.getByRole('status', { name: /Resting/ }).count())
await shot(ip, '05-rest-timer')

await ip.getByRole('button', { name: 'Skip rest' }).click()
await ip.waitForTimeout(400)
for (let i = 0; i < 8; i++) {
  const b = ip.getByRole('button', { name: /Mark set \d done/ }).first()
  if (await b.count()) { await b.click(); await ip.waitForTimeout(260) }
  const s = ip.getByRole('button', { name: 'Skip rest' })
  if (await s.count()) await s.click()
}
await ip.getByRole('button', { name: 'Finish early' }).click()
await ip.waitForTimeout(700)
await ip.getByRole('group', { name: 'How hard did that feel?' }).getByRole('button', { name: '6' }).click()
await ip.getByRole('button', { name: 'Save session' }).click()
await ip.waitForTimeout(1400)
console.log('  celebration heading:', await ip.locator('h1').first().textContent())
await shot(ip, '06-session-complete')
await ip.getByRole('button', { name: 'Done' }).click()
await ip.waitForTimeout(1200)
console.log('  post-session focus:', await ip.locator('text=/Today · /').first().textContent())

await ip.getByRole('link', { name: 'Mobility' }).click()
await ip.waitForTimeout(700)
await shot(ip, '07-mobility')

await ip.getByRole('link', { name: 'Progress' }).click()
await ip.waitForTimeout(1100)
await shot(ip, '08-progress')

// Dark mode
await ip.getByRole('link', { name: 'Settings' }).click()
await ip.waitForTimeout(700)
await ip.getByRole('radio', { name: 'Dark' }).click()
await ip.waitForTimeout(500)
await ip.getByRole('link', { name: 'Home' }).click()
await ip.waitForTimeout(1000)
await shot(ip, '09-home-dark')
await ip.getByRole('link', { name: 'Mobility' }).click()
await ip.waitForTimeout(800)
await shot(ip, '10-mobility-dark')
await ictx.close()

/* -------------------------------------------------- iPad: layout sanity */
console.log('iPad Air (834x1112)')
const { ctx: tctx, page: tp } = await session('ipad', { width: 834, height: 1112 })
await tp.goto(BASE, { waitUntil: 'networkidle' })
await tp.waitForTimeout(1400)
// A fresh context has its own IndexedDB, so onboard here too.
if (await tp.getByRole('dialog').count()) {
  await tp.getByPlaceholder('Your name').fill('Mayank')
  await tp.getByRole('button', { name: 'Start day one' }).click()
  await tp.waitForTimeout(900)
}
for (const tab of ['Home', 'Workout', 'Mobility', 'Progress', 'Settings']) {
  await tp.getByRole('link', { name: tab }).click()
  await tp.waitForTimeout(800)
  const overflow = await tp.evaluate(() =>
    document.documentElement.scrollWidth > document.documentElement.clientWidth)
  console.log(`  ${tab}: horizontal overflow = ${overflow}`)
}
await tp.getByRole('link', { name: 'Home' }).click()
await tp.waitForTimeout(900)
await tp.screenshot({ path: `${SHOTS}/11-ipad-home.png` })
console.log('  shot 11-ipad-home')
await tctx.close()

console.log('\nfailed requests:', failed.length ? failed.join('\n  ') : 'none')
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO CONSOLE ERRORS')
await browser.close()
