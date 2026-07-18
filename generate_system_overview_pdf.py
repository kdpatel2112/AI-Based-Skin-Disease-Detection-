import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon, Group
from reportlab.graphics.charts.barcharts import HorizontalBarChart

# Define custom Canvas for two-pass page numbering
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Primary colors
        teal = colors.HexColor('#0F5E59')
        grey = colors.HexColor('#666666')
        
        # --- HEADER ---
        self.setFont('Helvetica-Bold', 8)
        self.setFillColor(teal)
        self.drawString(54, 800, "AI SKIN DISEASE DETECTION & RECOMMENDATION SYSTEM")
        
        self.setFont('Helvetica', 8)
        self.setFillColor(grey)
        self.drawRightString(541, 800, "SYSTEM TECHNICAL OVERVIEW")
        
        self.setStrokeColor(teal)
        self.setLineWidth(0.75)
        self.line(54, 792, 541, 792)
        
        # --- FOOTER ---
        self.setStrokeColor(colors.HexColor('#E0E0E0'))
        self.setLineWidth(0.5)
        self.line(54, 50, 541, 50)
        
        self.setFont('Helvetica', 8)
        self.setFillColor(grey)
        self.drawString(54, 38, "Confidential - Internal Technical Architecture & Specifications")
        self.drawRightString(541, 38, f"Page {self._pageNumber} of {page_count}")
        
        self.restoreState()


# Helper to draw lines with arrows
def draw_arrow(drawing, x1, y1, x2, y2, color=colors.HexColor('#0F5E59'), width=1):
    drawing.add(Line(x1, y1, x2, y2, strokeColor=color, strokeWidth=width))
    # Downward arrowhead
    if abs(x1 - x2) < 0.1 and y1 > y2:
        drawing.add(Polygon([x2 - 3, y2 + 4, x2 + 3, y2 + 4, x2, y2], fillColor=color, strokeColor=None))
    # Rightward arrowhead
    elif abs(y1 - y2) < 0.1 and x1 < x2:
        drawing.add(Polygon([x2 - 4, y2 - 3, x2 - 4, y2 + 3, x2, y2], fillColor=color, strokeColor=None))
    # Upward arrowhead
    elif abs(x1 - x2) < 0.1 and y1 < y2:
        drawing.add(Polygon([x2 - 3, y2 - 4, x2 + 3, y2 - 4, x2, y2], fillColor=color, strokeColor=None))


# Draw rounded rectangles with text inside
def draw_node(drawing, text, x, y, w, h, fill_color, text_color=colors.white, font_size=8, rx=4, ry=4):
    drawing.add(Rect(x, y, w, h, rx=rx, ry=ry, fillColor=fill_color, strokeColor=None))
    drawing.add(String(x + w / 2, y + h / 2 - 3, text, textAnchor='middle', fillColor=text_color, fontName='Helvetica-Bold', fontSize=font_size))


# Graph 1: Tech Stack
def get_tech_stack_drawing():
    d = Drawing(480, 160)
    
    # Primary entry points
    primary_color = colors.HexColor('#0F5E59')
    # Supporting services
    secondary_color = colors.HexColor('#1D8B82')
    
    # UI Node
    draw_node(d, "React + TS Client (UI)", 170, 120, 140, 24, primary_color)
    
    # API Node
    draw_node(d, "FastAPI Gateway (API)", 170, 70, 140, 24, primary_color)
    
    # Arrow UI -> API
    draw_arrow(d, 240, 120, 240, 94)
    d.add(String(245, 103, "HTTP / JSON", fontName='Helvetica-Bold', fontSize=6.5, fillColor=colors.HexColor('#666666')))
    
    # Bottom Row of 5 Nodes (MongoDB, Cloudinary, OpenCV, TensorFlow, ReportLab)
    names = ["MongoDB Atlas", "Cloudinary CDN", "OpenCV & NumPy", "TensorFlow / Keras", "ReportLab Engine"]
    for i, name in enumerate(names):
        bx = 10 + i * 94
        by = 10
        bw = 84
        bh = 24
        draw_node(d, name, bx, by, bw, bh, secondary_color, font_size=7)
        
        # Draw connections from API to each bottom node
        # API bottom is at y=70, spanning x=170 to x=310. Center is 240.
        # Nodes top is at y=34, center is bx + bw/2 = 10 + 42 + i*94 = 52 + i*94
        node_center_x = bx + bw / 2
        api_exit_x = 180 + i * 30  # distribute outlets along API bottom
        
        d.add(Line(api_exit_x, 70, api_exit_x, 50, strokeColor=colors.HexColor('#B0D8D5'), strokeWidth=1))
        d.add(Line(api_exit_x, 50, node_center_x, 50, strokeColor=colors.HexColor('#B0D8D5'), strokeWidth=1))
        draw_arrow(d, node_center_x, 50, node_center_x, 34, color=colors.HexColor('#1D8B82'), width=1)
        
    return d


# Graph 2: Class Distribution Chart
def get_dataset_chart_drawing():
    d = Drawing(480, 210)
    
    chart = HorizontalBarChart()
    chart.x = 110
    chart.y = 15
    chart.height = 180
    chart.width = 330
    
    # Values reversed to show Eczema at top
    chart.data = [[2103, 1700, 1800, 2000, 2624, 7970, 3323, 1250, 15750, 1677]]
    chart.categoryAxis.categoryNames = [
        'Warts / Viral (2.1k)', 'Tinea / Fungal (1.7k)', 'Seborrheic Kerat. (1.8k)', 
        'Psoriasis/Lichen (2.0k)', 'Benign Keratosis (2.6k)', 'Melanocytic Nevi (8.0k)', 
        'Basal Cell Carc. (3.3k)', 'Atopic Derm. (1.3k)', 'Melanoma (15.8k)', 'Eczema (1.7k)'
    ]
    
    # Styling
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = 17000
    chart.valueAxis.valueStep = 3000
    chart.valueAxis.labels.fontName = 'Helvetica'
    chart.valueAxis.labels.fontSize = 7
    
    chart.categoryAxis.labels.fontName = 'Helvetica-Bold'
    chart.categoryAxis.labels.fontSize = 7.5
    chart.categoryAxis.labels.boxAnchor = 'e'
    chart.categoryAxis.labels.dx = -5
    chart.categoryAxis.labels.fillColor = colors.HexColor('#0F5E59')
    
    chart.bars[0].fillColor = colors.HexColor('#0F5E59')
    chart.bars.strokeColor = None
    
    # Labels next to bars
    chart.barLabelFormat = '%d'
    chart.barLabels.fontName = 'Helvetica-Bold'
    chart.barLabels.fontSize = 6.5
    chart.barLabels.boxAnchor = 'w'
    chart.barLabels.dx = 3
    chart.barLabels.fillColor = colors.HexColor('#222222')
    
    d.add(chart)
    return d


# Graph 3: Model Architecture flowchart (vertical)
def get_model_arch_drawing():
    d = Drawing(480, 350)
    
    layers = [
        ("Input Image", "384 x 384 x 3 Pixels", colors.HexColor('#9E9E9E')),
        ("Data Augmentation", "MixUp & Label Smoothing", colors.HexColor('#757575')),
        ("EfficientNetV2-L Backbone", "Pretrained ImageNet (Fused-MBConv)", colors.HexColor('#0F5E59')),
        ("Global Average Pooling", "2D Pool Feature Maps", colors.HexColor('#1D8B82')),
        ("Batch Normalization", "Normalize Channel Statistics", colors.HexColor('#1D8B82')),
        ("Dense Classification Layer", "512 Units (GELU Activation)", colors.HexColor('#0B423F')),
        ("Dropout Layer", "Rate: 0.40 Dropout", colors.HexColor('#B22222')),
        ("Dense Classification Layer", "256 Units (GELU Activation)", colors.HexColor('#0B423F')),
        ("Dropout Layer", "Rate: 0.24 Dropout", colors.HexColor('#B22222')),
        ("Softmax Outputs", "11 Output Probabilities", colors.HexColor('#D35400'))
    ]
    
    for i, (layer_name, details, color) in enumerate(layers):
        y = 318 - (i * 32)
        # Main Node Box
        draw_node(d, layer_name, 60, y, 160, 20, color, font_size=7.5)
        # Side Details Box
        draw_node(d, details, 240, y, 180, 20, colors.HexColor('#F4F8F8'), text_color=colors.HexColor('#222222'), font_size=7)
        # Connect main node and details
        d.add(Line(220, y + 10, 240, y + 10, strokeColor=colors.HexColor('#D3D3D3'), strokeWidth=0.5))
        
        # Connect to next layer
        if i < len(layers) - 1:
            draw_arrow(d, 140, y, 140, y - 12, color=colors.HexColor('#666666'), width=1)
            
    return d


# Graph 4: Methodology Flowchart
def get_methodology_drawing():
    d = Drawing(480, 130)
    
    primary = colors.HexColor('#0F5E59')
    secondary = colors.HexColor('#1D8B82')
    warning = colors.HexColor('#E6A23C')
    success = colors.HexColor('#2E7D32')
    
    # Row 1 (y=85): Upload -> Quality -> Predict -> Rec
    draw_node(d, "Image Upload", 10, 85, 80, 24, colors.HexColor('#757575'))
    draw_node(d, "Quality Check", 115, 85, 80, 24, secondary)
    draw_node(d, "EfficientNetV2-L", 230, 85, 95, 24, primary)
    draw_node(d, "Recommendations", 360, 85, 110, 24, secondary)
    
    # Row 2 (y=25): Warnings & GradCAM & PDF
    draw_node(d, "Blur / Light Warnings", 110, 25, 90, 24, warning, font_size=7)
    draw_node(d, "Grad-CAM Heatmap", 232, 25, 90, 24, secondary, font_size=7.5)
    draw_node(d, "Report PDF + QR", 360, 25, 110, 24, success)
    
    # Arrows
    draw_arrow(d, 90, 97, 115, 97)
    
    # Quality -> Warning (Failed)
    draw_arrow(d, 155, 85, 155, 49)
    d.add(String(160, 62, "Failed", fontName='Helvetica-Bold', fontSize=6, fillColor=warning))
    
    # Quality -> Predict (Passed)
    draw_arrow(d, 195, 97, 230, 97)
    d.add(String(202, 102, "Passed", fontName='Helvetica-Bold', fontSize=6, fillColor=success))
    
    # Predict -> GradCAM
    draw_arrow(d, 277, 85, 277, 49)
    
    # Predict -> Rec
    draw_arrow(d, 325, 97, 360, 97)
    
    # GradCAM -> Report
    d.add(Line(322, 37, 360, 37, strokeColor=primary, strokeWidth=1))
    draw_arrow(d, 360, 37, 360, 37)  # visual anchor
    
    # Rec -> Report
    draw_arrow(d, 415, 85, 415, 49)
    
    return d


def build_pdf(filename="system_overview.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Base styling colors
    teal_dark = colors.HexColor('#0F5E59')
    teal_accent = colors.HexColor('#1D8B82')
    charcoal = colors.HexColor('#222222')
    
    title_style = ParagraphStyle(
        "doc_title",
        parent=styles["Title"],
        textColor=teal_dark,
        fontSize=20,
        leading=24,
        alignment=0, # Left-aligned
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        "doc_sub",
        parent=styles["Normal"],
        textColor=colors.HexColor('#555555'),
        fontSize=10,
        leading=14,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        "h1",
        parent=styles["Heading1"],
        textColor=teal_dark,
        fontSize=14,
        leading=18,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    
    h2_style = ParagraphStyle(
        "h2",
        parent=styles["Heading2"],
        textColor=teal_accent,
        fontSize=10.5,
        leading=14,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        "body",
        parent=styles["BodyText"],
        textColor=charcoal,
        fontSize=9,
        leading=12.5,
        spaceAfter=8
    )
    
    bullet_style = ParagraphStyle(
        "bullet",
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    table_header_style = ParagraphStyle(
        "tbl_hdr",
        parent=styles["Normal"],
        textColor=colors.white,
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        alignment=1 # Centered
    )
    
    table_cell_style = ParagraphStyle(
        "tbl_cell",
        parent=styles["Normal"],
        textColor=charcoal,
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5
    )
    
    table_cell_center_style = ParagraphStyle(
        "tbl_cell_center",
        parent=table_cell_style,
        alignment=1 # Centered
    )

    elements = []

    # ---------------- PAGE 1 ----------------
    elements.append(Paragraph("System Technical Overview: AI Skin Disease Detection", title_style))
    elements.append(Paragraph("Decoupled Frontend, Async Backend Gateway, and EfficientNetV2 Deep Learning Inference Pipeline.", subtitle_style))
    elements.append(Spacer(1, 4))
    
    elements.append(Paragraph("1. Technology Stack Architecture", h1_style))
    elements.append(Paragraph(
        "The system architecture is structured as a decoupled client-server web application. "
        "The frontend React client handles secure patient capture and localization, while the FastAPI backend serves "
        "as an asynchronous API gateway processing requests, orchestrating ML inference tasks, and generating dynamically "
        "compiled patient reports.", body_style
    ))
    
    elements.append(Spacer(1, 4))
    elements.append(get_tech_stack_drawing())
    elements.append(Spacer(1, 10))
    
    elements.append(Paragraph("🎨 Frontend Client Features", h2_style))
    elements.append(Paragraph("&bull; <b>React & TypeScript:</b> Strict, type-safe Single Page Application architecture.", bullet_style))
    elements.append(Paragraph("&bull; <b>Tailwind CSS & Framer Motion:</b> Dynamic responsive layout styling with custom animations and transitions.", bullet_style))
    elements.append(Paragraph("&bull; <b>Recharts & Leaflet.js:</b> Interactive multi-class prediction probabilities charting and geographical mapping for nearby dermatologists.", bullet_style))
    elements.append(Paragraph("&bull; <b>i18next Localization:</b> Multilingual wrapping backing English, Hindi, and Gujarati client localized environments.", bullet_style))
    
    elements.append(Paragraph("🔌 Backend API Gateway Features", h2_style))
    elements.append(Paragraph("&bull; <b>FastAPI:</b> Asynchronous RESTful routing and high-throughput endpoint scheduling.", bullet_style))
    elements.append(Paragraph("&bull; <b>Motor & MongoDB:</b> Non-blocking database drivers managing persistent records and physician metadata.", bullet_style))
    elements.append(Paragraph("&bull; <b>SlowAPI:</b> Rate-limiting security middleware guarding classification and API authentication endpoints.", bullet_style))
    elements.append(Paragraph("&bull; <b>ReportLab & qrcode:</b> PDF builder rendering secure verification documents dynamically on demand.", bullet_style))

    # ---------------- PAGE 2 ----------------
    elements.append(PageBreak())
    
    elements.append(Paragraph("2. Dataset & Training Volumes", h1_style))
    elements.append(Paragraph(
        "The neural network model is trained on a highly diversified dataset containing <b>40,197 images</b>. "
        "The training set contains 10 distinct skin disease categories as well as a baseline of healthy skin images "
        "utilized for normalizations.", body_style
    ))
    
    # Class Distribution Table
    raw_table_data = [
        ["Idx", "Disease Class Folder / Mapping", "DB Key Mapping", "Images Count", "Primary Medical Description"],
        ["1", "1. Eczema 1677", "Eczema", "1,677", "Inflammatory skin condition resulting in red, dry, itchy patches."],
        ["2", "2. Melanoma 15.75k", "Melanoma", "15,750", "Serious skin cancer originating in pigment-producing melanocytes."],
        ["3", "3. Atopic Dermatitis - 1.25k", "Atopic_Dermatitis", "1,250", "Long-lasting (chronic) dry skin causing intensive flares."],
        ["4", "4. Basal Cell Carcinoma (BCC) 3323", "Basal_Cell_Carcinoma", "3,323", "A common, slow-growing, highly treatable non-melanoma cancer."],
        ["5", "5. Melanocytic Nevi (NV) - 7970", "Melanocytic_Nevi", "7,970", "Benign clusters of skin pigment cells (common moles)."],
        ["6", "6. Benign Keratosis-like Lesions 2624", "Benign_Keratosis", "2,624", "Non-cancerous waxy/scaly lesions including solar lentigines."],
        ["7", "7. Psoriasis pictures Lichen Planus...", "Psoriasis_Lichen_Planus", "2,000", "Autoimmune-linked scaly plaques and purple flat bumps."],
        ["8", "8. Seborrheic Keratoses...", "Seborrheic_Keratoses", "1,800", "Common, harmless, \"stuck-on\" waxy skin growths."],
        ["9", "9. Tinea Ringworm Candidiasis...", "Tinea_Fungal_Infections", "1,700", "Superficial fungal infections affecting the outer skin layers."],
        ["10", "10. Warts Molluscum...", "Warts_Viral_Infections", "2,103", "Highly contagious skin lesions triggered by viral infections."],
        ["-", "Healthy skin (Synthesized)", "Healthy_Skin", "Varies", "Baseline healthy, unblemished skin cells for normalization."]
    ]
    
    # Wrap cells in Paragraph to support text-wrapping
    table_data = []
    for r_idx, row in enumerate(raw_table_data):
        new_row = []
        for c_idx, cell in enumerate(row):
            if r_idx == 0:
                new_row.append(Paragraph(cell, table_header_style))
            else:
                if c_idx in [0, 3]:
                    new_row.append(Paragraph(cell, table_cell_center_style))
                else:
                    new_row.append(Paragraph(cell, table_cell_style))
        table_data.append(new_row)
        
    col_widths = [20, 135, 105, 45, 175] # Total width = 480 (A4 is 595.27, printable width = 487.27)
    dist_table = Table(table_data, colWidths=col_widths)
    dist_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), teal_dark),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D3D3D3')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F4F8F8')])
    ]))
    
    elements.append(dist_table)
    elements.append(Spacer(1, 14))
    
    elements.append(Paragraph("Dataset Images Volume Distribution Chart", h2_style))
    elements.append(get_dataset_chart_drawing())

    # ---------------- PAGE 3 ----------------
    elements.append(PageBreak())
    
    elements.append(Paragraph("3. Deep Learning Classifier Model Architecture", h1_style))
    elements.append(Paragraph(
        "The model core utilizes an <b>EfficientNetV2-L</b> backbone architecture pretrained on ImageNet weights. "
        "We append a custom classification head using Dropout and Batch Normalization layers to prevent overfitting "
        "on fine-grained lesions and outputs soft predictions across 11 labels.", body_style
    ))
    
    elements.append(Spacer(1, 4))
    elements.append(get_model_arch_drawing())
    elements.append(Spacer(1, 10))
    
    elements.append(Paragraph("🧠 Explanation of Core Backbone Layers", h2_style))
    elements.append(Paragraph("&bull; <b>EfficientNetV2-L Backbone:</b> Uses Fused-MBConv convolutions matching accuracy and efficiency speedups.", bullet_style))
    elements.append(Paragraph("&bull; <b>Global Average Pooling (GAP) 2D:</b> Spatially collapses feature maps, reducing dimensions and parameters.", bullet_style))
    elements.append(Paragraph("&bull; <b>Batch Normalization:</b> Stabilizes weight updates during partial and deep unfreezing stages.", bullet_style))
    elements.append(Paragraph("&bull; <b>GELU Activation:</b> Introduced in Dense layers to allow smooth gradient flows through negative distributions.", bullet_style))
    elements.append(Paragraph("&bull; <b>Dual-Stage Dropouts (0.40 & 0.24):</b> Deactivates redundant neurons randomly to prevent path overconfidence.", bullet_style))

    # ---------------- PAGE 4 ----------------
    elements.append(PageBreak())
    
    elements.append(Paragraph("4. Methodology & Algorithms", h1_style))
    elements.append(Paragraph(
        "The detection flow starts with OpenCV quality validation (filtering blur and low brightness). "
        "If accepted, the image goes to the EfficientNet classifier, generating classifications and a Grad-CAM localization "
        "heatmap before constructing the diagnostic PDF report.", body_style
    ))
    
    elements.append(Spacer(1, 4))
    elements.append(get_methodology_drawing())
    elements.append(Spacer(1, 12))
    
    elements.append(Paragraph("🔄 Progressive 3-Phase Fine-Tuning Strategy", h2_style))
    elements.append(Paragraph(
        "We implement a three-phase training pipeline to adapt ImageNet features to skin textures "
        "without destroying early filter structural memory:", body_style
    ))
    elements.append(Paragraph(
        "<b>Phase 1: Feature Extraction (Frozen Base)</b><br/>"
        "The backbone is frozen (<i>trainable=False</i>). We optimize the classification head with AdamW "
        "(Learning Rate = 1e-3) and Cosine Decay to orient weights around target skin classes.", bullet_style
    ))
    elements.append(Paragraph(
        "<b>Phase 2: Partial Fine-Tuning (Top 60 Layers)</b><br/>"
        "We unfreeze the top 60 layers. The Learning Rate is throttled down to 1e-5. "
        "This adapts high-level shape filters to lesion borders and irregular margins.", bullet_style
    ))
    elements.append(Paragraph(
        "<b>Phase 3: Deep Fine-Tuning (Full Unfreeze)</b><br/>"
        "We unfreeze all network parameters. The Learning Rate is set to 5e-7 to execute "
        "micro-adjustments across all weight layers without causing catastrophic gradient divergence.", bullet_style
    ))
    
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("🧪 Regularizations & Explainable AI (Grad-CAM)", h2_style))
    elements.append(Paragraph(
        "To combat severe dataset class imbalances and visual similarity across disease types, the training uses:<br/>"
        "&bull; <b>MixUp Augmentation & Label Smoothing (0.1):</b> Blends training distributions to smooth out hard decision boundaries.<br/>"
        "&bull; <b>Focal Loss:</b> Focuses gradient calculations on hard-to-classify samples rather than easy, abundant classes.<br/>"
        "&bull; <b>Grad-CAM (Gradient-weighted Class Activation Mapping):</b> Computes gradients of the target class score relative to the "
        "final EfficientNet convolutional feature map to highlight the specific lesion area triggering predictions.", bullet_style
    ))
    
    doc.build(elements, canvasmaker=NumberedCanvas)
    print("PDF generation completed successfully.")


if __name__ == "__main__":
    build_pdf()
