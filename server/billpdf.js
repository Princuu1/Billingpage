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
// Collect data chunks into the buffers array
doc.on('data', (chunk) => buffers.push(chunk));
doc.on('end', () => {
    // Concatenate all chunks into a single Buffer
    const pdfBuffer = Buffer.concat(buffers);
    resolve(pdfBuffer);
});
doc.on('error', (err) => {
    reject(err);
});

        // Add background image for the full page (hardcoded path)
        const backgroundImagePath = 'server/Blue White Minimalist Modern Invoice A4 Document.png'; // Hardcoded path
        if (backgroundImagePath) {
            doc.image(backgroundImagePath, 0, 0, { width: 595.28, height: 841.89 });
            // Title with GSTIN
doc.fontSize(22)
.font('server/PlayfulTime-BLBB8.ttf') // Cursive font
.fillColor('#0097b2') // Main text color
.text('XYZ Company', { align: 'center' }) // Slight offset for main text

        .moveDown(0);
        }
        // Add Company Logo (if provided)
         const companyLogoPath = 'server/image.png'; // Path to the company logo
         if (companyLogoPath) {
        doc.image(companyLogoPath, 470, 25, { width: 100, height: 50 }); // Right corner positioning
        }

        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('green')
            .text(`GSTIN: GSTIN123456789`, { align: 'right' })
            .text(`Address: abc colony,sec1,Hansi(125033)`, { align: 'left' })
            .text(`Contact: 94xxxxxxxx,89xxxxxxxx`, { align: 'left' })
            .text(`Email: xyzcompany@gmail.com`, { align: 'left' })
            .moveDown(0.5);

        // Draw a line under the title
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#3498db').lineWidth(2).stroke().moveDown(1);

        // Billing Information
        doc.fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('black')
    .text(`Name: ${billData.name}`, { continued: true })
    .text(`   Contact: 92xxxxxxxx`, { align: 'right' })        
    .text(`Date: ${billData.date}`, { continued: true })
    .text(`   Email: ${billData.recipientEmail}`, { align: 'right' })             
    .text(`Invoice No: XYZ/${billData.receiptNo}/25-26`)
    .moveDown(1);

        // Bill To and Shipping To Addresses
        const addressTop = doc.y;
        const addressColWidths = [250, 250];

        doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('black')
        .text(`Bill To: ${billData.address}`, 50, addressTop, { width: 200 })  // Set a width limit
        .text(`Shipping To: ${billData.address}`, 300, addressTop, { width: 300 }); // Set width limit for shipping
     

        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('black')
            .text(billData.billTo, 50, addressTop + 20, { width: addressColWidths[0] })
            .text(billData.shippingTo, 300, addressTop + 20, { width: addressColWidths[1] })
            .moveDown(2);

        // Table Headers
        const tableTop = doc.y;
        const colWidths = [30, 140, 70, 70, 100]; // Added width for serial number

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#2980b9')
            .text('S.No', 50, tableTop)
            .text('Description', 95, tableTop)
            .text('Quantity', 230, tableTop, { align: 'justify' })
            .text('Price/Unit', 310, tableTop, { align: 'justify' })
            .text('Total', 415, tableTop, { align: 'justify' });

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
        doc.text('Summary', 120, summaryTop,)
            .text('', 250, summaryTop, { align: 'justify' })
            .text('Amount', 400, summaryTop, { align: 'justify' });

        // Draw header underline for summary table
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).strokeColor('#2980b9').lineWidth(1).stroke();

        const summaryItems = [
            { label: 'Subtotal', value: `${billData.subtotal}Rs.` },
            { label: 'Discount@', value: `${billData.discountAmount}Rs.`, percent: `${billData.discount}%` },
            { label: 'GST Amount@', value: `${billData.gstAmount}Rs.`, percent: `` },
            { label: 'Grand Total', value: `${billData.totalAmount}Rs.`, color: '#4dff4d' } // Green color
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

        
        // Bank Account Details (Left Side)
        const offset = 20; // Adjust to move down
        const bankDetailsTop = doc.y + offset;
        doc.rect(50, bankDetailsTop, 250, 80).stroke(); // Box for bank details
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('black')
            .text('Bank Account Details:', 55, bankDetailsTop + 10)
            .font('Helvetica')
            .text(`Bank Name: Example Bank`, 55, bankDetailsTop + 30)
            .text(`Account No: 1234567890 `, 55, bankDetailsTop + 50)
            .text(`IFSC Code: ABCD0123456 `, 55, bankDetailsTop + 70);


        // Footer with Color and Font Changes (Right Side)
        const footerTop = summaryRowY + 20;
        doc.fontSize(12)
            .fillColor('#0097b2') // Gray
            .text('Thank you for using our service!', 300, footerTop, { align: 'right' })
            .moveDown(1)
            .fontSize(60)
            .fillColor('black')//black
            .font('server/Bastliga One.ttf')
            .text('Parbhansh',300, footerTop + 15, { align: 'right' })
            .fontSize(10)
            .fillColor('#bdc3c7')
            .font('Helvetica')
            .text('signed by Parbhansh Sharma', 300, footerTop + 70, { align: 'right' });
        // Finalize the PDF
        doc.end();
    });
}

module.exports = { generatePDF };