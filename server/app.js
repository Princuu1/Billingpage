const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { generatePDF } = require('./billpdf');
const dotenv = require('dotenv');
const cors = require('cors'); // Add CORS middleware

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS
app.use(express.static(path.join(__dirname, '../public')));

// Handle sending bill and generating PDF
app.post('/send-bill', async (req, res) => {
    const { name, address, date, receiptNo, recipientEmail, subtotal, discount, discountAmount, gstAmount, totalAmount, items, adminPassword } = req.body;

    // Validate admin password
    if (adminPassword !== process.env.ADMIN_PASS) {
        return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Validate required fields
    if (!name || !recipientEmail || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        // Generate PDF
        const pdfBuffer = await generatePDF({
            name,
            address,
            date,
            receiptNo,
            recipientEmail,
            subtotal,
            discount,
            discountAmount,
            gstAmount,
            totalAmount,
            items
        });

        // Load and modify email template
        const emailTemplatePath = path.join(__dirname, 'emailTemplate.html');
        if (!fs.existsSync(emailTemplatePath)) {
            throw new Error('Email template not found');
        }
        let emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');
        emailTemplate = emailTemplate.replace('{{recipientName}}', name);

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Set up email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: 'Your Bill',
            html: emailTemplate,
            attachments: [
                {
                    filename: 'bill.pdf',
                    content: pdfBuffer
                }
            ]
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Bill sent successfully with PDF!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, message: 'Failed to send bill. Please try again.' });
    }
});

// Route to handle PDF generation
app.post('/generate-pdf', async (req, res) => {
    try {
        const billData = req.body;

        // Validate required fields
        if (!billData || !billData.name || !billData.items || billData.items.length === 0) {
            return res.status(400).json({ error: 'Missing required fields in billData' });
        }

        // Generate the PDF
        const pdfBuffer = await generatePDF(billData);

        // Set headers to force download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; InvoiceNO:XYZ/${billData.receiptNo}/25-26.pdf`);

        // Send the PDF as a response
        res.send(pdfBuffer);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});