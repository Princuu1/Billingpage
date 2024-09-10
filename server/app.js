const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { generatePDF } = require('./billpdf');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Handle sending bill and generating PDF
app.post('/send-bill', async (req, res) => {
    const { name, address, date, receiptNo, recipientEmail, subtotal, discount, discountAmount, gstAmount, totalAmount, items, adminPassword } = req.body;

    if (adminPassword !== process.env.ADMIN_PASS) {
        return res.json({ success: false, message: 'Invalid password' });
    }

    try {
        // Generate PDF
        const pdfBuffer = await generatePDF({
            name,
            address,
            date,
            receiptNo,
            subtotal,
            discount,
            discountAmount,
            gstAmount,
            totalAmount,
            items
        });

        // Load and modify email template
        const emailTemplatePath = path.join(__dirname, 'emailTemplate.html');
        let emailTemplate = fs.readFileSync(emailTemplatePath, 'utf8');
        emailTemplate = emailTemplate.replace('{{recipientName}}', name);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

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

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Bill sent successfully with PDF!' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.json({ success: false, message: 'Failed to send bill. Please try again.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
