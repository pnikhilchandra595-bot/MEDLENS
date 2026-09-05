const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchGlossary() {
  const res = await fetch(`${API_BASE}/glossary`);
  return res.json();
}

export async function fetchPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  return res.json();
}

export async function fetchPatient(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}`);
  return res.json();
}

export async function savePatientIntake(patientId, intakeData) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id: patientId, ...intakeData })
  });
  return res.json();
}

export async function fetchPatientReports(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/reports`);
  return res.json();
}

export async function fetchReportDetails(reportId, lang = 'en') {
  const res = await fetch(`${API_BASE}/reports/${reportId}?lang=${lang}`);
  return res.json();
}

export async function uploadReport(formData) {
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function fetchPatientTimeline(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/timeline`);
  return res.json();
}

export async function exportFhirBundle(reportId) {
  const res = await fetch(`${API_BASE}/reports/${reportId}/fhir`);
  return res.json();
}

export async function deletePatientData(patientId) {
  const res = await fetch(`${API_BASE}/delete-my-data/${patientId}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function sendWhatsAppMessage(payload) {
  const res = await fetch(`${API_BASE}/whatsapp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function reseedDatabase() {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  return res.json();
}
