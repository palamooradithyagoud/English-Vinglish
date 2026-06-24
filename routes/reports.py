import io
import csv
from flask import Blueprint, send_file, flash, redirect, url_for, Response
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from database import get_student_by_id, get_levels_completed_count, get_recent_progress, get_students_list
from routes.faculty_auth import faculty_login_required

reports_bp = Blueprint('reports', __name__)

def make_student_pdf(student, progress, levels_completed):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#10B981'),  # English Winglish branding green
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=10,
        spaceBefore=10
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#475569'),
        spaceAfter=6
    )
    
    bold_body_style = ParagraphStyle(
        'BodyTextBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    story = []
    
    story.append(Paragraph("English Winglish - Academic Report", title_style))
    story.append(Spacer(1, 10))
    
    details_data = [
        [Paragraph("Full Name:", bold_body_style), Paragraph(student['full_name'], body_style),
         Paragraph("Roll Number:", bold_body_style), Paragraph(student['roll_number'], body_style)],
        [Paragraph("Branch:", bold_body_style), Paragraph(student['branch'], body_style),
         Paragraph("Year:", bold_body_style), Paragraph(str(student['year']), body_style)],
        [Paragraph("Email:", bold_body_style), Paragraph(student['email'], body_style),
         Paragraph("Current Level:", bold_body_style), Paragraph(f"Level {student['current_level']}", body_style)],
        [Paragraph("XP Score:", bold_body_style), Paragraph(f"{student['xp']} XP", body_style),
         Paragraph("Levels Completed:", bold_body_style), Paragraph(str(levels_completed), body_style)]
    ]
    
    details_table = Table(details_data, colWidths=[100, 160, 100, 160])
    details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    
    story.append(Paragraph("Student Information", section_style))
    story.append(details_table)
    story.append(Spacer(1, 20))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

def make_class_pdf(students_list):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=colors.HexColor('#10B981'),
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=10,
        spaceBefore=10
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#475569'),
        spaceAfter=4
    )
    
    bold_body_style = ParagraphStyle(
        'BodyTextBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    story = []
    
    story.append(Paragraph("English Winglish - Class-wide Performance Report", title_style))
    story.append(Spacer(1, 10))
    
    total_students = len(students_list)
    avg_xp = round(sum(s['xp'] for s in students_list) / total_students) if total_students else 0
    
    summary_data = [
        [Paragraph("Total Registered Students:", bold_body_style), Paragraph(str(total_students), body_style)],
        [Paragraph("Average Student XP:", bold_body_style), Paragraph(f"{avg_xp} XP", body_style)]
    ]
    summary_table = Table(summary_data, colWidths=[180, 340])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    
    story.append(Paragraph("Class Summary", section_style))
    story.append(summary_table)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("Student Performance Roster", section_style))
    
    table_data = [[
        Paragraph("<b>Rank</b>", body_style),
        Paragraph("<b>Name</b>", body_style),
        Paragraph("<b>Roll Number</b>", body_style),
        Paragraph("<b>Branch / Year</b>", body_style),
        Paragraph("<b>XP Score</b>", body_style),
        Paragraph("<b>Current Level</b>", body_style)
    ]]
    
    sorted_students = sorted(students_list, key=lambda x: x.get('xp', 0), reverse=True)
    
    for idx, s in enumerate(sorted_students):
        table_data.append([
            Paragraph(str(idx + 1), body_style),
            Paragraph(s['full_name'], body_style),
            Paragraph(s['roll_number'], body_style),
            Paragraph(f"{s['branch']} - Yr {s['year']}", body_style),
            Paragraph(f"{s['xp']} XP", body_style),
            Paragraph(f"Level {s['current_level']}", body_style)
        ])
        
    roster_table = Table(table_data, colWidths=[40, 140, 100, 100, 70, 70])
    roster_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    
    story.append(roster_table)
    
    doc.build(story)
    buffer.seek(0)
    return buffer

@reports_bp.route('/faculty/reports/student/<int:student_id>/pdf')
@faculty_login_required
def student_pdf(student_id):
    student = get_student_by_id(student_id)
    if not student:
        flash("Student not found.", "error")
        return redirect(url_for('faculty_dashboard.students'))
        
    progress = get_recent_progress(student_id, limit=100)
    levels_completed = get_levels_completed_count(student_id)
    
    pdf_buffer = make_student_pdf(student, progress, levels_completed)
    filename = f"student_report_{student['roll_number']}.pdf"
    
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=filename,
        mimetype='application/pdf'
    )

@reports_bp.route('/faculty/reports/student/<int:student_id>/excel')
@faculty_login_required
def student_excel(student_id):
    student = get_student_by_id(student_id)
    if not student:
        flash("Student not found.", "error")
        return redirect(url_for('faculty_dashboard.students'))
        
    progress = get_recent_progress(student_id, limit=100)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Student Profile Summary"])
    writer.writerow(["Full Name", student['full_name']])
    writer.writerow(["Roll Number", student['roll_number']])
    writer.writerow(["Branch", student['branch']])
    writer.writerow(["Year", student['year']])
    writer.writerow(["Email", student['email']])
    writer.writerow(["XP Score", student['xp']])
    writer.writerow(["Current Level", student['current_level']])
    writer.writerow([])
    

        
    filename = f"student_report_{student['roll_number']}.csv"
    response = Response(output.getvalue(), mimetype='text/csv')
    response.headers['Content-Disposition'] = f'attachment; filename={filename}'
    return response

@reports_bp.route('/faculty/reports/class/pdf')
@faculty_login_required
def class_pdf():
    branch = request.args.get('branch', 'All')
    year = request.args.get('year', 'All')
    level = request.args.get('level', 'All')
    
    student_list = get_students_list(
        branch=None if branch == 'All' else branch,
        year=None if year == 'All' else year,
        level=None if level == 'All' else level
    )
    
    if not student_list:
        flash("No students found to generate report.", "warning")
        return redirect(url_for('faculty_dashboard.students'))
        
    pdf_buffer = make_class_pdf(student_list)
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name="class_performance_report.pdf",
        mimetype='application/pdf'
    )

@reports_bp.route('/faculty/reports/class/excel')
@faculty_login_required
def class_excel():
    branch = request.args.get('branch', 'All')
    year = request.args.get('year', 'All')
    level = request.args.get('level', 'All')
    
    student_list = get_students_list(
        branch=None if branch == 'All' else branch,
        year=None if year == 'All' else year,
        level=None if level == 'All' else level
    )
    
    if not student_list:
        flash("No students found to generate report.", "warning")
        return redirect(url_for('faculty_dashboard.students'))
        
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["Class-wide Student Roster Report"])
    writer.writerow(["Branch Filter", branch])
    writer.writerow(["Year Filter", year])
    writer.writerow(["Level Filter", level])
    writer.writerow([])
    writer.writerow(["Rank", "Full Name", "Roll Number", "Branch", "Year", "Email", "XP Score", "Current Level"])
    
    sorted_students = sorted(student_list, key=lambda x: x.get('xp', 0), reverse=True)
    for idx, s in enumerate(sorted_students):
        writer.writerow([
            idx + 1,
            s['full_name'],
            s['roll_number'],
            s['branch'],
            s['year'],
            s['email'],
            s['xp'],
            f"Level {s['current_level']}"
        ])
        
    response = Response(output.getvalue(), mimetype='text/csv')
    response.headers['Content-Disposition'] = 'attachment; filename=class_performance_report.csv'
    return response
