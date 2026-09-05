import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportViewer from '../components/ReportViewer';

describe('ReportViewer Component', () => {
  const mockResults = [
    {
      id: 'res-1',
      test_name: 'TSH',
      canonical_name: 'Thyroid Stimulating Hormone',
      value: 6.8,
      unit: 'uIU/mL',
      ref_low: 0.4,
      ref_high: 4.5,
      is_abnormal: true,
      is_grounded: true,
      bbox: { x: 0.1, y: 0.28, w: 0.8, h: 0.04 }
    },
    {
      id: 'res-2',
      test_name: 'Serum Creatinine',
      canonical_name: 'Creatinine',
      value: 0.9,
      unit: 'mg/dL',
      ref_low: 0.6,
      ref_high: 1.2,
      is_abnormal: false,
      is_grounded: false,
      bbox: null // Honestly ungrounded item
    }
  ];

  it('renders laboratory document title and SHA-256 hash', () => {
    render(
      <ReportViewer
        results={mockResults}
        sha256Hash="a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890"
        patientName="Arjun Sharma"
      />
    );
    expect(screen.getByText('Laboratory Document')).toBeInTheDocument();
    expect(screen.getByText(/SHA-256:/)).toBeInTheDocument();
    expect(screen.getByText('1 Grounded')).toBeInTheDocument();
    expect(screen.getByText('1 Unconfirmed')).toBeInTheDocument();
  });

  it('renders test findings in structured mode without fabricated hospital letterheads', () => {
    render(
      <ReportViewer
        results={mockResults}
        selectedResultId="res-1"
        patientName="Arjun Sharma"
      />
    );
    expect(screen.getByText('Thyroid Stimulating Hormone')).toBeInTheDocument();
    expect(screen.getByText('Creatinine')).toBeInTheDocument();
    expect(screen.getByText(/6.8/)).toBeInTheDocument();
    // Verify no fabricated hospital/doctor text
    expect(screen.queryByText(/METROPOLIS HEALTHCARE LABS/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dr\. V\. K\. Malhotra/i)).not.toBeInTheDocument();
  });

  it('triggers onSelectResult callback when clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ReportViewer
        results={mockResults}
        onSelectResult={handleSelect}
        patientName="Arjun Sharma"
      />
    );

    const elem = screen.getByText('Thyroid Stimulating Hormone');
    fireEvent.click(elem);
    expect(handleSelect).toHaveBeenCalledWith('res-1');
  });

  it('renders SVG bounding box ONLY for grounded items, omitting ungrounded items', () => {
    render(
      <ReportViewer
        fileUrl="https://example.com/test_report.png"
        results={mockResults}
        selectedResultId="res-1"
        patientName="Arjun Sharma"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Clinical laboratory diagnostic report scan for Arjun Sharma');

    // Only res-1 has a grounded bounding box; res-2 has null bbox and must NOT render an SVG box
    expect(screen.getByLabelText(/Grounded Bounding Box for Thyroid Stimulating Hormone/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Grounded Bounding Box for Creatinine/i)).not.toBeInTheDocument();
  });

  it('renders iframe for PDF documents', () => {
    render(
      <ReportViewer
        fileUrl="/uploads/sample_report.pdf"
        results={mockResults}
        patientName="Arjun Sharma"
      />
    );
    const iframe = screen.getByTitle('Clinical Laboratory PDF Report for Arjun Sharma');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', '/uploads/sample_report.pdf');
  });
});
