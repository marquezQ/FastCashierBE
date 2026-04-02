import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';

const PDFDocument = require('pdfkit-table');

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) { }

    async getSalesPerformance(start: string, end: string) {
        // Parse as LOCAL time by appending T00:00:00 without Z if no time is given.
        // new Date('YYYY-MM-DD') parses as UTC midnight — WRONG for La Paz.
        // new Date('YYYY-MM-DDT00:00:00') parses as local midnight — CORRECT.
        const startDate = start.includes('T')
            ? new Date(start)
            : new Date(start + 'T00:00:00');

        const endDate = end.includes('T')
            ? new Date(end)
            : new Date(end + 'T00:00:00');

        // Force end to include the full day (only when no specific time was given)
        if (!end.includes('T')) {
            endDate.setHours(23, 59, 59, 999);
        }

        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let groupBy: 'hour' | 'day' | 'week' | 'month';
        if (diffDays < 2) {
            groupBy = 'hour';
        } else if (diffDays <= 14) {
            groupBy = 'day';
        } else if (diffDays <= 60) {
            groupBy = 'week';
        } else {
            groupBy = 'month';
        }

        const orders = await this.orderRepository
            .createQueryBuilder('order')
            .where('order.order_date BETWEEN :start AND :end', { start: startDate, end: endDate })
            .andWhere('order.order_status != :status', { status: 'CANCELLED' })
            .orderBy('order.order_date', 'ASC')
            .getMany();

        const groupedData: { [key: string]: number } = {};

        orders.forEach((order) => {
            const label = this.getLabel(order.orderDate, groupBy);
            groupedData[label] = (groupedData[label] || 0) + Number(order.total);
        });

        return Object.entries(groupedData).map(([label, sales]) => ({
            label,
            sales: parseFloat(sales.toFixed(2)),
        }));
    }

    private getLabel(date: Date, groupBy: 'hour' | 'day' | 'week' | 'month'): string {
        const d = new Date(date);
        switch (groupBy) {
            case 'hour':
                return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            case 'day':
                const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
                return `${days[d.getDay()]} ${d.getDate()}`;
            case 'week':
                // Approximation of week of the month
                const weekNum = Math.ceil(d.getDate() / 7);
                return `Sem ${weekNum}`;
            case 'month':
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return months[d.getMonth()];
            default:
                return '';
        }
    }

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

    async generateSingleSessionPdf(session: any, orders: Order[]): Promise<Buffer> {
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
            const d = new Date(date);
            const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            return `${formatDate(d)} ${timeStr}`;
        };

        const buffer: Buffer[] = [];
        doc.on('data', (chunk) => buffer.push(chunk));

        const result = new Promise<Buffer>((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(buffer)));
        });

        // --- Header ---
        doc.fontSize(16).font('Helvetica-Bold').text('Reporte a Detalle de Turno');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Turno ID: ${session.idSession}`);
        doc.text(`Cajero(a): ${session.user?.fullName || 'Desconocido'}`);
        doc.text(`Apertura: ${formatDateTime(session.openingDate)}${session.closingDate ? '  |  Cierre: ' + formatDateTime(session.closingDate) : '  |  Cierre: PENDIENTE'}`);
        doc.text(`Fondo de Reserva (Monto Inicial): ${formatCurrency(session.initialAmount)}`);
        doc.moveDown(2);

        // --- Orders Table ---
        let totalCashSum = 0;
        let totalQrSum = 0;
        let totalSalesSum = 0;

        const rows = orders.map((order) => {
            const orderTotal = Number(order.total) || 0;
            const isCash = order.paymentMethod === 'CASH';
            const isQr = order.paymentMethod === 'QR';
            
            const cashVal = isCash ? orderTotal : 0;
            const qrVal = isQr ? orderTotal : 0;

            if (order.orderStatus !== 'CANCELLED') {
                totalCashSum += cashVal;
                totalQrSum += qrVal;
                totalSalesSum += orderTotal;
            }

            const tipo = order.orderType === 'DINE_IN' ? 'Mesa' : 'Llevar';
            const cliente = order.customer || '';

            return [
                order.orderNumber,
                formatDateTime(order.orderDate),
                cliente,
                tipo,
                isCash ? formatCurrency(cashVal) : '-',
                isQr ? formatCurrency(qrVal) : '-',
                formatCurrency(orderTotal),
                order.orderStatus === 'CANCELLED' ? 'Anulado' : 'OK'
            ];
        });

        // Fila de Totales
        rows.push([
            'TOTAL VÁLIDO',
            '',
            '',
            '',
            formatCurrency(totalCashSum),
            formatCurrency(totalQrSum),
            formatCurrency(totalSalesSum),
            ''
        ]);

        const tableData = {
            title: 'Listado de Órdenes',
            headers: ['# Orden', 'Fecha y Hora', 'Cliente', 'Tipo', 'Efectivo', 'QR', 'Total', 'Estado'],
            rows: rows,
        };

        await doc.table(tableData, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
            prepareRow: (row: any, indexColumn: number, indexRow: number) => {
                if (indexRow === rows.length - 1) {
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('black');
                } else if (row[7] === 'Anulado') {
                    doc.font('Helvetica-Oblique').fontSize(8).fillColor('red');
                } else {
                    doc.font('Helvetica').fontSize(8).fillColor('black');
                }
            },
        });

        // Reset fill color 
        doc.fillColor('black');

        // --- Resumen General (Texto) ---
        doc.moveDown(2);
        
        const initialCash = Number(session.initialAmount) || 0;
        const expectedCashTotal = initialCash + totalCashSum;
        const expectedQrTotal = totalQrSum;
        const declaredCash = Number(session.closingCashAmount) || 0;
        const declaredQr = Number(session.closingQrAmount) || 0;
        
        const diferenciaEfectivo = declaredCash - expectedCashTotal;
        const diferenciaQr = declaredQr - expectedQrTotal;
        const diferenciaTotal = diferenciaEfectivo + diferenciaQr;
        
        const totalGeneral = expectedCashTotal + expectedQrTotal;

        const printRow = (label: string, value: string) => {
            doc.font('Helvetica').fontSize(10).text(`${label}: ${value}`);
        };

        const statusCash = session.closingDate ? formatCurrency(declaredCash) : 'PENDIENTE';
        const statusQr = session.closingDate ? formatCurrency(declaredQr) : 'PENDIENTE';
        const diffText = session.closingDate ? formatCurrency(diferenciaTotal) : 'PENDIENTE';

        doc.font('Helvetica-Bold').fontSize(11).text('CAJA Y EFECTIVO');
        doc.moveDown(0.2);
        printRow('Efectivo Inicial', formatCurrency(initialCash));
        printRow('Ventas Efectivo', formatCurrency(totalCashSum));
        printRow('Efectivo Esperado', formatCurrency(expectedCashTotal));
        printRow('Efectivo (Físico Caja)', statusCash);
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(11).text('TRANSACCIONES (QR)');
        doc.moveDown(0.2);
        printRow('Ventas QR Esperado', formatCurrency(expectedQrTotal));
        printRow('Ventas QR Declarado', statusQr);
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(11).text(`TOTAL GENERAL: ${formatCurrency(totalGeneral)}`);
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(11).text('SOBRANTE / FALTANTE TOTAL');
        doc.moveDown(0.2);
        doc.font('Helvetica').fontSize(11).text(diffText);
        doc.moveDown(2);

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
