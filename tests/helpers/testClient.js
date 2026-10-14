import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();
const API_PREFIX = '/api/v1';
let userCounter = 0;

/**
 * A cookie-keeping supertest agent that automatically sends the CSRF header,
 * mimicking what the browser client does.
 */
export class TestClient {
  constructor() {
    this.agent = request.agent(app);
    this.csrfToken = null;
  }

  async init() {
    const res = await this.agent.get(`${API_PREFIX}/auth/csrf`);
    this.csrfToken = res.body.csrfToken;
    return this;
  }

  get(path) {
    return this.agent.get(API_PREFIX + path);
  }

  post(path) {
    return this.agent.post(API_PREFIX + path).set('X-CSRF-Token', this.csrfToken);
  }

  put(path) {
    return this.agent.put(API_PREFIX + path).set('X-CSRF-Token', this.csrfToken);
  }

  patch(path) {
    return this.agent.patch(API_PREFIX + path).set('X-CSRF-Token', this.csrfToken);
  }

  delete(path) {
    return this.agent.delete(API_PREFIX + path).set('X-CSRF-Token', this.csrfToken);
  }
}

export function createAnonymousClient() {
  return new TestClient().init();
}

export function buildUserInput(overrides = {}) {
  userCounter += 1;
  return {
    email: `user${userCounter}@example.com`,
    username: `user_${userCounter}`,
    displayName: `Test User ${userCounter}`,
    password: 'correct-horse-battery',
    ...overrides,
  };
}

/** Registers a fresh user and returns a client signed in as them. */
export async function createSignedInClient(overrides = {}) {
  const client = await createAnonymousClient();
  const input = buildUserInput(overrides);
  const res = await client.post('/auth/register').send(input);
  if (res.status !== 201) throw new Error(`Failed to register test user: ${res.text}`);
  client.user = res.body.user;
  client.password = input.password;
  return client;
}

export { app, request };
