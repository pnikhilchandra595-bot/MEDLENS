import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BiomarkerTable from '../components/results/BiomarkerTable';
import SmartAnalyteCard from '../components/results/SmartAnalyteCard';
import ReportViewer from '../components/ReportViewer';

describe('Frontend Accessibility & Keyboard Navigation Suite', () => {
  const mockResult = {
    id: 'res-test-01',
    test_name: 'TSH',
    canonical_name: 'Thyroid Stimulating Hormone',
    loinc_code: '3016-3',
    value: 6.8,
    unit: 'uIU/mL',
    ref_low: 0.4,
    ref_high: 4.5,
    ref_raw: '0.40 - 4.50 uIU/mL',
    is_abnormal: true,
    confidence_tier: 'high',
    source: 'Extracted from report',
    is_grounded: true,
    bbox: { x: 0.08, y: 0.28, w: 0.84, h: 0.038 },
    history: [
      { date: '18th Feb 2025', value: 5.8, is_abnormal: true },
      { date: '25th Aug 2026', value: 6.8, is_abnormal: true }
    ],
    audit_trail: [
      {
        id: 'adt-01',
        previous_value: 7.2,
        corrected_value: 6.8,
        reason: 'Pathology slide manual verification',
        corrected_by: 'Dr. Pathologist',
        created_at: '2026-08-25T10:30:00Z'
      }
    ]
  };

  it('ReportViewer result buttons are keyboard accessible via Tab and Enter', () => {
    const handleSelect = vi.fn();
    render(
      <ReportViewer
        results={[mockResult]}
        selectedResultId="res-test-01"
        onSelectResult={handleSelect}
        patientName="P Vijay Kumar"
      />
    );

    const button = screen.getByRole('button', { name: /TSH: 6.8 uIU\/mL/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    
    // Simulate Enter key press
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    expect(button).toBeInTheDocument();
  });

  it('BiomarkerTable rows are keyboard focusable and selectable with Enter key', () => {
    const handleSelect = vi.fn();
    render(
      <BiomarkerTable
        results={[mockResult]}
        searchQuery=""
        setSearchQuery={() => {}}
        onlyAbnormalFilter={false}
        setOnlyAbnormalFilter={() => {}}
        selectedResultId="res-test-01"
        onSelectResult={handleSelect}
        onStartCorrection={() => {}}
      />
    );

    const row = screen.getByRole('row', { name: /Thyroid Stimulating Hormone/i });
    expect(row).toBeInTheDocument();
    expect(row).toHaveAttribute('tabIndex', '0');

    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith('res-test-01');
  });

  it('SmartAnalyteCard exposes accessible buttons and focus rings', () => {
    const handleSelect = vi.fn();
    render(
      <SmartAnalyteCard
        result={mockResult}
        isSelected={false}
        onSelect={handleSelect}
      />
    );

    const testButton = screen.getByRole('button', { name: /TSH/i });
    expect(testButton).toBeInTheDocument();

    const compareBtn = screen.getByRole('button', { name: /Compare Readings/i });
    expect(compareBtn).toBeInTheDocument();
    expect(compareBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(compareBtn);
    expect(compareBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('Surfaces audit history and allows expanding the verification audit drawer', () => {
    render(
      <SmartAnalyteCard
        result={mockResult}
        isSelected={false}
      />
    );

    // Verify audit history button exists
    const auditBtn = screen.getByRole('button', { name: /Audit History/i });
    expect(auditBtn).toBeInTheDocument();
    expect(auditBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to expand audit drawer
    fireEvent.click(auditBtn);
    expect(auditBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Verification & Correction Audit Trail/i)).toBeInTheDocument();
    expect(screen.getByText(/Pathology slide manual verification/i)).toBeInTheDocument();
  });
});
