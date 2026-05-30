import { supabase } from '../src/supabase.js'

let settings = {}
let tiles = []
let services = []
let openPanelId = null

async function init() {
  await Promise.all([loadSettings(), loadTiles(), loadServices()])
  document.getElementById('loading').style.display = 'none'
  showSection('hero', document.querySelector('.nav-item.active'))
}

async function loadSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').maybeSingle()
  if (error) { toast('Failed to load settings', 'error'); return }
  settings = data || {}
  populateSettingsFields()
}

function populateSettingsFields() {
  const fields = ['hero_eyebrow','hero_title_line1','hero_title_line2','hero_title_line3','hero_body','about_pull_quote','about_body1','about_body2','contact_email','contact_phone','contact_area','contact_lead','footer_copy']
  fields.forEach(f => { const el = document.getElementById(f); if (el && settings[f] != null) el.value = settings[f] })
}

window.saveSettings = async function(section) {
  const sectionFields = {
    hero: ['hero_eyebrow','hero_title_line1','hero_title_line2','hero_title_line3','hero_body'],
    about: ['about_pull_quote','about_body1','about_body2'],
    contact: ['contact_email','contact_phone','contact_area','contact_lead'],
    footer: ['footer_copy'],
  }
  const patch = {}
  sectionFields[section].forEach(f => { const el = document.getElementById(f); if (el) patch[f] = el.value })
  const btn = document.querySelector(`button[onclick="saveSettings('${section}')"]`)
  btn.disabled = true
  const { error } = await supabase.from('site_settings').upsert({ id: 1, ...patch })
  btn.disabled = false
  if (error) { toast('Save failed: ' + error.message, 'error'); return }
  Object.assign(settings, patch)
  toast(`${cap(section)} saved`, 'success')
}

async function loadTiles() {
  const { data, error } = await supabase.from('work_tiles').select('*').order('sort_order')
  if (error) { toast('Failed to load tiles', 'error'); return }
  tiles = data || []
  renderTiles()
}

function renderTiles() {
  const list = document.getElementById('work-list')
  if (!tiles.length) { list.innerHTML = '<div style="padding:1.5rem;color:var(--ash);font-size:0.8rem;">No tiles yet.</div>'; return }
  list.innerHTML = tiles.map(t => `
  <div id="row-${t.id}">
    <div class="tile-row">
      <span class="tile-drag">:</span>
      <div>
        <div class="tile-row-title">${esc(t.title) || '<em style="color:var(--ash)">Untitled</em>'}</div>
        <div class="tile-row-cat">${esc(t.category)}</div>
      </div>
      <span class="tile-row-badge ${t.is_wide ? 'wide' : ''}">${t.is_wide ? 'Wide' : 'Standard'}</span>
      <div class="toggle-wrap">
        <label class="toggle">
          <input type="checkbox" ${t.visible ? 'checked' : ''} onchange="toggleTileVisible('${t.id}', this.checked)">
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
      </div>
      <div class="tile-row-actions">
        <button class="btn btn-ghost btn-sm" onclick="togglePanel('tile-panel-${t.id}', '${t.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTile('${t.id}')">X</button>
      </div>
    </div>
    <div class="edit-panel" id="tile-panel-${t.id}">
      <div class="edit-panel-header">Editing Tile</div>
      <div class="field-group">
        <div class="field">
          <label>Title</label>
          <input type="text" id="tile-title-${t.id}" value="${esc(t.title)}" maxlength="80">
        </div>
        <div class="field">
          <label>Category</label>
          <select id="tile-cat-${t.id}">
            ${['real-estate','cinematic','events','commercial'].map(c => `<option value="${c}" ${t.category === c ? 'selected' : ''}>${cap(c.replace('-',' '))}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field-group single">
        <div class="field">
          <label>Description</label>
          <textarea id="tile-desc-${t.id}" rows="3" maxlength="200">${esc(t.description)}</textarea>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <label>Sort Order</label>
          <input type="number" id="tile-sort-${t.id}" value="${t.sort_order}" min="0">
        </div>
        <div class="field" style="justify-content:flex-end;padding-top:1.5rem;">
          <div class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="tile-wide-${t.id}" ${t.is_wide ? 'checked' : ''}>
              <span class="toggle-track"></span>
              <span class="toggle-thumb"></span>
            </label>
            <span class="toggle-label">Wide tile (2 columns)</span>
          </div>
        </div>
      </div>
      <div class="panel-actions">
        <button class="btn btn-primary btn-sm" onclick="saveTile('${t.id}')">Save</button>
        <button class="btn btn-ghost btn-sm" onclick="togglePanel('tile-panel-${t.id}')">Cancel</button>
      </div>
    </div>
  </div>`).join('')
}

window.addTile = async function() {
  const { data, error } = await supabase.from('work_tiles').insert({ title: 'New Tile', category: 'cinematic', description: '', sort_order: tiles.length + 1 }).select().single()
  if (error) { toast('Failed to add tile', 'error'); return }
  tiles.push(data); renderTiles()
  setTimeout(() => togglePanel(`tile-panel-${data.id}`, data.id), 50)
  toast('Tile added', 'success')
}

window.saveTile = async function(id) {
  const patch = {
    title: document.getElementById(`tile-title-${id}`).value,
    category: document.getElementById(`tile-cat-${id}`).value,
    description: document.getElementById(`tile-desc-${id}`).value,
    sort_order: parseInt(document.getElementById(`tile-sort-${id}`).value) || 0,
    is_wide: document.getElementById(`tile-wide-${id}`).checked,
  }
  const { error } = await supabase.from('work_tiles').update(patch).eq('id', id)
  if (error) { toast('Save failed', 'error'); return }
  const idx = tiles.findIndex(t => t.id === id)
  if (idx > -1) tiles[idx] = { ...tiles[idx], ...patch }
  renderTiles()
  toast('Tile saved', 'success')
}

window.deleteTile = async function(id) {
  if (!confirm('Delete this tile?')) return
  const { error } = await supabase.from('work_tiles').delete().eq('id', id)
  if (error) { toast('Delete failed', 'error'); return }
  tiles = tiles.filter(t => t.id !== id)
  renderTiles()
  toast('Tile deleted', 'success')
}

window.toggleTileVisible = async function(id, visible) {
  const { error } = await supabase.from('work_tiles').update({ visible }).eq('id', id)
  if (error) { toast('Update failed', 'error'); return }
  const idx = tiles.findIndex(t => t.id === id)
  if (idx > -1) tiles[idx].visible = visible
  toast(visible ? 'Tile visible' : 'Tile hidden', 'success')
}

async function loadServices() {
  const { data, error } = await supabase.from('services').select('*').order('sort_order')
  if (error) { toast('Failed to load services', 'error'); return }
  services = data || []
  renderServices()
}

function renderServices() {
  const list = document.getElementById('services-list')
  if (!services.length) { list.innerHTML = '<div style="padding:1.5rem;color:var(--ash);font-size:0.8rem;">No services yet.</div>'; return }
  list.innerHTML = services.map(s => `
  <div id="srow-${s.id}">
    <div class="tile-row">
      <span class="tile-drag">:</span>
      <div>
        <div class="tile-row-title">${esc(s.title)}</div>
        <div class="tile-row-cat">${esc(s.subtitle)}</div>
      </div>
      <span class="tile-row-badge">${esc(s.index_label)}</span>
      <div class="toggle-wrap">
        <label class="toggle">
          <input type="checkbox" ${s.visible ? 'checked' : ''} onchange="toggleServiceVisible('${s.id}', this.checked)">
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
      </div>
      <div class="tile-row-actions">
        <button class="btn btn-ghost btn-sm" onclick="togglePanel('svc-panel-${s.id}', '${s.id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">X</button>
      </div>
    </div>
    <div class="edit-panel" id="svc-panel-${s.id}">
      <div class="edit-panel-header">Editing Service</div>
      <div class="field-group triple">
        <div class="field">
          <label>Index</label>
          <input type="text" id="svc-idx-${s.id}" value="${esc(s.index_label)}" maxlength="4">
        </div>
        <div class="field">
          <label>Title</label>
          <input type="text" id="svc-title-${s.id}" value="${esc(s.title)}" maxlength="60">
        </div>
        <div class="field">
          <label>Subtitle</label>
          <input type="text" id="svc-sub-${s.id}" value="${esc(s.subtitle)}" maxlength="60">
        </div>
      </div>
      <div class="field-group single">
        <div class="field">
          <label>Description</label>
          <textarea id="svc-desc-${s.id}" rows="3" maxlength="400">${esc(s.description)}</textarea>
        </div>
      </div>
      <div class="field-group">
        <div class="field">
          <label>Tags (comma-separated)</label>
          <input type="text" id="svc-tags-${s.id}" value="${(s.tags || []).join(', ')}">
        </div>
        <div class="field">
          <label>Sort Order</label>
          <input type="number" id="svc-sort-${s.id}" value="${s.sort_order}" min="0">
        </div>
      </div>
      <div class="panel-actions">
        <button class="btn btn-primary btn-sm" onclick="saveService('${s.id}')">Save</button>
        <button class="btn btn-ghost btn-sm" onclick="togglePanel('svc-panel-${s.id}')">Cancel</button>
      </div>
    </div>
  </div>`).join('')
}

window.addService = async function() {
  const { data, error } = await supabase.from('services').insert({ index_label: `0${services.length+1}`, title: 'New Service', subtitle: '', description: '', tags: [], sort_order: services.length + 1 }).select().single()
  if (error) { toast('Failed to add service', 'error'); return }
  services.push(data); renderServices()
  setTimeout(() => togglePanel(`svc-panel-${data.id}`, data.id), 50)
  toast('Service added', 'success')
}

window.saveService = async function(id) {
  const tagsVal = document.getElementById(`svc-tags-${id}`).value
  const tags = tagsVal ? tagsVal.split(',').map(t => t.trim()).filter(Boolean) : []
  const patch = {
    index_label: document.getElementById(`svc-idx-${id}`).value,
    title: document.getElementById(`svc-title-${id}`).value,
    subtitle: document.getElementById(`svc-sub-${id}`).value,
    description: document.getElementById(`svc-desc-${id}`).value,
    sort_order: parseInt(document.getElementById(`svc-sort-${id}`).value) || 0,
    tags,
  }
  const { error } = await supabase.from('services').update(patch).eq('id', id)
  if (error) { toast('Save failed', 'error'); return }
  const idx = services.findIndex(s => s.id === id)
  if (idx > -1) services[idx] = { ...services[idx], ...patch }
  renderServices()
  toast('Service saved', 'success')
}

window.deleteService = async function(id) {
  if (!confirm('Delete this service?')) return
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) { toast('Delete failed', 'error'); return }
  services = services.filter(s => s.id !== id)
  renderServices()
  toast('Service deleted', 'success')
}

window.toggleServiceVisible = async function(id, visible) {
  const { error } = await supabase.from('services').update({ visible }).eq('id', id)
  if (error) { toast('Update failed', 'error'); return }
  const idx = services.findIndex(s => s.id === id)
  if (idx > -1) services[idx].visible = visible
  toast(visible ? 'Service visible' : 'Service hidden', 'success')
}

window.togglePanel = function(panelId) {
  const panel = document.getElementById(panelId)
  if (!panel) return
  const isOpen = panel.classList.contains('open')
  if (openPanelId && openPanelId !== panelId) document.getElementById(openPanelId)?.classList.remove('open')
  panel.classList.toggle('open', !isOpen)
  openPanelId = !isOpen ? panelId : null
}

window.showSection = function(section, btn) {
  document.querySelectorAll('[id^="section-"]').forEach(el => el.classList.add('section-hidden'))
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'))
  document.getElementById(`section-${section}`)?.classList.remove('section-hidden')
  if (btn) btn.classList.add('active')
}

function esc(str) { if (!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1) }
function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container')
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.textContent = msg
  container.appendChild(el)
  setTimeout(() => el.remove(), 3000)
}

init()
