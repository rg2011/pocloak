const { renderHeadsUp } = require('../home/home.view');

function renderTabs(prefix, tabs) {
  const items = tabs
    .map((tab, index) => {
      const activeClass = index === 0 ? ' class="is-active"' : '';
      return `<li${activeClass} data-endpoint-tab-item="${tab.endpoint}"><a href="#" data-endpoint="${tab.endpoint}">${tab.label}</a></li>`;
    })
    .join('');

  return `
    <div class="tabs is-boxed">
      <ul data-endpoint-tabs="${prefix}">
        ${items}
      </ul>
    </div>
  `;
}

function renderEndpointInspector({ prefix, tabs, hintText }) {
  const eventName = `${prefix}:request-executed`;
  const headsUp = renderHeadsUp({
    id: `${prefix}-initial-heads-up`,
    text: hintText,
    type: 'info',
    hideOnEvent: eventName
  });

  const body = `
    ${renderTabs(prefix, tabs)}
    <p class="title is-6">Ejecución</p>
    <p id="${prefix}-response-meta">Sin ejecución todavía.</p>
    <hr />
    <p class="title is-6">Petición enviada (curl equivalente)</p>
    <pre id="${prefix}-request-curl"># Ejecuta una llamada para ver el comando curl equivalente.</pre>
    <hr />
    <p class="title is-6">Respuesta</p>
    <p><strong>HTTP code:</strong> <span id="${prefix}-reply-code">-</span></p>
    <p class="title is-6" style="margin-top:0.75rem;">Body</p>
    <pre id="${prefix}-reply-body">-</pre>
    <hr style="margin:0.75rem 0;" />
    <p class="title is-6">Headers</p>
    <pre id="${prefix}-reply-headers">-</pre>
    <script>
      (function attachEndpointInspector() {
        const container = document.querySelector('[data-endpoint-tabs="${prefix}"]');
        if (!container) {
          return;
        }

        const endpointLinks = container.querySelectorAll('[data-endpoint]');
        const endpointTabItems = container.querySelectorAll('[data-endpoint-tab-item]');
        const meta = document.getElementById('${prefix}-response-meta');
        const requestCurl = document.getElementById('${prefix}-request-curl');
        const replyCode = document.getElementById('${prefix}-reply-code');
        const replyHeaders = document.getElementById('${prefix}-reply-headers');
        const replyBody = document.getElementById('${prefix}-reply-body');

        function stringifyData(data) {
          return JSON.stringify(typeof data === 'undefined' ? null : data, null, 2);
        }

        function shellQuote(value) {
          return JSON.stringify(String(value));
        }

        function buildCurlCommand(request) {
          if (!request || !request.url) {
            return '# Sin datos de petición';
          }

          const method = request.method || 'GET';
          const headers = request.headers || {};
          const lines = ['curl -i \\\\', '  -X ' + shellQuote(method) + ' \\\\'];

          for (const [key, value] of Object.entries(headers)) {
            lines.push('  -H ' + shellQuote(key + ': ' + value) + ' \\\\');
          }

          const hasFormContentType = typeof headers['Content-Type'] === 'string'
            && headers['Content-Type'].toLowerCase().includes('application/x-www-form-urlencoded');

          if (request.body && typeof request.body === 'object' && hasFormContentType) {
            for (const [key, value] of Object.entries(request.body)) {
              if (value !== null && typeof value !== 'undefined') {
                lines.push('  --data-urlencode ' + shellQuote(key + '=' + String(value)) + ' \\\\');
              }
            }
          } else if (request.body !== null && typeof request.body !== 'undefined') {
            lines.push('  --data-raw ' + shellQuote(JSON.stringify(request.body)) + ' \\\\');
          }

          lines.push('  ' + shellQuote(request.url));
          return lines.join('\\n');
        }

        function paintExchange(exchange, fallbackStatus) {
          const request = exchange && exchange.request ? exchange.request : {};
          const reply = exchange && exchange.reply ? exchange.reply : {};

          requestCurl.textContent = buildCurlCommand(request);

          replyCode.textContent = String(
            typeof reply.http_code === 'number' ? reply.http_code : fallbackStatus
          );
          replyHeaders.textContent = stringifyData(reply.headers || {});
          replyBody.textContent = stringifyData(reply.body);
        }

        function setActiveEndpointTab(endpoint) {
          for (const tabItem of endpointTabItems) {
            tabItem.classList.toggle('is-active', tabItem.dataset.endpointTabItem === endpoint);
          }
        }

        async function callEndpoint(endpoint) {
          meta.textContent = 'Consultando ' + endpoint + '...';
          paintExchange(null, '-');

          try {
            const httpResponse = await fetch(endpoint, {
              method: 'GET',
              headers: {
                Accept: 'application/json'
              }
            });

            const payload = await httpResponse.json();
            meta.textContent = endpoint + ' -> HTTP ' + httpResponse.status;
            paintExchange(payload, httpResponse.status);
            window.dispatchEvent(new CustomEvent('${eventName}'));
          } catch (error) {
            meta.textContent = endpoint + ' -> error de red o parsing';
            paintExchange(
              {
                request: {
                  url: endpoint,
                  method: 'GET',
                  headers: {
                    Accept: 'application/json'
                  },
                  body: null
                },
                reply: {
                  http_code: 0,
                  headers: {},
                  body: {
                    error: 'No se pudo obtener respuesta JSON del endpoint.',
                    detail: String(error && error.message ? error.message : error)
                  }
                }
              },
              0
            );
            window.dispatchEvent(new CustomEvent('${eventName}'));
          }
        }

        for (const link of endpointLinks) {
          link.addEventListener('click', (event) => {
            event.preventDefault();
            const endpoint = link.dataset.endpoint;
            setActiveEndpointTab(endpoint);
            callEndpoint(endpoint);
          });
        }
      })();
    </script>
  `;

  return {
    headsUp,
    body
  };
}

module.exports = {
  renderEndpointInspector
};
