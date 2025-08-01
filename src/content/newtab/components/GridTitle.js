/**
 * Updates the main title and breadcrumb based on depth and group title.
 * @param {number} depth - Current folder depth.
 * @param {string} groupTitle - Title of the current group (if depth > 0).
 */
export function updateGridTitle(depth, groupTitle) {
  const titleEl = document.getElementById('folder-title');
  const breadcrumbEl = document.getElementById('breadcrumb');
  if (depth === 0) {
    titleEl.textContent = 'Tất cả bookmark';
    breadcrumbEl.textContent = 'Trang chủ';
  } else {
    titleEl.textContent = groupTitle;
    breadcrumbEl.textContent = groupTitle;
  }
}