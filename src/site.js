import { hasSupabaseConfig, supabase, supabaseConfigError } from './supabase.js'

const TILE_SVGS = [
  `<svg class="tile-scene" viewBox="0 0 900 520" preserveAspectRatio="xMidYMid slice"><rect width="900" height="520" fill="#b8c99f"/><path d="M0 330 C190 250 300 356 468 274 C610 206 740 294 900 210 V520 H0Z" fill="#315f43"/><path d="M0 412 C180 364 320 424 500 370 C660 318 760 370 900 330 V520 H0Z" fill="#183f2f"/><path d="M170 286 H420 V380 H170Z" fill="#fffaf0" opacity="0.76"/><path d="M140 288 L294 190 L450 288Z" fill="#6b563f"/></svg>`,
  `<svg class="tile-scene" viewBox="0 0 600 520" preserveAspectRatio="xMidYMid slice"><rect width="600" height="520" fill="#f4ecd7"/><circle cx="430" cy="130" r="58" fill="#d5a95f" opacity="0.6"/><path d="M0 330 C118 210 174 292 260 236 C344 180 418 290 600 210 V520 H0Z" fill="#6f8062"/><path d="M0 390 C150 330 240 408 366 342 C476 284 536 342 600 314 V520 H0Z" fill="#183f2f"/></svg>`,
  `<svg class="tile-scene" viewBox="0 0 600 520" preserveAspectRatio="xMidYMid slice"><rect width="600" height="520" fill="#dfe8d6"/><path d="M0 230 H600 V520 H0Z" fill="#6f8062"/><path d="M100 140 H470 V376 H100Z" fill="#fffaf0" opacity="0.72"/><path d="M130 176 H440 M130 220 H440 M130 264 H440 M130 308 H440" stroke="#183f2f" stroke-width="6" opacity="0.42"/></svg>`,
  `<svg class="tile-scene" viewBox="0 0 600 520" preserveAspectRatio="xMidYMid slice"><rect width="600" height="520" fill="#cfd8be"/><path d="M0 260 C108 232 156 274 248 246 C348 216 452 250 600 198 V520 H0Z" fill="#315f43"/><path d="M160 80 C220 136 218 218 176 292 C142 352 154 420 228 520" fill="none" stroke="#fffaf0" stroke-width="54" opacity="0.58"/></svg>`
]

const CATEGORY_LABELS = {
  'real-estate': 'Real Estate',
  cinematic: 'Cinematic',
  events: 'Events',
  commercial: 'Commercial',
}

const text = (value = '') => String(value)
const labelFor = (slug = '') => CATEGORY_LABELS[slug] || text(slug).replace(/-/g, ' ')

function setText(id, value) {
  const el = document.getElementById(id)
  if (el && value) el.textContent = value
}

function showFormSuccess(contactForm) {
  contactForm.style.display = 'none'
  document.getElementById('form-success')?.classList.add('show')
}

function safeHTML(value) {
  return text(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatTitle(settings) {
  const lines = [settings.hero_title_line1, settings.hero_title_line2, settings.hero_title_line3]
    .filter(Boolean)
    .map((line) => safeHTML(line).replace(/^from\s*/i, ''))

  if (!lines.length) return ''
  const finalLine = lines.pop()
  return `${lines.join('<br>')}${lines.length ? '<br>' : ''}<em>${finalLine}</em>`
}

function applySettings(settings) {
  setText('site-hero-eyebrow', settings.hero_eyebrow)
  setText('site-hero-body', settings.hero_body)
  setText('site-about-pull', settings.about_pull_quote)
  setText('site-about-body1', settings.about_body1)
  setText('site-about-body2', settings.about_body2)
  setText('site-contact-area', settings.contact_area)
  setText('site-contact-lead', settings.contact_lead)
  setText('site-footer-copy', settings.footer_copy)

  const titleEl = document.getElementById('site-hero-title')
  const title = formatTitle(settings)
  if (titleEl && title) titleEl.innerHTML = title

  const emailEl = document.getElementById('site-contact-email')
  if (emailEl && settings.contact_email) {
    emailEl.textContent = settings.contact_email
    emailEl.href = `mailto:${settings.contact_email}`
  }

  const phoneEl = document.getElementById('site-contact-phone')
  if (phoneEl && settings.contact_phone) {
    phoneEl.textContent = settings.contact_phone
    phoneEl.href = `tel:${settings.contact_phone.replace(/\D/g, '')}`
  }
}

function applyTiles(tiles) {
  const grid = document.getElementById('grid-work')
  if (!grid || !tiles.length) return

  grid.innerHTML = tiles.map((tile, index) => {
    const category = tile.category || 'cinematic'
    const label = labelFor(category)
    const description = tile.description || 'Aerial footage planned around light, movement, and place.'

    return `
      <article class="work-tile ${tile.is_wide ? 'wide' : ''} reveal" data-cat="${safeHTML(category)}" data-title="${safeHTML(tile.title)}" data-label="${safeHTML(label)}">
        ${TILE_SVGS[index % TILE_SVGS.length]}
        <div class="tile-always">
          <div class="tile-cat">${safeHTML(label)}</div>
          <div class="tile-name">${safeHTML(tile.title)}</div>
        </div>
        <div class="tile-info">
          <div class="tile-cat">${safeHTML(label)}</div>
          <div class="tile-name">${safeHTML(tile.title)}</div>
          <div class="tile-desc">${safeHTML(description)}</div>
        </div>
        <div class="tile-play">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(244,241,236,0.9)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </article>`
  }).join('')

  bindWorkTiles()
  observeReveals()
}

function applyServices(services) {
  const list = document.querySelector('.services-list')
  if (!list || !services.length) return

  list.innerHTML = services.map((service, index) => `
    <article class="service-row reveal">
      <span class="service-index">${safeHTML(service.index_label || String(index + 1).padStart(2, '0'))}</span>
      <div class="service-title-col">${safeHTML(service.title)}<em>${safeHTML(service.subtitle || '')}</em></div>
      <p class="service-desc-col">${safeHTML(service.description || '')}</p>
      <div class="service-tags">${(service.tags || []).map((tag) => `<span class="tag">${safeHTML(tag)}</span>`).join('')}</div>
    </article>`).join('')

  observeReveals()
}

function doFilter(filter, button) {
  document.querySelectorAll('.filter-tab, [data-filter]').forEach((tab) => {
    tab.classList.toggle('active', tab === button || tab.dataset.filter === filter)
  })

  document.querySelectorAll('.work-tile').forEach((tile) => {
    const isVisible = filter === 'all' || tile.dataset.cat === filter
    tile.hidden = !isVisible
    tile.style.display = isVisible ? '' : 'none'
  })
}

function bindFilters() {
  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => doFilter(button.dataset.filter, button))
  })
}

function openModal(title, category) {
  setText('modal-title', title)
  setText('modal-cat', category)
  const modal = document.getElementById('modal')
  if (modal) {
    modal.classList.add('open')
    modal.setAttribute('aria-hidden', 'false')
  }
}

function closeModal() {
  const modal = document.getElementById('modal')
  if (modal) {
    modal.classList.remove('open')
    modal.setAttribute('aria-hidden', 'true')
  }
}

function bindWorkTiles() {
  document.querySelectorAll('.work-tile').forEach((tile) => {
    const title = tile.dataset.title || tile.querySelector('.tile-name')?.textContent?.trim() || ''
    const label = tile.dataset.label || tile.querySelector('.tile-cat')?.textContent?.trim() || labelFor(tile.dataset.cat)
    tile.dataset.title = title
    tile.dataset.label = label
    tile.addEventListener('click', () => openModal(title, label))
  })
}

function bindModal() {
  document.querySelector('[data-close-modal]')?.addEventListener('click', closeModal)
  document.getElementById('modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'modal') closeModal()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal()
  })
}

function observeReveals() {
  const reveals = document.querySelectorAll('.reveal:not(.visible)')
  if (!reveals.length) return

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.08 })

  reveals.forEach((el) => observer.observe(el))
}

async function handleSubmit(event) {
  event.preventDefault()

  const contactForm = event.currentTarget || document.getElementById('contact-form')
  if (!contactForm?.checkValidity()) {
    contactForm?.reportValidity()
    return
  }

  const data = Object.fromEntries(new FormData(contactForm))
  const accessKey = window.WEB3FORMS_KEY

  if (!accessKey) {
    showFormSuccess(contactForm)
    return
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_key: accessKey, ...data }),
    })

    if (response.ok) showFormSuccess(contactForm)
  } catch (error) {
    console.error('Form submission error:', error)
  }
}

function bindContactForm() {
  const contactForm = document.getElementById('contact-form')
  if (!contactForm) return

  contactForm.addEventListener('submit', handleSubmit)
}

async function hydrateSite() {
  if (!hasSupabaseConfig) {
    console.info(supabaseConfigError)
    return
  }

  try {
    const [{ data: settings }, { data: tiles }, { data: services }] = await Promise.all([
      supabase.from('site_settings').select('*').maybeSingle(),
      supabase.from('work_tiles').select('*').order('sort_order').eq('visible', true),
      supabase.from('services').select('*').order('sort_order').eq('visible', true),
    ])

    if (settings) applySettings(settings)
    if (tiles?.length) applyTiles(tiles)
    if (services?.length) applyServices(services)
  } catch (error) {
    console.error('Error loading site content:', error)
  }
}

window.doFilter = doFilter
window.openModal = openModal
window.closeModal = closeModal
window.handleSubmit = handleSubmit

bindFilters()
bindWorkTiles()
bindModal()
bindContactForm()
observeReveals()
hydrateSite()
