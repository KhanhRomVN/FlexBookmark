document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle elements
  const themeToggle = document.getElementById('theme-toggle');
  const themeDropdown = document.getElementById('theme-dropdown');

  // Apply and persist theme
  function applyTheme(theme, bgImage) {
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-image');
    document.body.classList.add(`theme-${theme}`);
    if (theme === 'image' && bgImage) {
      document.body.style.backgroundImage = `url(${bgImage})`;
    } else {
      document.body.style.backgroundImage = '';
    }
    chrome.storage.local.set({ theme });
  }

  // Load saved theme
  chrome.storage.local.get(['theme', 'backgroundImage'], (result) => {
    const theme = result.theme || 'light';
    applyTheme(theme, result.backgroundImage);
  });

  // Toggle dropdown visibility
  themeToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('show');
  });
  document.addEventListener('click', (e) => {
    if (!themeDropdown.contains(e.target) && e.target !== themeToggle) {
      themeDropdown.classList.remove('show');
    }
  });

  // Theme selection buttons
  themeDropdown.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.dataset.theme;
      chrome.storage.local.get('backgroundImage', (res) => {
        applyTheme(selected, res.backgroundImage);
      });
      themeDropdown.classList.remove('show');
    });
  });

  // Elements for form & folder tree
  const form = document.getElementById('bookmark-form');
  const titleInput = document.getElementById('bookmark-title');
  const urlInput = document.getElementById('bookmark-url');
  const container = document.getElementById('folder-tree');
  let selectedFolderId = null;

  // Auto-fill from active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab) {
      titleInput.value = tab.title;
      urlInput.value = tab.url;
    }
  });

  // Build nested folder list
  function buildList(nodes, level = 0) {
    const ul = document.createElement('ul');
    ul.style.paddingLeft = level > 0 ? '16px' : '0';
    nodes.forEach((node) => {
      if (node.url) return;
      const li = document.createElement('li');
      li.textContent = node.title || 'Untitled';
      li.dataset.id = node.id;
      li.classList.add('folder');
      const children = (node.children || []).filter((c) => !c.url);
      if (!children.length) li.classList.add('leaf');
      if (children.length) {
        const childUl = buildList(children, level + 1);
        childUl.style.display = 'none';
        li.appendChild(childUl);
        li.addEventListener('click', (e) => {
          if (e.target !== li) return;
          e.stopPropagation();
          const hidden = childUl.style.display === 'none';
          childUl.style.display = hidden ? 'block' : 'none';
          li.classList.toggle('expanded', hidden);
          selectFolder(li, node.id);
        });
      } else {
        li.addEventListener('click', (e) => {
          e.stopPropagation();
          selectFolder(li, node.id);
        });
      }
      ul.appendChild(li);
    });
    return ul;
  }

  // Mark selected folder
  function selectFolder(li, id) {
    container.querySelectorAll('li.selected').forEach((el) => el.classList.remove('selected'));
    li.classList.add('selected');
    selectedFolderId = id;
  }

  // Load and render bookmark folders
  chrome.bookmarks.getTree((tree) => {
    container.innerHTML = '';
    const root = tree[0];
    const nodes = [];
    root.children.forEach((node) => {
      if (node.title === 'Other bookmarks' && node.children) {
        node.children.filter((c) => !c.url).forEach((c) => nodes.push(c));
      } else {
        nodes.push(node);
      }
    });
    const list = buildList(nodes);
    if (list && list.childElementCount) {
      container.appendChild(list);
    } else {
      container.textContent = 'No folders found.';
    }
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedFolderId) {
      alert('Please select a folder.');
      return;
    }
    const btn = form.querySelector('.submit-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;
    chrome.bookmarks.create(
      { parentId: selectedFolderId, title: titleInput.value, url: urlInput.value },
      () => window.close()
    );
  });

  // Input focus effects
  document.querySelectorAll('input').forEach((input) => {
    input.addEventListener('focus', () => {
      input.parentElement.style.boxShadow = '0 0 0 2px rgba(66,153,225,0.5)';
    });
    input.addEventListener('blur', () => {
      input.parentElement.style.boxShadow = '';
    });
  });
});