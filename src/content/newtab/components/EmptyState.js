/**
 * Creates an empty-state element for when there are no bookmarks.
 * @returns {HTMLElement}
 */
export function createEmptyState() {
  const wrapper = document.createElement('div');
  wrapper.className = 'empty-state';
  wrapper.innerHTML = `
    <div class="empty-icon">📚</div>
    <p>Chưa có bookmark nào trong thư mục này</p>
  `;
  return wrapper;
}