const icon = (code) => '<span class="kit-icon" aria-hidden="true">&#x' + code + ';</span>';
const byId = (id) => document.getElementById(id);
const dialog = byId('dialog');
const notice = byId('notice');
let noticeTimeout;

function showNotice(message) {
  clearTimeout(noticeTimeout);
  notice.textContent = message;
  noticeTimeout = setTimeout(() => { notice.textContent = ''; }, 2400);
}

function openDialog(title, markup) {
  dialog.querySelector('h2').textContent = title;
  byId('dialog-content').innerHTML = markup;
  if (!dialog.open) dialog.showModal();
}

byId('help').addEventListener('click', () => openDialog(
  'Справка',
  '<p>Выберите компоновку и настройте вид участников и демонстрации.</p>',
));
byId('save').addEventListener('click', () => showNotice('Настройки сохранены в текущем сеансе'));
byId('publish').addEventListener('click', () => openDialog('Опубликовать вебинар', '<form method="dialog"><button class="apply" value="publish">Опубликовать в прототипе</button></form>'));
dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'publish') showNotice('Вебинар опубликован в прототипе');
  dialog.returnValue = '';
});
byId('close').addEventListener('click', () => {
  const webinar = document.querySelector('.webinar');
  webinar.hidden = !webinar.hidden;
  byId('close').innerHTML = webinar.hidden ? icon('eb9e') : '<img src="assets/a9caf.svg" alt="">';
  byId('close').setAttribute('aria-label', webinar.hidden ? 'Открыть панель' : 'Закрыть панель');
});


byId('preview-window-size').addEventListener('change', event => {
  document.querySelector('.prototype').dataset.windowSize = event.target.value;
});

document.querySelector('.card-reactions').addEventListener('click', event => {
  const button = event.target.closest('button[aria-pressed]');
  if (button) button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
});

const cardTabs = document.querySelector('.card-tabs');
const webinarCard = document.querySelector('#webinar-card .webinar');
cardTabs.addEventListener('click', event => {
  const tab = event.target.closest('[data-card-tab]');
  if (!tab) return;
  const plan = tab.dataset.cardTab === 'plan';
  webinarCard.dataset.cardTab = tab.dataset.cardTab;
  byId('card-transmission').hidden = plan;
  byId('card-plan').hidden = !plan;
  if (plan) renderPlan();
  else closePlanOverlays();
  for (const item of cardTabs.querySelectorAll('[data-card-tab]')) {
    if (item === tab) item.setAttribute('aria-current', 'true');
    else item.removeAttribute('aria-current');
    const button = item.querySelector('button');
    if (item === tab) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  byId('content').scrollTop = 0;
});

const planImage = (file, fit = 'cover') => `<img src="assets/plan/${file}" class="plan-image-${fit}" alt="" draggable="false">`;
const planMaterials = [
  { name: 'Презентация проекта', filename: 'Презентация проекта.pdf', cover: '6a54b.png', slides: ['6a54b.png','28cbb.png','1150c.png','b9f1e.png','bbe6f.png','27d06.png'] },
  { name: 'Сравнение создания события', filename: 'Сравнение создания события.pdf', cover: '5f8c5.png', slides: ['5f8c5.png'] },
];
const planPortraits = ['40e8a.png','a69d7.png','a3f76.png'];
const planRows = [
  { title: 'Добро пожаловать', description: '<p>Коротко пройдемся о основным изменения в нашем журнале</p>', preview: 'single', names: 'Дмитров Е.', ad: true, duration: 'Длительность' },
  { title: 'Презентация', description: '<p>Друзья, в этом году мы внесли несколько важных<br class="plan-wide-break"> обновлений, чтобы сделать наш журнал еще удобнее и<br class="plan-wide-break"> интереснее для вас:</p><div class="plan-presentation-text"><p><strong>Новый дизайн</strong> – более современный и удобный для чтения.</p><p><strong>Обновленные рубрики</strong> – добавили актуальные темы по<br class="plan-wide-break"> вашим запросам.</p><p><strong>Экспертные колонки</strong> – теперь у нас больше авторов-практиков.</p><p><strong>Удобный доступ</strong> – оптимизировали сайт и мобильное приложение.</p><p><strong>Интерактив</strong> – новые форматы: опросы, гайды, чек-листы.</p></div>', preview: 'presentation', names: 'Дмитров Е., Творогова Е., Федоров М.', attachment: true, duration: 'Длительность' },
  { title: 'Выступление экспертов', description: '<p>Представление экспертов. Рассказ об основных направлениях разработки</p>', preview: 'group', names: 'Дмитров Е., Творогова Е., Федоров М.', duration: '25 мин' },
  { title: 'Эксперты отвечают на вопросы', description: '<p>Ответы на вопросы от участников</p>', preview: 'group', names: 'Дмитров Е., Творогова Е., Федоров М.', duration: 'Длительность' },
  { title: 'Эксперты отвечают на вопросы', description: '<p>Поблагодарить за внимание и анонсировать следующие вебинары</p>', preview: 'single', names: 'Дмитров Е.', duration: '5 мин' },
];
const initialLayouts = ['host','groupSide','group','group','host'];
planRows.forEach((row, index) => { row.layout = initialLayouts[index]; row.material = row.attachment ? { file: 0, slide: 0 } : null; });
function emptyPlanRow() {
  return { title: 'Название пункта', description: '<p>Что задумано? Текст видят...</p>', names: '', layout: 'host', material: null, ad: true, duration: 'Длительность', empty: true };
}
planRows.push(emptyPlanRow());
const planMenu = byId('plan-layout-menu');
const materialPanel = byId('plan-material-panel');
let planMenuRow = null;
let materialRow = null;
let materialDraft = null;

function planPreview(row, index) {
  const material = row.material && planMaterials[row.material.file];
  const image = material ? planImage(material.slides[row.material.slide], 'contain') : planImage('c9824.png', 'contain');
  const info = window.webinarLayouts.sharedPreview(row.layout, {
    material: image + `<button type="button" class="plan-material-add" data-plan-material="${index}" aria-label="${material ? 'Выбрать другой материал' : 'Добавить материал'}"><span aria-hidden="true">&#xeadd;</span></button>`,
    camera: cameraIndex => `<span class="camera-picture">${planImage(row.names ? planPortraits[cameraIndex] ?? '0d8b6.png' : '0d8b6.png')}</span>`,
  });
  return `<div class="plan-layout-preview layout-card" data-plan-preview="${index}" aria-label="${info.label}">${info.markup}<button class="plan-preview-key" type="button" aria-label="Выбрать компоновку: ${row.title}"></button></div>`;
}

function planAttachment(row, index) {
  if (!row.material) return '';
  const file = planMaterials[row.material.file];
  return `<div class="plan-attachment"><span class="plan-pdf">${icon('e661')}</span><button type="button" data-plan-material="${index}" class="plan-attachment-link">${file.filename}</button><span class="plan-separator">${icon('e9ab')}</span><span class="plan-page-icon">${icon('e921')}</span><button type="button" data-plan-material="${index}" class="plan-attachment-link">Страница ${row.material.slide + 1}</button><button type="button" class="plan-attachment-remove" data-plan-remove="${index}" aria-label="Удалить материал"><img src="assets/plan/4f87a.svg" alt=""></button></div>`;
}

function renderPlan() {
  if (!window.webinarLayouts) return;
  byId('plan-list').innerHTML = planRows.map((row, index) => `<article class="plan-card${row.empty ? ' plan-card-empty' : ''}" data-plan-row="${index}">
  <header class="plan-card-header"><span class="plan-number">${index + 1}</span><h3>${row.title}</h3><span class="plan-card-actions" aria-hidden="true"><img src="assets/plan/1a625.svg" alt="">${icon('e65c')}</span></header>
  <div class="plan-card-body">
    <div class="plan-card-main"><div class="plan-card-description">${row.description}</div>
      <div class="plan-card-footer">${planAttachment(row, index)}
        <div class="plan-chips"><span class="plan-chip"><img src="assets/plan/e19ef.svg" alt="">Выступающие</span><span class="plan-chip">${index < 2 || row.empty ? icon('eb5b') : '<img src="assets/plan/2ac76.svg" alt="">'}${row.duration}</span>${row.ad ? `<span class="plan-chip plan-chip-ad">${icon('e6a3')}Реклама</span>` : ''}</div>
      </div>
    </div>
    <div class="plan-layout">${planPreview(row, index)}${row.names ? `<div class="plan-presenters"><span>На сцене:</span><span>${row.names}</span></div>` : ''}</div>
  </div>
</article>`).join('');
  if (planMenuRow !== null) renderPlanLayoutMenu();
}

byId('plan-add-row').addEventListener('click', () => {
  closePlanOverlays();
  planRows.push(emptyPlanRow());
  renderPlan();
  byId('plan-list').lastElementChild?.scrollIntoView({ block: 'nearest' });
});

function positionPlanLayoutMenu() {
  if (planMenuRow === null || planMenu.hidden) return;
  const anchor = byId('plan-list').querySelector(`[data-plan-preview="${planMenuRow}"]`);
  const desktop = byId('webinar-card').getBoundingClientRect();
  const card = webinarCard.getBoundingClientRect();
  const box = anchor.getBoundingClientRect();
  const width = planMenu.offsetWidth;
  const height = planMenu.offsetHeight;
  const x = Math.max(card.left + 6, Math.min(box.right - width, card.right - width - 6));
  const y = Math.max(desktop.top + 6, Math.min(box.top, desktop.bottom - height - 6));
  planMenu.style.left = `${x - desktop.left}px`;
  planMenu.style.top = `${y - desktop.top}px`;
}

function renderPlanLayoutMenu() {
  const row = planRows[planMenuRow];
  if (!row) return;
  const presenterCount = (row.names ?? '').split(',').map(name => name.trim()).filter(Boolean).length;
  const groups = window.webinarLayouts.sharedGroups().filter(group => presenterCount === 0 ||
    (presenterCount > 1 ? group.ids.some(layout => layout.cameras > 1) : group.ids.every(layout => layout.cameras <= 1)));
  planMenu.innerHTML = `<div class="plan-menu-heading"><div><h2>Шаблоны компоновок</h2><p>Заранее настройте расположение ведущих и материалов</p></div><button type="button" data-close-plan-menu aria-label="Закрыть"><img src="assets/plan/676e4.svg" alt=""></button></div>
    <div class="plan-menu-tiles">${groups.map(group => `<section class="composition-group">${groups.length > 1 && group.label ? `<h3>${group.label}</h3>` : ''}<div class="composition-grid">${group.ids.map(layout => `<div class="composition-tile"><button type="button" class="layout-card" data-plan-choose="${layout.id}" aria-label="${layout.label}" aria-pressed="${row.layout === layout.id}">${layout.markup}</button>${layout.cameras ? `<button type="button" class="composition-edit" data-plan-edit="${layout.id}" aria-label="Редактировать: ${layout.label}">${icon('e660')}</button>` : ''}</div>`).join('')}</div></section>`).join('')}</div>`;
  planMenu.hidden = false;
  positionPlanLayoutMenu();
}

function closePlanLayoutMenu() { planMenu.hidden = true; planMenuRow = null; }
function closePlanMaterialPanel() { materialPanel.hidden = true; materialRow = null; materialDraft = null; }
function closePlanOverlays() { closePlanLayoutMenu(); closePlanMaterialPanel(); }

function materialToolbar() {
  return `<aside class="toolbar plan-material-toolbar"><button type="button" data-material-close aria-label="Закрыть"><img src="assets/a9caf.svg" alt=""></button><div class="toolbar-end"><span class="toolbar-date">16<small>чт</small></span><span class="toolbar-icon" aria-hidden="true">&#xe636;</span><span class="toolbar-icon" aria-hidden="true">&#xe65d;</span><span class="plan-help-icon"><img src="assets/d9537.svg" alt=""></span></div></aside>`;
}

function renderMaterialPanel() {
  if (materialRow === null) return;
  if (materialDraft === null) {
    materialPanel.innerHTML = `<div class="plan-material-main"><header class="plan-material-header"><h2>Материалы</h2></header><div class="plan-material-gallery"><div class="plan-material-gallery-heading"><span class="plan-add">${icon('eadd')}</span><h3>Для всех</h3><small>Доступны всем во время трансляции</small></div><div class="plan-material-files">${planMaterials.map((file,i) => `<button type="button" class="plan-material-file" data-material-file="${i}">${planImage(file.cover)}<span class="plan-file-type">${icon('e6ff')}</span><span class="plan-file-title">${file.name}</span></button>`).join('')}</div></div></div>${materialToolbar()}`;
  } else {
    const { file, slide } = materialDraft;
    const document = planMaterials[file];
    materialPanel.innerHTML = `<div class="plan-material-main"><header class="plan-material-header"><h2>${document.filename}</h2><button type="button" class="plan-material-confirm" data-material-confirm>Выбрать</button></header><div class="plan-document"><div class="plan-document-preview"><div class="plan-document-page">${planImage(document.slides[slide], 'contain')}<span>${document.filename}</span></div></div><div class="plan-slide-list">${document.slides.map((src,i) => `<button type="button" class="plan-slide" data-material-slide="${i}" aria-pressed="${i === slide}" aria-label="Страница ${i + 1}">${planImage(src)}<span>${i + 1}</span></button>`).join('')}</div></div></div>${materialToolbar()}`;
  }
  materialPanel.hidden = false;
}

function openPlanMaterials(index) {
  closePlanLayoutMenu();
  materialRow = index;
  materialDraft = null;
  renderMaterialPanel();
}

byId('plan-list').addEventListener('click', event => {
  const material = event.target.closest('[data-plan-material]');
  if (material) { openPlanMaterials(Number(material.dataset.planMaterial)); return; }
  const remove = event.target.closest('[data-plan-remove]');
  if (remove) { planRows[Number(remove.dataset.planRemove)].material = null; renderPlan(); return; }
  const preview = event.target.closest('[data-plan-preview]');
  if (!preview) return;
  const index = Number(preview.dataset.planPreview);
  if (planMenuRow === index) closePlanLayoutMenu();
  else { planMenuRow = index; renderPlanLayoutMenu(); }
});

planMenu.addEventListener('click', event => {
  if (event.target.closest('[data-close-plan-menu]')) { closePlanLayoutMenu(); return; }
  const edit = event.target.closest('[data-plan-edit]');
  if (edit) {
    const id = edit.dataset.planEdit;
    window.webinarLayouts.editShared(id, () => {
      if (planMenuRow !== null) planMenu.querySelector(`[data-plan-edit="${id}"]`)?.focus({ preventScroll: true });
    });
    return;
  }
  const choice = event.target.closest('[data-plan-choose]');
  if (choice && planMenuRow !== null) {
    planRows[planMenuRow].layout = choice.dataset.planChoose;
    closePlanLayoutMenu();
    renderPlan();
  }
});

materialPanel.addEventListener('click', event => {
  if (event.target.closest('[data-material-close]')) { closePlanMaterialPanel(); return; }
  const file = event.target.closest('[data-material-file]');
  if (file) { const index = Number(file.dataset.materialFile); materialDraft = { file: index, slide: planRows[materialRow].material?.file === index ? planRows[materialRow].material.slide : 0 }; renderMaterialPanel(); return; }
  const slide = event.target.closest('[data-material-slide]');
  if (slide && materialDraft) { materialDraft.slide = Number(slide.dataset.materialSlide); renderMaterialPanel(); materialPanel.querySelector('[data-material-slide][aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' }); return; }
  if (event.target.closest('[data-material-confirm]') && materialDraft) {
    planRows[materialRow].material = { ...materialDraft };
    closePlanMaterialPanel();
    renderPlan();
  }
});

document.addEventListener('webinar-layouts-updated', () => { if (!byId('card-plan').hidden) renderPlan(); });
document.addEventListener('click', event => {
  if (planMenuRow !== null && !event.composedPath().some(node => node instanceof Element && node.matches('#plan-layout-menu, [data-plan-preview], #layout-editor'))) closePlanLayoutMenu();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || byId('layout-editor').open) return;
  if (!materialPanel.hidden) closePlanMaterialPanel();
  else if (!planMenu.hidden) closePlanLayoutMenu();
});
byId('content').addEventListener('scroll', positionPlanLayoutMenu, { passive: true });
window.addEventListener('resize', positionPlanLayoutMenu);
document.querySelector('.system').addEventListener('change', event => { if (event.target.name === 'view' && event.target.value === 'broadcast') closePlanOverlays(); });
