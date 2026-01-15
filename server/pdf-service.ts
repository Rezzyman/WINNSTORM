import PDFDocument from 'pdfkit';

export interface ReportData {
  title: string;
  propertyAddress: string;
  clientName?: string;
  inspectionDate: Date;
  inspectorName?: string;
  summary?: string;
  findings: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation?: string;
  }>;
  images?: Array<{
    url: string;
    caption: string;
  }>;
  thermalData?: {
    averageTemp: number;
    hotSpots: number;
    moistureAreas: number;
    analysis: string;
  };
  recommendations?: string[];
  estimatedCost?: {
    min: number;
    max: number;
  };
}

const COLORS = {
  primary: '#1e3a5f',
  secondary: '#2d5a87',
  text: '#333333',
  lightGray: '#f5f5f5',
  mediumGray: '#cccccc',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  critical: '#dc2626',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.danger,
  critical: COLORS.critical,
};

export async function generateReport(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: data.title,
          Author: 'WinnStorm',
          Subject: `Damage Assessment Report - ${data.propertyAddress}`,
          Creator: 'WinnStorm Platform',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      drawHeader(doc, data);

      // Property Information
      doc.moveDown(2);
      drawPropertyInfo(doc, data);

      // Executive Summary
      if (data.summary) {
        doc.moveDown(1);
        drawSection(doc, 'Executive Summary', data.summary);
      }

      // Thermal Analysis
      if (data.thermalData) {
        doc.moveDown(1);
        drawThermalSection(doc, data.thermalData);
      }

      // Findings
      if (data.findings.length > 0) {
        doc.moveDown(1);
        drawFindings(doc, data.findings);
      }

      // Recommendations
      if (data.recommendations && data.recommendations.length > 0) {
        doc.moveDown(1);
        drawRecommendations(doc, data.recommendations);
      }

      // Cost Estimate
      if (data.estimatedCost) {
        doc.moveDown(1);
        drawCostEstimate(doc, data.estimatedCost);
      }

      // Footer on each page
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        drawFooter(doc, i + 1, pageCount);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function drawHeader(doc: PDFKit.PDFDocument, data: ReportData) {
  // Logo area
  doc.fillColor(COLORS.primary)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('WINNSTORM', 50, 50);

  doc.fillColor(COLORS.secondary)
    .fontSize(10)
    .font('Helvetica')
    .text('Professional Damage Assessment', 50, 78);

  // Report title
  doc.fillColor(COLORS.primary)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(data.title, 50, 120, { align: 'center' });

  // Horizontal line
  doc.moveTo(50, 150)
    .lineTo(562, 150)
    .strokeColor(COLORS.primary)
    .lineWidth(2)
    .stroke();
}

function drawPropertyInfo(doc: PDFKit.PDFDocument, data: ReportData) {
  const startY = doc.y + 20;

  doc.fillColor(COLORS.primary)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Property Information', 50, startY);

  doc.fillColor(COLORS.text)
    .fontSize(10)
    .font('Helvetica');

  const infoY = startY + 20;
  const col1X = 50;
  const col2X = 300;

  // Left column
  doc.font('Helvetica-Bold').text('Address:', col1X, infoY);
  doc.font('Helvetica').text(data.propertyAddress, col1X + 60, infoY);

  if (data.clientName) {
    doc.font('Helvetica-Bold').text('Client:', col1X, infoY + 15);
    doc.font('Helvetica').text(data.clientName, col1X + 60, infoY + 15);
  }

  // Right column
  doc.font('Helvetica-Bold').text('Date:', col2X, infoY);
  doc.font('Helvetica').text(data.inspectionDate.toLocaleDateString(), col2X + 60, infoY);

  if (data.inspectorName) {
    doc.font('Helvetica-Bold').text('Inspector:', col2X, infoY + 15);
    doc.font('Helvetica').text(data.inspectorName, col2X + 60, infoY + 15);
  }

  doc.y = infoY + 40;
}

function drawSection(doc: PDFKit.PDFDocument, title: string, content: string) {
  doc.fillColor(COLORS.primary)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text(title);

  doc.moveDown(0.5);

  doc.fillColor(COLORS.text)
    .fontSize(10)
    .font('Helvetica')
    .text(content, { align: 'justify' });
}

function drawThermalSection(doc: PDFKit.PDFDocument, thermal: ReportData['thermalData']) {
  if (!thermal) return;

  doc.fillColor(COLORS.primary)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Thermal Analysis Results');

  doc.moveDown(0.5);

  const boxY = doc.y;
  const boxHeight = 80;

  // Background box
  doc.rect(50, boxY, 512, boxHeight)
    .fill(COLORS.lightGray);

  // Stats
  const statWidth = 128;
  const stats = [
    { label: 'Avg. Temperature', value: `${thermal.averageTemp}°F` },
    { label: 'Hot Spots', value: thermal.hotSpots.toString() },
    { label: 'Moisture Areas', value: thermal.moistureAreas.toString() },
  ];

  stats.forEach((stat, i) => {
    const x = 50 + (statWidth * i) + 20;
    doc.fillColor(COLORS.secondary)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(stat.value, x, boxY + 15, { width: statWidth - 40 });

    doc.fillColor(COLORS.text)
      .fontSize(9)
      .font('Helvetica')
      .text(stat.label, x, boxY + 45, { width: statWidth - 40 });
  });

  doc.y = boxY + boxHeight + 10;

  // Analysis text
  doc.fillColor(COLORS.text)
    .fontSize(10)
    .font('Helvetica')
    .text(thermal.analysis, { align: 'justify' });
}

function drawFindings(doc: PDFKit.PDFDocument, findings: ReportData['findings']) {
  doc.fillColor(COLORS.primary)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Inspection Findings');

  doc.moveDown(0.5);

  findings.forEach((finding, index) => {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
      doc.y = 50;
    }

    const findingY = doc.y;

    // Severity indicator
    const severityColor = SEVERITY_COLORS[finding.severity] || COLORS.mediumGray;
    doc.rect(50, findingY, 5, 50)
      .fill(severityColor);

    // Finding header
    doc.fillColor(COLORS.text)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`${index + 1}. ${finding.category}`, 65, findingY);

    // Severity badge
    doc.fillColor(severityColor)
      .fontSize(8)
      .font('Helvetica-Bold')
      .text(finding.severity.toUpperCase(), 450, findingY + 2);

    // Description
    doc.fillColor(COLORS.text)
      .fontSize(10)
      .font('Helvetica')
      .text(finding.description, 65, findingY + 18, { width: 480 });

    // Recommendation
    if (finding.recommendation) {
      doc.fillColor(COLORS.secondary)
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text(`Recommendation: ${finding.recommendation}`, 65, doc.y + 5, { width: 480 });
    }

    doc.moveDown(1);
  });
}

function drawRecommendations(doc: PDFKit.PDFDocument, recommendations: string[]) {
  doc.fillColor(COLORS.primary)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Recommendations');

  doc.moveDown(0.5);

  recommendations.forEach((rec, index) => {
    doc.fillColor(COLORS.text)
      .fontSize(10)
      .font('Helvetica')
      .text(`${index + 1}. ${rec}`, { indent: 20 });
    doc.moveDown(0.3);
  });
}

function drawCostEstimate(doc: PDFKit.PDFDocument, cost: { min: number; max: number }) {
  doc.fillColor(COLORS.primary)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Estimated Repair Cost');

  doc.moveDown(0.5);

  const boxY = doc.y;

  doc.rect(50, boxY, 512, 50)
    .fill(COLORS.lightGray);

  doc.fillColor(COLORS.primary)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(`$${cost.min.toLocaleString()} - $${cost.max.toLocaleString()}`, 50, boxY + 15, {
      width: 512,
      align: 'center',
    });

  doc.fillColor(COLORS.text)
    .fontSize(8)
    .font('Helvetica')
    .text('*Estimate based on current market rates. Actual costs may vary.', 50, boxY + 55, {
      width: 512,
      align: 'center',
    });

  doc.y = boxY + 70;
}

function drawFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number) {
  const footerY = 730;

  doc.fillColor(COLORS.mediumGray)
    .fontSize(8)
    .font('Helvetica')
    .text(
      `Generated by WinnStorm | Page ${pageNum} of ${totalPages} | ${new Date().toLocaleDateString()}`,
      50,
      footerY,
      { width: 512, align: 'center' }
    );

  doc.text(
    'This report is confidential and intended for the named recipient only.',
    50,
    footerY + 12,
    { width: 512, align: 'center' }
  );
}

// Quick report generation for thermal assessments
export async function generateThermalReport(
  propertyAddress: string,
  clientName: string,
  thermalData: ReportData['thermalData'],
  findings: ReportData['findings'] = []
): Promise<Buffer> {
  return generateReport({
    title: 'Thermal Roof Assessment Report',
    propertyAddress,
    clientName,
    inspectionDate: new Date(),
    inspectorName: 'WinnStorm Inspector',
    summary: `This thermal assessment was conducted on ${new Date().toLocaleDateString()} using infrared imaging technology to identify potential moisture intrusion, heat loss, and structural anomalies in the roofing system.`,
    thermalData,
    findings: findings.length > 0 ? findings : [
      {
        category: 'Thermal Anomalies',
        severity: thermalData && thermalData.hotSpots > 3 ? 'high' : 'medium',
        description: `${thermalData?.hotSpots || 0} thermal anomalies detected during inspection.`,
        recommendation: 'Further investigation recommended for areas showing significant temperature variance.',
      },
      {
        category: 'Moisture Detection',
        severity: thermalData && thermalData.moistureAreas > 2 ? 'high' : 'low',
        description: `${thermalData?.moistureAreas || 0} potential moisture areas identified.`,
        recommendation: 'Consider moisture testing in highlighted areas.',
      },
    ],
    recommendations: [
      'Schedule follow-up inspection within 6 months',
      'Address identified moisture areas before they cause structural damage',
      'Consider preventive maintenance on areas showing early signs of wear',
    ],
  });
}
