// controllers/sendMailController.js
const emailService = require('../services/emailService');

exports.sendMail = async (req, res) => {
    try {
        const { template_key, from, to, cc, bcc, merge_info, reply_to, client_reference, mime_headers } = req.body;
        
        const response = await emailService.sendTemplateEmail({
            templateKey: template_key,
            from,
            to,
            cc,
            bcc,
            mergeInfo: merge_info,
            replyTo: reply_to,
            clientReference: client_reference,
            mimeHeaders: mime_headers
        });
        
        res.status(200).json({ message: 'Email sent successfully', data: response.data });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Error sending email', error: error.message });
    }
};