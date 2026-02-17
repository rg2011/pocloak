import {
  createSwimlaneDiagram,
  SwimlaneDiagram,
  SwimlaneDiagramSpec,
  SwimlaneHeader
} from '../../shared/swimlane-diagram.component';

const SHARED_HEADERS = [
  { x: 150, label: 'Browser' },
  { x: 450, label: 'Angular Web App' },
  { x: 750, label: 'Node Backend' },
  { x: 1050, label: 'Keycloak' }
] satisfies SwimlaneHeader[];

const SPA_PKCE_HEADERS = [
  { x: 200, label: 'Browser' },
  { x: 600, label: 'Angular Web App' },
  { x: 1000, label: 'Keycloak' }
] satisfies SwimlaneHeader[];

const LOGIN_FLOW_SPEC: SwimlaneDiagramSpec = {
  viewBox: '0 0 1200 760',
  ariaLabel: 'OIDC swimlane Browser Angular Backend Keycloak',
  markerId: 'arrow-login-flow',
  steps: [
    { id: 's1', lane: 0, order: 1, text: '1. Browse login page' },
    { id: 's2', lane: 1, order: 2, text: '2. Redirect browser to /login' },
    { id: 's3', lane: 0, order: 3, text: '3. GET /login' },
    { id: 's4', lane: 2, order: 4, text: '4. state/nonce/PKCE + auth URL' },
    { id: 's5', lane: 0, order: 5, text: '5. Follow redirect to Keycloak' },
    { id: 's6', lane: 3, order: 6, text: '6. Login + redirect with code' },
    { id: 's7', lane: 0, order: 7, text: '7. GET /auth/callback?code=...' },
    { id: 's8', lane: 2, order: 8, text: '8. Exchange code at token endpoint' },
    { id: 's9', lane: 3, order: 9, text: '9. Return tokens' },
    { id: 's10', lane: 2, order: 10, text: '10. Save session + redirect /' },
    { id: 's11', lane: 0, order: 11, text: '11. GET / (home)' },
    { id: 's12', lane: 1, order: 12, text: '12. Render /home' }
  ],
  links: [
    { from: 's1', to: 's2' },
    { from: 's2', to: 's3' },
    { from: 's3', to: 's4' },
    { from: 's4', to: 's5' },
    { from: 's5', to: 's6' },
    { from: 's6', to: 's7' },
    { from: 's7', to: 's8' },
    { from: 's8', to: 's9' },
    { from: 's9', to: 's10' },
    { from: 's10', to: 's11' },
    { from: 's11', to: 's12' }
  ]
};

const ACCESS_FLOW_SPEC: SwimlaneDiagramSpec = {
  viewBox: '0 0 1200 720',
  ariaLabel: 'Protected access swimlane Browser Angular Backend Keycloak',
  markerId: 'arrow-access-flow',
  steps: [
    { id: 'a1', lane: 0, order: 1, text: '1. Open /oidc (protected route)' },
    { id: 'a2', lane: 1, order: 2, text: '2. Angular AuthGuard runs' },
    { id: 'a3', lane: 2, order: 3, text: '3. GET /api/auth/status' },
    { id: 'a4', lane: 1, order: 4, text: '4. Auth status received' },
    { id: 'a5', lane: 1, order: 5, text: '5. If unauthenticated, redirect /' },
    { id: 'a6', lane: 1, order: 6, text: '6. If authenticated, call /api/oidc/*' },
    { id: 'a7', lane: 2, order: 7, text: '7. Backend guard + refresh check' },
    { id: 'a8', lane: 3, order: 8, text: '8. Keycloak endpoint response' },
    { id: 'a9', lane: 2, order: 9, text: '9. Return sanitized API payload' },
    { id: 'a10', lane: 1, order: 10, text: '10. Angular renders endpoint data' },
    { id: 'a11', lane: 0, order: 11, text: '11. Browser updates UI' }
  ],
  links: [
    { from: 'a1', to: 'a2' },
    { from: 'a2', to: 'a3' },
    { from: 'a3', to: 'a4' },
    { from: 'a4', to: 'a5' },
    { from: 'a5', to: 'a6' },
    { from: 'a6', to: 'a7' },
    { from: 'a7', to: 'a8' },
    { from: 'a8', to: 'a9' },
    { from: 'a9', to: 'a10' },
    { from: 'a10', to: 'a11' }
  ]
};

const SPA_PKCE_FLOW_SPEC: SwimlaneDiagramSpec = {
  viewBox: '0 0 1200 760',
  ariaLabel: 'SPA PKCE swimlane Browser SPA Keycloak',
  markerId: 'arrow-spa-pkce-flow',
  headers: SPA_PKCE_HEADERS,
  layout: {
    stepWidth: 340
  },
  steps: [
    { id: 'p1', lane: 0, order: 1, text: '1. Open SPA in browser' },
    { id: 'p2', lane: 1, order: 2, text: '2. SPA generates code_verifier + code_challenge' },
    { id: 'p3', lane: 0, order: 3, text: '3. Browser redirected to authorize endpoint' },
    { id: 'p4', lane: 2, order: 4, text: '4. User authenticates at Keycloak' },
    { id: 'p5', lane: 0, order: 5, text: '5. Redirect back with authorization code' },
    { id: 'p6', lane: 1, order: 6, text: '6. SPA sends code + code_verifier to token endpoint' },
    { id: 'p7', lane: 2, order: 7, text: '7. Keycloak validates PKCE and returns tokens' },
    { id: 'p8', lane: 1, order: 8, text: '8. SPA stores tokens in browser runtime' },
    { id: 'p9', lane: 1, order: 9, text: '9. SPA calls APIs with access token' }
  ],
  links: [
    { from: 'p1', to: 'p2' },
    { from: 'p2', to: 'p3' },
    { from: 'p3', to: 'p4' },
    { from: 'p4', to: 'p5' },
    { from: 'p5', to: 'p6' },
    { from: 'p6', to: 'p7' },
    { from: 'p7', to: 'p8' },
    { from: 'p8', to: 'p9' }
  ]
};

export const LOGIN_FLOW_DIAGRAM: SwimlaneDiagram = createSwimlaneDiagram(LOGIN_FLOW_SPEC, SHARED_HEADERS);
export const ACCESS_FLOW_DIAGRAM: SwimlaneDiagram = createSwimlaneDiagram(ACCESS_FLOW_SPEC, SHARED_HEADERS);
export const SPA_PKCE_FLOW_DIAGRAM: SwimlaneDiagram = createSwimlaneDiagram(SPA_PKCE_FLOW_SPEC, SHARED_HEADERS);
