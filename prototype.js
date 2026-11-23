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
