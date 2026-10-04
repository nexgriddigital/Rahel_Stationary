import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  DailyReport,
  WeeklyReport,
  MonthlyReport,
  Product,
  Sale,
  Expense,
  CustomerCreditAccount,
  StoreSettings,
  ETHIOPIAN_PAYMENT_METHODS
} from '../types';

/**
 * Format a numeric amount to standard Ethiopian Birr string: e.g. "ETB 157.50"
 */
export const formatETB = (amount: number, currency = 'ETB'): string => {
  const safeNum = isNaN(amount) ? 0 : amount;
  return `${currency} ${safeNum.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Clean date/time formatter
 */
const formatDateTime = (date: Date = new Date()): string => {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Draw a professional, cohesive header on every document
 */
const drawDocHeader = (
  doc: jsPDF,
  settings: StoreSettings,
  title: string,
  periodSubtitle: string,
  extraMetadata?: string
) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary accent bar (Gold brand accent: #d4af37 -> 212, 175, 55)
  doc.setFillColor(212, 175, 55);
  doc.rect(14, 10, pageWidth - 28, 2.5, 'F');

  // Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 28);
  doc.text((settings.storeName || 'RAHEL STATIONERY').toUpperCase(), 14, 20);

  // System tag & Live generation stamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 105);
  const genText = `Generated: ${formatDateTime()}`;
  doc.text(genText, pageWidth - 14, 18, { align: 'right' });

  // Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(50, 45, 38);
  doc.text(title, 14, 27);

  // Period / Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(115, 105, 95);
  doc.text(periodSubtitle, 14, 32);

  if (extraMetadata) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(extraMetadata, pageWidth - 14, 27, { align: 'right' });
  }

  // Divider line
  doc.setDrawColor(220, 215, 205);
  doc.setLineWidth(0.4);
  doc.line(14, 35, pageWidth - 14, 35);
};

/**
 * Draw professional multi-page footers with page numbers
 */
const addMultiPageFooters = (doc: jsPDF, settings: StoreSettings) => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(225, 220, 215);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    // Left info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 115, 110);
    doc.text(
      `${settings.storeName || 'Rahel Stationery'} · POS Retail Ledger & Financial Audit System`,
      14,
      pageHeight - 7
    );

    // Right Page numbering
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, {
      align: 'right'
    });
  }
};

/**
 * Draw summary KPI stat cards in the PDF
 */
const drawSummaryBoxes = (
  doc: jsPDF,
  startY: number,
  boxes: Array<{ label: string; value: string; sub?: string }>
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const totalWidth = pageWidth - margin * 2;
  const count = boxes.length;
  const gap = 3;
  const boxWidth = (totalWidth - (count - 1) * gap) / count;
  const boxHeight = 18;

  boxes.forEach((box, i) => {
    const x = margin + i * (boxWidth + gap);
    // Box background
    doc.setFillColor(248, 247, 244);
    doc.setDrawColor(220, 215, 205);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(115, 105, 95);
    doc.text(box.label.toUpperCase(), x + 3.5, startY + 4.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(24, 24, 28);
    doc.text(box.value, x + 3.5, startY + 11);

    // Subtext
    if (box.sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(140, 130, 120);
      doc.text(box.sub, x + 3.5, startY + 15.5);
    }
  });

  return startY + boxHeight + 4;
};

// ============================================================================
// 1. DAILY SALES REPORT PDF
// ============================================================================
export const exportDailySalesReportPDF = (
  dailyReport: DailyReport,
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  drawDocHeader(
    doc,
    settings,
    'Daily Sales Report',
    `Report Date: ${dailyReport.formattedDate}`,
    `Total Transactions: ${dailyReport.totalTransactions}`
  );

  let curY = 38;

  // Executive Summary KPI Cards
  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Gross Sales Revenue',
      value: formatETB(dailyReport.totalRevenue, curr),
      sub: 'All recorded payments'
    },
    {
      label: 'Total Orders / Txns',
      value: String(dailyReport.totalTransactions),
      sub: 'Completed checkouts'
    },
    {
      label: 'Units Sold',
      value: String(dailyReport.totalItemsSold),
      sub: 'Catalog stationery items'
    },
    {
      label: 'Avg Ticket Size',
      value: formatETB(dailyReport.averageTransactionValue || 0, curr),
      sub: 'Revenue / transaction'
    }
  ]);

  // Section Header: Payment Method Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 36, 30);
  doc.text('Payment Method Breakdown', 14, curY + 3);

  // Payment Breakdown Table
  const paymentRows = (dailyReport.paymentMethodBreakdown || []).map((pm) => [
    pm.label,
    String(pm.count),
    formatETB(pm.totalAmount, curr),
    `${pm.percentage.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: curY + 5,
    margin: { left: 14, right: 14 },
    head: [['Payment Channel', 'Transactions', 'Total Amount', '% Share']],
    body: paymentRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    alternateRowStyles: { fillColor: [250, 249, 246] },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' }
    }
  });

  // Section Header: Sales Transaction Details
  const afterPaymentY = (doc as any).lastAutoTable.finalY + 6;

  // Recorded sales for this day
  const salesForDay = (dailyReport.transactions || []).filter(
    (s: Sale) => s.status !== 'refunded'
  );

  if (salesForDay.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 36, 30);
    doc.text('Recorded Sales Transactions', 14, afterPaymentY);

    const txnRows = salesForDay.map((s: Sale) => {
      const timeStr = new Date(s.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      const paymentSummary = s.payments
        .map((p) => {
          const match = ETHIOPIAN_PAYMENT_METHODS.find((m) => m.id === p.method);
          return match ? match.shortLabel : p.method.toUpperCase();
        })
        .join(', ');

      const totalItems = s.items.reduce((acc: number, i) => acc + i.quantity, 0);

      return [
        s.transactionId || s.receiptNumber,
        timeStr,
        s.customerName || 'Walk-in Customer',
        String(totalItems),
        paymentSummary || 'Cash',
        formatETB(s.total, curr)
      ];
    });

    autoTable(doc, {
      startY: afterPaymentY + 2,
      margin: { left: 14, right: 14 },
      head: [
        [
          'Transaction ID',
          'Time',
          'Customer',
          'Items',
          'Payment Method',
          'Total Amount'
        ]
      ],
      body: txnRows,
      foot: [
        [
          'Total Day Sales',
          '',
          '',
          String(dailyReport.totalItemsSold),
          '',
          formatETB(dailyReport.totalRevenue, curr)
        ]
      ],
      theme: 'grid',
      showHead: 'everyPage',
      styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
      headStyles: {
        fillColor: [35, 33, 29],
        textColor: [245, 215, 127],
        fontStyle: 'bold'
      },
      footStyles: {
        fillColor: [240, 236, 226],
        textColor: [24, 24, 28],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [252, 252, 250] },
      columnStyles: {
        0: { font: 'courier', fontStyle: 'bold' },
        3: { halign: 'center' },
        5: { halign: 'right', fontStyle: 'bold' }
      }
    });
  }

  // Product Sales Breakdown Table
  const afterTxnY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 36, 30);
  doc.text('Product Sales Breakdown', 14, afterTxnY);

  const productRows = dailyReport.productBreakdown.map((p) => [
    p.productName,
    p.sku,
    p.barcode,
    p.category,
    String(p.quantitySold),
    formatETB(p.averagePrice, curr),
    formatETB(p.totalRevenue, curr)
  ]);

  autoTable(doc, {
    startY: afterTxnY + 2,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Product Name',
        'SKU',
        'Barcode',
        'Category',
        'Qty Sold',
        'Avg Unit Price',
        'Total Revenue'
      ]
    ],
    body: productRows,
    foot: [
      [
        'Total',
        '',
        '',
        '',
        String(dailyReport.totalItemsSold),
        '',
        formatETB(dailyReport.totalRevenue, curr)
      ]
    ],
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [250, 249, 246] },
    columnStyles: {
      1: { font: 'courier' },
      2: { font: 'courier' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  addMultiPageFooters(doc, settings);
  doc.save(`Daily-Sales-Report-${dailyReport.date}.pdf`);
  return doc;
};

// ============================================================================
// 2. WEEKLY SALES REPORT PDF
// ============================================================================
export const exportWeeklySalesReportPDF = (
  weeklyReport: WeeklyReport,
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  drawDocHeader(
    doc,
    settings,
    'Weekly Sales Report',
    `Period: ${weeklyReport.startDate} to ${weeklyReport.endDate}`,
    `Total Transactions: ${weeklyReport.totalTransactions}`
  );

  let curY = 38;

  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Weekly Revenue',
      value: formatETB(weeklyReport.totalRevenue, curr),
      sub: 'Gross revenue'
    },
    {
      label: 'Total Orders',
      value: String(weeklyReport.totalTransactions),
      sub: 'Customer transactions'
    },
    {
      label: 'Items Sold',
      value: String(weeklyReport.totalItemsSold),
      sub: 'Total stationery units'
    },
    {
      label: 'Daily Average',
      value: formatETB(weeklyReport.averageDailyRevenue, curr),
      sub: 'Revenue per day'
    }
  ]);

  // Section 1: Payment Channel Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 36, 30);
  doc.text('Weekly Payment Channel Breakdown', 14, curY + 3);

  const paymentRows = (weeklyReport.paymentMethodBreakdown || []).map((pm) => [
    pm.label,
    String(pm.count),
    formatETB(pm.totalAmount, curr),
    `${pm.percentage.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: curY + 5,
    margin: { left: 14, right: 14 },
    head: [['Payment Method', 'Transactions', 'Total Amount', '% Share']],
    body: paymentRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [250, 249, 246] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' }
    }
  });

  // Section 2: Daily Performance Breakdown
  const afterPayY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 36, 30);
  doc.text('Day-by-Day Sales Trajectory', 14, afterPayY);

  const dailyRows = weeklyReport.dailyTotals.map((d) => [
    d.dayName,
    d.date,
    String(d.totalTransactions),
    String(d.totalItemsSold),
    formatETB(d.totalRevenue, curr),
    weeklyReport.totalRevenue > 0
      ? `${((d.totalRevenue / weeklyReport.totalRevenue) * 100).toFixed(1)}%`
      : '0.0%'
  ]);

  autoTable(doc, {
    startY: afterPayY + 2,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Day',
        'Date',
        'Transactions',
        'Items Sold',
        'Daily Revenue',
        '% of Week'
      ]
    ],
    body: dailyRows,
    foot: [
      [
        'Total Week',
        '',
        String(weeklyReport.totalTransactions),
        String(weeklyReport.totalItemsSold),
        formatETB(weeklyReport.totalRevenue, curr),
        '100.0%'
      ]
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [35, 33, 29],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'right' }
    }
  });

  // Section 3: Product Breakdown
  const afterDailyY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 36, 30);
  doc.text('Product Sales Breakdown (Volume & Revenue)', 14, afterDailyY);

  const productRows = weeklyReport.productBreakdown.map((p) => [
    p.productName,
    p.sku,
    p.barcode,
    String(p.quantitySold),
    formatETB(p.totalRevenue, curr)
  ]);

  autoTable(doc, {
    startY: afterDailyY + 2,
    margin: { left: 14, right: 14 },
    head: [['Product Name', 'SKU', 'Barcode', 'Units Sold', 'Total Revenue']],
    body: productRows,
    foot: [
      [
        'Total',
        '',
        '',
        String(weeklyReport.totalItemsSold),
        formatETB(weeklyReport.totalRevenue, curr)
      ]
    ],
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    columnStyles: {
      1: { font: 'courier' },
      2: { font: 'courier' },
      3: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  addMultiPageFooters(doc, settings);
  doc.save(`Weekly-Sales-Report-${weeklyReport.startDate}_to_${weeklyReport.endDate}.pdf`);
  return doc;
};

// ============================================================================
// 3. MONTHLY SALES REPORT PDF
// ============================================================================
export const exportMonthlySalesReportPDF = (
  monthlyReport: MonthlyReport,
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  drawDocHeader(
    doc,
    settings,
    'Monthly Sales Report',
    `Month: ${monthlyReport.monthName}`,
    `Total Transactions: ${monthlyReport.totalTransactions}`
  );

  let curY = 38;

  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Monthly Revenue',
      value: formatETB(monthlyReport.totalRevenue, curr),
      sub: `Gross sales in ${monthlyReport.monthName}`
    },
    {
      label: 'Total Orders',
      value: String(monthlyReport.totalTransactions),
      sub: 'Recorded retail checkouts'
    },
    {
      label: 'Total Units Sold',
      value: String(monthlyReport.totalItemsSold),
      sub: 'Stationery items'
    },
    {
      label: 'Daily Average',
      value: formatETB(monthlyReport.averageDailyRevenue, curr),
      sub: 'Pace per day'
    }
  ]);

  // Section 1: Payment Method Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 36, 30);
  doc.text('Monthly Payment Channels Breakdown', 14, curY + 3);

  const paymentRows = (monthlyReport.paymentMethodBreakdown || []).map((pm) => [
    pm.label,
    String(pm.count),
    formatETB(pm.totalAmount, curr),
    `${pm.percentage.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: curY + 5,
    margin: { left: 14, right: 14 },
    head: [['Payment Channel', 'Transactions', 'Total Amount', '% Share']],
    body: paymentRows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [250, 249, 246] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold' },
      3: { halign: 'right' }
    }
  });

  // Section 2: Calendar Day-by-Day Breakdown
  const afterPayY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 36, 30);
  doc.text('Day-by-Day Calendar Performance', 14, afterPayY);

  const dailyRows = monthlyReport.dailyBreakdown.map((d) => [
    d.shortDate,
    d.dayName,
    String(d.totalTransactions),
    String(d.totalItemsSold),
    d.totalRevenue > 0 ? formatETB(d.totalRevenue, curr) : '-'
  ]);

  autoTable(doc, {
    startY: afterPayY + 2,
    margin: { left: 14, right: 14 },
    head: [['Date', 'Day', 'Transactions', 'Items Sold', 'Revenue']],
    body: dailyRows,
    foot: [
      [
        'Monthly Total',
        '',
        String(monthlyReport.totalTransactions),
        String(monthlyReport.totalItemsSold),
        formatETB(monthlyReport.totalRevenue, curr)
      ]
    ],
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 1.8 },
    headStyles: {
      fillColor: [35, 33, 29],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { font: 'courier', fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  // Section 3: Product Breakdown
  const afterDailyY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 36, 30);
  doc.text('Product Sales Breakdown', 14, afterDailyY);

  const productRows = monthlyReport.productBreakdown.map((p) => [
    p.productName,
    p.sku,
    p.barcode,
    String(p.quantitySold),
    formatETB(p.totalRevenue, curr)
  ]);

  autoTable(doc, {
    startY: afterDailyY + 2,
    margin: { left: 14, right: 14 },
    head: [['Product Name', 'SKU', 'Barcode', 'Units Sold', 'Total Revenue']],
    body: productRows,
    foot: [
      [
        'Total',
        '',
        '',
        String(monthlyReport.totalItemsSold),
        formatETB(monthlyReport.totalRevenue, curr)
      ]
    ],
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    columnStyles: {
      1: { font: 'courier' },
      2: { font: 'courier' },
      3: { halign: 'center', fontStyle: 'bold' },
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  addMultiPageFooters(doc, settings);
  doc.save(`Monthly-Sales-Report-${monthlyReport.year}-${String(monthlyReport.month).padStart(2, '0')}.pdf`);
  return doc;
};

// ============================================================================
// 4. SALES HISTORY / TRANSACTION LEDGER PDF (Filtered)
// ============================================================================
export const exportSalesHistoryPDF = (
  sales: Sale[],
  filterContext: string,
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  const validSales = sales.filter((s) => s.status !== 'refunded');
  const totalRev = validSales.reduce((acc, s) => acc + s.total, 0);
  const totalItems = validSales.reduce(
    (acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );

  drawDocHeader(
    doc,
    settings,
    'Sales History & Transaction Ledger',
    filterContext || 'All Recorded Sales Transactions',
    `Records: ${sales.length} | Net: ${formatETB(totalRev, curr)}`
  );

  let curY = 38;

  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Net Sales Volume',
      value: formatETB(totalRev, curr),
      sub: 'Excludes refunds'
    },
    {
      label: 'Filtered Transactions',
      value: String(sales.length),
      sub: `${validSales.length} active, ${sales.length - validSales.length} refunded`
    },
    {
      label: 'Units Sold',
      value: String(totalItems),
      sub: 'Items disbursed'
    },
    {
      label: 'Average Ticket',
      value: formatETB(validSales.length > 0 ? totalRev / validSales.length : 0, curr),
      sub: 'Average checkout'
    }
  ]);

  const rows = sales.map((s) => {
    const isRefund = s.status === 'refunded';
    const dateFormatted = new Date(s.timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeFormatted = new Date(s.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    const paymentText = s.payments
      .map((p) => {
        const found = ETHIOPIAN_PAYMENT_METHODS.find((m) => m.id === p.method);
        return found ? found.shortLabel : p.method.toUpperCase();
      })
      .join(', ');

    const itemsSummary = s.items
      .map((i) => `${i.productName} (x${i.quantity})`)
      .join(', ');

    return [
      s.transactionId || s.receiptNumber,
      `${dateFormatted}\n${timeFormatted}`,
      s.customerName || 'Walk-in',
      itemsSummary.length > 35 ? itemsSummary.slice(0, 32) + '...' : itemsSummary,
      paymentText || 'Cash',
      isRefund ? `[REFUND]\n-${formatETB(s.total, curr)}` : formatETB(s.total, curr)
    ];
  });

  autoTable(doc, {
    startY: curY + 2,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Transaction ID',
        'Date / Time',
        'Customer',
        'Line Items',
        'Payment Channel',
        'Total Amount'
      ]
    ],
    body: rows,
    foot: [
      [
        'Net Total',
        '',
        '',
        `${totalItems} items`,
        '',
        formatETB(totalRev, curr)
      ]
    ],
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [252, 252, 250] },
    columnStyles: {
      0: { font: 'courier', fontStyle: 'bold' },
      1: { font: 'courier', fontSize: 7 },
      5: { halign: 'right', fontStyle: 'bold' }
    }
  });

  addMultiPageFooters(doc, settings);
  doc.save(`Sales-History-${new Date().toISOString().split('T')[0]}.pdf`);
  return doc;
};

// ============================================================================
// 5. INVENTORY / PRODUCT CATALOG MASTER PDF
// ============================================================================
export const exportInventoryReportPDF = (
  products: Product[],
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  const totalRetailVal = products.reduce((acc, p) => acc + p.retailPrice * p.stock, 0);
  const totalCostVal = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minThreshold).length;

  drawDocHeader(
    doc,
    settings,
    'Inventory Catalog & Stock Audit Report',
    'Full Product Stock Status & Valuation',
    `SKUs: ${products.length} · Low Stock: ${lowStockCount}`
  );

  let curY = 38;

  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Total Products / SKUs',
      value: String(products.length),
      sub: 'Catalog items'
    },
    {
      label: 'Inventory Valuation',
      value: formatETB(totalRetailVal, curr),
      sub: `Cost Value: ${formatETB(totalCostVal, curr)}`
    },
    {
      label: 'Stock Alerts',
      value: String(lowStockCount),
      sub: 'Items at/below threshold'
    },
    {
      label: 'Gross Margin Est.',
      value: totalRetailVal > 0 ? `${(((totalRetailVal - totalCostVal) / totalRetailVal) * 100).toFixed(1)}%` : '0%',
      sub: 'Catalog markup margin'
    }
  ]);

  const rows = products.map((p) => {
    const isDepleted = p.stock <= 0;
    const isLow = p.stock <= p.minThreshold;
    const statusText = isDepleted
      ? 'DEPLETED (0)'
      : isLow
      ? `LOW STOCK (<= ${p.minThreshold})`
      : 'In Stock (OK)';

    return [
      p.name,
      p.sku,
      p.barcode,
      p.category,
      formatETB(p.retailPrice, curr),
      `${p.stock} ${p.unit || 'pcs'}`,
      `${p.minThreshold} ${p.unit || 'pcs'}`,
      statusText
    ];
  });

  autoTable(doc, {
    startY: curY + 2,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Product Name',
        'SKU',
        'Barcode',
        'Category',
        'Retail Price',
        'Current Stock',
        'Min Threshold',
        'Stock Status'
      ]
    ],
    body: rows,
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 7, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [250, 249, 246] },
    columnStyles: {
      1: { font: 'courier' },
      2: { font: 'courier' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { halign: 'center', fontStyle: 'bold' },
      6: { halign: 'center' },
      7: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Highlight low stock or depleted cells
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw);
        if (val.includes('DEPLETED')) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fillColor = [254, 242, 242];
        } else if (val.includes('LOW')) {
          data.cell.styles.textColor = [180, 83, 9]; // Amber
          data.cell.styles.fillColor = [254, 243, 199];
        } else {
          data.cell.styles.textColor = [22, 101, 52]; // Green
        }
      }
    }
  });

  addMultiPageFooters(doc, settings);
  doc.save(`Inventory-Catalog-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  return doc;
};

// ============================================================================
// 6. LOW STOCK & REORDER REPORT PDF
// ============================================================================
export const exportLowStockReportPDF = (
  products: Product[],
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  const lowStock = products.filter((p) => p.stock <= p.minThreshold);
  const depleted = lowStock.filter((p) => p.stock <= 0);

  // Total estimated replenishment cost
  const estReplenishCost = lowStock.reduce((acc, p) => {
    const deficit = Math.max(0, p.minThreshold * 2 - p.stock);
    return acc + deficit * p.costPrice;
  }, 0);

  drawDocHeader(
    doc,
    settings,
    'Low Stock & Reorder Alert Report',
    'Urgent Inventory Replenishment Audit',
    `Critical Items: ${lowStock.length} | Depleted: ${depleted.length}`
  );

  let curY = 38;

  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Critical Items',
      value: String(lowStock.length),
      sub: 'Need immediate restock'
    },
    {
      label: 'Depleted (Out of Stock)',
      value: String(depleted.length),
      sub: 'Zero inventory on shelf'
    },
    {
      label: 'Est. Restock Outlay',
      value: formatETB(estReplenishCost, curr),
      sub: 'Cost to replenish to 2x threshold'
    },
    {
      label: 'Supplier Urgency',
      value: depleted.length > 0 ? 'HIGH PRIORITY' : 'MODERATE',
      sub: 'Procurement status'
    }
  ]);

  if (lowStock.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 150, 50);
    doc.text('All catalog inventory items are comfortably stocked above safety thresholds.', 14, curY + 10);
  } else {
    const rows = lowStock.map((p) => {
      const isDepleted = p.stock <= 0;
      const suggestedReorder = Math.max(0, p.minThreshold * 2 - p.stock);
      const estLineCost = suggestedReorder * p.costPrice;

      return [
        p.name,
        p.sku,
        p.barcode,
        p.category,
        `${p.stock} ${p.unit || 'pcs'}`,
        `${p.minThreshold} ${p.unit || 'pcs'}`,
        isDepleted ? '0 (DEPLETED)' : `${p.stock}`,
        String(suggestedReorder),
        formatETB(p.costPrice, curr),
        formatETB(estLineCost, curr)
      ];
    });

    autoTable(doc, {
      startY: curY + 2,
      margin: { left: 14, right: 14 },
      head: [
        [
          'Product Name',
          'SKU',
          'Barcode',
          'Category',
          'Current',
          'Min',
          'Status',
          'Suggested Qty',
          'Unit Cost',
          'Est. Cost'
        ]
      ],
      body: rows,
      foot: [
        [
          'Total Estimated Outlay',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          formatETB(estReplenishCost, curr)
        ]
      ],
      theme: 'grid',
      showHead: 'everyPage',
      styles: { font: 'helvetica', fontSize: 7, cellPadding: 2 },
      headStyles: {
        fillColor: [180, 83, 9], // Dark amber
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      footStyles: {
        fillColor: [240, 236, 226],
        textColor: [24, 24, 28],
        fontStyle: 'bold'
      },
      columnStyles: {
        1: { font: 'courier' },
        2: { font: 'courier' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { fontStyle: 'bold' },
        7: { halign: 'center', fontStyle: 'bold' },
        8: { halign: 'right' },
        9: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const val = String(data.cell.raw);
          if (val.includes('DEPLETED')) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fillColor = [254, 242, 242];
          } else {
            data.cell.styles.textColor = [180, 83, 9];
          }
        }
      }
    });
  }

  addMultiPageFooters(doc, settings);
  doc.save(`Low-Stock-Alert-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  return doc;
};

// ============================================================================
// 7. EXPENSE REPORT PDF
// ============================================================================
export const exportExpenseReportPDF = (
  expenses: Expense[],
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  const totalAmount = expenses.reduce((acc, e) => acc + e.amount, 0);

  drawDocHeader(
    doc,
    settings,
    'Store Expense & Operational Costs Report',
    'Retail Operational Outflows & Payout Records',
    `Entries: ${expenses.length} | Total: ${formatETB(totalAmount, curr)}`
  );

  let curY = 38;

  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Total Expenses',
      value: formatETB(totalAmount, curr),
      sub: 'Cumulative operational outlay'
    },
    {
      label: 'Expense Records',
      value: String(expenses.length),
      sub: 'Audited payout entries'
    },
    {
      label: 'Avg Outflow Entry',
      value: formatETB(expenses.length > 0 ? totalAmount / expenses.length : 0, curr),
      sub: 'Per expense ticket'
    },
    {
      label: 'Accounting Status',
      value: 'AUDITED & LOGGED',
      sub: 'Single source of truth'
    }
  ]);

  const rows = expenses.map((e) => {
    const dStr = new Date(e.date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return [
      dStr,
      e.category,
      e.description,
      e.paidVia || 'Cash Register',
      e.recordedBy || 'Store Admin',
      e.receiptReference || '-',
      formatETB(e.amount, curr)
    ];
  });

  autoTable(doc, {
    startY: curY + 2,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Date',
        'Category',
        'Description',
        'Payment Channel',
        'Authorized By',
        'Receipt Ref',
        'Amount'
      ]
    ],
    body: rows,
    foot: [
      [
        'Total Operational Expenses',
        '',
        '',
        '',
        '',
        '',
        formatETB(totalAmount, curr)
      ]
    ],
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { font: 'courier' },
      6: { halign: 'right', fontStyle: 'bold' }
    }
  });

  addMultiPageFooters(doc, settings);
  doc.save(`Expense-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  return doc;
};

// ============================================================================
// 8. CUSTOMER CREDIT & RECEIVABLES REPORT PDF
// ============================================================================
export const exportCreditAccountsReportPDF = (
  accounts: CustomerCreditAccount[],
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  const totalOutstanding = accounts.reduce((acc, a) => acc + a.currentBalance, 0);
  const totalLimit = accounts.reduce((acc, a) => acc + a.creditLimit, 0);

  drawDocHeader(
    doc,
    settings,
    'Customer Credit & Receivables Report',
    'Store Credit Accounts, Outstanding Debts & Limits',
    `Accounts: ${accounts.length} | Receivables: ${formatETB(totalOutstanding, curr)}`
  );

  let curY = 38;

  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Total Receivables',
      value: formatETB(totalOutstanding, curr),
      sub: 'Outstanding store credit'
    },
    {
      label: 'Total Credit Limits',
      value: formatETB(totalLimit, curr),
      sub: 'Approved credit ceiling'
    },
    {
      label: 'Active Accounts',
      value: String(accounts.length),
      sub: 'Customer ledgers'
    },
    {
      label: 'Utilization Rate',
      value: totalLimit > 0 ? `${((totalOutstanding / totalLimit) * 100).toFixed(1)}%` : '0%',
      sub: 'Credit risk ratio'
    }
  ]);

  const rows = accounts.map((a) => {
    const available = Math.max(0, a.creditLimit - a.currentBalance);
    const isExceeded = a.currentBalance > a.creditLimit;
    const status = isExceeded
      ? 'OVER LIMIT'
      : a.currentBalance > 0
      ? 'ACTIVE DEBT'
      : 'CLEARED';

    return [
      a.customerName,
      a.phone,
      formatETB(a.creditLimit, curr),
      formatETB(a.currentBalance, curr),
      formatETB(available, curr),
      status
    ];
  });

  autoTable(doc, {
    startY: curY + 2,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Customer Name',
        'Phone / Contact',
        'Credit Limit',
        'Outstanding Debt',
        'Available Credit',
        'Account Status'
      ]
    ],
    body: rows,
    foot: [
      [
        'Total Receivables',
        '',
        formatETB(totalLimit, curr),
        formatETB(totalOutstanding, curr),
        formatETB(Math.max(0, totalLimit - totalOutstanding), curr),
        ''
      ]
    ],
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right' },
      5: { fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw);
        if (val.includes('OVER')) {
          data.cell.styles.textColor = [220, 38, 38];
        } else if (val.includes('ACTIVE')) {
          data.cell.styles.textColor = [180, 83, 9];
        } else {
          data.cell.styles.textColor = [22, 101, 52];
        }
      }
    }
  });

  addMultiPageFooters(doc, settings);
  doc.save(`Customer-Credit-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  return doc;
};

// ============================================================================
// 9. PAYMENT METHOD REPORT PDF
// ============================================================================
export const exportPaymentMethodsReportPDF = (
  sales: Sale[],
  periodLabel: string,
  settings: StoreSettings
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const curr = settings.currencySymbol || 'ETB';

  const validSales = sales.filter((s) => s.status !== 'refunded');
  const totalVolume = validSales.reduce((acc, s) => acc + s.total, 0);

  // Group by Ethiopian Payment Methods
  const methodMap: Record<string, { label: string; count: number; total: number }> = {};
  ETHIOPIAN_PAYMENT_METHODS.forEach((m) => {
    methodMap[m.id] = { label: m.label, count: 0, total: 0 };
  });

  validSales.forEach((s) => {
    s.payments.forEach((p) => {
      let key = p.method;
      if (key === 'card') key = 'cbe';
      if (key === 'mobile_transfer') key = 'telebirr';
      if (!methodMap[key]) {
        methodMap[key] = { label: p.method, count: 0, total: 0 };
      }
      methodMap[key].count += 1;
      methodMap[key].total += p.amount;
    });
  });

  drawDocHeader(
    doc,
    settings,
    'Payment Methods & Channel Audit Report',
    periodLabel || 'All Completed Retail Checkouts',
    `Gross Processed: ${formatETB(totalVolume, curr)}`
  );

  let curY = 38;

  curY = drawSummaryBoxes(doc, curY, [
    {
      label: 'Gross Tender Volume',
      value: formatETB(totalVolume, curr),
      sub: 'All processed payments'
    },
    {
      label: 'Total Checkouts',
      value: String(validSales.length),
      sub: 'Tendered sales'
    },
    {
      label: 'Active Channels',
      value: String(Object.values(methodMap).filter((m) => m.count > 0).length),
      sub: 'Tender types utilized'
    },
    {
      label: 'Top Tender Method',
      value:
        Object.values(methodMap).sort((a, b) => b.total - a.total)[0]?.label ||
        'Cash',
      sub: 'Highest revenue channel'
    }
  ]);

  const rows = Object.values(methodMap).map((m) => {
    const pctVol = totalVolume > 0 ? ((m.total / totalVolume) * 100).toFixed(1) : '0.0';
    const pctCount =
      validSales.length > 0 ? ((m.count / validSales.length) * 100).toFixed(1) : '0.0';
    const avgTicket = m.count > 0 ? m.total / m.count : 0;

    return [
      m.label,
      String(m.count),
      `${pctCount}%`,
      formatETB(m.total, curr),
      `${pctVol}%`,
      formatETB(avgTicket, curr)
    ];
  });

  autoTable(doc, {
    startY: curY + 2,
    margin: { left: 14, right: 14 },
    head: [
      [
        'Payment Channel',
        'Transactions',
        '% of Orders',
        'Total Amount',
        '% of Sales Volume',
        'Average Ticket'
      ]
    ],
    body: rows,
    foot: [
      [
        'Total',
        String(validSales.length),
        '100.0%',
        formatETB(totalVolume, curr),
        '100.0%',
        formatETB(validSales.length > 0 ? totalVolume / validSales.length : 0, curr)
      ]
    ],
    theme: 'grid',
    showHead: 'everyPage',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.2 },
    headStyles: {
      fillColor: [24, 24, 28],
      textColor: [245, 215, 127],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 236, 226],
      textColor: [24, 24, 28],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'right' },
      5: { halign: 'right' }
    }
  });

  addMultiPageFooters(doc, settings);
  doc.save(`Payment-Methods-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  return doc;
};
