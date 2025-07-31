export function renderSidebar(bookmarkTree) {
  console.log('renderSidebar received tree:', bookmarkTree);
  const sidebar = document.getElementById('sidebar');

  function processNode(nodes) {
    return nodes
      .filter(node => !node.url)
      .map(node => {
        const childrenHTML = node.children && node.children.length
          ? `<ul class="folder-list">${processNode(node.children)}</ul>`
          : '';
        return `
          <li class="folder-item" data-id="${node.id}">
            <span>${node.title}</span>
            ${childrenHTML}
          </li>`;
      })
      .join('');
  }

  const html = `<ul class="folder-list">${processNode(bookmarkTree)}</ul>`;
  sidebar.innerHTML = html;

  sidebar.querySelectorAll('.folder-item').forEach(item => {
    item.addEventListener('click', async e => {
      e.stopPropagation();
      const folderId = item.dataset.id;
      const children = await chrome.bookmarks.getChildren(folderId);
      document.getElementById('folder-title').textContent =
        item.querySelector('span').textContent;
      renderBookmarkGrid(children);
    });
  });
}