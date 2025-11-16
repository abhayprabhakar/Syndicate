"""
PDF Report Generator Service
Generates professional F1-themed PDF reports from segmentation analysis results.
"""
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak,
    Table, TableStyle, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

from utils.logger import get_logger

# Import graph generator
from services.graph_generator import generate_graphs

logger = get_logger(__name__)


class F1ThemedCanvas(canvas.Canvas):
    """Custom canvas for adding headers, footers, and F1 branding."""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.pages = []
        
    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()
        
    def save(self):
        page_count = len(self.pages)
        for page_num, page in enumerate(self.pages, start=1):
            self.__dict__.update(page)
            self.draw_page_decorations(page_num, page_count)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)
        
    def draw_page_decorations(self, page_num: int, page_count: int):
        """Draw header, footer, and decorative elements."""
        page_width, page_height = letter
        
        # F1 Red color
        f1_red = colors.HexColor("#e10600")
        f1_dark = colors.HexColor("#0a0a0a")
        
        # Top red line
        self.setStrokeColor(f1_red)
        self.setLineWidth(3)
        self.line(0, page_height - 20, page_width, page_height - 20)
        
        # Bottom red line
        self.line(0, 30, page_width, 30)
        
        # Corner decorative elements
        self.setStrokeColor(f1_red)
        self.setLineWidth(1.5)
        
        # Top left corner
        self.line(30, page_height - 40, 30, page_height - 80)
        self.line(30, page_height - 40, 70, page_height - 40)
        
        # Top right corner
        self.line(page_width - 30, page_height - 40, page_width - 30, page_height - 80)
        self.line(page_width - 30, page_height - 40, page_width - 70, page_height - 40)
        
        # Bottom left corner
        self.line(30, 50, 30, 90)
        self.line(30, 50, 70, 50)
        
        # Bottom right corner
        self.line(page_width - 30, 50, page_width - 30, 90)
        self.line(page_width - 30, 50, page_width - 70, 50)
        
        # Header text
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#999999"))
        self.drawString(40, page_height - 15, "TrackShift Visual Intelligence Engine")
        
        # Footer text
        self.setFont("Helvetica", 8)
        self.drawString(40, 20, f"Generated: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}")
        
        # Page number
        self.drawRightString(page_width - 40, 20, f"Page {page_num} of {page_count}")


class PDFReportGenerator:
    """Generates professional F1-themed PDF reports from analysis results."""
    
    # F1 Theme Colors
    F1_RED = colors.HexColor("#e10600")
    F1_RED_DARK = colors.HexColor("#b30500")
    F1_RED_LIGHT = colors.HexColor("#ff1e1e")
    F1_BLACK = colors.HexColor("#000000")
    F1_SURFACE = colors.HexColor("#1a1a1a")
    F1_SURFACE_LIGHT = colors.HexColor("#2a2a2a")
    F1_WHITE = colors.HexColor("#ffffff")
    F1_GRAY = colors.HexColor("#999999")
    
    def __init__(self):
        self.logger = get_logger(__name__)
        self.styles = self._create_custom_styles()
        
    def _create_custom_styles(self) -> Dict[str, ParagraphStyle]:
        """Create custom F1-themed paragraph styles."""
        styles = getSampleStyleSheet()
        
        # Main title style
        styles.add(ParagraphStyle(
            name='F1Title',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=self.F1_RED,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            leading=32
        ))
        
        # Section header style
        styles.add(ParagraphStyle(
            name='F1SectionHeader',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=self.F1_RED,
            spaceBefore=15,
            spaceAfter=10,
            fontName='Helvetica-Bold',
            borderWidth=0,
            borderColor=self.F1_RED,
            borderPadding=5,
            leading=20
        ))
        
        # Subsection header style
        styles.add(ParagraphStyle(
            name='F1Subsection',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=self.F1_WHITE,
            spaceBefore=10,
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))
        
        # Body text style
        styles.add(ParagraphStyle(
            name='F1Body',
            parent=styles['Normal'],
            fontSize=10,
            textColor=self.F1_WHITE,
            spaceAfter=8,
            fontName='Helvetica',
            leading=14
        ))
        
        # Caption style
        styles.add(ParagraphStyle(
            name='F1Caption',
            parent=styles['Normal'],
            fontSize=8,
            textColor=self.F1_GRAY,
            alignment=TA_CENTER,
            spaceAfter=10,
            fontName='Helvetica-Oblique'
        ))
        
        # Metric label style
        styles.add(ParagraphStyle(
            name='F1MetricLabel',
            parent=styles['Normal'],
            fontSize=10,
            textColor=self.F1_GRAY,
            fontName='Helvetica'
        ))
        
        # Metric value style
        styles.add(ParagraphStyle(
            name='F1MetricValue',
            parent=styles['Normal'],
            fontSize=14,
            textColor=self.F1_RED,
            fontName='Helvetica-Bold'
        ))
        
        return styles
    
    def generate_report(
        self,
        job_id: str,
        results: Dict[str, Any],
        image_paths: Dict[str, Path],
        output_path: Optional[Path] = None,
        ai_analysis: Optional[Dict[str, Any]] = None
    ) -> BytesIO:
        """
        Generate a complete PDF report.
        
        Args:
            job_id: Unique job identifier
            results: Analysis results including changes, metrics, etc.
            image_paths: Paths to baseline, current, and annotated images
            output_path: Optional path to save PDF file
            ai_analysis: Optional AI-generated analysis from Gemini
            
        Returns:
            BytesIO buffer containing the PDF
        """
        self.logger.info(
            "pdf_generation_started",
            job_id=job_id,
            num_changes=results.get("num_changes", 0),
            ai_powered=ai_analysis is not None
        )
        
        # Create buffer for PDF
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer if not output_path else str(output_path),
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=100,
            bottomMargin=80,
            title=f"F1 Analysis Report - {job_id}",
            author="TrackShift Visual Intelligence Engine"
        )
        
        # Build document content
        story = []
        
        # Title Page
        story.extend(self._create_title_page(job_id, results, ai_analysis))
        story.append(PageBreak())
        
        # AI Executive Summary (if available)
        if ai_analysis:
            story.extend(self._create_ai_summary_section(ai_analysis))
            story.append(PageBreak())
        
        # Executive Summary
        story.extend(self._create_executive_summary(results))
        story.append(PageBreak())
        
        # Visual Analysis
        story.extend(self._create_visual_analysis(image_paths))
        story.append(PageBreak())
        
        # Detailed Changes
        if results.get("changes"):
            story.extend(self._create_changes_section(results["changes"]))
            story.append(PageBreak())
        
        # AI Detailed Analysis (if available)
        if ai_analysis:
            story.extend(self._create_ai_analysis_sections(ai_analysis))
            story.append(PageBreak())
        
        # Performance Metrics
        story.extend(self._create_metrics_section(results))
        story.append(PageBreak())
        
        # Analytical Graphs Section
        story.extend(self._create_graphs_section())
        
        # Build PDF with custom canvas
        doc.build(story, canvasmaker=F1ThemedCanvas)
        
        # Reset buffer position
        if not output_path:
            buffer.seek(0)
        
        self.logger.info(
            "pdf_generation_completed",
            job_id=job_id,
            output_path=str(output_path) if output_path else "buffer"
        )
        
        return buffer
    
    def _create_title_page(self, job_id: str, results: Dict[str, Any], ai_analysis: Optional[Dict[str, Any]] = None) -> List:
        """Create the title page with branding and summary."""
        elements = []
        
        # Add spacing
        elements.append(Spacer(1, 1.5 * inch))
        
        # Main title
        title = Paragraph(
            "F1 VISUAL ANALYSIS REPORT",
            self.styles['F1Title']
        )
        elements.append(title)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Subtitle with AI badge
        subtitle_text = "Complete Vehicle Inspection & Change Detection"
        if ai_analysis and ai_analysis.get("ai_powered", True):
            subtitle_text += " • <font color='#e10600'>AI-POWERED</font>"
        
        subtitle = Paragraph(
            subtitle_text,
            self.styles['F1Body']
        )
        subtitle.alignment = TA_CENTER
        elements.append(subtitle)
        elements.append(Spacer(1, 0.5 * inch))
        
        # Job ID badge
        job_badge = Paragraph(
            f"<font color='#999999'>JOB ID:</font> <font color='#e10600'>{job_id[:8].upper()}</font>",
            self.styles['F1Body']
        )
        job_badge.alignment = TA_CENTER
        elements.append(job_badge)
        elements.append(Spacer(1, 1 * inch))
        
        # Key metrics summary table
        num_changes = results.get("num_changes", 0)
        severity = self._calculate_severity(num_changes)
        
        summary_data = [
            ["CHANGES DETECTED", "OVERALL SEVERITY", "ANALYSIS STATUS"],
            [
                f"{num_changes}",
                f"{severity}%",
                "COMPLETE"
            ]
        ]
        
        summary_table = Table(summary_data, colWidths=[2 * inch, 2 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), self.F1_RED),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.F1_WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Data row
            ('BACKGROUND', (0, 1), (-1, 1), self.F1_SURFACE),
            ('TEXTCOLOR', (0, 1), (-1, 1), self.F1_RED),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 18),
            ('ALIGN', (0, 1), (-1, 1), 'CENTER'),
            ('TOPPADDING', (0, 1), (-1, 1), 15),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 15),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 1, self.F1_RED),
            ('BOX', (0, 0), (-1, -1), 2, self.F1_RED),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 1 * inch))
        
        # Generated by
        footer = Paragraph(
            "<font color='#999999'>Generated by</font><br/>"
            "<font color='#e10600' size='14'><b>TrackShift Visual Intelligence Engine</b></font>",
            self.styles['F1Body']
        )
        footer.alignment = TA_CENTER
        elements.append(footer)
        
        return elements
    
    def _create_executive_summary(self, results: Dict[str, Any]) -> List:
        """Create executive summary section."""
        elements = []
        
        # Section header
        elements.append(Paragraph("EXECUTIVE SUMMARY", self.styles['F1SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Overview text
        num_changes = results.get("num_changes", 0)
        changes = results.get("changes", [])
        
        # Introduction
        intro_text = (
            "<b>Analysis Overview:</b> This comprehensive report presents the findings of an automated visual "
            "inspection conducted using the TrackShift Visual Intelligence Engine. The system employs state-of-the-art "
            "computer vision algorithms, including LoFTR feature matching and Segment Anything Model (SAM), to detect "
            "and classify structural changes in Formula 1 racing vehicles."
        )
        elements.append(Paragraph(intro_text, self.styles['F1Body']))
        elements.append(Spacer(1, 0.15 * inch))
        
        if num_changes > 0:
            summary_text = (
                f"<b>Key Findings:</b> The automated visual inspection system has detected <b><font color='#e10600'>{num_changes}</font></b> "
                f"significant changes between the baseline and current vehicle states. These changes have been classified by component "
                f"and assigned confidence scores based on advanced computer vision analysis. Each detection has undergone rigorous "
                f"validation to ensure accuracy and reliability."
            )
        else:
            summary_text = (
                "<b>Key Findings:</b> The automated visual inspection system has completed a thorough analysis of the vehicle. "
                "No significant changes were detected between the baseline and current vehicle states. This indicates either "
                "minimal wear or successful maintenance procedures."
            )
        
        elements.append(Paragraph(summary_text, self.styles['F1Body']))
        elements.append(Spacer(1, 0.15 * inch))
        
        # Methodology description
        methodology_text = (
            "<b>Analysis Methodology:</b> The inspection process utilizes a multi-stage pipeline incorporating image alignment, "
            "change detection through binary difference masks, semantic segmentation using SAM, and component classification "
            "via ResNet-based neural networks. This approach ensures high precision in identifying structural modifications, "
            "damage patterns, and component wear across the vehicle chassis and aerodynamic elements."
        )
        elements.append(Paragraph(methodology_text, self.styles['F1Body']))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Change distribution by part
        if changes:
            elements.append(Paragraph("Change Distribution by Component", self.styles['F1Subsection']))
            elements.append(Spacer(1, 0.1 * inch))
            
            # Count changes by part
            part_counts: Dict[str, int] = {}
            for change in changes:
                part = change.get("part", "Unknown")
                part_counts[part] = part_counts.get(part, 0) + 1
            
            # Create distribution table
            dist_data = [["Component", "Changes Detected", "Percentage"]]
            for part, count in sorted(part_counts.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / num_changes) * 100
                dist_data.append([
                    part,
                    str(count),
                    f"{percentage:.1f}%"
                ])
            
            dist_table = Table(dist_data, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch])
            dist_table.setStyle(TableStyle([
                # Header
                ('BACKGROUND', (0, 0), (-1, 0), self.F1_RED),
                ('TEXTCOLOR', (0, 0), (-1, 0), self.F1_WHITE),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                
                # Data rows
                ('BACKGROUND', (0, 1), (-1, -1), self.F1_SURFACE),
                ('TEXTCOLOR', (0, 1), (-1, -1), self.F1_WHITE),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                
                # Grid
                ('GRID', (0, 0), (-1, -1), 0.5, self.F1_GRAY),
                ('BOX', (0, 0), (-1, -1), 1, self.F1_RED),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            
            elements.append(dist_table)
        
        return elements
    
    def _create_visual_analysis(self, image_paths: Dict[str, Path]) -> List:
        """Create visual analysis section with images."""
        elements = []
        
        # Section header
        elements.append(Paragraph("VISUAL ANALYSIS", self.styles['F1SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Visual analysis introduction
        visual_intro = (
            "<b>Visual Comparison:</b> This section presents the visual comparison between the baseline and current vehicle states. "
            "The images below show the original baseline condition, the current analyzed state, and an overlay "
            "highlighting detected changes. Red bounding boxes indicate areas of interest where modifications, "
            "damage, or component changes have been identified. Each detection is labeled with the component "
            "name and confidence score for rapid visual assessment."
        )
        elements.append(Paragraph(visual_intro, self.styles['F1Body']))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Helper function to add image if it exists
        def add_image_if_exists(path: Optional[Path], caption: str):
            if path and path.exists():
                try:
                    img = Image(str(path), width=5 * inch, height=3.5 * inch)
                    img.hAlign = 'CENTER'
                    elements.append(img)
                    elements.append(Paragraph(caption, self.styles['F1Caption']))
                    elements.append(Spacer(1, 0.2 * inch))
                except Exception as e:
                    self.logger.warning(f"Failed to add image {path}: {e}")
                    elements.append(Paragraph(
                        f"[Image unavailable: {caption}]",
                        self.styles['F1Caption']
                    ))
        
        # Baseline image
        add_image_if_exists(
            image_paths.get("baseline"),
            "Baseline Image - Original Vehicle State"
        )
        
        # Current image
        add_image_if_exists(
            image_paths.get("current"),
            "Current Image - Analyzed Vehicle State"
        )
        
        # Combined/annotated image
        add_image_if_exists(
            image_paths.get("combined") or image_paths.get("annotated"),
            "Change Detection Overlay - Highlighted Differences"
        )
        
        return elements
    
    def _create_changes_section(self, changes: List[Dict[str, Any]]) -> List:
        """Create detailed changes section."""
        elements = []
        
        # Section header
        elements.append(Paragraph("DETAILED CHANGE ANALYSIS", self.styles['F1SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Detailed analysis introduction
        detailed_intro = (
            "<b>Component-Level Analysis:</b> This section provides a comprehensive breakdown of each detected change, "
            "including precise location coordinates, component classification, and confidence metrics. Changes are ranked "
            "by confidence score to prioritize inspection efforts. High-confidence detections (&gt;80%) require immediate "
            "attention, while medium-confidence detections (60-80%) should be verified through manual inspection. "
            "Low-confidence detections (&lt;60%) may indicate minor wear or environmental factors."
        )
        elements.append(Paragraph(detailed_intro, self.styles['F1Body']))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Sort changes by confidence (highest first)
        sorted_changes = sorted(changes, key=lambda x: x.get("confidence", 0), reverse=True)
        
        # Create changes table
        changes_data = [["ID", "Component", "Location (x, y)", "Confidence", "Status"]]
        
        for change in sorted_changes:
            change_id = change.get("id", "N/A")
            part = change.get("part", "Unknown")
            bbox = change.get("bbox", [0, 0, 0, 0])
            confidence = change.get("confidence", 0)
            
            # Calculate center point from bbox
            if len(bbox) >= 2:
                center_x = int(bbox[0])
                center_y = int(bbox[1])
                location = f"({center_x}, {center_y})"
            else:
                location = "N/A"
            
            # Determine status based on confidence
            if confidence >= 0.8:
                status = "Critical"
                status_color = "#e10600"
            elif confidence >= 0.6:
                status = "High"
                status_color = "#ff1e1e"
            elif confidence >= 0.4:
                status = "Medium"
                status_color = "#ff6b6b"
            else:
                status = "Low"
                status_color = "#999999"
            
            changes_data.append([
                str(change_id),
                part,
                location,
                f"{confidence:.1%}",
                f"<font color='{status_color}'>{status}</font>"
            ])
        
        changes_table = Table(
            changes_data,
            colWidths=[0.5 * inch, 1.8 * inch, 1.3 * inch, 1 * inch, 1 * inch]
        )
        changes_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), self.F1_RED),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.F1_WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Data rows
            ('BACKGROUND', (0, 1), (-1, -1), self.F1_SURFACE),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.F1_WHITE),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # ID column
            ('ALIGN', (2, 1), (-1, -1), 'CENTER'),  # Location, Confidence, Status
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, self.F1_GRAY),
            ('BOX', (0, 0), (-1, -1), 1, self.F1_RED),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        elements.append(changes_table)
        
        return elements
    
    def _create_metrics_section(self, results: Dict[str, Any]) -> List:
        """Create performance metrics section."""
        elements = []
        
        # Section header
        elements.append(Paragraph("PERFORMANCE METRICS & STATISTICS", self.styles['F1SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Metrics introduction
        metrics_intro = (
            "<b>Statistical Analysis:</b> The following metrics provide quantitative insights into the inspection results, "
            "including detection confidence levels, severity assessments, and component distribution patterns. These statistics "
            "are derived from the aggregated analysis data and serve as key performance indicators for maintenance planning "
            "and technical decision-making. Trends in these metrics over multiple inspections can reveal degradation patterns "
            "and inform predictive maintenance strategies."
        )
        elements.append(Paragraph(metrics_intro, self.styles['F1Body']))
        elements.append(Spacer(1, 0.3 * inch))
        
        # Calculate metrics
        num_changes = results.get("num_changes", 0)
        changes = results.get("changes", [])
        
        # Average confidence
        if changes:
            avg_confidence = sum(c.get("confidence", 0) for c in changes) / len(changes)
            max_confidence = max(c.get("confidence", 0) for c in changes)
            min_confidence = min(c.get("confidence", 0) for c in changes)
        else:
            avg_confidence = 0
            max_confidence = 0
            min_confidence = 0
        
        # Overall severity
        severity = self._calculate_severity(num_changes)
        
        # Create metrics table
        metrics_data = [
            ["Metric", "Value", "Assessment"],
            ["Total Changes", str(num_changes), self._get_change_assessment(num_changes)],
            ["Average Confidence", f"{avg_confidence:.1%}", self._get_confidence_assessment(avg_confidence)],
            ["Maximum Confidence", f"{max_confidence:.1%}", "-"],
            ["Minimum Confidence", f"{min_confidence:.1%}", "-"],
            ["Overall Severity", f"{severity}%", self._get_severity_assessment(severity)],
        ]
        
        metrics_table = Table(metrics_data, colWidths=[2 * inch, 1.5 * inch, 2 * inch])
        metrics_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), self.F1_RED),
            ('TEXTCOLOR', (0, 0), (-1, 0), self.F1_WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            
            # Data rows
            ('BACKGROUND', (0, 1), (-1, -1), self.F1_SURFACE),
            ('TEXTCOLOR', (0, 1), (-1, -1), self.F1_WHITE),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (1, 1), (1, -1), 'CENTER'),
            
            # Grid
            ('GRID', (0, 0), (-1, -1), 0.5, self.F1_GRAY),
            ('BOX', (0, 0), (-1, -1), 1, self.F1_RED),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        
        elements.append(metrics_table)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Recommendations
        elements.append(Paragraph("Recommendations", self.styles['F1Subsection']))
        elements.append(Spacer(1, 0.1 * inch))
        
        recommendations = self._generate_recommendations(num_changes, avg_confidence, severity)
        for rec in recommendations:
            bullet = Paragraph(f"• {rec}", self.styles['F1Body'])
            elements.append(bullet)
            elements.append(Spacer(1, 0.05 * inch))
        
        return elements
    
    def _calculate_severity(self, num_changes: int) -> int:
        """Calculate overall severity percentage based on number of changes."""
        if num_changes == 0:
            return 0
        elif num_changes <= 2:
            return min(20 + (num_changes * 10), 40)
        elif num_changes <= 5:
            return min(40 + ((num_changes - 2) * 10), 70)
        else:
            return min(70 + ((num_changes - 5) * 5), 95)
    
    def _get_change_assessment(self, num_changes: int) -> str:
        """Get text assessment for number of changes."""
        if num_changes == 0:
            return "Excellent - No issues detected"
        elif num_changes <= 2:
            return "Good - Minor changes"
        elif num_changes <= 5:
            return "Moderate - Review recommended"
        else:
            return "Significant - Immediate attention required"
    
    def _get_confidence_assessment(self, confidence: float) -> str:
        """Get text assessment for confidence level."""
        if confidence >= 0.9:
            return "Very High"
        elif confidence >= 0.7:
            return "High"
        elif confidence >= 0.5:
            return "Moderate"
        else:
            return "Low - Manual verification recommended"
    
    def _get_severity_assessment(self, severity: int) -> str:
        """Get text assessment for severity level."""
        if severity < 30:
            return "Low Impact"
        elif severity < 60:
            return "Moderate Impact"
        else:
            return "High Impact - Priority Review"
    
    def _generate_recommendations(self, num_changes: int, avg_confidence: float, severity: int) -> List[str]:
        """Generate actionable recommendations based on analysis."""
        recommendations = []
        
        if num_changes == 0:
            recommendations.append(
                "No changes detected. Vehicle appears to be in baseline condition."
            )
            recommendations.append(
                "Continue regular monitoring schedule."
            )
        else:
            if severity >= 60:
                recommendations.append(
                    "High severity detected. Immediate inspection by technical team recommended."
                )
            
            if avg_confidence < 0.7:
                recommendations.append(
                    "Average confidence below 70%. Manual verification of flagged areas is recommended."
                )
            
            if num_changes > 5:
                recommendations.append(
                    f"Multiple changes detected ({num_changes} areas). Conduct comprehensive vehicle inspection."
                )
            
            recommendations.append(
                "Review detailed change analysis section for specific component information."
            )
            
            recommendations.append(
                "Update maintenance log with findings and schedule follow-up inspection."
            )
        
        return recommendations


    def _create_ai_summary_section(self, ai_analysis: Dict[str, Any]) -> List:
        """Create AI-powered executive summary section."""
        elements = []
        
        # Section header
        elements.append(Paragraph(
            "AI-POWERED EXECUTIVE SUMMARY",
            self.styles['F1SectionHeader']
        ))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Executive summary text
        summary = ai_analysis.get("executive_summary", "No AI summary available.")
        elements.append(Paragraph(summary, self.styles['F1Body']))
        elements.append(Spacer(1, 0.2 * inch))
        
        # AI badge
        badge = Paragraph(
            "<font color='#999999'>Generated by</font> <font color='#e10600'><b>Google Gemini AI</b></font>",
            self.styles['F1Caption']
        )
        elements.append(badge)
        
        return elements
    
    def _create_ai_analysis_sections(self, ai_analysis: Dict[str, Any]) -> List:
        """Create detailed AI analysis sections."""
        elements = []
        
        # Risk Assessment Section
        if ai_analysis.get("risk_assessment"):
            elements.append(Paragraph("AI RISK ASSESSMENT", self.styles['F1SectionHeader']))
            elements.append(Spacer(1, 0.2 * inch))
            
            risk_text = ai_analysis["risk_assessment"]
            # Parse risk text into structured format
            for line in risk_text.split('\n'):
                if line.strip():
                    elements.append(Paragraph(line, self.styles['F1Body']))
            
            elements.append(Spacer(1, 0.3 * inch))
        
        # Technical Insights Section
        if ai_analysis.get("technical_insights"):
            elements.append(Paragraph("TECHNICAL INSIGHTS", self.styles['F1SectionHeader']))
            elements.append(Spacer(1, 0.2 * inch))
            
            insights_text = ai_analysis["technical_insights"]
            for line in insights_text.split('\n'):
                if line.strip():
                    elements.append(Paragraph(line, self.styles['F1Body']))
            
            elements.append(Spacer(1, 0.3 * inch))
        
        # Detailed Component Analysis
        if ai_analysis.get("detailed_analysis"):
            elements.append(Paragraph("DETAILED COMPONENT ANALYSIS", self.styles['F1SectionHeader']))
            elements.append(Spacer(1, 0.2 * inch))
            
            analysis_text = ai_analysis["detailed_analysis"]
            for line in analysis_text.split('\n'):
                if line.strip():
                    elements.append(Paragraph(line, self.styles['F1Body']))
            
            elements.append(Spacer(1, 0.3 * inch))
        
        # AI Recommendations Section
        if ai_analysis.get("recommendations"):
            elements.append(Paragraph("AI RECOMMENDATIONS", self.styles['F1SectionHeader']))
            elements.append(Spacer(1, 0.2 * inch))
            
            recommendations_text = ai_analysis["recommendations"]
            for line in recommendations_text.split('\n'):
                if line.strip():
                    elements.append(Paragraph(line, self.styles['F1Body']))
            
            elements.append(Spacer(1, 0.3 * inch))
        
        # Next Steps Section
        if ai_analysis.get("next_steps"):
            elements.append(Paragraph("RECOMMENDED NEXT STEPS", self.styles['F1Subsection']))
            elements.append(Spacer(1, 0.1 * inch))
            
            next_steps_text = ai_analysis["next_steps"]
            for line in next_steps_text.split('\n'):
                if line.strip():
                    elements.append(Paragraph(f"• {line.strip()}", self.styles['F1Body']))
        
        return elements
    
    def _create_graphs_section(self) -> List:
        """Create analytical graphs section with F1 data visualizations."""
        elements = []
        
        # Section header
        elements.append(Paragraph(
            "📊 ANALYTICAL GRAPHS & VISUALIZATIONS",
            self.styles['F1SectionHeader']
        ))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Graphs introduction
        graphs_intro = (
            "<b>Data Visualization Suite:</b> This section presents a comprehensive set of analytical visualizations "
            "designed to provide deeper insights into vehicle performance, component wear patterns, and operational metrics. "
            "Each graph is generated using real-time telemetry data and historical baselines to identify trends, anomalies, "
            "and areas requiring attention. The visualizations follow F1 industry standards and utilize color-coded indicators "
            "for rapid assessment of critical parameters. These graphs support data-driven decision making for race strategy, "
            "pit stop planning, and component lifecycle management."
        )
        elements.append(Paragraph(graphs_intro, self.styles['F1Body']))
        elements.append(Spacer(1, 0.3 * inch))
        
        try:
            # Generate all graphs
            self.logger.info("Generating analytical graphs for PDF")
            graphs = generate_graphs()
            
            # Convert base64 images to ImageReader objects
            import base64
            
            # 1. Confidence Distribution
            if 'confidence_distribution' in graphs:
                elements.append(Paragraph("1. Change Detection Confidence Distribution", self.styles['F1Subsection']))
                desc_text = (
                    "This histogram illustrates the distribution of confidence scores across all detected changes. "
                    "The color gradient (light red to dark red) indicates confidence levels, with darker shades representing "
                    "higher confidence detections. A right-skewed distribution suggests reliable detection performance, "
                    "while a left-skewed pattern may indicate environmental noise or marginal changes requiring validation."
                )
                elements.append(Paragraph(desc_text, self.styles['F1Body']))
                elements.append(Spacer(1, 0.15 * inch))
                img_data = base64.b64decode(graphs['confidence_distribution'].split(',')[1])
                img = Image(BytesIO(img_data), width=6*inch, height=3*inch)
                elements.append(img)
                elements.append(Spacer(1, 0.3 * inch))
            
            # 2. Component Damage Chart
            if 'component_damage' in graphs:
                elements.append(PageBreak())
                elements.append(Paragraph("2. Component Damage Severity Analysis", self.styles['F1Subsection']))
                desc_text = (
                    "This horizontal bar chart displays damage severity percentages for critical F1 components. "
                    "Color coding provides immediate visual assessment: Green (0-40%) indicates acceptable wear, "
                    "Orange (40-70%) suggests monitoring required, and Red (70-100%) signals urgent attention needed. "
                    "Components are sorted to highlight high-priority maintenance items. This data informs component "
                    "replacement schedules and helps prevent catastrophic failures during race conditions."
                )
                elements.append(Paragraph(desc_text, self.styles['F1Body']))
                elements.append(Spacer(1, 0.15 * inch))
                img_data = base64.b64decode(graphs['component_damage'].split(',')[1])
                img = Image(BytesIO(img_data), width=6*inch, height=3.5*inch)
                elements.append(img)
                elements.append(Spacer(1, 0.3 * inch))
            
            # 3. Lap Time Evolution
            if 'lap_times' in graphs:
                elements.append(PageBreak())
                elements.append(Paragraph("3. Lap Time Evolution & Performance Tracking", self.styles['F1Subsection']))
                desc_text = (
                    "This line graph tracks lap time progression throughout the session, revealing performance trends and anomalies. "
                    "The green dashed line indicates the best lap achieved, while the blue line shows the average pace. "
                    "Orange triangle markers identify pit stops or traffic interference. Gradual increases suggest tire degradation, "
                    "while sudden spikes may indicate mechanical issues or track incidents. This data is crucial for optimizing "
                    "pit stop timing and race strategy decisions."
                )
                elements.append(Paragraph(desc_text, self.styles['F1Body']))
                elements.append(Spacer(1, 0.15 * inch))
                img_data = base64.b64decode(graphs['lap_times'].split(',')[1])
                img = Image(BytesIO(img_data), width=6.5*inch, height=3*inch)
                elements.append(img)
                elements.append(Spacer(1, 0.3 * inch))
            
            # 4. Tire Wear Progression
            if 'tire_wear' in graphs:
                elements.append(PageBreak())
                elements.append(Paragraph("4. Tire Wear Progression by Compound", self.styles['F1Subsection']))
                desc_text = (
                    "This multi-line chart compares wear rates across different tire compounds: Soft (red), Medium (orange), "
                    "and Hard (white). The critical wear zone (80-100%) is highlighted in red, indicating when tire replacement "
                    "becomes urgent. Soft compounds degrade fastest but offer maximum grip, while hard compounds provide longevity "
                    "at the cost of performance. Understanding these degradation curves is essential for multi-stint race strategies "
                    "and helps predict optimal pit window timing based on compound selection."
                )
                elements.append(Paragraph(desc_text, self.styles['F1Body']))
                elements.append(Spacer(1, 0.15 * inch))
                img_data = base64.b64decode(graphs['tire_wear'].split(',')[1])
                img = Image(BytesIO(img_data), width=6*inch, height=3*inch)
                elements.append(img)
                elements.append(Spacer(1, 0.3 * inch))
            
            # 5. Speed Heatmap
            if 'speed_heatmap' in graphs:
                elements.append(PageBreak())
                elements.append(Paragraph("5. Speed Distribution Across Track Sections", self.styles['F1Subsection']))
                desc_text = (
                    "This heatmap visualizes speed patterns across nine critical track sections over multiple laps. "
                    "The color gradient ranges from red (lower speeds in technical sections) through yellow to green (maximum speeds on straights). "
                    "Numerical values in each cell show exact speeds in km/h. Consistent patterns indicate driver confidence and vehicle balance, "
                    "while variations may reveal setup issues, tire degradation, or traffic interference. Straights typically show 280-330 km/h, "
                    "while tight complexes exhibit 140-180 km/h. This sector-by-sector analysis helps identify performance gains and setup optimization opportunities."
                )
                elements.append(Paragraph(desc_text, self.styles['F1Body']))
                elements.append(Spacer(1, 0.15 * inch))
                img_data = base64.b64decode(graphs['speed_heatmap'].split(',')[1])
                img = Image(BytesIO(img_data), width=6.5*inch, height=4*inch)
                elements.append(img)
                elements.append(Spacer(1, 0.3 * inch))
            
            # 6. Performance Radar
            if 'performance_radar' in graphs:
                elements.append(PageBreak())
                elements.append(Paragraph("6. Overall Performance Analysis Radar", self.styles['F1Subsection']))
                desc_text = (
                    "This radar chart provides a holistic view of vehicle performance across eight key metrics: Speed, Braking, "
                    "Cornering, Acceleration, Tire Management, Fuel Efficiency, Consistency, and Overtaking capability. "
                    "Scores range from 0-100%, with larger polygons indicating superior overall performance. This visualization "
                    "quickly identifies strengths and weaknesses in the vehicle setup and driver performance. Balanced shapes "
                    "suggest well-rounded performance, while irregular patterns highlight areas requiring attention. Teams use "
                    "this analysis to benchmark against competitors and guide development priorities for upcoming race sessions."
                )
                elements.append(Paragraph(desc_text, self.styles['F1Body']))
                elements.append(Spacer(1, 0.15 * inch))
                img_data = base64.b64decode(graphs['performance_radar'].split(',')[1])
                img = Image(BytesIO(img_data), width=5*inch, height=5*inch)
                elements.append(img)
                elements.append(Spacer(1, 0.3 * inch))
            
            self.logger.info(f"Successfully added {len(graphs)} graphs to PDF")
            
        except Exception as e:
            self.logger.error(f"Failed to generate graphs: {str(e)}")
            elements.append(Paragraph(
                "⚠️ Graph generation unavailable. Please ensure matplotlib is installed.",
                self.styles['F1Body']
            ))
        
        # Add final recommendations section
        elements.append(PageBreak())
        elements.append(Paragraph("TECHNICAL RECOMMENDATIONS", self.styles['F1SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))
        
        recommendations_text = (
            "<b>Priority Actions:</b> Based on the comprehensive analysis presented in this report, the following "
            "recommendations are provided to ensure vehicle safety, optimal performance, and regulatory compliance:"
        )
        elements.append(Paragraph(recommendations_text, self.styles['F1Body']))
        elements.append(Spacer(1, 0.15 * inch))
        
        recommendations = [
            "<b>Immediate Inspections:</b> Conduct hands-on verification of all high-confidence (>80%) detections, "
            "particularly those affecting aerodynamic components (wings, floor, diffuser) as these directly impact "
            "downforce and handling characteristics.",
            
            "<b>Component Replacement:</b> Replace or repair components showing damage severity above 70%, especially "
            "safety-critical elements such as suspension components, brake ducts, and structural chassis elements. "
            "Document all replacements for FIA technical compliance.",
            
            "<b>Setup Optimization:</b> Analyze lap time variations and speed distribution patterns to identify setup "
            "adjustments that could improve consistency and performance. Focus on areas showing significant lap-to-lap "
            "variations as these indicate potential for optimization.",
            
            "<b>Tire Strategy Review:</b> Utilize tire wear progression data to refine compound selection and pit stop "
            "timing for upcoming sessions. Consider track temperature and expected race conditions when planning strategy.",
            
            "<b>Trend Monitoring:</b> Establish baseline metrics from this report for comparison with future inspections. "
            "Progressive degradation patterns can predict failures before they occur, enabling proactive maintenance.",
            
            "<b>Documentation & Compliance:</b> Maintain this report in the vehicle's technical log for FIA scrutineering "
            "records. Ensure all detected changes are properly documented and approved per technical regulations.",
            
            "<b>Follow-up Analysis:</b> Schedule re-inspection after component replacements to verify corrective actions. "
            "Generate comparative reports to track improvement and validate maintenance procedures."
        ]
        
        for rec in recommendations:
            elements.append(Paragraph(f"• {rec}", self.styles['F1Body']))
            elements.append(Spacer(1, 0.1 * inch))
        
        elements.append(Spacer(1, 0.2 * inch))
        
        # Closing statement
        closing_text = (
            "<b>Conclusion:</b> This automated visual inspection report provides a comprehensive assessment of the vehicle's "
            "current condition. The combination of AI-powered change detection, detailed component analysis, and performance "
            "visualization enables data-driven maintenance decisions and strategic planning. Regular use of this system "
            "contributes to improved vehicle reliability, enhanced safety margins, and optimized performance output across "
            "all racing conditions."
        )
        elements.append(Paragraph(closing_text, self.styles['F1Body']))
        
        return elements


def generate_pdf_report(
    job_id: str,
    results: Dict[str, Any],
    image_paths: Dict[str, Path],
    output_path: Optional[Path] = None,
    ai_analysis: Optional[Dict[str, Any]] = None
) -> BytesIO:
    """
    Convenience function to generate a PDF report.
    
    Args:
        job_id: Unique job identifier
        results: Analysis results including changes, metrics, etc.
        image_paths: Paths to baseline, current, and annotated images
        output_path: Optional path to save PDF file
        ai_analysis: Optional AI-generated analysis from Gemini
        
    Returns:
        BytesIO buffer containing the PDF
    """
    generator = PDFReportGenerator()
    return generator.generate_report(job_id, results, image_paths, output_path, ai_analysis)
