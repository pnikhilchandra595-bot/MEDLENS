/**
 * MedLens API Client & Interceptor Layer
 * Provides centralized error interception, automatic session token injection,
 * request retry capabilities, and typed API endpoints.
 */

const API_BASE = '/api';

// In-memory + sessionStorage token store
const TOKEN_KEY = 'medlens_session_tokens';

export function getSessionToken(patientId) {
  try {
    const tokens = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || '{}');
    return tokens[patientId] || null;
  } catch {
    return null;
  }
}

export function saveSessionToken(patientId, token) {
  try {
    const tokens = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || '{}');
    tokens[patientId] = token;
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } catch (e) {
    console.warn('[ApiClient] Failed to persist session token:', e);
  }
}

/**
 * Core HTTP Request Wrapper with Error Interception & Auth
 */
async function request(endpoint, options = {}, patientId = null) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = { ...options.headers };

  // Inject session token if available
  const token = patientId ? getSessionToken(patientId) : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);

    // Handle standard error codes
    if (!res.ok) {
      let errorDetail = `Request failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || errJson.message || errorDetail;
      } catch {
        // Non-JSON response
      }

      const error = new Error(errorDetail);
      error.status = res.status;
      error.statusText = res.statusText;
      throw error;
    }

    // 204 No Content
    if (res.status === 204) {
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error(`[ApiClient Error] ${config.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

// ---------------- API Endpoints ----------------

export async function fetchHealth() {
  return request('/health');
}

export async function fetchGlossary() {
  return request('/glossary');
}

export async function searchNlmLoinc(query) {
  return request(`/loinc/search?query=${encodeURIComponent(query)}`);
}

export async function searchRxNormDrug(query) {
  return request(`/drugs/search?query=${encodeURIComponent(query)}`);
}

export async function fetchPatients(limit = 50, offset = 0) {
  return request(`/patients?limit=${limit}&offset=${offset}`);
}

export async function fetchPatient(patientId) {
  return request(`/patients/${patientId}`, {}, patientId);
}

export async function savePatientIntake(patientId, intakeData) {
  return request(`/patients/${patientId}/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, ...intakeData })
  }, patientId);
}

export async function fetchPatientReports(patientId, limit = 50, offset = 0) {
  return request(`/patients/${patientId}/reports?limit=${limit}&offset=${offset}`, {}, patientId);
}

export async function fetchReportDetails(reportId, lang = 'en', patientId = null) {
  return request(`/reports/${reportId}?lang=${lang}`, {}, patientId);
}

export async function searchReports(query = '', isAbnormal = null, startDate = null, endDate = null) {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (isAbnormal !== null) params.append('is_abnormal', isAbnormal);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  return request(`/reports/search?${params.toString()}`);
}

export async function uploadReport(formData) {
  const res = await request('/upload', {
    method: 'POST',
    body: formData
  });
  // If backend issued a session token, persist it
  if (res.session_token && res.patient_id) {
    saveSessionToken(res.patient_id, res.session_token);
  }
  return res;
}

export async function correctTestResult(reportId, resultId, correctedValue, correctionReason, patientId = null) {
  return request(`/reports/${reportId}/correct-result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      result_id: resultId,
      corrected_value: correctedValue,
      correction_reason: correctionReason
    })
  }, patientId);
}

export async function fetchPatientTimeline(patientId) {
  return request(`/patients/${patientId}/timeline`, {}, patientId);
}

export async function exportFhirBundle(reportId, patientId = null) {
  return request(`/reports/${reportId}/fhir`, {}, patientId);
}

export async function exportAbdmBundle(reportId, patientId = null) {
  return request(`/reports/${reportId}/abdm`, {}, patientId);
}

export async function deletePatientData(patientId) {
  return request(`/delete-my-data/${patientId}`, {
    method: 'DELETE'
  }, patientId);
}

export async function sendWhatsAppMessage(payload) {
  return request('/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function reseedDatabase() {
  return request('/seed', { method: 'POST' });
}
