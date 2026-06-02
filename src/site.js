import { supabase } from './supabase.js'

const TILE_SVGS = [
  `<svg class="tile-scene" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="t1sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8a9888"/><stop offset="60%" stop-color="#b8c0b0"/><stop offset="100%" stop-color="#c8c8b8"/></linearGradient></defs><rect width="900" height="340" fill="url(#t1sky)"/><path d="M0 220 Q150 180 280 200 Q420 170 560 190 Q680 165 900 185 L900 340 L0 340Z" fill="#6a7060" opacity="0.7"/><path d="M0 255 Q100 235 220 248 Q360 230 500 245 Q640 228 780 240 Q850 232 900 238 L900 340 L0 340Z" fill="#4a5040"/><path d="M0 290 Q200 275 400 282 Q600 268 900 278 L900 340 L0 340Z" fill="#3a3e30"/><rect x="380" y="210" width="80" height="50" fill="#c8c0a8" opacity="0.8"/><polygon points="370,210 460,210 415,180" fill="#a89880" opacity="0.8"/></svg>`,
  `<svg class="tile-scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="t2sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a09080"/><stop offset="100%" stop-color="#c8b8a8"/></linearGradient></defs><rect width="400" height="300" fill="url(#t2sky)"/><path d="M0 180 Q60 120 120 155 Q180 100 240 140 Q300 90 360 130 Q380 118 400 125 L400 300 L0 300Z" fill="#6a6258" opacity="0.6"/><path d="M0 220 Q80 190 160 205 Q240 180 320 198 Q360 185 400 192 L400 300 L0 300Z" fill="#4a4438"/></svg>`,
  `<svg class="tile-scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="#5a5248"/><rect x="0" y="200" width="400" height="100" fill="#3a342c"/><polygon points="80,200 120,160 160,200" fill="#c8b890" opacity="0.7"/><polygon points="180,200 220,155 260,200" fill="#c8b890" opacity="0.65"/><polygon points="260,200 300,162 340,200" fill="#c8b890" opacity="0.6"/></svg>`,
  `<svg class="tile-scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="#8a8a7a"/><rect x="40" y="40" width="320" height="220" fill="none" stroke="rgba(224,216,200,0.25)" stroke-width="1"/><rect x="60" y="55" width="80" height="40" fill="rgba(180,170,148,0.6)"/><rect x="180" y="120" width="80" height="45" fill="rgba(180,170,148,0.5)"/></svg>`,
  `<svg class="tile-scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="t5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#788090"/><stop offset="50%" stop-color="#a0a8b0"/><stop offset="100%" stop-color="#c0c8c8"/></linearGradient></defs><rect width="400" height="300" fill="url(#t5)"/><path d="M0 180 Q100 165 200 175 Q300 162 400 170 L400 300 L0 300Z" fill="#5a6870" opacity="0.8"/><path d="M0 210 Q80 195 180 205 Q280 192 400 200 L400 300 L0 300Z" fill="#485860"/></svg>`,
  `<svg class="tile-scene" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="t6" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b0b8c0"/><stop offset="100%" stop-color="#d0d0c8"/></linearGradient></defs><rect width="400" height="300" fill="url(#t6)"/><path d="M0 280 L0 200 Q20 180 30 200 Q40 160 50 200 Q60 170 70 200 L70 280Z" fill="#4a5040"/><path d="M330 280 L330 195 Q350 175 360 195 Q370 160 380 195 Q390 170 400 195 L400 280Z" fill="#4a5040"/></svg>`,
]

const PLAY_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(244,241,236,0.9)"><polygon points="5 3 19 12 5 21 5 3"/></svg>`

function catLabel(slug) {
  return { 'real-estate': 'Real Estate', cinematic: 'Cinematic', events: 'Events', commercial: 'Commercial' }[slug] || slug
}

async function hydrateSite() {
  const [{ data: settings }, { data: tiles }, { data: services }] = await Promise.all([
    supabase.from('site_settings').select('*').maybeSingle(),
    supabase.from('work_tiles').select('*').order('sort_order').eq('visible', true),
    supabase.from('services').select('*').order('sort_order').eq('visible', true),
  ])
  if (settings) applySettings(settings)
  if (tiles) applyTiles(tiles)
  if (services) applyServices(services)
}

function applySettings(s) {
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val }
  set('site-hero-eyebrow', s.hero_eyebrow)
  const titleEl = document.getElementById('site-hero-title')
  if (titleEl && (s.hero_title_line1 || s.hero_title_line2 || s.hero_title_line3)) {
    titleEl.innerHTML = `${s.hero_title_line1 || ''}<br>${s.hero_title_line2 || ''}<br>from <em>${(s.hero_title_line3 || 'above.').replace(/^from\s*/i, '')}</em>`
  }
  set('site-hero-body', s.hero_body)
  set('site-about-pull', s.about_pull_quote)
  set('site-about-body1', s.about_body1)
  set('site-about-body2', s.about_body2)
  const emailEl = document.getElementById('site-contact-email')
  if (emailEl && s.contact_email) { emailEl.textContent = s.contact_email; emailEl.href = `mailto:${s.contact_email}` }
  const phoneEl = document.getElementById('site-contact-phone')
  if (phoneEl && s.contact_phone) { phoneEl.textContent = s.contact_phone; phoneEl.href = `tel:${s.contact_phone.replace(/\D/g, '')}` }
  set('site-contact-area', s.contact_area)
  set('site-contact-lead', s.contact_lead)
  set('site-footer-copy', s.footer_copy)
}

function applyTiles(tiles) {
  const grid = document.getElementById('grid-work')
  if (!grid || !tiles.length) return
  grid.innerHTML = tiles.map((t, i) => {
    const svg = TILE_SVGS[i % TILE_SVGS.length]
    const cls = t.is_wide ? 'wide' : ''
    const cat = t.category || 'cinematic'
    const label = catLabel(cat)
    return `<div class="work-tile ${cls} reveal" data-cat="${cat}" onclick="openModal('${t.title.replace(/'/g,"\\'")}', '${label}')">${svg}<div class="tile-always"><div class="tile-cat">${label}</div><div class="tile-name">${t.title}</div></div><div class="tile-info"><div class="tile-cat">${label} · 4K</div><div class="tile-name">${t.title}</div><div class="tile-desc">${t.description}</div></div><div class="tile-play">${PLAY_SVG}</div></div>`
  }).join('')
  reobserve()
}

function applyServices(services) {
  const list = document.querySelector('.services-list')
  if (!list || !services.length) return
  list.innerHTML = services.map(s => `<div class="service-row reveal"><span class="service-index">${s.index_label}</span><div class="service-title-col">${s.title}<em>${s.subtitle}</em></div><p class="service-desc-col">${s.description}</p><div class="service-tags">${(s.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div></div>`).join('')
  reobserve()
}

function reobserve() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target) } })
  }, { threshold: 0.08 })
  document.querySelectorAll('.reveal').forEach(el => io.observe(el))
}

hydrateSite()