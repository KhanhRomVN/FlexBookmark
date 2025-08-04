document.addEventListener('DOMContentLoaded', () => {
  // Theme handling
  function applyTheme(theme, backgroundImage) {
    const root = document.documentElement;
    if (theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-image');
    document.body.classList.add(`theme-${theme}`);
    if (theme === 'image' && backgroundImage) {
      document.body.style.backgroundImage = `url(${backgroundImage})`;
    } else {
      document.body.style.backgroundImage = '';
    }
  }
  chrome.storage.local.get(['theme', 'backgroundImage'], result => {
    const theme = result.theme || 'light';
    const bgImage = result.backgroundImage;
    applyTheme(theme, bgImage);
  });
// Theme toggle UI
const themeBtn = document.getElementById('theme-btn');
const themeDropdown = document.getElementById('theme-dropdown');
themeBtn.addEventListener('click', e => {
  e.stopPropagation();
  themeDropdown.style.display = themeDropdown.style.display === 'block' ? 'none' : 'block';
});
document.addEventListener('click', () => {
  themeDropdown.style.display = 'none';
});
themeDropdown.querySelectorAll('button[data-theme]').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.dataset.theme;
    chrome.storage.local.set({ theme: t });
    applyTheme(t);
    themeDropdown.style.display = 'none';
  });
});

  // Auto-fill form from active tab
  const form = document.getElementById('bookmark-form');
  const titleInput = document.getElementById('bookmark-title');
  const urlInput = document.getElementById('bookmark-url');
  let selectedFolderId = null;

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (tab) {
      titleInput.value = tab.title;
      urlInput.value = tab.url;
    }
  });

  // Build folder tree with expand/collapse
  const container = document.getElementById('folder-tree');

  function buildList(nodes) {
    const ul = document.createElement('ul');
    nodes.forEach(node => {
      if (node.url) return;
      const li = document.createElement('li');
      li.textContent = node.title || 'Untitled';
      li.dataset.id = node.id;
      li.classList.add('folder');
      // find subfolders
      const children = (node.children || []).filter(c => !c.url);
      if (children.length) {
        const childUl = buildList(children);
        childUl.style.display = 'none';
        li.appendChild(childUl);
        li.addEventListener('click', e => {
          e.stopPropagation();
          const isHidden = childUl.style.display === 'none';
          childUl.style.display = isHidden ? 'block' : 'none';
          li.classList.toggle('expanded', isHidden);
          selectFolder(li, node.id);
        });
      } else {
        li.addEventListener('click', e => {
          e.stopPropagation();
          selectFolder(li, node.id);
        });
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function selectFolder(li, id) {
    container.querySelectorAll('li.selected').forEach(el =>
      el.classList.remove('selected')
    );
    li.classList.add('selected');
    selectedFolderId = id;
  }

  chrome.bookmarks.getTree(tree => {
    container.innerHTML = '';
    const root = tree[0];
    const list = buildList(root.children || []);
    if (list && list.childElementCount) {
      container.appendChild(list);
    } else {
      container.textContent = 'No folders found.';
    }
  });

  // Handle form submission
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!selectedFolderId) {
      alert('Please select a folder.');
      return;
    }
    chrome.bookmarks.create(
      {
        parentId: selectedFolderId,
        title: titleInput.value,
        url: urlInput.value
      },
      () => {
        window.close();
      }
    );
  });
});