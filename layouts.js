(() => {
  const scenarios = {
    host: { label: 'Одна камера', cameras: 1 },
    side: { label: 'Одна камера + показ материала', cameras: 1, material: true },
    material: { label: 'Показ материала', cameras: 0, material: true },
    group: { label: 'Несколько камер', cameras: 4 },
    groupSide: { label: 'Несколько камер + показ материала', cameras: 4, material: true },
  };
  const groups = [
    { key: 'single', ids: ['host', 'side', 'material'] },
    { label: 'Несколько ведущих', key: 'multiple', ids: ['group', 'groupSide'] },
  ];
  const templates = [
    { label: 'Камера рядом с материалом', kind: 'side', shape: 'rectangle', corner: 'tr', size: 23 },
    { label: 'Прямоугольник поверх материала', kind: 'overlay', shape: 'rectangle', corner: 'br', size: 23 },
    { label: 'Круг поверх материала', kind: 'overlay', shape: 'circle', corner: 'br', size: 18 },
    { label: 'Поровну', kind: 'half', shape: 'rectangle', corner: 'tr', size: 50 },
  ];
  const shapes = { rectangle: 'Прямоугольник', square: 'Квадрат', circle: 'Круг' };
  const resizeEdges = { left: 'слева', right: 'справа', top: 'сверху', bottom: 'снизу' };
  const editor = byId('layout-editor');
  const stage = byId('layout-stage');
  const mockup = editor.closest('.desktop');
  const options = byId('layout-options');
  const grid = byId('layouts');
  const selected = { single: 'host', multiple: 'group' };
  let editingId;
  let menu;
  let history;
  let step;
  let gesture;
  let cameraIndex = 0;
  let skipClick = false;

  function defaults(id) {
    return scenarios[id].material ? { ...templates[0], template: 0 } : { kind: 'camera', shape: 'rectangle' };
  }

  const saved = Object.fromEntries(Object.keys(scenarios).map(id => [id, defaults(id)]));
  const savedTemplates = new Map();

  function art(id, config, editable = false, visuals) {
    const { cameras: defaultCount, material } = scenarios[id];
    const cameras = visuals?.slots ?? defaultCount;
    const adjustable = editable && material && (config.kind !== 'half' || cameras > 1);
    const cameraBase = editable ? '<img class="panel-art-base" src="assets/0d8b6.png" alt="" draggable="false">' : '';
    const cameraImage = '<span class="camera-picture">' + cameraBase + '<img src="assets/55be3.png" alt="" draggable="false"></span>';
    const materialImage = visuals?.material ?? '<img src="assets/c9824.png" alt="" draggable="false">';
    const windows = Array.from({ length: cameras }, (_, index) =>
      editable
        ? '<button type="button" class="camera-window" data-camera="' + index + '" aria-label="Форма камеры ' + (index + 1) + '">' + cameraImage + '</button>'
        : '<span class="camera-window' + (index >= (visuals?.compactFrom ?? Infinity) ? ' camera-compact' : '') + '">' + (visuals ? visuals.camera(index) : cameraImage) + '</span>'
    ).join('');
    const kind = !cameras ? 'material' : config.kind;
    return '<div class="composition-art" data-kind="' + kind + '" data-count="' + cameras + '" data-shape="' + config.shape +
      '" data-corner="' + (config.corner ?? 'tr') + '"' + (kind === 'half' || (kind === 'side' && config.size === 50) ? ' data-even' : '') + ' style="--camera-request:' + (config.size ?? 23) + 'cqw' +
      (visuals?.slots ? ';--overflow-slots:' + cameras : '') + '"><div class="composition-panels">' +
      (material ? '<div class="material-slot"><div class="material-window">' + materialImage + '</div></div>' : '') +
      (cameras ? '<div class="camera-windows">' + windows +
        (adjustable ? Object.entries(resizeEdges).map(([edge, label]) =>
          '<button class="camera-resize" type="button" data-resize="' + edge + '" aria-label="Изменить размер камеры ' + label + '"></button>'
        ).join('') : '') +
        '</div>' : '') + '</div></div>';
  }

  function renderCards(focusId, focusEdit) {
    grid.innerHTML = groups.map(({ label, key, ids }) =>
      '<section class="composition-group">' + (label ? '<h3>' + label + '</h3>' : '') + '<div class="composition-grid">' +
      ids.map(id => {
        const { label: title, cameras } = scenarios[id];
        const checked = selected[key] === id;
        return '<div class="composition-tile"><button type="button" class="layout-card" data-select="' + id +
          '" aria-label="' + title + '" aria-pressed="' + checked + '">' + art(id, saved[id]) + '</button>' +
          (cameras ? '<button type="button" class="composition-edit" data-edit="' + id + '" aria-label="Редактировать: ' + title + '">' + icon('e660') + '</button>' : '') +
          '</div>';
      }).join('') + '</div></section>'
    ).join('');
    if (focusId) grid.querySelector('[' + (focusEdit ? 'data-edit' : 'data-select') + '="' + focusId + '"]')?.focus();
  }

  function openEditor(id) {
    editingId = id;
    history = [saved[id]];
    step = 0;
    menu = '';
    renderEditor();
    positionEditor();
    editor.showModal();
  }

  function positionEditor() {
    const { left, top, width, height } = mockup.getBoundingClientRect();
    editor.style.setProperty('--editor-x', left + width / 2 + 'px');
    editor.style.setProperty('--editor-y', top + height / 2 + 'px');
    editor.style.setProperty('--editor-width', Math.max(0, width - 20) + 'px');
    editor.style.setProperty('--editor-height', Math.max(0, height - 20) + 'px');
    if (editor.open && menu === 'shape') positionShapeMenu(stage.querySelector('.camera-selected'));
  }

  new ResizeObserver(positionEditor).observe(mockup);
  window.addEventListener('scroll', positionEditor, { passive: true });
  window.addEventListener('resize', positionEditor);

  function update(next) {
    if (JSON.stringify(history[step]) !== JSON.stringify(next)) {
      history.splice(step + 1, Infinity, next);
      step += 1;
    }
    renderEditor();
  }

  function renderEditor() {
    const config = history[step];
    const canUseTemplates = scenarios[editingId].material;
    editor.querySelector('[data-command=templates]').disabled = !canUseTemplates;
    for (const command of ['previous', 'next']) {
      editor.querySelector('[data-command=' + command + ']').hidden = !canUseTemplates;
    }
    editor.querySelector('[data-command=undo]').disabled = step === 0;
    editor.querySelector('[data-command=redo]').disabled = step === history.length - 1;
    editor.querySelector('[data-command=reset]').disabled = JSON.stringify(config) === JSON.stringify(defaults(editingId));
    stage.innerHTML = art(editingId, config, true);
    options.hidden = !menu;
    options.removeAttribute('style');
    options.dataset.menu = menu;
    editor.querySelector('[data-command=templates]').setAttribute('aria-expanded', String(menu === 'templates'));
    if (menu === 'templates') {
      options.innerHTML = '<div class="template-heading"><h3>Шаблон</h3><button type="button" data-command="dismiss" aria-label="Закрыть шаблоны"><img src="assets/a9caf.svg" alt=""></button></div><div class="composition-grid">' + templates.map((template, index) =>
        '<button type="button" class="layout-card" data-template="' + index + '" aria-label="' + template.label +
        '" aria-pressed="' + (config.template === index) + '">' + art(editingId, template) + '</button>'
      ).join('') + '</div>';
    } else if (menu === 'shape') {
      const camera = stage.querySelector('[data-camera="' + cameraIndex + '"]');
      camera.classList.add('camera-selected');
      camera.setAttribute('aria-expanded', 'true');
      options.innerHTML = '<div class="shape-toolbar" role="group" aria-label="Форма камеры">' +
        '<button type="button" data-command="dismiss" aria-label="Закрыть выбор формы"><img src="assets/layout-arrow.svg" alt=""></button>' +
        ['rectangle', 'circle', 'square'].map(value =>
          '<button type="button" data-shape-choice="' + value + '" aria-label="' + shapes[value] +
          '" aria-pressed="' + (config.shape === value) + '"><span class="shape-sample" aria-hidden="true"></span></button>'
        ).join('') + '</div>';
      positionShapeMenu(camera);
    }
  }

  function positionShapeMenu(camera) {
    const dialogBox = editor.getBoundingClientRect();
    const box = camera.getBoundingClientRect();
    const width = options.offsetWidth;
    const left = Math.max(10, Math.min(box.left - dialogBox.left, editor.clientWidth - width - 10));
    options.style.left = left + 'px';
    options.style.top = Math.max(4, box.top - dialogBox.top - options.offsetHeight - 8) + 'px';
  }

  function chooseTemplate(index) {
    menu = '';
    const draft = history.slice(0, step + 1).findLast(config => config.template === index);
    const previous = savedTemplates.get(editingId)?.get(index);
    const { cameraOverrides } = history[step];
    update(draft ?? previous ?? {
      ...templates[index],
      template: index,
      ...(cameraOverrides && { ...cameraOverrides, cameraOverrides }),
    });
  }

  function customizeCamera(config, property, value) {
    if (config[property] === value) return config;
    return {
      ...config,
      [property]: value,
      cameraOverrides: { ...config.cameraOverrides, [property]: value },
    };
  }

  grid.addEventListener('click', event => {
    const edit = event.target.closest('[data-edit]');
    if (edit) {
      openEditor(edit.dataset.edit);
      return;
    }
    const select = event.target.closest('[data-select]');
    if (!select) return;
    const id = select.dataset.select;
    const { key } = groups.find(group => group.ids.includes(id));
    selected[key] = id;
    renderCards(id);
  });

  editor.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) {
      if (menu && !options.contains(event.target)) dismissMenu();
      return;
    }
    if (skipClick && (button.hasAttribute('data-camera') || button.hasAttribute('data-resize'))) {
      skipClick = false;
      return;
    }
    const config = history[step];
    const { command, template, shapeChoice, camera } = button.dataset;
    if (command === 'close') editor.close();
    if (command === 'apply') {
      saved[editingId] = { ...config };
      if (scenarios[editingId].material) {
        const configs = savedTemplates.get(editingId) ?? new Map();
        for (const draft of history.slice(0, step + 1)) configs.set(draft.template, draft);
        savedTemplates.set(editingId, configs);
      }
      editor.close();
    }
    if (command === 'previous' || command === 'next') {
      const direction = command === 'next' ? 1 : -1;
      chooseTemplate((config.template + direction + templates.length) % templates.length);
    }
    if (command === 'templates' || camera !== undefined) {
      const target = command ? 'templates' : 'shape';
      const sameCamera = camera === undefined || Number(camera) === cameraIndex;
      menu = menu === target && sameCamera ? '' : target;
      if (camera !== undefined) cameraIndex = Number(camera);
      renderEditor();
      if (menu) options.querySelector('button')?.focus();
      else if (camera !== undefined) stage.querySelector('[data-camera="' + cameraIndex + '"]').focus();
    }
    if (command === 'dismiss') dismissMenu();
    if (command === 'undo' || command === 'redo') {
      step += command === 'undo' ? -1 : 1;
      renderEditor();
    }
    if (command === 'reset') update(defaults(editingId));
    if (template !== undefined) chooseTemplate(Number(template));
    if (shapeChoice) {
      menu = '';
      update(customizeCamera(config, 'shape', shapeChoice));
      stage.querySelector('[data-camera="' + cameraIndex + '"]').focus();
    }
  });

  function dismissMenu() {
    const wasShape = menu === 'shape';
    menu = '';
    renderEditor();
    (wasShape ? stage.querySelector('[data-camera="' + cameraIndex + '"]') :
      editor.querySelector('[data-command=templates]')).focus();
  }

  editor.addEventListener('cancel', event => {
    if (!menu) return;
    event.preventDefault();
    dismissMenu();
  });

  function maxCameraSize(config, bounds) {
    const count = scenarios[editingId].cameras;
    if (count === 1) return 50;
    const side = config.kind === 'side';
    const gap = 4 * (count - 1);
    const inset = gap + (side ? 1 : config.kind === 'overlay' ? 8 : 0);
    const available = (bounds.height - inset) / count;
    const laneWidth = config.kind === 'half' ? (bounds.width - 4) / 2 : bounds.width;
    const maxWidth = Math.min(laneWidth, available * 16 / 9);
    return Math.min(50, Math.floor(maxWidth / bounds.width * 10000) / 100);
  }

  function resizeCamera(config, bounds, delta) {
    const maximum = maxCameraSize(config, bounds);
    const minimum = Math.min(maximum, 144 / bounds.width * 100);
    const initial = Math.max(minimum, Math.min(maximum, config.size));
    const size = Math.max(minimum, Math.min(maximum, initial + delta));
    return { size, next: size === initial ? config : customizeCamera(config, 'size', size) };
  }

  stage.addEventListener('keydown', event => {
    const edge = event.target.dataset.resize;
    if (!edge || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const increase = { left: 'ArrowLeft', right: 'ArrowRight', top: 'ArrowUp', bottom: 'ArrowDown' };
    const config = history[step];
    const bounds = stage.firstElementChild.getBoundingClientRect();
    const { next } = resizeCamera(config, bounds, event.key === increase[edge] ? 1 : -1);
    if (next === config) return;
    update(next);
    stage.querySelector('[data-resize="' + edge + '"]').focus();
  });

  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || !scenarios[editingId].material) return;
    const target = event.target.closest('[data-camera],[data-resize]');
    if (!target) return;
    skipClick = false;
    gesture = {
      pointer: event.pointerId, x: event.clientX, y: event.clientY,
      edge: target.dataset.resize,
      config: history[step],
      bounds: stage.firstElementChild.getBoundingClientRect(),
      cameraBox: stage.querySelector('.camera-windows').getBoundingClientRect(),
    };
    target.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', event => {
    if (gesture?.pointer !== event.pointerId) return;
    const { bounds, config, edge, x, y, cameraBox } = gesture;
    const dx = event.clientX - x;
    const dy = event.clientY - y;
    if (!gesture.next && Math.hypot(dx, dy) < 5) return;
    const art = stage.firstElementChild;
    if (menu) {
      menu = '';
      options.hidden = true;
      stage.querySelector('.camera-selected')?.classList.remove('camera-selected');
    }
    if (edge) {
      const horizontal = edge === 'left' || edge === 'right';
      const movement = horizontal ? dx : dy * cameraBox.width / cameraBox.height;
      const direction = edge === 'left' || edge === 'top' ? -1 : 1;
      const delta = Math.round(direction * movement / bounds.width * 100);
      const { size, next } = resizeCamera(config, bounds, delta);
      gesture.next = next;
      art.style.setProperty('--camera-request', size + 'cqw');
      art.toggleAttribute('data-even', config.kind === 'side' && size === 50);
      return;
    }

    const left = Math.max(0, Math.min(bounds.width - cameraBox.width, cameraBox.left - bounds.left + dx));
    const top = Math.max(0, Math.min(bounds.height - cameraBox.height, cameraBox.top - bounds.top + dy));
    const corner = (top + cameraBox.height / 2 < bounds.height / 2 ? 't' : 'b') +
      (left + cameraBox.width / 2 < bounds.width / 2 ? 'l' : 'r');
    gesture.next = customizeCamera(config, 'corner', corner);
    art.dataset.corner = corner;
    art.style.setProperty('--drag-left', left + 'px');
    art.style.setProperty('--drag-top', top + 'px');
    art.setAttribute('data-dragging', '');
  });

  stage.addEventListener('pointerup', event => {
    if (gesture?.pointer !== event.pointerId) return;
    if (gesture.next) {
      skipClick = true;
      setTimeout(() => { skipClick = false; }, 0);
      update(gesture.next);
    }
    gesture = null;
  });
  stage.addEventListener('pointercancel', () => {
    gesture = null;
    renderEditor();
  });

  editor.addEventListener('close', () => {
    const id = editingId;
    gesture = null;
    skipClick = false;
    renderCards(id, true);
  });

  window.webinarLayouts = Object.freeze({
    preview(id) {
      return { label: scenarios[id].label, markup: art(id, defaults(id)) };
    },
    draw(id, { template, shape, corner, size, ...visuals }) {
      const config = scenarios[id].material && scenarios[id].cameras
        ? templates[template] : defaults(id);
      return art(id, { ...config, shape, corner: corner ?? config.corner, size: size ?? config.size }, false, visuals);
    },
  });

  renderCards();
})();
