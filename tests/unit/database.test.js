import { describe, expect, it } from 'vitest';
import { buildDatasourceUrl } from '../../src/config/database.js';

describe('buildDatasourceUrl', () => {
  it('flags Neon pooled connections for PgBouncer', () => {
    const url = new URL(
      buildDatasourceUrl(
        'postgresql://u:p@ep-cool-123-pooler.us-east-2.aws.neon.tech/db?sslmode=require',
      ),
    );

    expect(url.searchParams.get('pgbouncer')).toBe('true');
    expect(url.searchParams.get('connect_timeout')).toBe('15');
    expect(url.searchParams.get('sslmode')).toBe('require');
  });

  it('leaves direct and local connections untouched', () => {
    const local = 'postgresql://localhost:5432/ripple_dev';

    expect(buildDatasourceUrl(local)).toBe(local);
  });
});
