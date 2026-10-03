import React from 'react';
import { Sale } from '../types';
import { storage } from '../services/storage';
import { BarcodeRenderer } from './BarcodeRenderer';
import { Printer, Download, X, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale
}) => {
  if (!isOpen || !sale) return null;

  const settings = storage.getSettings();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // 80mm thermal roll format
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(settings.storeName, 40, 10, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(settings.tagline, 40, 14, { align: 'center' });
      doc.text(settings.address, 40, 18, { align: 'center' });
      doc.text(`Tel: ${settings.phone}${settings.taxNumber ? ` | TIN: ${settings.taxNumber}` : ''}`, 40, 22, { align: 'center' });

      doc.setLineDashPattern([1, 1], 0);
      doc.line(5, 25, 75, 25);

      doc.setFontSize(8);
      doc.text(`Receipt: ${sale.receiptNumber}`, 5, 29);
      doc.text(`Date: ${new Date(sale.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`, 5, 33);
      doc.text(`Cashier: ${sale.cashierName}`, 5, 37);
      if (sale.customerName) {
        doc.text(`Customer: ${sale.customerName}`, 5, 41);
      }

      const tableData = sale.items.map(item => [
        item.productName.substring(0, 18),
        `${item.quantity}`,
        `${settings.currencySymbol} ${item.unitPrice.toFixed(2)}`,
        `${settings.currencySymbol} ${item.total.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: sale.customerName ? 44 : 40,
        margin: { left: 4, right: 4 },
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: tableData,
        theme: 'plain',
        styles: { fontSize: 7, cellPadding: 1, font: 'helvetica' },
        headStyles: { fontStyle: 'bold', textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 14, halign: 'right' },
          3: { cellWidth: 16, halign: 'right' }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || 90;

      doc.line(5, finalY + 2, 75, finalY + 2);

      let currentY = finalY + 6;
      doc.setFontSize(8);
      doc.text('Subtotal:', 45, currentY);
      doc.text(`${settings.currencySymbol} ${sale.subtotal.toFixed(2)}`, 75, currentY, { align: 'right' });

      if (sale.discountAmount > 0) {
        currentY += 4;
        doc.text('Discount:', 45, currentY);
        doc.text(`-${settings.currencySymbol} ${sale.discountAmount.toFixed(2)}`, 75, currentY, { align: 'right' });
      }

      if (sale.taxAmount > 0) {
        currentY += 4;
        doc.text(`Tax (${sale.taxPercent}%):`, 45, currentY);
        doc.text(`${settings.currencySymbol} ${sale.taxAmount.toFixed(2)}`, 75, currentY, { align: 'right' });
      }

      currentY += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('TOTAL:', 45, currentY);
      doc.text(`${settings.currencySymbol} ${sale.total.toFixed(2)}`, 75, currentY, { align: 'right' });

      currentY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      sale.payments.forEach(p => {
        doc.text(`Paid via ${p.method.replace('_', ' ').toUpperCase()}:`, 5, currentY);
        doc.text(`${settings.currencySymbol} ${p.amount.toFixed(2)}`, 75, currentY, { align: 'right' });
        currentY += 3.5;
      });

      currentY += 3;
      doc.setFontSize(7);
      doc.text('Thank you for shopping at Rahel Stationary!', 40, currentY, { align: 'center' });
      currentY += 3.5;
      doc.text(settings.receiptFooter.split('\n')[0] || '', 40, currentY, { align: 'center' });

      doc.save(`Receipt-${sale.receiptNumber}.pdf`);
    } catch (err) {
      console.error('PDF export error', err);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#141417] text-[#f4efe8] shadow-2xl border border-[#26221c] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#26221c] bg-[#18181c]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f5d77f]">
            <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
            <span>Transaction Processed</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              title="Print Thermal 80mm Receipt"
              className="p-1.5 rounded-lg text-[#c4bbb0] hover:text-[#f5d77f] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadPdf}
              title="Download PDF"
              className="p-1.5 rounded-lg text-[#c4bbb0] hover:text-[#f5d77f] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#998b7a] hover:text-[#f4efe8] hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 80mm Paper Preview Container */}
        <div className="p-4 overflow-y-auto bg-[#0a0a0c] flex justify-center">
          <div
            id="thermal-receipt-printable"
            className="w-[300px] bg-white text-[#111] p-5 shadow-2xl border border-slate-300 font-mono text-[11px] leading-tight select-text"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <div className="text-base font-bold tracking-tight text-black">{settings.storeName}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{settings.tagline}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{settings.address}</div>
              <div className="text-[9px] text-slate-500">Tel: {settings.phone}{settings.taxNumber ? ` · TIN: ${settings.taxNumber}` : ''}</div>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{sale.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(sale.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="truncate max-w-[150px]">{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="py-2 border-b border-dashed border-slate-400">
              <div className="grid grid-cols-12 font-bold pb-1 text-[10px]">
                <div className="col-span-6">Item</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-4 text-right">Amount</div>
              </div>
              <div className="space-y-1.5 pt-1">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-[10px]">
                    <div className="col-span-6">
                      <div className="font-semibold text-black leading-3">{item.productName}</div>
                      <div className="text-[9px] text-slate-500">
                        {item.sku} @ {settings.currencySymbol} {item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-2 text-center">{item.quantity}</div>
                    <div className="col-span-4 text-right font-semibold">
                      {settings.currencySymbol} {item.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Totals */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{settings.currencySymbol} {sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Discounts:</span>
                  <span>-{settings.currencySymbol} {sale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {sale.taxAmount > 0 && (
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>Tax ({sale.taxPercent}%):</span>
                  <span>{settings.currencySymbol} {sale.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-300 text-black">
                <span>TOTAL:</span>
                <span>{settings.currencySymbol} {sale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Splits */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              {sale.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="capitalize">{p.method.replace('_', ' ')}:</span>
                  <span className="font-semibold">{settings.currencySymbol} {p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Barcode & Footer */}
            <div className="pt-3 text-center space-y-1">
              <BarcodeRenderer value={sale.receiptNumber} height={35} fontSize={10} />
              <p className="text-[9px] text-slate-600 whitespace-pre-line pt-1">
                {settings.receiptFooter}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#141417] border-t border-[#26221c] flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8010] hover:from-[#e6ca65] hover:to-[#b88c14] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-black" />
            Print Receipt
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-3 py-2 rounded-xl bg-[#1a1714] hover:bg-[#26221c] border border-[#26221c] text-xs font-semibold text-[#f4efe8] hover:text-[#f5d77f] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>
    </div>
  );
};
