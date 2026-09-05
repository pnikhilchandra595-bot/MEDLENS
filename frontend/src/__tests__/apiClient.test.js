import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveSessionToken,
  getSessionToken,
  fetchHealth,
  searchReports,
  deletePatientData
} from '../api/client';

describe('API Client Layer', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('saves and retrieves patient session token from sessionStorage', () => {
    saveSessionToken('pat_123', 'tok_abc_secure_signature');
    const token = getSessionToken('pat_123');
    expect(token).toBe('tok_abc_secure_signature');
  });

  it('returns null if token does not exist', () => {
    const token = getSessionToken('non_existent_patient');
    expect(token).toBeNull();
  });

  it('fetches health check successfully', async () => {
    const mockHealth = { status: 'ok', version: '2.0.0', services: {} };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockHealth
    });

    const result = await fetchHealth();
    expect(global.fetch).toHaveBeenCalledWith('/api/health', expect.any(Object));
    expect(result).toEqual(mockHealth);
  });

  it('attaches Authorization header when session token is present', async () => {
    saveSessionToken('pat_999', 'secret_token_123');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'deleted' })
    });

    await deletePatientData('pat_999');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/delete-my-data/pat_999',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer secret_token_123'
        })
      })
    );
  });

  it('throws descriptive error on 403 Forbidden with detail message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ detail: 'Authentication token is required for this operation.' })
    });

    await expect(deletePatientData('unauthorized_pat')).rejects.toThrow(
      'Authentication token is required for this operation.'
    );
  });

  it('builds proper query parameters in searchReports', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ total: 1, results: [] })
    });

    await searchReports('hemoglobin', true, '2026-01-01', '2026-09-01');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reports/search?query=hemoglobin&is_abnormal=true&start_date=2026-01-01&end_date=2026-09-01',
      expect.any(Object)
    );
  });
});
