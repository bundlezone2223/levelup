/**
 * تفتح النافذة المنبثقة (Modal) المطلوبة.
 * @param {string} type - نوع النافذة المراد فتحها ('about' أو 'privacy').
 */
function openModal(type) {
  document.getElementById('modal-overlay').style.display = 'block';
  if (type === 'about') {
    document.getElementById('modal-about').style.display = 'block';
  } else if (type === 'privacy') {
    document.getElementById('modal-privacy').style.display = 'block';
  }
}

/**
 * تغلق جميع النوافذ المنبثقة.
 */
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('modal-about').style.display = 'none';
  document.getElementById('modal-privacy').style.display = 'none';
}
