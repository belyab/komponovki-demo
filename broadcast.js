(() => {
  const card = byId('webinar-card');
  const screen = byId('webinar-broadcast');
  const controls = byId('broadcast-controls');
  const stage = byId('broadcast-stage');
  const share = byId('broadcast-share');
  const slides = byId('broadcast-slides');
  const positionField = byId('broadcast-position-options');
  const positionSelect = controls.elements.position;
  const corners = Array.from(positionSelect.options, option => [option.value, option.text]);
  let selectedCorner = positionSelect.value;
  const presenters = [
    { name: 'Михаил Орлов', files: ['14129.png', 'e466a.png', 'd02ca.png'] },
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

  function cameraVisual(index) {
    const { name, files, sprite } = presenters[index];
    const picture = files
      ? files.map(file => '<img src="assets/broadcast/' + file + '" alt="" draggable="false">').join('')
      : '<span class="camera-sprite" aria-hidden="true" style="--sprite-col:' + sprite % 2 +
        ';--sprite-row:' + Math.floor(sprite / 2) + '"></span>';
    return '<span class="camera-picture">' + picture + '</span><span class="broadcast-name" title="' + name + '"><span class="broadcast-name-text">' + name +
      '</span><span class="broadcast-speaking" role="img" aria-label="Говорит"></span></span>';
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
    if (stage.classList.contains('broadcast-overlay-bottom-right')) {
      const camera = stage.querySelector('.camera-windows').getBoundingClientRect();
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
  function sceneCapacity(scene, count, row) {
    if (count !== 12 || scene === 'material') return {};
    const css = getComputedStyle(stage);
    const height = stage.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
    const width = stage.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
    if (row) {
      const stripHeight = Math.min(parseFloat(css.getPropertyValue('--camera-strip-request')), height * 0.24);
      const ratio = controls.elements.shape.value === 'rectangle' ? 16 / 9 : 1;
      const gap = 4;
      const cameraWidth = stripHeight * ratio;
      const fullCapacity = Math.floor((width + gap) / (cameraWidth + gap));
      if (fullCapacity >= count) return { slots: count };
      const avatarWidth = Math.min(width * 0.09, stripHeight / 2);
      const avatarGroupWidth = 3 * (avatarWidth + gap) + 8;
      const full = Math.max(1, Math.floor((width + gap - avatarGroupWidth) / (cameraWidth + gap)));
      return { slots: Math.min(count, full + 3), compactFrom: full };
    }
    if (scene === 'cameras') {
      const columns = Math.max(2, Math.min(4, Math.floor((width + 4) / 128)));
      const rows = Math.max(1, Math.floor((height + 4) / 76));
      return { slots: Math.min(count, columns * rows), columns };
    }
    return { slots: Math.min(count, Math.max(2, Math.floor((height - 8 + 4) / 80))) };
  }

  new ResizeObserver(() => {
    if (screen.hidden) return;
    const row = stage.classList.contains('broadcast-camera-row');
    const current = sceneCapacity(controls.elements.scene.value, Number(controls.elements.count.value), row);
    if (JSON.stringify(current) !== capacityKey) render();
    else positionSlides();
  }).observe(stage);

  function render() {
    const settings = new FormData(controls);
    const count = Number(settings.get('count'));
    const multiple = count > 1;
    const scene = settings.get('scene');
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
    const shape = settings.get('shape');
    const overlayBottomRight = scene === 'both' && (template === 1 || template === 2) && corner === 'br';
    const canResize = scene === 'both' && (!half || multiple);
    const cameraSize = byId('broadcast-size-options');
    cameraSize.hidden = !canResize;
    const sizes = { small: 12, maximum: template === 0 ? 49.99 : 50 };
    const standard = overlayBottomRight && !multiple && shape === 'rectangle' ? 26 : undefined;
    const size = canResize ? sizes[settings.get('cameraSize')] ?? standard : undefined;
    slides.hidden = scene === 'cameras';
    stage.classList.toggle('broadcast-overlay-bottom-right', overlayBottomRight);
    const sideStack = !row && scene === 'both' && template === 0 && multiple;
    stage.classList.toggle('broadcast-side-stack', sideStack);
    stage.classList.toggle('broadcast-camera-row', row);
    stage.classList.toggle('broadcast-row-bottom', bottomRow);
    const stripHeight = { small: '72px', standard: '100px', maximum: '124px' };
    stage.style.setProperty('--camera-strip-request', stripHeight[settings.get('cameraSize')]);
    stage.classList.toggle('broadcast-stage-with-slides', !slides.hidden && !overlayBottomRight && !sideStack && !bottomRow);
    const capacity = sceneCapacity(scene, count, row);
    capacityKey = JSON.stringify(capacity);
    const { slots, columns, compactFrom } = capacity;
    stage.classList.toggle('broadcast-overflow', Boolean(slots));
    stage.style.setProperty('--camera-grid-columns', columns ?? 4);
    const hiddenCount = slots && slots < count ? count - slots + 1 : 0;
    stage.innerHTML = window.webinarLayouts.draw(id, {
      template,
      corner,
      shape,
      size,
      slots,
      compactFrom,
      camera: index => hiddenCount && index === slots - 1
        ? (row ? cameraVisual(index) : '') +
          '<span class="broadcast-overflow-badge" aria-label="Ещё ' + hiddenCount + ' камер">+' + hiddenCount + '</span>'
        : cameraVisual(index),
      material: `<span class="broadcast-slide-image" role="img" aria-label="Business Presentation">
        <img src="assets/broadcast/6a54b.png" alt="" draggable="false">
      </span><span class="broadcast-name">Вы</span>`,
    });
    positionSlides();
    byId('broadcast-template-options').hidden = scene !== 'both';
    byId('broadcast-shape-options').hidden = scene === 'material';
    byId('broadcast-count-options').hidden = scene === 'material';
    share.classList.toggle('broadcast-active', scene !== 'cameras');
  }

  document.querySelector('.system').addEventListener('change', event => {
    if (event.target.name !== 'view') return;
    const live = event.target.value === 'broadcast';
    card.hidden = live;
    screen.hidden = !live;
    controls.hidden = !live;
    byId('card-system-footer').hidden = live;
    if (live) render();
  });

  controls.addEventListener('submit', event => event.preventDefault());
  controls.addEventListener('change', event => {
    if (event.target === positionSelect) {
      selectedCorner = positionSelect.value;
    }
    if (event.target.name === 'template') {
      controls.elements.shape.value = templateShapes[Number(event.target.value)];
    }
    render();
  });
})();
