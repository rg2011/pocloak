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

export const LOGIN_FLOW_DIAGRAM: SwimlaneDiagram = {
  viewBox: '0 0 1200 760',
  ariaLabel: 'OIDC login flow with BFF architecture',
  markerId: 'arrow-login',
  laneDividers: [150, 450, 750, 1050],
  headers: BFF_HEADERS,
  arrows: [
    'M265 100 H450 V130',
    'M335 155 H150 V185',
    'M265 210 H750 V240',
    'M635 265 H150 V295',
    'M265 320 H1050 V350',
    'M935 375 H150 V405',
    'M265 430 H750 V460',
    'M865 485 H1050 V515',
    'M935 540 H750 V570',
    'M635 595 H150 V625',
    'M265 650 H450 V680'
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
    'M265 100 H450 V130',
    'M565 155 H750 V185',
    'M635 210 H450 V240',
    'M450 290 V295',
    'M450 345 V350',
    'M565 375 H750 V405',
    'M865 430 H1050 V460',
    'M935 485 H750 V515',
    'M635 540 H450 V570',
    'M335 595 H150 V625'
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
    'M315 100 H600 V130',
    'M485 155 H200 V185',
    'M315 210 H1000 V240',
    'M885 265 H200 V295',
    'M315 320 H600 V350',
    'M715 375 H1000 V405',
    'M885 430 H600 V460',
    'M600 490 V495',
    'M600 545 V550'
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
