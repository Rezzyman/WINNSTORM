import PDFDocument from 'pdfkit';
import { Property, Scan, Metric, Issue } from '@shared/schema';

interface ReportOptions {
  includeExecutiveSummary?: boolean;
  includePhotos?: boolean;
  includeThermalAnalysis?: boolean;
  includeRecommendations?: boolean;
}

interface ReportData {
  property: Property;
  scan: Scan;
  executiveSummary?: string;
  thermalAnalysis?: {
    anomalies: Array<{
      type: string;
      severity: string;
      location: string;
      description: string;
    }>;
    overallAssessment: string;
  };
  evidencePhotos?: Array<{
    url: string;
    caption: string;
    timestamp: string;
  }>;
  inspectorName?: string;
  companyName?: string;
}

const COLORS = {
  primary: '#FF5500',
  secondary: '#1A1A1A',
  accent: '#00BFFF',
  text: '#333333',
  lightGray: '#F5F5F5',
  white: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};

function getSeverityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'high':
      return COLORS.danger;
    case 'medium':
      return COLORS.warning;
    case 'low':
      return COLORS.success;
    default:
      return COLORS.text;
  }
}

function getConditionColor(condition: string): string {
  switch (condition?.toLowerCase()) {
    case 'excellent':
      return COLORS.success;
    case 'good':
      return '#4ADE80';
    case 'fair':
      return COLORS.warning;
    case 'poor':
      return '#F97316';
    case 'critical':
      return COLORS.danger;
    default:
      return COLORS.text;
  }
}

export async function generateWinnReport(
  data: ReportData,
  options: ReportOptions = {}
): Promise<Buffer> {
  const {
    includeExecutiveSummary = true,
    includePhotos = true,
    includeThermalAnalysis = true,
    includeRecommendations = true,
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Winn Report - ${data.property.name}`,
          Author: 'WinnStorm™ Damage Assessment Platform',
          Subject: 'Thermal Roof Assessment Report',
          Creator: 'WinnStorm™',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      addCoverPage(doc, data);
      doc.addPage();
      
      addTableOfContents(doc, options);
      doc.addPage();

      if (includeExecutiveSummary && data.executiveSummary) {
        addExecutiveSummary(doc, data.executiveSummary);
        doc.addPage();
      }

      addPropertyInformation(doc, data.property);
      doc.addPage();

      addScanDetails(doc, data.scan);
      
      if (data.scan.metrics && data.scan.metrics.length > 0) {
        doc.addPage();
        addMetricsSection(doc, data.scan.metrics);
      }

      if (data.scan.issues && data.scan.issues.length > 0) {
        doc.addPage();
        addIssuesSection(doc, data.scan.issues);
      }

      if (includeThermalAnalysis && data.thermalAnalysis) {
        doc.addPage();
        addThermalAnalysisSection(doc, data.thermalAnalysis);
      }

      if (includeRecommendations) {
        doc.addPage();
        addRecommendationsSection(doc, data);
      }

      addFooter(doc, data);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

function addCoverPage(doc: PDFKit.PDFDocument, data: ReportData) {
  doc.rect(0, 0, 612, 100).fill(COLORS.secondary);
  
  doc.fontSize(28)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('WINNSTORM™', 50, 35, { align: 'left' });

  doc.fontSize(10)
    .fillColor(COLORS.white)
    .font('Helvetica')
    .text('DAMAGE ASSESSMENT PLATFORM', 50, 65);

  doc.fontSize(36)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('WINN REPORT', 50, 180, { align: 'center' });

  doc.fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica')
    .text('Comprehensive Thermal Roof Assessment', 50, 230, { align: 'center' });

  doc.moveTo(200, 270).lineTo(412, 270).stroke(COLORS.primary);

  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text(data.property.name, 50, 320, { align: 'center' });

  doc.fontSize(14)
    .fillColor(COLORS.text)
    .font('Helvetica')
    .text(data.property.address, 50, 360, { align: 'center' });

  const reportDate = data.scan.date ? new Date(data.scan.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.fontSize(12)
    .text(`Report Date: ${reportDate}`, 50, 400, { align: 'center' });

  if (data.scan.healthScore !== null && data.scan.healthScore !== undefined) {
    const score = data.scan.healthScore;
    const scoreColor = score >= 80 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger;
    
    doc.circle(306, 520, 60).lineWidth(8).stroke(scoreColor);
    
    doc.fontSize(36)
      .fillColor(scoreColor)
      .font('Helvetica-Bold')
      .text(`${score}`, 256, 500, { width: 100, align: 'center' });
    
    doc.fontSize(12)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text('Health Score', 256, 545, { width: 100, align: 'center' });
  }

  if (data.property.overallCondition) {
    const condition = data.property.overallCondition;
    const conditionColor = getConditionColor(condition);
    
    doc.fontSize(14)
      .fillColor(conditionColor)
      .font('Helvetica-Bold')
      .text(`Overall Condition: ${condition.toUpperCase()}`, 50, 620, { align: 'center' });
  }

  doc.rect(0, 742, 612, 50).fill(COLORS.secondary);
  doc.fontSize(8)
    .fillColor(COLORS.white)
    .text('Certified to Winn™ | Powered by WinnStorm™ Damage Assessment Platform', 50, 760, { 
      align: 'center',
      width: 512 
    });
}

function addTableOfContents(doc: PDFKit.PDFDocument, options: ReportOptions) {
  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('TABLE OF CONTENTS', 50, 50);

  doc.moveTo(50, 85).lineTo(200, 85).stroke(COLORS.primary);

  let yPos = 120;
  const items = [
    { title: 'Executive Summary', page: 3, included: options.includeExecutiveSummary !== false },
    { title: 'Property Information', page: 4, included: true },
    { title: 'Scan Details & Analysis', page: 5, included: true },
    { title: 'Performance Metrics', page: 6, included: true },
    { title: 'Issues & Findings', page: 7, included: true },
    { title: 'Thermal Analysis', page: 8, included: options.includeThermalAnalysis !== false },
    { title: 'Recommendations', page: 9, included: options.includeRecommendations !== false },
  ];

  items.filter(item => item.included).forEach((item, index) => {
    doc.fontSize(12)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(`${index + 1}. ${item.title}`, 70, yPos);
    
    const dots = '.'.repeat(50);
    doc.fontSize(12)
      .fillColor('#999999')
      .text(dots, 250, yPos, { width: 250 });
    
    doc.fontSize(12)
      .fillColor(COLORS.text)
      .text(`${item.page}`, 520, yPos);
    
    yPos += 30;
  });
}

function addExecutiveSummary(doc: PDFKit.PDFDocument, summary: string) {
  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('EXECUTIVE SUMMARY', 50, 50);

  doc.moveTo(50, 85).lineTo(250, 85).stroke(COLORS.primary);

  doc.rect(50, 110, 512, 4).fill(COLORS.primary);

  doc.fontSize(11)
    .fillColor(COLORS.text)
    .font('Helvetica')
    .text(summary, 50, 130, {
      width: 512,
      align: 'justify',
      lineGap: 6,
    });
}

function addPropertyInformation(doc: PDFKit.PDFDocument, property: Property) {
  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('PROPERTY INFORMATION', 50, 50);

  doc.moveTo(50, 85).lineTo(280, 85).stroke(COLORS.primary);

  let yPos = 110;

  const fields = [
    { label: 'Property Name', value: property.name },
    { label: 'Address', value: property.address },
    { label: 'Overall Condition', value: property.overallCondition || 'Not assessed' },
    { label: 'Last Inspection', value: property.lastInspectionDate 
      ? new Date(property.lastInspectionDate).toLocaleDateString() 
      : 'N/A' },
  ];

  fields.forEach(field => {
    doc.fontSize(10)
      .fillColor('#666666')
      .font('Helvetica')
      .text(field.label, 50, yPos);
    
    doc.fontSize(12)
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .text(field.value, 50, yPos + 15);
    
    yPos += 50;
  });

  if (property.buildingInfo) {
    yPos += 20;
    doc.fontSize(16)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text('Building Information', 50, yPos);
    
    yPos += 30;

    const buildingInfo = property.buildingInfo;
    const buildingFields = [
      { label: 'Property Type', value: buildingInfo.propertyType || 'N/A' },
      { label: 'Year Built', value: buildingInfo.yearBuilt?.toString() || 'N/A' },
      { label: 'Square Footage', value: buildingInfo.squareFootage 
        ? `${buildingInfo.squareFootage.toLocaleString()} sq ft` 
        : 'N/A' },
      { label: 'Number of Stories', value: buildingInfo.stories?.toString() || 'N/A' },
    ];

    buildingFields.forEach(field => {
      doc.fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text(field.label, 50, yPos);
      
      doc.fontSize(11)
        .fillColor(COLORS.text)
        .font('Helvetica')
        .text(field.value, 200, yPos);
      
      yPos += 25;
    });
  }

  if (property.roofSystemDetails) {
    yPos += 20;
    doc.fontSize(16)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text('Roof System Details', 50, yPos);
    
    yPos += 30;

    const roofDetails = property.roofSystemDetails;
    const roofFields = [
      { label: 'Roof Type', value: roofDetails.roofType || 'N/A' },
      { label: 'Material', value: roofDetails.primaryMaterial || 'N/A' },
      { label: 'Age', value: roofDetails.age ? `${roofDetails.age} years` : 'N/A' },
      { label: 'Condition', value: roofDetails.condition || 'N/A' },
    ];

    roofFields.forEach(field => {
      doc.fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text(field.label, 50, yPos);
      
      doc.fontSize(11)
        .fillColor(COLORS.text)
        .font('Helvetica')
        .text(field.value, 200, yPos);
      
      yPos += 25;
    });
  }
}

function addScanDetails(doc: PDFKit.PDFDocument, scan: Scan) {
  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('SCAN DETAILS & ANALYSIS', 50, 50);

  doc.moveTo(50, 85).lineTo(280, 85).stroke(COLORS.primary);

  let yPos = 110;

  const scanFields = [
    { label: 'Scan Date', value: scan.date 
      ? new Date(scan.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A' },
    { label: 'Scan Type', value: scan.scanType?.toUpperCase() || 'N/A' },
    { label: 'Device Used', value: scan.deviceType || 'N/A' },
    { label: 'Health Score', value: scan.healthScore?.toString() || 'Not calculated' },
  ];

  scanFields.forEach(field => {
    doc.fontSize(10)
      .fillColor('#666666')
      .font('Helvetica')
      .text(field.label, 50, yPos);
    
    doc.fontSize(12)
      .fillColor(COLORS.text)
      .font('Helvetica-Bold')
      .text(field.value, 200, yPos);
    
    yPos += 35;
  });

  if (scan.notes) {
    yPos += 20;
    doc.fontSize(14)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text('Inspector Notes', 50, yPos);
    
    yPos += 25;
    doc.fontSize(11)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(scan.notes, 50, yPos, { width: 512 });
  }
}

function addMetricsSection(doc: PDFKit.PDFDocument, metrics: Metric[]) {
  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('PERFORMANCE METRICS', 50, 50);

  doc.moveTo(50, 85).lineTo(250, 85).stroke(COLORS.primary);

  let yPos = 120;

  metrics.forEach((metric, index) => {
    doc.rect(50, yPos, 512, 60).fill(index % 2 === 0 ? COLORS.lightGray : COLORS.white);
    
    doc.fontSize(14)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text(metric.name, 60, yPos + 10);
    
    doc.fontSize(20)
      .fillColor(COLORS.primary)
      .font('Helvetica-Bold')
      .text(`${metric.value}`, 60, yPos + 30);
    
    yPos += 70;
    
    if (yPos > 700) {
      doc.addPage();
      yPos = 50;
    }
  });
}

function addIssuesSection(doc: PDFKit.PDFDocument, issues: Issue[]) {
  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('ISSUES & FINDINGS', 50, 50);

  doc.moveTo(50, 85).lineTo(220, 85).stroke(COLORS.primary);

  let yPos = 120;

  issues.forEach((issue, index) => {
    const severityColor = getSeverityColor(issue.severity);
    
    doc.rect(50, yPos, 4, 80).fill(severityColor);
    doc.rect(54, yPos, 508, 80).fill(COLORS.lightGray);
    
    doc.fontSize(14)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text(issue.title, 65, yPos + 10, { width: 400 });
    
    doc.fontSize(10)
      .fillColor(severityColor)
      .font('Helvetica-Bold')
      .text(issue.severity?.toUpperCase() || 'UNKNOWN', 480, yPos + 10);
    
    doc.fontSize(10)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(issue.description || '', 65, yPos + 35, { width: 480, height: 35 });
    
    yPos += 95;
    
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }
  });
}

function addThermalAnalysisSection(
  doc: PDFKit.PDFDocument, 
  analysis: ReportData['thermalAnalysis']
) {
  if (!analysis) return;

  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('THERMAL ANALYSIS', 50, 50);

  doc.moveTo(50, 85).lineTo(220, 85).stroke(COLORS.primary);

  doc.fontSize(14)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('Overall Assessment', 50, 110);

  doc.fontSize(11)
    .fillColor(COLORS.text)
    .font('Helvetica')
    .text(analysis.overallAssessment, 50, 130, { width: 512 });

  if (analysis.anomalies && analysis.anomalies.length > 0) {
    let yPos = 180;
    
    doc.fontSize(14)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text('Detected Anomalies', 50, yPos);
    
    yPos += 30;

    analysis.anomalies.forEach((anomaly, index) => {
      const severityColor = getSeverityColor(anomaly.severity);
      
      doc.rect(50, yPos, 512, 70).fill(index % 2 === 0 ? COLORS.lightGray : COLORS.white);
      doc.rect(50, yPos, 4, 70).fill(severityColor);
      
      doc.fontSize(12)
        .fillColor(COLORS.secondary)
        .font('Helvetica-Bold')
        .text(`${anomaly.type}`, 65, yPos + 10);
      
      doc.fontSize(10)
        .fillColor(severityColor)
        .font('Helvetica-Bold')
        .text(anomaly.severity.toUpperCase(), 480, yPos + 10);
      
      doc.fontSize(10)
        .fillColor('#666666')
        .font('Helvetica')
        .text(`Location: ${anomaly.location}`, 65, yPos + 30);
      
      doc.fontSize(10)
        .fillColor(COLORS.text)
        .font('Helvetica')
        .text(anomaly.description, 65, yPos + 45, { width: 480 });
      
      yPos += 80;
      
      if (yPos > 650) {
        doc.addPage();
        yPos = 50;
      }
    });
  }
}

function addRecommendationsSection(doc: PDFKit.PDFDocument, data: ReportData) {
  doc.fontSize(24)
    .fillColor(COLORS.secondary)
    .font('Helvetica-Bold')
    .text('RECOMMENDATIONS', 50, 50);

  doc.moveTo(50, 85).lineTo(230, 85).stroke(COLORS.primary);

  let yPos = 120;

  const generateRecommendations = () => {
    const recs: Array<{ priority: string; title: string; description: string }> = [];
    
    if (data.scan.issues) {
      const criticalIssues = data.scan.issues.filter(i => 
        i.severity?.toLowerCase() === 'critical' || i.severity?.toLowerCase() === 'high'
      );
      
      if (criticalIssues.length > 0) {
        recs.push({
          priority: 'Immediate',
          title: 'Address Critical Issues',
          description: `${criticalIssues.length} critical/high severity issue(s) require immediate attention. These should be addressed within 30 days to prevent further damage.`,
        });
      }
    }

    if (data.scan.healthScore !== null && data.scan.healthScore !== undefined) {
      if (data.scan.healthScore < 60) {
        recs.push({
          priority: 'High',
          title: 'Schedule Comprehensive Roof Assessment',
          description: 'Health score indicates significant concerns. Recommend scheduling a detailed physical inspection within 60 days.',
        });
      } else if (data.scan.healthScore < 80) {
        recs.push({
          priority: 'Medium',
          title: 'Preventive Maintenance Recommended',
          description: 'Health score shows moderate wear. Implement preventive maintenance program to extend roof life.',
        });
      }
    }

    recs.push({
      priority: 'Ongoing',
      title: 'Regular Thermal Monitoring',
      description: 'Continue quarterly thermal assessments to track condition changes and identify new issues early.',
    });

    return recs;
  };

  const recommendations = generateRecommendations();

  recommendations.forEach((rec, index) => {
    const priorityColors: Record<string, string> = {
      'Immediate': COLORS.danger,
      'High': '#F97316',
      'Medium': COLORS.warning,
      'Low': COLORS.success,
      'Ongoing': COLORS.accent,
    };
    
    const color = priorityColors[rec.priority] || COLORS.text;
    
    doc.rect(50, yPos, 4, 70).fill(color);
    doc.rect(54, yPos, 508, 70).fill(COLORS.lightGray);
    
    doc.fontSize(10)
      .fillColor(color)
      .font('Helvetica-Bold')
      .text(rec.priority.toUpperCase(), 65, yPos + 8);
    
    doc.fontSize(14)
      .fillColor(COLORS.secondary)
      .font('Helvetica-Bold')
      .text(rec.title, 65, yPos + 24);
    
    doc.fontSize(10)
      .fillColor(COLORS.text)
      .font('Helvetica')
      .text(rec.description, 65, yPos + 45, { width: 480 });
    
    yPos += 85;
  });
}

function addFooter(doc: PDFKit.PDFDocument, data: ReportData) {
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    if (i > 0) {
      doc.fontSize(8)
        .fillColor('#999999')
        .text(
          `WinnStorm™ Report - ${data.property.name}`,
          50,
          doc.page.height - 30,
          { align: 'left', width: 200 }
        );
      
      doc.text(
        `Page ${i + 1} of ${pageCount}`,
        doc.page.width - 150,
        doc.page.height - 30,
        { align: 'right', width: 100 }
        );
    }
  }
}

export async function generateExecutiveSummary(data: ReportData): Promise<string> {
  const healthStatus = data.scan.healthScore 
    ? data.scan.healthScore >= 80 ? 'excellent' 
      : data.scan.healthScore >= 60 ? 'satisfactory' 
      : 'concerning'
    : 'not yet assessed';

  const issueCount = data.scan.issues?.length || 0;
  const criticalCount = data.scan.issues?.filter(i => 
    i.severity?.toLowerCase() === 'critical' || i.severity?.toLowerCase() === 'high'
  ).length || 0;

  return `This thermal roof assessment was conducted on ${data.property.name} located at ${data.property.address}. ` +
    `The inspection utilized ${data.scan.scanType || 'thermal imaging'} technology with ${data.scan.deviceType || 'professional-grade equipment'}.\n\n` +
    `Overall roof health is ${healthStatus}${data.scan.healthScore ? ` with a score of ${data.scan.healthScore}/100` : ''}. ` +
    `${issueCount > 0 ? `A total of ${issueCount} issue(s) were identified, ${criticalCount > 0 ? `including ${criticalCount} requiring immediate attention` : 'none requiring immediate action'}.` : 'No significant issues were detected during this assessment.'}\n\n` +
    `${data.property.overallCondition ? `The property's overall condition is rated as ${data.property.overallCondition.toUpperCase()}.` : ''} ` +
    `Based on the Winn Methodology assessment criteria, ${healthStatus === 'excellent' ? 'the roof system is performing optimally and requires only routine maintenance.' : healthStatus === 'satisfactory' ? 'preventive maintenance is recommended to maintain performance.' : 'immediate attention is advised to address identified concerns and prevent further deterioration.'}`;
}
