import os
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(
    output_path: str,
    patient_name: str,
    patient_age: int,
    patient_sex: str,
    lab_name: str,
    doctor_name: str,
    report_date: str,
    report_id: str,
    test_rows: list,
    notice_text: str = ""
):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'LabTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#064e3b'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'LabSubtitle',
        parent=styles['Normal'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569')
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading3'],
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )
    cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=cell_style,
        fontName='Helvetica-Bold'
    )
    cell_abnormal = ParagraphStyle(
        'TableCellAbn',
        parent=cell_style,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#b91c1c')
    )

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph(f"<b>{lab_name.upper()}</b>", title_style),
            Paragraph(f"<b>NABL ACCREDITED LAB</b><br/>ISO 15189:2022 Certified<br/>CIN: U74999MH2015PLC268924", subtitle_style)
        ],
        [
            Paragraph("National Clinical Reference Laboratory • 24x7 Diagnostic Services", subtitle_style),
            Paragraph(f"<b>Report ID:</b> {report_id}<br/><b>Date:</b> {report_date}", subtitle_style)
        ]
    ]
    t_header = Table(header_data, colWidths=[360, 180])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#064e3b'), spaceAfter=8))

    # 2. Patient Demographics Grid
    demo_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {patient_name}", cell_style),
            Paragraph(f"<b>Age / Gender:</b> {patient_age} Y / {patient_sex}", cell_style)
        ],
        [
            Paragraph(f"<b>Ref By Doctor:</b> {doctor_name}", cell_style),
            Paragraph(f"<b>Sample Type:</b> Serum / Whole Blood", cell_style)
        ],
        [
            Paragraph(f"<b>Collection Time:</b> {report_date} 08:30 AM", cell_style),
            Paragraph(f"<b>Reporting Time:</b> {report_date} 04:45 PM", cell_style)
        ]
    ]
    t_demo = Table(demo_data, colWidths=[270, 270])
    t_demo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_demo)
    story.append(Spacer(1, 12))

    # 3. Test Results Table
    story.append(Paragraph("<b>BIOCHEMISTRY & CLINICAL PATHOLOGY REPORT</b>", section_style))
    story.append(Spacer(1, 6))

    table_rows = [
        [
            Paragraph("<b>TEST INVESTIGATION</b>", cell_bold),
            Paragraph("<b>OBSERVED VALUE</b>", cell_bold),
            Paragraph("<b>UNIT</b>", cell_bold),
            Paragraph("<b>REFERENCE INTERVAL</b>", cell_bold)
        ]
    ]

    for item in test_rows:
        name = item.get("name", "")
        val = str(item.get("val", ""))
        unit = item.get("unit", "")
        ref = item.get("ref", "Not Specified")
        is_abn = item.get("is_abn", False)

        p_name = Paragraph(name, cell_bold if is_abn else cell_style)
        p_val = Paragraph(f"{val} {'▲' if is_abn else ''}", cell_abnormal if is_abn else cell_style)
        p_unit = Paragraph(unit, cell_style)
        p_ref = Paragraph(ref, cell_style)

        table_rows.append([p_name, p_val, p_unit, p_ref])

    t_results = Table(table_rows, colWidths=[220, 100, 80, 140])
    t_results.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('LINEBELOW', (0, 0), (-1, 0), 1.2, colors.HexColor('#0f172a')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
    ]))
    story.append(t_results)

    if notice_text:
        story.append(Spacer(1, 8))
        story.append(Paragraph(f"<i>Clinical Note: {notice_text}</i>", subtitle_style))

    # 4. Footer Signatures & QR Note
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceAfter=8))
    
    footer_data = [
        [
            Paragraph("<b>Medical Technologist</b><br/>S. N. Joshi, DMLT", subtitle_style),
            Paragraph("<b>Verified By</b><br/>Dr. S. K. Ramanathan, MD (Path)<br/>Reg No: MMC/2004/0981", subtitle_style),
            Paragraph("<b>Chief Pathologist</b><br/>Dr. V. K. Malhotra, MD, FICP<br/>Director, Pathology Services", subtitle_style)
        ]
    ]
    t_footer = Table(footer_data, colWidths=[180, 180, 180])
    t_footer.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(t_footer)
    story.append(Spacer(1, 8))
    story.append(Paragraph("=== End of Certified Laboratory Examination Report ===", subtitle_style))

    doc.build(story)
    print(f"[ReportGen] Generated PDF report: {output_path}")


def generate_all_demo_reports():
    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "uploads")
    os.makedirs(base_dir, exist_ok=True)

    # 1. Arjun Sharma - Sep 2025 (Baseline)
    generate_pdf_report(
        output_path=os.path.join(base_dir, "arjun_lab_sept_2025.pdf"),
        patient_name="Arjun Sharma",
        patient_age=42,
        patient_sex="Male",
        lab_name="Metropolis Healthcare Laboratory",
        doctor_name="Dr. V. K. Malhotra, MD",
        report_date="2025-09-10",
        report_id="MET-2025-0910-A",
        test_rows=[
            {"name": "TSH (Thyroid Stimulating Hormone)", "val": 3.2, "unit": "uIU/mL", "ref": "0.40 - 4.50", "is_abn": False},
            {"name": "Total Cholesterol", "val": 190.0, "unit": "mg/dL", "ref": "125.0 - 200.0", "is_abn": False},
            {"name": "Triglycerides", "val": 140.0, "unit": "mg/dL", "ref": "50.0 - 150.0", "is_abn": False},
            {"name": "HDL Cholesterol", "val": 45.0, "unit": "mg/dL", "ref": "40.0 - 60.0", "is_abn": False},
            {"name": "Fasting Blood Glucose", "val": 88.0, "unit": "mg/dL", "ref": "70.0 - 99.0", "is_abn": False}
        ]
    )

    # 2. Arjun Sharma - Dec 2025 (Midpoint)
    generate_pdf_report(
        output_path=os.path.join(base_dir, "arjun_lab_dec_2025.pdf"),
        patient_name="Arjun Sharma",
        patient_age=42,
        patient_sex="Male",
        lab_name="Metropolis Healthcare Laboratory",
        doctor_name="Dr. V. K. Malhotra, MD",
        report_date="2025-12-15",
        report_id="MET-2025-1215-B",
        test_rows=[
            {"name": "TSH (Thyroid Stimulating Hormone)", "val": 4.8, "unit": "uIU/mL", "ref": "0.40 - 4.50", "is_abn": True},
            {"name": "Total Cholesterol", "val": 215.0, "unit": "mg/dL", "ref": "125.0 - 200.0", "is_abn": True},
            {"name": "Triglycerides", "val": 170.0, "unit": "mg/dL", "ref": "50.0 - 150.0", "is_abn": True},
            {"name": "HDL Cholesterol", "val": 41.0, "unit": "mg/dL", "ref": "40.0 - 60.0", "is_abn": False},
            {"name": "Fasting Blood Glucose", "val": 91.0, "unit": "mg/dL", "ref": "70.0 - 99.0", "is_abn": False}
        ]
    )

    # 3. Arjun Sharma - Mar 2026 (Latest)
    generate_pdf_report(
        output_path=os.path.join(base_dir, "arjun_lab_march_2026.pdf"),
        patient_name="Arjun Sharma",
        patient_age=42,
        patient_sex="Male",
        lab_name="Metropolis Healthcare Laboratory",
        doctor_name="Dr. V. K. Malhotra, MD",
        report_date="2026-03-01",
        report_id="MET-2026-0301-C",
        test_rows=[
            {"name": "TSH (Thyroid Stimulating Hormone)", "val": 6.8, "unit": "uIU/mL", "ref": "0.40 - 4.50", "is_abn": True},
            {"name": "Total Cholesterol", "val": 242.0, "unit": "mg/dL", "ref": "125.0 - 200.0", "is_abn": True},
            {"name": "Triglycerides", "val": 195.0, "unit": "mg/dL", "ref": "50.0 - 150.0", "is_abn": True},
            {"name": "HDL Cholesterol", "val": 38.0, "unit": "mg/dL", "ref": "40.0 - 60.0", "is_abn": True},
            {"name": "LDL Cholesterol", "val": 165.0, "unit": "mg/dL", "ref": "50.0 - 100.0", "is_abn": True},
            {"name": "Fasting Blood Glucose", "val": 94.0, "unit": "mg/dL", "ref": "70.0 - 99.0", "is_abn": False},
            {"name": "Serum Creatinine", "val": 0.9, "unit": "mg/dL", "ref": "0.60 - 1.20", "is_abn": False}
        ]
    )

    # 4. Kavita Patel - Feb 2026 (Missing reference range demonstration)
    generate_pdf_report(
        output_path=os.path.join(base_dir, "kavita_glycemic_report.pdf"),
        patient_name="Kavita Patel",
        patient_age=36,
        patient_sex="Female",
        lab_name="Lifeline Diagnostic Centre, Ahmedabad",
        doctor_name="Dr. R. C. Shah",
        report_date="2026-02-20",
        report_id="LL-2026-0220-K",
        test_rows=[
            {"name": "Blood Glucose Fasting", "val": 138.0, "unit": "mg/dL", "ref": "Not Provided on Lab Slip", "is_abn": True},
            {"name": "HbA1c (Glycated Hemoglobin)", "val": 6.9, "unit": "%", "ref": "Not Provided on Lab Slip", "is_abn": True},
            {"name": "Total Protein", "val": 7.1, "unit": "g/dL", "ref": "Not Provided on Lab Slip", "is_abn": False}
        ],
        notice_text="Reference ranges omitted from print slip by laboratory. MedLens safely processes without fabricating ranges."
    )

    # 5. Priya Sharma - Mismatch Test
    generate_pdf_report(
        output_path=os.path.join(base_dir, "priya_sharma_report.pdf"),
        patient_name="Priya Sharma",
        patient_age=38,
        patient_sex="Female",
        lab_name="Apollo Diagnostics, New Delhi",
        doctor_name="Dr. Ananya Roy",
        report_date="2026-02-28",
        report_id="APL-2026-0228-P",
        test_rows=[
            {"name": "Hemoglobin", "val": 11.2, "unit": "g/dL", "ref": "12.0 - 15.5", "is_abn": True},
            {"name": "Serum Ferritin", "val": 14.0, "unit": "ng/mL", "ref": "15.0 - 150.0", "is_abn": True},
            {"name": "MCV", "val": 74.0, "unit": "fL", "ref": "80.0 - 100.0", "is_abn": True}
        ]
    )

if __name__ == "__main__":
    generate_all_demo_reports()
