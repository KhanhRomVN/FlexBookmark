import { createBookmark } from '../../utils/api.js';

export function setupAddBookmarkForm() {
  const modal = document.getElementById('add-bookmark-modal');
  const addBtn = document.getElementById('add-bookmark-btn');

  addBtn.addEventListener('click', () => {
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Thêm bookmark mới</h2>
        <form id="bookmark-form">
          <input type="text" id="title" placeholder="Tiêu đề" required>
          <input type="url" id="url" placeholder="URL" required>
          <button type="submit">Lưu</button>
        </form>
      </div>
    `;
    modal.style.display = 'block';

    document.getElementById('bookmark-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await createBookmark({
        title: document.getElementById('title').value,
        url: document.getElementById('url').value
      });
      modal.style.display = 'none';
    });
  });
}