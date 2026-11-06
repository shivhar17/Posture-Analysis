import os
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_posture_pdf(analysis_record, output_stream=None):
    """
    Generates a high-quality PDF report for posture assessment.
    Returns either bytes if output_stream is None or writes to output_stream.
    """
    if output_stream is None:
        buffer = io.BytesIO()
    else:
        buffer = output_stream
        
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand Styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0f172a") # Dark navy
    )
    
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#0d9488") # Teal accent
    )
    
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155")
    )
    
    alert_style = ParagraphStyle(
        "AlertText",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b")
    )
    
    story = []
    
    # Header
    story.append(Paragraph("POSTURE AI", title_style))
    story.append(Paragraph("Human Posture Analysis & Biomechanical Ergonomic Report", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0d9488"), spaceAfter=15))
    
    # Session Details Table
    analysis_date = analysis_record.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    input_type = analysis_record.get("input_type", "Image").upper()
    category = analysis_record.get("category", "Good Posture")
    score = analysis_record.get("score", 85)
    rec_id = analysis_record.get("id", "PAI-SESSION-001")
    
    # Score color
    if score >= 85:
        score_color = colors.HexColor("#16a34a") # Green
        rating_text = "ACCEPTABLE / OPTIMAL"
    elif score >= 68:
        score_color = colors.HexColor("#d97706") # Orange
        rating_text = "MODERATE STRAIN / WARNING"
    else:
        score_color = colors.HexColor("#dc2626") # Red
        rating_text = "HIGH ERGONOMIC RISK"
        
    summary_data = [
        [Paragraph("<b>Report ID:</b>", body_style), Paragraph(str(rec_id), body_style),
         Paragraph("<b>Analysis Date:</b>", body_style), Paragraph(str(analysis_date), body_style)],
        [Paragraph("<b>Input Media:</b>", body_style), Paragraph(input_type, body_style),
         Paragraph("<b>Classification Mode:</b>", body_style), Paragraph(analysis_record.get("mode", "Random Forest ML"), body_style)],
        [Paragraph("<b>Detected Posture:</b>", body_style), Paragraph(f"<b>{category}</b>", body_style),
         Paragraph("<b>Ergonomic Score:</b>", body_style), Paragraph(f"<b><font color='{score_color.hexval()}'>{score} / 100 ({rating_text})</font></b>", body_style)]
    ]
    
    t_summary = Table(summary_data, colWidths=[110, 150, 110, 160])
    t_summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 14))
    
    # Joint Angles Table
    angles = analysis_record.get("angles", {})
    if angles:
        story.append(Paragraph("Quantitative Joint Angle Assessment", section_heading))
        
        angle_rows = [
            [Paragraph("<b>Biomechanical Metric</b>", body_style),
             Paragraph("<b>Measured Value</b>", body_style),
             Paragraph("<b>Healthy Range</b>", body_style),
             Paragraph("<b>Status</b>", body_style)]
        ]
        
        metric_configs = [
            ("Craniovertebral Angle (CVA)", angles.get("craniovertebral_angle", 55.0), "°", "50° - 65°", 50.0, False),
            ("Shoulder Girdle Tilt", angles.get("shoulder_tilt", 1.5), "°", "< 4.0°", 4.0, True),
            ("Torso / Trunk Inclination", angles.get("trunk_inclination", 4.0), "°", "< 12.0°", 12.0, True),
            ("Lateral Spine Deviation", angles.get("lateral_tilt", 1.0), "°", "< 4.0°", 4.0, True),
            ("Hip Flexion (Sagittal)", angles.get("hip_flexion", 175.0), "°", "160° - 180°", 150.0, False),
            ("Knee Articulation", angles.get("knee_flexion", 175.0), "°", "165° - 180°", 155.0, False),
            ("Neck Flexion Strain", angles.get("neck_flexion", 8.0), "°", "< 15.0°", 15.0, True)
        ]
        
        for name, val, unit, ref, thresh, high_is_bad in metric_configs:
            is_good = val <= thresh if high_is_bad else val >= thresh
            status_cell = "<font color='#16a34a'>Normal</font>" if is_good else "<font color='#dc2626'>Strain</font>"
            angle_rows.append([
                Paragraph(name, body_style),
                Paragraph(f"{val}{unit}", body_style),
                Paragraph(ref, body_style),
                Paragraph(status_cell, body_style)
            ])
            
        t_angles = Table(angle_rows, colWidths=[200, 110, 110, 110])
        t_angles.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_angles)
        story.append(Spacer(1, 14))
        
    # Ergonomic Concerns
    concerns = analysis_record.get("concerns", [])
    if concerns:
        story.append(Paragraph("Identified Ergonomic Concerns", section_heading))
        for c in concerns:
            story.append(Paragraph(f"• {c}", body_style))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 10))
        
    # Corrective Exercises
    recs = analysis_record.get("recommendations", [])
    if recs:
        story.append(Paragraph("Personalized Corrective Recommendations & Exercises", section_heading))
        for r in recs:
            story.append(Paragraph(f"<b>{r.get('title', 'Exercise')}</b> - <i>Target: {r.get('area', 'Spine')}</i>", body_style))
            story.append(Paragraph(f"Protocol: {r.get('duration', 'Daily')} | Purpose: {r.get('purpose', 'Postural correction')}", alert_style))
            story.append(Spacer(1, 5))
            
    # Disclaimer
    story.append(Spacer(1, 18))
    story.append(HRFlowable(width="100%", thickness=0.8, color=colors.HexColor("#e2e8f0"), spaceAfter=8))
    disclaimer = (
        "<b>CLINICAL DISCLAIMER:</b> This automated posture assessment report is generated via computer vision "
        "and biomechanical landmark estimation algorithms. It is intended solely for ergonomic awareness, wellness "
        "monitoring, and preventative posture education. It does not replace medical consultation, radiological imaging, "
        "or diagnostic evaluation by a certified physician or physical therapist."
    )
    story.append(Paragraph(disclaimer, alert_style))
    
    doc.build(story)
    
    if output_stream is None:
        buffer.seek(0)
        return buffer.getvalue()
    return None
