import { Injectable } from '@nestjs/common';
const PDFDocument = require('pdfkit-table');

@Injectable()
export class ReportsService {
    async generateSessionsPdf(sessions: any[], rangeText: string): Promise<Buffer> {
        const doc = new PDFDocument({
            margin: 30,
            size: 'A4',
        });

        const formatCurrency = (amount: number) => `Bs.- ${Number(amount).toFixed(2)}`;
        const formatDate = (date: Date) => {
            const d = new Date(date);
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };
        const formatDateTime = (date: Date) => {
            const dateStr = formatDate(date);
            const timeStr = new Date(date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            return `${dateStr} ${timeStr}`;
        };

        const buffer: Buffer[] = [];
        doc.on('data', (chunk) => buffer.push(chunk));

        const result = new Promise<Buffer>((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(buffer)));
        });

        // --- Header ---
        doc.fontSize(20).text('FastCashier - Reporte de Turnos', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Periodo: ${rangeText}`, { align: 'center' });
        doc.moveDown(2);

        // --- Summary Table ---
        const totalSalesSum = sessions.reduce((acc, s) => acc + Number(s.totalSales), 0);
        const totalCashSum = sessions.reduce((acc, s) => acc + Number(s.totalCash), 0);
        const totalQrSum = sessions.reduce((acc, s) => acc + Number(s.totalQr), 0);
        const totalDifferenceSum = sessions.reduce((acc, s) => acc + (Number(s.difference) || 0), 0);

        const summaryTable = {
            title: 'Resumen del Periodo',
            headers: ['Concepto', 'Total'],
            rows: [
                ['Ventas Totales', formatCurrency(totalSalesSum)],
                ['Diferencia Acumulada', formatCurrency(totalDifferenceSum)],
                ['Total Turnos', sessions.length.toString()],
            ],
        };

        await doc.table(summaryTable, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(11),
            prepareRow: () => doc.font('Helvetica').fontSize(10),
            width: 250,
        });

        doc.moveDown(2);

        const formatAmount = (amount: number) => Number(amount).toFixed(2);

        // --- Detailed Table ---
        const rows = sessions.map((s) => [
            s.user.fullName,
            formatDateTime(s.openingDate),
            formatAmount(s.initialAmount),
            formatAmount(s.totalSales),
            formatAmount(s.totalCash),
            formatAmount(s.totalQr),
            formatAmount(s.difference || 0),
        ]);

        // Fila de Totales
        rows.push([
            'TOTAL GENERAL',
            '',
            '',
            formatCurrency(totalSalesSum),
            formatCurrency(totalCashSum),
            formatCurrency(totalQrSum),
            formatCurrency(totalDifferenceSum),
        ]);

        const tableData = {
            title: 'Detalle de Turnos',
            headers: ['Responsable', 'Apertura', 'Ef. Inicial', 'Ventas', 'Ef.', 'QR', 'Dif.'],
            rows: rows,
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                // Negrita para la última fila de totales
                if (indexRow === rows.length - 1) {
                    doc.font('Helvetica-Bold').fontSize(9);
                } else {
                    doc.font('Helvetica').fontSize(9);
                }
            },
        });

        // Footer with page numbers
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            doc.fontSize(8).text(
                `Página ${i + 1} de ${range.count} - Generado el ${new Date().toLocaleString()}`,
                30,
                doc.page.height - 40,
                { align: 'center' },
            );
        }

        doc.end();

        return result;
    }
}
