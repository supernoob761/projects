const form = document.getElementById('form')
const realForm = document.querySelector('#form form')
const nameInput = document.getElementById('name')
const fillform = document.querySelector('.popup')
const staffcon = document.querySelector('#staffList')
const imgInput = document.getElementById('imgInput')
const preview = document.getElementById('preview')
let currentEditingStaff = null
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{8,15}$/;



const ZONE_IDS = ['zone-staff-room','zone-archives','zone-security','zone-reception','zone-conference','zone-server']



const ROLE_RULES = {
  'zone-staff-room': ['Manager','Receptionist','Technicien IT','Security Agent','Cleaning Staff'],
  'zone-archives': ['Manager','Receptionist','Technicien IT','Security Agent'],
  'zone-security': ['Manager','Security Agent'],
  'zone-reception': ['Manager','Receptionist'],
  'zone-conference': ['Manager','Receptionist','Technicien IT','Security Agent','Cleaning Staff'],
  'zone-server': ['Manager','Technicien IT']
}

const ZONE_LIMITS = {
  'zone-staff-room': 21,
  'zone-archives': 2,
  'zone-security': 3,
  'zone-reception': 2,
  'zone-conference': 6,
  'zone-server': 2
}

let staffs = []

function saveAll() {
  try {
    localStorage.setItem('staffs_v1', JSON.stringify(staffs))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

function loadAll() {
  const raw = localStorage.getItem('staffs_v1')
  staffs = raw ? JSON.parse(raw) : []
  if (!Array.isArray(staffs)) staffs = []
}

function resetform() {
  if (realForm) realForm.reset()
  fillform.querySelectorAll('.experience_Form').forEach(exp => exp.remove())
  preview.src = ''
  preview.style.display = 'none'
  imgInput.value = ''
  if (preview.parentElement) preview.parentElement.classList.remove('has-image')
  const addBtn = document.querySelector('.Add button')
  if (addBtn) addBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> Add`
}

function OpenAdd() {
  resetform()
  form.classList.add('active')
  nameInput.focus()
}

function RemoveAdd() {
  form.classList.remove('active')
  resetform()
}

imgInput.addEventListener('change', function () {
  const file = this.files && this.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = function () {
    preview.src = reader.result || ''
    preview.style.display = preview.src ? 'block' : 'none'
    if (preview.parentElement) preview.parentElement.classList.add('has-image')
  }
  reader.readAsDataURL(file)
})

function generateId() {
  return 's_' + Date.now() + Math.random().toString(36).slice(2,9)
}

function safeText(v){ return (v===null||v===undefined)?'':String(v) }




function renderUnassignedStaff() {
  staffcon.innerHTML = ''
  staffs.filter(s => !s.location).forEach(staff => {
    const card = document.createElement('div')
    card.className = 'staff-card'
    card.dataset.id = staff.id
    card.innerHTML = `
      <div class="staff-photo"><img src="${safeText(staff.photo) || 'default.png'}" alt="Staff Photo"></div>
      <div class="staff-info"><h3><i class="fa-solid fa-user"></i> ${escapeHtml(staff.name)}</h3><p>${escapeHtml(staff.Role)}</p></div>
      <button class="delete-staff" title="Delete"><i class="fa-solid fa-trash"></i></button>
    `
    card.addEventListener('click', () => showProfile(staff))


    const delBtn = card.querySelector('.delete-staff')
    if (delBtn) {
      delBtn.addEventListener('click', e => {
        e.stopPropagation()
        e.stopImmediatePropagation()
        if (confirm(`delete?`)) {
          staffs = staffs.filter(s => s.id !== staff.id)
          saveAll()
          renderUnassignedStaff()
          renderAllZones()
        }
        else{
          alert('Why are Like This?')
          saveAll()
          renderUnassignedStaff()
          renderAllZones()
        }
      })
    }
    staffcon.appendChild(card)
  })
}

function renderAllZones() {
  ZONE_IDS.forEach(zoneId => {
    const zone = document.getElementById(zoneId)
    if (!zone) return
    const list = zone.querySelector('.staff-in-zone-list')
    if (!list) return
    list.innerHTML = ''
    const assigned = staffs.filter(s => s.location === zoneId)
    assigned.forEach(staff => {
      const li = document.createElement('li')
      li.className = 'zone-staff'
      li.dataset.id = staff.id
      li.innerHTML = `<img src="${safeText(staff.photo) || 'default.png'}" alt="${escapeHtml(staff.name)}"><span class="zone-staff-name">${escapeHtml(staff.name)} <small>(${escapeHtml(staff.Role)})</small></span><button class="remove-from-zone" title="Remove">×</button>`
      const removeBtn = li.querySelector('.remove-from-zone')
      if (removeBtn) removeBtn.addEventListener('click', e => { e.stopPropagation(); removeFromZone(staff.id) })
      li.addEventListener('click', () => showProfile(staff ,zoneId))
      list.appendChild(li)
    })
    zone.classList.toggle('full', assigned.length >= ZONE_LIMITS[zoneId])
    warning(['zone-archives','zone-server','zone-reception','zone-security'])
  })
}

realForm && realForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const nameValue = fillform.querySelector('#name').value.trim();
  const roleValue = fillform.querySelector('#genre').value;
  const emailValue = fillform.querySelector('#email_main').value.trim();
  const phoneValue = fillform.querySelector('#phone').value.trim();

  let allFilled = true;
  [nameValue, roleValue, emailValue, phoneValue].forEach((val, i) => {
    const input = [ '#name', '#genre', '#email_main', '#phone' ][i];
    const el = fillform.querySelector(input);
    if (!el) return
    if (!val) {
      el.style.border = '2px solid red';
      allFilled = false;
    } else {
      el.style.border = '';
    }
  });
  if (!allFilled) {
    alert('fill everything, you got time i don not.');
    return;
  }

  if (!emailRegex.test(emailValue)) {
    alert('Problem man : email.');
    return;
  }

  if (!phoneRegex.test(phoneValue)) {
    alert('Problem man : phone.');
    return;
  }

  let expValid = true;
  const expForms = fillform.querySelectorAll('.experience_Form');

  expForms.forEach(exp => {
    const company = exp.querySelector('.Company');
    const role = exp.querySelector('.Role');
    const from = exp.querySelector('.exp-from');
    const to = exp.querySelector('.exp-to');

    ;[company, role, from, to].forEach(input => {
      if (!input || !input.value || !input.value.trim()) {
        if (input) input.style.border = '2px solid red';
        expValid = false;
      } else {
        if (input) input.style.border = '';
      }
    });

    if (from && to && from.value && to.value && new Date(from.value) > new Date(to.value)) {
      alert(`wrong`);
      expValid = false;
    }
  });

  if (!expValid) {
    alert("don't satrt an argument plz.");
    return;
  }

  const photoValue = preview.src && preview.src.indexOf('data:') === 0 ? preview.src : (preview.src || null)

  const info = {
    id: currentEditingStaff ? currentEditingStaff.id : generateId(),
    name: nameValue,
    Role: roleValue,
    email: emailValue,
    phone: phoneValue,
    photo: photoValue || null,
    Experience: [],
    location: currentEditingStaff ? (currentEditingStaff.location || null) : null
  };

  expForms.forEach(exp => {
    info.Experience.push({
      company: exp.querySelector('.Company').value,
      role: exp.querySelector('.Role').value,
      from: exp.querySelector('.exp-from').value,
      to: exp.querySelector('.exp-to').value
    });
  });

  saveAll();
  RemoveAdd();
  renderUnassignedStaff();
  renderAllZones();
});

function AddExperiance(data) {
  const container = document.getElementById('Extra_crap')
  const formDiv = document.createElement('div')
  formDiv.className = 'experience_Form'
  formDiv.innerHTML = `
    <input type="text" class="Company" placeholder="Company Name" value="${data?.company ? escapeAttr(data.company) : ''}">
    <input type="text" class="Role" placeholder="Your Role" value="${data?.role ? escapeAttr(data.role) : ''}">
    <input class="exp-input exp-from" type="text" placeholder="From" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" value="${data?.from ? escapeAttr(data.from) : ''}">
    <input class="exp-input exp-to" type="text" placeholder="To" onfocus="this.type='date'" onblur="if(!this.value)this.type='text'" value="${data?.to ? escapeAttr(data.to) : ''}">
    <div class="removeexp"><button type="button" class="rm-exp"><i class="fa-solid fa-trash"></i> delete</button></div>
  `
  container.appendChild(formDiv)
  const rm = formDiv.querySelector('.rm-exp')
  if (rm) rm.addEventListener('click', () => { 
    if(confirm('Are you sure you want to delete this experience?')) formDiv.remove() 
  })
}

function Removeexp(button) {
  const el = button.closest('.experience_Form')
  if (el && confirm('Are you sure you want to delete this experience?')) el.remove()
}

document.addEventListener('DOMContentLoaded', () => {
  loadAll()
  renderUnassignedStaff()
  renderAllZones()
  const searchInput = document.getElementById('search')
  const categoryButtons = document.querySelectorAll('.Category_sel a')
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.toLowerCase()
      document.querySelectorAll('.staff-card').forEach(card => { 
        const title = card.querySelector('.staff-info h3')
        card.style.display = title && title.textContent.toLowerCase().includes(term) ? '' : 'none' 
      })
    })
  }
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault()
      const category = btn.textContent.trim().toLowerCase()
      document.querySelectorAll('.staff-card').forEach(card => {
        const catEl = card.querySelector('.staff-info p')
        const cardCategory = catEl ? catEl.textContent.trim().toLowerCase() : ''
        card.style.display = (category === 'all' || cardCategory.includes(category)) ? '' : 'none'
      })
    })
  })
  document.querySelectorAll('.add-to-zone-btn').forEach(btn => btn.addEventListener('click', () => openZonePicker(btn.closest('.zone').id)))
})

function showProfile(staff , zoneId) {
  const old = document.querySelector('.profile')
  if (old) old.remove()
  const modal = document.createElement('div')
  modal.className = 'profile'
  modal.innerHTML = `
    <div class="the_info">
      <div class="priv_info"><img src="${safeText(staff.photo) || 'default.png'}" alt="profile_pic"><h2>${escapeHtml(staff.name)}</h2><p>${escapeHtml(staff.Role)}</p><h6>${humanZoneName(zoneId)}</h6></div>
      <div class="pub_info"><div class="email"><h4><i class="fa-solid fa-envelope"></i> ${escapeHtml(staff.email)}</h4></div><div class="phone"><h4><i class="fa-solid fa-phone"></i> ${escapeHtml(staff.phone)}</h4></div></div>
      <div class="experiance"><h2><i class="fa-solid fa-suitcase"></i> Experience</h2><div class="experiance_cards"></div></div>
      <div class="profile_buttons"><button class="Back"><i class="fa-solid fa-arrow-left"></i> Go Back</button><div>
    </div>
  `
  document.body.appendChild(modal)
  modal.classList.add('active')
  const expContainer = modal.querySelector('.experiance_cards')
  if (Array.isArray(staff.Experience)) staff.Experience.forEach(exp => {
    const card = document.createElement('div')
    card.className = 'experiance_card'
    card.innerHTML = `<div class="companyna"><h4>${escapeHtml(exp.company||'')}</h4><h4>${escapeHtml(exp.role||'')}</h4></div><div class="dates"><p>${escapeHtml(exp.from||'')}</p><p>${escapeHtml(exp.to||'')}</p></div>`
    expContainer.appendChild(card)
  })
  const editBtn = modal.querySelector('.Edit')
  const backBtn = modal.querySelector('.Back')
  if (backBtn) backBtn.addEventListener('click', () => modal.remove())
}

function humanZoneName(zoneId) {
  const map = {'zone-staff-room':'Staff Room','zone-archives':'Archives','zone-security':'Security Room','zone-reception':'Reception','zone-conference':'Conference Room','zone-server':'Server Room'}
  return map[zoneId] || 'Unassigned'
}

function openZonePicker(zoneId) {
  const zone = document.getElementById(zoneId)
  if (!zone) return
  const allowed = ROLE_RULES[zoneId] || []
  const modal = document.createElement('div')
  modal.className = 'zone-picker'
  modal.innerHTML = `<div class="picker-inner"><div class="picker-header"><h3>Select staff for ${humanZoneName(zoneId)}</h3><button class="picker-close">×</button></div><div class="picker-list"></div></div>`
  document.body.appendChild(modal)
  const list = modal.querySelector('.picker-list')
  const candidateStaff = staffs.filter(s => !s.location && allowed.includes(s.Role))
  if (candidateStaff.length === 0) list.innerHTML = `<p class="no-candidates">No eligible unassigned staff available</p>`
  else candidateStaff.forEach(staff => {
    const item = document.createElement('div')
    item.className = 'picker-item'
    item.dataset.id = staff.id
    item.innerHTML = `<img src="${safeText(staff.photo)||'default.png'}" alt="${escapeHtml(staff.name)}"><div class="picker-meta"><div class="picker-name">${escapeHtml(staff.name)}</div><div class="picker-role">${escapeHtml(staff.Role)}</div></div><button class="picker-assign">Assign</button>`
    const assignBtn = item.querySelector('.picker-assign')
    if (assignBtn) assignBtn.addEventListener('click', () => { assignToZone(staff.id, zoneId); modal.remove() })
    list.appendChild(item)
  })
  const closeBtn = modal.querySelector('.picker-close')
  if (closeBtn) closeBtn.addEventListener('click', () => modal.remove())
}

function assignToZone(staffId, zoneId) {
  const staff = staffs.find(s => s.id === staffId)
  if (!staff) return
  const allowed = ROLE_RULES[zoneId] || []
  if (!(allowed.includes(staff.Role) || staff.Role === 'Manager')) { 
    alert(`${staff.name} (${staff.Role}) is not allowed in ${humanZoneName(zoneId)}`)
    return 
  }
  if (staffs.filter(s => s.location === zoneId).length >= ZONE_LIMITS[zoneId]){
    alert(`${humanZoneName(zoneId)} has reached its maximum capacity.`)
    return
}
  staff.location = zoneId
  saveAll()
  renderUnassignedStaff()
  renderAllZones()
}

function warning(zoneIds){
  if (!Array.isArray(zoneIds)) zoneIds = [zoneIds]

 zoneIds.forEach(zoneId=> {
  const zone = document.getElementById(zoneId)
 const felas = staffs.filter(s => s.location === zoneId)
 if(felas.length===0)
  zone.classList.add('danger')
else
  zone.classList.remove('danger')} )

}

function removeFromZone(staffId) {
  const staff = staffs.find(s => s.id === staffId)
  if (!staff) return
  staff.location = null
  saveAll()
  renderUnassignedStaff()
  renderAllZones()
}

window.addEventListener('beforeunload', () => { saveAll() })


function escapeHtml(str){ return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[s]) }
function escapeAttr(str){ return String(str || '').replace(/"/g, '&quot;') }
