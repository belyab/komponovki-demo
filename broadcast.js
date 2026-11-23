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
    { name: 'Вы', files: ['14129.png', 'e466a.png', 'd02ca.png'] },
    { name: 'Александр Григорьев', files: ['e6bfa.png'] },
    { name: 'Светлана Синицина', files: ['5e82d.png'] },
    { name: 'Ксения Макарова', files: ['6114f.png'] },
  ];
  const templateShapes = ['rectangle', 'rectangle', 'circle', 'rectangle'];

  function cameraVisual(index) {
    const { name, files } = presenters[index];
    const picture = files.map(file => '<img src="assets/broadcast/' + file + '" alt="" draggable="false">').join('');
    return picture + '<span class="broadcast-name" title="' + name + '"><span class="broadcast-name-text">' + name +
      '</span><span class="broadcast-speaking" role="img" aria-label="Говорит"></span></span>';
  }

  function positionSlides() {
    if (screen.hidden || slides.hidden) return;
    const presentation = stage.querySelector('.material-window').getBoundingClientRect();
    const area = stage.getBoundingClientRect();
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

  new ResizeObserver(positionSlides).observe(stage);

  function render() {
    const settings = new FormData(controls);
    const multiple = settings.get('count') === '4';
    const scene = settings.get('scene');
    const id = scene === 'material' ? 'material' : scene === 'both'
      ? (multiple ? 'groupSide' : 'side') : (multiple ? 'group' : 'host');
    const template = Number(controls.elements.template.value);
    const half = template === 3;
    positionField.hidden = scene !== 'both';
    if (!positionField.hidden && positionSelect.options.length !== (half ? 2 : 4)) {
      const choices = half ? [['tl', 'Слева'], ['tr', 'Справа']] : corners;
      positionSelect.replaceChildren(...choices.map(([value, label]) => new Option(label, value)));
    }
    if (!positionField.hidden) {
      positionSelect.value = half ? 't' + selectedCorner[1] : selectedCorner;
    }
    const shape = settings.get('shape');
    const overlayBottomRight = scene === 'both' && (template === 1 || template === 2) && selectedCorner === 'br';
    const canResize = scene === 'both' && (!half || multiple);
    const cameraSize = byId('broadcast-size-options');
    cameraSize.hidden = !canResize;
    const sizes = { small: 12, maximum: template === 0 ? 49.99 : 50 };
    const standard = overlayBottomRight && !multiple && shape === 'rectangle' ? 26 : undefined;
    const size = canResize ? sizes[settings.get('cameraSize')] ?? standard : undefined;
    stage.innerHTML = window.webinarLayouts.draw(id, {
      template,
      corner: scene === 'both' ? selectedCorner : undefined,
      shape,
      size,
      camera: cameraVisual,
      material: `<span class="broadcast-slide-image" role="img" aria-label="Business Presentation">
        <img src="assets/broadcast/6a54b.png" alt="" draggable="false">
      </span><span class="broadcast-name">Вы</span>`,
    });
    slides.hidden = scene === 'cameras';
    stage.classList.toggle('broadcast-overlay-bottom-right', overlayBottomRight);
    stage.classList.toggle('broadcast-stage-with-slides', !slides.hidden && !overlayBottomRight);
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
      selectedCorner = positionSelect.options.length === 2
        ? selectedCorner[0] + positionSelect.value[1] : positionSelect.value;
    }
    if (event.target.name === 'template') {
      controls.elements.shape.value = templateShapes[Number(event.target.value)];
    }
    render();
  });
})();
