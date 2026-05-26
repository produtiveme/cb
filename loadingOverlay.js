// loadingOverlay.js - manages a fullscreen loading overlay with message
export function showLoading(message = 'Carregando...') {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    // Spinner element
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    overlay.appendChild(spinner);
    // Message element
    const msg = document.createElement('div');
    msg.id = 'loading-message';
    msg.style.marginTop = '12px';
    overlay.appendChild(msg);
    document.body.appendChild(overlay);
  }
  const msgEl = document.getElementById('loading-message');
  if (msgEl) msgEl.textContent = message;
  overlay.style.display = 'flex';
}

export function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}
