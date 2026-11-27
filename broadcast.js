(() => {
  const card = byId('webinar-card');
  const screen = byId('webinar-broadcast');
  const controls = byId('broadcast-controls');
  const stage = byId('broadcast-stage');
  const share = byId('broadcast-share');
  const slides = byId('broadcast-slides');
  const settingsButton = byId('broadcast-settings-button');
  const settingsPanel = byId('broadcast-settings');
  const settingsLayouts = byId('broadcast-settings-layouts');
  const positionField = byId('broadcast-position-options');
  const positionSelect = controls.elements.position;
  const corners = Array.from(positionSelect.options, option => [option.value, option.text]);
  let selectedCorner = positionSelect.value;
  const presenters = [
    { name: 'Вы', files: ['14129.png', 'e466a.png', 'd02ca.png'] },
    { name: 'Александр Григорьев', files: ['e6bfa.png'] },
    { name: 'Светлана Синицина', files: ['5e82d.png'] },
    { name: 'Ксения Макарова', files: ['6114f.png'] },
    { name: 'Елена Соколова', sprite: 0 },
    { name: 'Дмитрий Волков', sprite: 1 },
    { name: 'Анна Ким', sprite: 2 },
    { name: 'Илья Морозов', sprite: 3 },
    { name: 'Амина Каримова', sprite: 4 },
    { name: 'Роман Лебедев', sprite: 5 },
    { name: 'Мария Воронцова', sprite: 6 },
    { name: 'Тимур Ахметов', sprite: 7 },
  ];
  const templateShapes = ['rectangle', 'rectangle', 'circle', 'rectangle'];
  let customCameraSize;
  let settingsInitialConfig;

  function sceneState() {
    const selected = controls.elements.scene.value;
    const screenShare = controls.elements.screenShare.checked;
    const cameraCount = selected === 'material' ? 0 : Number(controls.elements.count.value);
    return { selected, screenShare, cameraCount, count: cameraCount + Number(screenShare),
      scene: selected === 'material' && screenShare ? 'both' : selected };
  }

  function renderSettingsLayouts() {
    window.webinarLayouts.endEmbedded();
    const { scene, count } = sceneState();
    const art = stage.querySelector('.composition-art');
    if (!art) return;
    const id = scene === 'material' ? 'material' : scene === 'both'
      ? (count > 1 ? 'groupSide' : 'side') : (count > 1 ? 'group' : 'host');
    const template = Number(controls.elements.template.value);
    // Use the same representative previews as the webinar card, not the live participant count.
    const slots = count > 1 ? 4 : count;
    const config = { kind: art.dataset.kind, shape: art.dataset.shape,
      ...(scene === 'both' && { template, corner: positionSelect.value, size: parseFloat(art.style.getPropertyValue('--camera-request')) }) };
    settingsInitialConfig = { ...config };
    window.webinarLayouts.beginEmbedded(settingsEditorContainer(), id, config, {
      slots,
      columns: scene === 'cameras' && slots > 1 ? 2 : 1,
      sceneWidth: art.clientWidth,
    });
  }

  function settingsEditorContainer() {
    const inline = controls.elements.settingsVariant.value === 'inline';
    settingsPanel.classList.toggle('broadcast-settings-inline', inline);
    settingsLayouts.closest('.broadcast-settings-layouts').hidden = inline;
    const preview = byId('broadcast-settings-preview');
    preview.querySelector('.video-preview').hidden = inline;
    return inline ? preview.querySelector('.video') : settingsLayouts;
  }

  function openSettings() {
    settingsPanel.hidden = false;
    settingsButton.setAttribute('aria-expanded', 'true');
    const preview = byId('broadcast-settings-preview');
    if (!preview.firstElementChild) preview.append(card.querySelector('.preview-panel').cloneNode(true));
    byId('broadcast-settings-variant-options').hidden = false;
    renderSettingsLayouts();
    settingsPanel.querySelector('.broadcast-settings-content').scrollTop = 0;
  }

  function closeSettings(restoreFocus = true, commit = false) {
    window.webinarLayouts.endEmbedded(commit);
    settingsPanel.hidden = true;
    byId('broadcast-settings-variant-options').hidden = true;
    settingsButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) settingsButton.focus({ preventScroll: true });
  }

  settingsButton.addEventListener('click', () => {
    if (settingsPanel.hidden) openSettings();
    else closeSettings();
  });
  byId('broadcast-settings-apply').addEventListener('click', () => {
    const config = window.webinarLayouts.embeddedConfig();
    if (config) {
      controls.elements.shape.value = config.shape;
      if (Number.isFinite(config.template)) {
        controls.elements.template.value = String(config.template);
        selectedCorner = config.corner ?? 'tr';
        if (config.size !== settingsInitialConfig?.size || config.template !== settingsInitialConfig?.template) {
          customCameraSize = config.size;
          const size = controls.elements.cameraSize;
          if (!size.querySelector('[value="custom"]')) size.add(new Option('Настроенный', 'custom'));
          size.value = 'custom';
        }
      }
    }
    closeSettings(true, true);
    render();
  });
  byId('broadcast-settings-close').addEventListener('click', () => closeSettings());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !settingsPanel.hidden) {
      event.preventDefault();
      if (window.webinarLayouts.dismissEmbeddedMenu()) return;
      closeSettings();
    }
  });

  function cameraVisual(index) {
    const { name, files, sprite } = presenters[index];
    const picture = files
      ? files.map(file => '<img src="assets/broadcast/' + file + '" alt="" draggable="false">').join('')
      : '<span class="camera-sprite" aria-hidden="true" style="--sprite-col:' + sprite % 2 +
        ';--sprite-row:' + Math.floor(sprite / 2) + '"></span>';
    return '<span class="camera-picture">' + picture + '</span><span class="broadcast-name" title="' + name + '"><span class="broadcast-name-text">' + name +
      '</span><span class="broadcast-speaking" role="img" aria-label="Говорит"></span></span>';
  }

  function screenShareVisual() {
    return '<span class="camera-picture broadcast-screen-picture" role="img" aria-label="Демонстрация рабочего стола">' +
      '<span class="screen-share-desktop"><span class="screen-share-browser"><i></i><i></i><i></i><span></span></span>' +
      '<span class="screen-share-page"><span class="screen-share-sidebar"><i></i><i></i><i></i><i></i></span>' +
      '<span class="screen-share-document"><strong>План вебинара</strong><span></span><span></span><span></span>' +
      '<span class="screen-share-chart"><i></i><i></i><i></i><i></i><i></i></span><span></span></span></span></span></span>' +
      '<span class="broadcast-name" title="Показ экрана"><span class="broadcast-name-text">Показ экрана</span></span>';
  }

  function overflowAvatars(first, count) {
    const remaining = count - first;
    const visible = Math.min(3, remaining);
    return '<span class="broadcast-avatar-group">' +
      Array.from({ length: visible }, (_, offset) => {
        const index = first + offset;
        const hidden = offset === visible - 1 ? remaining - visible + 1 : 0;
        return '<span class="broadcast-avatar" title="' + presenters[index].name + '">' +
          cameraVisual(index) + (hidden ? overflowBadge(hidden) : '') + '</span>';
      }).join('') + '</span>';
  }

  function overflowBadge(count) {
    return '<span class="broadcast-overflow-badge" aria-label="Ещё ' + count + ' камер">+' + count + '</span>';
  }

  function positionOverlay() {
    if (stage.classList.contains('broadcast-camera-row')) return;
    const overlay = stage.querySelector('[data-kind="overlay"] .camera-windows');
    if (!overlay) return;
    const art = overlay.closest('.composition-art');
    const presentation = art.querySelector('.material-window').getBoundingClientRect();
    const area = art.querySelector('.composition-panels').getBoundingClientRect();
    const corner = art.dataset.corner;
    overlay.style.left = '';
    overlay.style.right = '';
    overlay.style.top = '';
    overlay.style.bottom = '';
    const camera = overlay.getBoundingClientRect();
    const css = getComputedStyle(overlay);
    const marginLeft = parseFloat(css.marginLeft) || 0;
    const marginRight = parseFloat(css.marginRight) || 0;
    const marginTop = parseFloat(css.marginTop) || 0;
    const desiredLeft = corner.endsWith('r')
      ? presentation.right - camera.width - marginRight
      : presentation.left + marginLeft;
    const left = Math.max(area.left, Math.min(desiredLeft, area.right - camera.width));
    overlay.style.left = left - area.left - marginLeft + 'px';
    overlay.style.right = 'auto';

    // Keep the existing top/bottom position when it already overlaps the slide.
    // If letterboxing separates the camera entirely from the slide, anchor it to the slide vertically as well.
    if (camera.bottom <= presentation.top || camera.top >= presentation.bottom) {
      const desiredTop = corner.startsWith('t') ? presentation.top + marginTop : presentation.bottom - camera.height;
      const top = Math.max(area.top, Math.min(desiredTop, area.bottom - camera.height));
      overlay.style.top = top - area.top - marginTop + 'px';
      overlay.style.bottom = 'auto';
    }
  }

  function positionSlides() {
    if (screen.hidden || slides.hidden) return;
    const presentation = stage.querySelector('.material-window').getBoundingClientRect();
    const area = stage.getBoundingClientRect();
    const bottomRow = stage.classList.contains('broadcast-row-bottom');
    const row = bottomRow ? stage.querySelector('.camera-windows').getBoundingClientRect() : null;
    const topRow = stage.classList.contains('broadcast-camera-row') && !bottomRow;
    slides.style.bottom = row ? area.bottom - row.top + 6 + 'px'
      : topRow ? area.bottom - presentation.bottom - slides.offsetHeight - 4 + 'px' : '';
    const overlay = stage.querySelector('[data-kind="overlay"] .camera-windows');
    const camera = overlay?.getBoundingClientRect();
    const overlayOnRight = camera && overlay.closest('.composition-art').dataset.corner.endsWith('r');
    const cameraAtBottom = camera && camera.bottom > area.bottom - slides.offsetHeight - 6;
    if (overlayOnRight && cameraAtBottom) {
      slides.style.left = presentation.left - area.left + 'px';
      slides.style.right = 'auto';
      slides.style.width = Math.max(0, Math.min(358, camera.left - presentation.left - 8)) + 'px';
    } else {
      slides.style.left = 'auto';
      slides.style.right = area.right - presentation.right + 'px';
      slides.style.width = Math.min(358, presentation.width) + 'px';
    }
  }

  let capacityKey;
  function sceneCapacity(scene, count, row, draft = {}) {
    if (count <= 1 || scene === 'material') return {};
    const css = getComputedStyle(stage);
    const height = stage.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
    const width = stage.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
    if (draft.halfGrid ?? stage.classList.contains('broadcast-half-grid')) {
      const halfWidth = Math.min((width - 4) / 2, height * 16 / 9);
      const minimum = Math.max(1, Math.min(144, halfWidth, height));
      const maxColumns = Math.max(1, Math.floor((halfWidth + 4) / (minimum + 4)));
      const maxRows = Math.max(1, Math.floor((height + 4) / (minimum + 4)));
      const slots = Math.min(count, maxColumns * maxRows);
      let columns = 1;
      let bestDiameter = 0;
      for (let candidate = 1; candidate <= Math.min(slots, maxColumns); candidate++) {
        const rows = Math.ceil(slots / candidate);
        const diameter = Math.min((halfWidth - 4 * (candidate - 1)) / candidate, (height - 4 * (rows - 1)) / rows);
        if (diameter > bestDiameter) {
          bestDiameter = diameter;
          columns = candidate;
        }
      }
      return { slots, columns };
    }
    if (row) {
      const stripHeight = Math.min(parseFloat(css.getPropertyValue('--camera-strip-request')), height * 0.24);
      const ratio = (draft.shape ?? controls.elements.shape.value) === 'rectangle' ? 16 / 9 : 1;
      const gap = 4;
      const cameraWidth = stripHeight * ratio;
      const fullCapacity = Math.floor((width + gap) / (cameraWidth + gap));
      if (fullCapacity >= count) return count === 4 ? {} : { slots: count };
      const avatarWidth = Math.min(width * 0.09, stripHeight / 2);
      const avatarGroupWidth = 3 * (avatarWidth + gap) + 8;
      const full = Math.max(1, Math.floor((width + gap - avatarGroupWidth) / (cameraWidth + gap)));
      return { slots: Math.min(count, full + 3), compactFrom: full };
    }
    if (scene === 'cameras') {
      const columns = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(count)), Math.floor((width + 4) / 128)));
      const rows = Math.max(1, Math.floor((height + 4) / 76));
      if (count === 4 && columns * rows >= count) return {};
      return { slots: Math.min(count, columns * rows), columns };
    }
    const slots = Math.min(count, Math.max(2, Math.floor((height - 8 + 4) / 80)));
    return count === 4 && slots === count ? {} : { slots };
  }

  new ResizeObserver(() => {
    if (screen.hidden) return;
    const row = stage.classList.contains('broadcast-camera-row');
    const { scene, count } = sceneState();
    const current = sceneCapacity(scene, count, row);
    if (JSON.stringify(current) !== capacityKey) render();
    else { positionOverlay(); positionSlides(); }
  }).observe(stage);

  function render() {
    const settings = new FormData(controls);
    const { selected, scene, count, screenShare, cameraCount } = sceneState();
    const multiple = count > 1;
    const id = scene === 'material' ? 'material' : scene === 'both'
      ? (multiple ? 'groupSide' : 'side') : (multiple ? 'group' : 'host');
    const template = Number(controls.elements.template.value);
    const half = template === 3;
    positionField.hidden = scene !== 'both';
    const canUseRow = scene === 'both' && multiple && !half;
    if (!positionField.hidden) {
      const sides = [['tl', 'Слева'], ['tr', 'Справа']];
      const choices = half ? sides :
        canUseRow ? [...sides, ['top', 'Сверху'], ['bottom', 'Снизу']] : corners;
      if (choices.some(([value, label], index) =>
        positionSelect.options[index]?.value !== value || positionSelect.options[index]?.text !== label
      ) || positionSelect.options.length !== choices.length) {
        positionSelect.replaceChildren(...choices.map(([value, label]) => new Option(label, value)));
      }
      const side = selectedCorner === 'top' || selectedCorner === 'bottom' ? 'tr' : selectedCorner;
      const rowSelected = canUseRow && ['top', 'bottom'].includes(selectedCorner);
      positionSelect.value = rowSelected ? selectedCorner : half || canUseRow ? 't' + side[1] : side;
    }
    const row = canUseRow && ['top', 'bottom'].includes(positionSelect.value);
    const bottomRow = row && positionSelect.value === 'bottom';
    const corner = scene === 'both' && !row ? positionSelect.value : undefined;
    const shape = cameraCount ? settings.get('shape') : 'rectangle';
    const overlayBottomRight = scene === 'both' && (template === 1 || template === 2) && corner === 'br';
    const canResize = scene === 'both' && (!half || multiple);
    const cameraSize = byId('broadcast-size-options');
    cameraSize.hidden = !canResize;
    const sizes = { small: 12, maximum: template === 0 ? 49.99 : 50 };
    const standard = overlayBottomRight && !multiple && shape === 'rectangle' ? 26 : undefined;
    const size = canResize ? (settings.get('cameraSize') === 'custom' ? customCameraSize : sizes[settings.get('cameraSize')] ?? standard) : undefined;
    slides.hidden = scene === 'cameras';
    stage.classList.toggle('broadcast-overlay-bottom-right', overlayBottomRight);
    const sideStack = !row && scene === 'both' && template === 0 && multiple;
    stage.classList.toggle('broadcast-side-stack', sideStack);
    stage.classList.toggle('broadcast-camera-row', row);
    stage.classList.toggle('broadcast-row-bottom', bottomRow);
    stage.classList.toggle('broadcast-half-grid', scene === 'both' && half && multiple && shape !== 'rectangle');
    const stripHeight = { small: '72px', standard: '100px', maximum: '124px' };
    stage.style.setProperty('--camera-strip-request', settings.get('cameraSize') === 'custom'
      ? Math.max(40, Math.min(124, (customCameraSize ?? 23) / 23 * 100)) + 'px'
      : stripHeight[settings.get('cameraSize')]);
    const verticalCameras = scene === 'both' && multiple && !row;
    stage.classList.toggle('broadcast-vertical-cameras', verticalCameras);
    stage.classList.toggle('broadcast-stage-with-slides', !slides.hidden && !overlayBottomRight && !verticalCameras && !bottomRow);
    const capacity = sceneCapacity(scene, count, row);
    capacityKey = JSON.stringify(capacity);
    const { slots, columns, compactFrom } = capacity;
    stage.classList.toggle('broadcast-overflow', Boolean(slots));
    stage.style.setProperty('--camera-grid-columns', columns ?? 4);
    const hiddenCount = slots && slots < count ? count - slots + 1 : 0;
    const cameraIndex = index => index - Number(screenShare);
    const cameraAt = index => screenShare && index === 0 ? screenShareVisual() : cameraVisual(cameraIndex(index));
    stage.innerHTML = window.webinarLayouts.draw(id, {
      template,
      corner,
      shape,
      size,
      slots,
      compactFrom,
      screenShare,
      camera: index => hiddenCount && index === slots - 1 && !(screenShare && index === 0)
        ? row ? cameraAt(index) + overflowBadge(hiddenCount) : overflowAvatars(cameraIndex(index), cameraCount)
        : cameraAt(index),
      material: `<span class="broadcast-slide-image" role="img" aria-label="Business Presentation">
        <img src="assets/broadcast/6a54b.png" alt="" draggable="false">
      </span><span class="broadcast-name">Вы</span>`,
    });
    positionOverlay();
    positionSlides();
    byId('broadcast-template-options').hidden = scene !== 'both';
    byId('broadcast-shape-options').hidden = !cameraCount;
    byId('broadcast-count-options').hidden = selected === 'material';
    share.classList.toggle('broadcast-active', scene !== 'cameras' || screenShare);
    share.setAttribute('aria-label', screenShare ? 'Показ экрана' : 'Показ презентации');
  }

  document.querySelector('.system').addEventListener('change', event => {
    if (event.target.name !== 'view') return;
    const live = event.target.value === 'broadcast';
    const windowSize = byId('preview-window-size');
    windowSize.querySelector('[value="narrow"]').hidden = !live;
    if (!live && windowSize.value === 'narrow') {
      windowSize.value = 'standard';
      windowSize.dispatchEvent(new Event('change'));
    }
    card.hidden = live;
    screen.hidden = !live;
    controls.hidden = !live;
    byId('card-system-footer').hidden = live;
    if (live) render();
    else closeSettings(false);
  });

  controls.addEventListener('submit', event => event.preventDefault());
  controls.addEventListener('change', event => {
    if (event.target.name === 'settingsVariant') {
      if (!settingsPanel.hidden) {
        window.webinarLayouts.moveEmbedded(settingsEditorContainer());
        settingsPanel.querySelector('.broadcast-settings-content').scrollTop = 0;
      }
      return;
    }
    if (event.target === positionSelect) {
      selectedCorner = positionSelect.value;
    }
    if (event.target.name === 'template') {
      controls.elements.shape.value = templateShapes[Number(event.target.value)];
    }
    render();
    if (!settingsPanel.hidden) renderSettingsLayouts();
  });
})();
