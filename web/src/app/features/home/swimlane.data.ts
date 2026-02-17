import { SwimlaneDiagram } from '../../shared/swimlane-diagram.component';

const BFF_HEADERS = [
  { x: 150, label: 'Browser' },
  { x: 450, label: 'Angular Web App' },
  { x: 750, label: 'Node Backend' },
  { x: 1050, label: 'Keycloak' }
];

const SPA_HEADERS = [
  { x: 200, label: 'Browser' },
  { x: 600, label: 'Angular Web App' },
  { x: 1000, label: 'Keycloak' }
];

const CLIENT_CREDENTIALS_HEADERS = [
  { x: 300, label: 'Node Backend' },
  { x: 900, label: 'Keycloak' }
];

export const LOGIN_FLOW_DIAGRAM: SwimlaneDiagram = {
  viewBox: '0 0 1200 760',
  ariaLabel: 'OIDC login flow with BFF architecture',
  markerId: 'arrow-login',
  laneDividers: [150, 450, 750, 1050],
  headers: BFF_HEADERS,
  arrows: [
    'M265 102 H450',
    'M335 157 H150',
    'M265 212 H750',
    'M635 267 H150',
    'M265 322 H1050',
    'M935 377 H150',
    'M265 432 H750',
    'M865 487 H1050',
    'M935 542 H750',
    'M635 597 H150',
    'M265 652 H450'
  ],
  steps: [
    { x: 35, y: 80, text: '1. Browse login page' },
    { x: 335, y: 135, text: '2. Redirect browser to /login' },
    { x: 35, y: 190, text: '3. GET /login' },
    // Backend generates state, nonce and PKCE challenge.
    { x: 635, y: 245, text: '4. state/nonce/PKCE + auth URL' },
    { x: 35, y: 300, text: '5. Follow redirect to Keycloak' },
    { x: 935, y: 355, text: '6. Login + redirect with code' },
    { x: 35, y: 410, text: '7. GET /auth/callback?code=...' },
    { x: 635, y: 465, text: '8. Exchange code at token endpoint' },
    { x: 935, y: 520, text: '9. Return tokens' },
    // Tokens are stored in server session, not in the browser.
    { x: 635, y: 575, text: '10. Save session + redirect /' },
    { x: 35, y: 630, text: '11. GET / (home)' },
    { x: 335, y: 685, text: '12. Render /home' }
  ]
};

export const ACCESS_FLOW_DIAGRAM: SwimlaneDiagram = {
  viewBox: '0 0 1200 720',
  ariaLabel: 'Protected API access flow with BFF architecture',
  markerId: 'arrow-access',
  laneDividers: [150, 450, 750, 1050],
  headers: BFF_HEADERS,
  arrows: [
    'M265 102 H450',
    'M565 157 H750',
    'M635 212 H450',
    'M565 377 H750',
    'M865 432 H1050',
    'M935 487 H750',
    'M635 542 H450',
    'M335 597 H150'
  ],
  steps: [
    { x: 35, y: 80, text: '1. Open /oidc (protected route)' },
    { x: 335, y: 135, text: '2. Angular AuthGuard runs' },
    { x: 635, y: 190, text: '3. GET /api/auth/status' },
    { x: 335, y: 245, text: '4. Auth status received' },
    { x: 335, y: 300, text: '5. If unauthenticated, redirect /' },
    { x: 335, y: 355, text: '6. If authenticated, call /api/oidc/*' },
    // Backend refreshes token if needed before proxying OIDC calls.
    { x: 635, y: 410, text: '7. Backend guard + refresh check' },
    { x: 935, y: 465, text: '8. Keycloak endpoint response' },
    { x: 635, y: 520, text: '9. Return sanitized API payload' },
    { x: 335, y: 575, text: '10. Angular renders endpoint data' },
    { x: 35, y: 630, text: '11. Browser updates UI' }
  ]
};

export const SPA_PKCE_FLOW_DIAGRAM: SwimlaneDiagram = {
  viewBox: '0 0 1200 620',
  ariaLabel: 'SPA PKCE flow for public clients (conceptual)',
  markerId: 'arrow-spa-pkce',
  laneDividers: [200, 600, 1000],
  headers: SPA_HEADERS,
  arrows: [
    'M370 102 H600',
    'M430 157 H200',
    'M370 212 H1000',
    'M830 267 H200',
    'M370 322 H600',
    'M770 377 H1000',
    'M830 432 H600'
  ],
  steps: [
    { x: 30, y: 80, width: 340, text: '1. Open SPA in browser' },
    // SPA creates code_verifier and sends only code_challenge to authorization endpoint.
    { x: 430, y: 135, width: 340, text: '2. SPA generates code_verifier + code_challenge' },
    { x: 30, y: 190, width: 340, text: '3. Browser redirected to authorize endpoint' },
    { x: 830, y: 245, width: 340, text: '4. User authenticates at Keycloak' },
    { x: 30, y: 300, width: 340, text: '5. Redirect back with authorization code' },
    { x: 430, y: 355, width: 340, text: '6. SPA sends code + code_verifier to token endpoint' },
    { x: 830, y: 410, width: 340, text: '7. Keycloak validates PKCE and returns tokens' },
    // Tokens live in browser runtime in SPA/public-client architecture.
    { x: 430, y: 465, width: 340, text: '8. SPA stores tokens in browser runtime' },
    { x: 430, y: 520, width: 340, text: '9. SPA calls APIs with access token' }
  ]
};

export const CLIENT_CREDENTIALS_FLOW_DIAGRAM: SwimlaneDiagram = {
  viewBox: '0 0 1200 420',
  ariaLabel: 'Client credentials flow with backend confidential client',
  markerId: 'arrow-client-credentials',
  laneDividers: [300, 900],
  headers: CLIENT_CREDENTIALS_HEADERS,
  arrows: [
    'M450 117 H900',
    'M750 237 H300'
  ],
  steps: [
    { x: 150, y: 95, width: 300, text: '1. Trigger client login in backend' },
    { x: 750, y: 155, width: 300, text: '2. POST token (client_credentials)' },
    { x: 750, y: 215, width: 300, text: '3. Return service-account token' },
    { x: 150, y: 275, width: 300, text: '4. Save session token' }
  ]
};
