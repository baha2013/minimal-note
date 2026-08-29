const { invoke } = window.__TAURI__ ? (window.__TAURI__.core || window.__TAURI__.tauri) : { invoke: async () => {} };
const editor = document.getElementById('editor');
const themeBtn = document.getElementById('btn-theme');
const exportToggleBtn = document.getElementById('btn-export-toggle');
const exportMenu = document.getElementById('export-menu');
let saveTimeout = null;

if (window.__TAURI__ && window.__TAURI__.window) {
  const { getCurrentWindow } = window.__TAURI__.window;
  const appWindow = getCurrentWindow();
  document.getElementById('btn-minimize').addEventListener('click', () => appWindow.minimize());
  document.getElementById('btn-maximize').addEventListener('click', async () => {
    (await appWindow.isMaximized()) ? appWindow.unmaximize() : appWindow.maximize();
  });
  document.getElementById('btn-close').addEventListener('click', () => appWindow.close());
}

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  themeBtn.textContent = isLight ? '🌙' : '☀️';
  localStorage.setItem('app-theme', isLight ? 'light' : 'dark');
});

exportToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  exportMenu.classList.toggle('show');
});
document.addEventListener('click', () => exportMenu.classList.remove('show'));

editor.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D' || e.key === 'ي')) {
    e.preventDefault();
    const selection = window.getSelection();
    let listItem = selection.anchorNode;
    while (listItem && listItem.nodeName !== 'LI' && listItem !== editor) {
      listItem = listItem.parentNode;
    }
    if (listItem && listItem.nodeName === 'LI') listItem.classList.toggle('strikethrough');
    triggerAutoSave();
  }
  if (e.key === 'Tab') {
    e.preventDefault();
    e.shiftKey ? handleOutdent() : handleIndent();
    triggerAutoSave();
  }
});

function handleIndent() {
  const selection = window.getSelection();
  let listItem = selection.anchorNode;
  while (listItem && listItem.nodeName !== 'LI' && listItem !== editor) listItem = listItem.parentNode;
  if (!listItem) return;
  let currentUl = listItem.parentElement;
  let currentLevel = parseInt(currentUl.getAttribute('data-level') || '1', 10);
  if (currentLevel >= 4) return;
  const nextLevel = currentLevel + 1;
  const prevLi = listItem.previousElementSibling;
  if (prevLi) {
    let subUl = prevLi.querySelector('ul');
    if (!subUl) {
      subUl = document.createElement('ul');
      subUl.setAttribute('data-level', nextLevel);
      prevLi.appendChild(subUl);
    }
    subUl.appendChild(listItem);
  }
}

function handleOutdent() {
  const selection = window.getSelection();
  let listItem = selection.anchorNode;
  while (listItem && listItem.nodeName !== 'LI' && listItem !== editor) listItem = listItem.parentNode;
  if (!listItem) return;
  let currentUl = listItem.parentElement;
  let currentLevel = parseInt(currentUl.getAttribute('data-level') || '1', 10);
  if (currentLevel <= 1) return;
  const parentLi = currentUl.parentElement;
  if (parentLi && parentLi.tagName === 'LI') {
    parentLi.parentElement.insertBefore(listItem, parentLi.nextSibling);
    if (currentUl.children.length === 0) currentUl.remove();
  }
}

function triggerAutoSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (window.__TAURI__) await invoke('save_note', { content: editor.innerHTML });
  }, 500);
}
editor.addEventListener('input', triggerAutoSave);

window.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('app-theme') === 'light') {
    document.body.classList.add('light-mode');
    themeBtn.textContent = '🌙';
  }
  try {
    if (window.__TAURI__) {
      const saved = await invoke('load_note');
      editor.innerHTML = saved && saved.trim() !== '' ? saved : '<ul data-level="1"><li><br></li></ul>';
    } else {
      editor.innerHTML = '<ul data-level="1"><li>مرحباً بك في المفكرة الذكية</li></ul>';
    }
  } catch (err) {
    editor.innerHTML = '<ul data-level="1"><li><br></li></ul>';
  }
});