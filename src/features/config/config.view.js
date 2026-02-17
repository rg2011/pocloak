const { renderHeadsUp, renderLayout } = require('../home/home.view');

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderConfig({ isAuthenticated, filePath, runtimeConfig, rawConfig, message, error }) {
  const feedback = error
    ? renderHeadsUp({ text: error, type: 'danger' })
    : message
      ? renderHeadsUp({ text: message, type: 'success' })
      : '';

  return renderLayout({
    title: 'Configuración',
    isAuthenticated,
    activeNav: 'config',
    headsUp: feedback,
    body: `
      <p><strong>Fichero:</strong> ${filePath}</p>
      <hr />
      <p class="title is-6">Configuración efectiva (runtime)</p>
      <pre>${JSON.stringify(runtimeConfig, null, 2)}</pre>
      <p class="title is-6">Contenido editable del fichero</p>
      <form method="post" action="/config/restart">
        <div class="field">
          <div class="control">
            <textarea class="textarea" name="configJson" rows="16">${escapeHtml(JSON.stringify(rawConfig, null, 2))}</textarea>
          </div>
        </div>
        <div class="buttons">
          <button class="button is-warning" type="submit">Guardar y reiniciar proceso</button>
        </div>
      </form>
    `
  });
}

module.exports = {
  renderConfig
};
