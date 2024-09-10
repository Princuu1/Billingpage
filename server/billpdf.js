const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');

function generatePDF(billData) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
        });

        const stream = new PassThrough();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });

        doc.on('error', reject);

        // Title
        doc.fontSize(22)
            .font('Helvetica-Bold')
            .fillColor('#3498db')
            .text('XYZ Company', { align: 'center' })
            .moveDown(1);

        // Draw a line under the title
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#3498db').lineWidth(2).stroke().moveDown(1);

        // Billing Information
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('black')
            .text(`Name:          ${billData.name}`)
            .text(`Address:      ${billData.address}`)
            .text(`Date:           ${billData.date}`)
            .text(`Receipt No:   ${billData.receiptNo}`)
            .moveDown(1);

        // Table Headers
        const tableTop = doc.y;
        const colWidths = [30, 140, 70, 70, 100]; // Added width for serial number

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2980b9')
            .text('S.No', 50, tableTop)
            .text('Description', 80, tableTop)
            .text('Quantity', 220, tableTop, { align: 'justify' })
            .text('Price', 300, tableTop, { align: 'justify' })
            .text('Total', 400, tableTop, { align: 'justify' });

        // Draw header underline
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).strokeColor('#2980b9').lineWidth(1).stroke();

        let rowY = tableTop + 25;

        // Add vertical table lines
        const drawTableRow = (rowY) => {
            doc.moveTo(50, rowY - 5).lineTo(50, rowY + 20).strokeColor('#2980b9').lineWidth(1).stroke();
            doc.moveTo(80, rowY - 5).lineTo(80, rowY + 20).stroke();
            doc.moveTo(220, rowY - 5).lineTo(220, rowY + 20).stroke();
            doc.moveTo(300, rowY - 5).lineTo(300, rowY + 20).stroke();
            doc.moveTo(400, rowY - 5).lineTo(400, rowY + 20).stroke();
            doc.moveTo(550, rowY - 5).lineTo(550, rowY + 20).stroke();
        };

        // Table Rows with wrapping text to prevent overflow
        billData.items.forEach((item, index) => {
            const fillColor = index % 2 === 0 ? '#f1f1f1' : '#ffffff';
            doc.rect(50, rowY - 5, 500, 20).fill(fillColor).stroke();

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('black')
                .text(index + 1, 55, rowY, { width: colWidths[0], align: 'justify' }) // Serial number
                .text(item.description, 85, rowY, { width: colWidths[1], height: 20, ellipsis: true }) // Wrapping long descriptions
                .text(item.quantity, 220, rowY, { width: colWidths[2], align: 'center' })
                .text(`${item.price}Rs.`, 300, rowY, { width: colWidths[3], align: 'center' })
                .text(`${item.total}Rs.`, 400, rowY, { width: colWidths[4], align: 'center' });

            // Draw the vertical lines for the row
            drawTableRow(rowY);
            rowY += 25;
        });

        // Draw borders around the table
        doc.moveTo(50, tableTop - 5).lineTo(550, tableTop - 5).lineTo(550, rowY - 5).lineTo(50, rowY - 5).closePath().strokeColor('#2980b9').lineWidth(1).stroke();

        // Summary Table
        doc.moveDown(2);

        const summaryTop = doc.y;
        const summaryColWidths = [200, 100, 150];

        doc.font('Helvetica-Bold').fillColor('#2980b9');
        doc.text('Summary', 50, summaryTop,{ align: 'center' })
            .text('', 250, summaryTop, { align: 'justify' })
            .text('Amount', 400, summaryTop, { align: 'justify' });

        // Draw header underline for summary table
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).strokeColor('#2980b9').lineWidth(1).stroke();

        const summaryItems = [
            { label: 'Subtotal', value: `${billData.subtotal}Rs.` },
            { label: 'Discount', value: `${billData.discountAmount}Rs.`, percent: `${billData.discount}%` },
            { label: 'GST Amount', value: `${billData.gstAmount}Rs.`, percent: `` },
            { label: 'Total Amount', value: `${billData.totalAmount}Rs.`, color: '#4dff4d' } // Green color
        ];

        let summaryRowY = summaryTop + 25;
        summaryItems.forEach((item, index) => {
            if (item.color) {
                // Draw the background color for the "Total Amount" row
                doc.rect(50, summaryRowY - 5, 500, 20).fill(item.color);
            } else {
                doc.rect(50, summaryRowY - 5, 500, 20).fill('#ffffff'); // Default background color
            }

            doc.font('Helvetica').fillColor('black')
                .text(item.label, 50, summaryRowY, { width: summaryColWidths[0], height: 20, align: 'center' })
                .text(item.percent, 250, summaryRowY, { width: summaryColWidths[1], align: 'justify' })
                .text(item.value, 400, summaryRowY, { width: summaryColWidths[2], align: 'justify' });

            summaryRowY += 25;
        });

        // Draw borders around the summary table
        doc.moveTo(50, summaryTop - 5).lineTo(550, summaryTop - 5).lineTo(550, summaryRowY - 5).lineTo(50, summaryRowY - 5).closePath().strokeColor('#2980b9').lineWidth(1).stroke();

        // Footer with Color and Font Changes
        doc.moveDown(5);
        doc.fontSize(10)
            .fillColor('#7f8c8d') // Gray
            .text('Thank you for using our service!', { align: 'justify' })
            .moveDown(0.5)
            .fillColor('#bdc3c7')
            .text('Designed by Parbhansh Sharma', { align: 'justify' });

        // Finalize the PDF
        doc.end();
    });
}

module.exports = { generatePDF };
