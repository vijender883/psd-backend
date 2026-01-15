// services/emailService.js
const { SendMailClient } = require("zeptomail");
require("dotenv").config();

// Initialize the client
const url = "api.zeptomail.in/";
const token = process.env.ZEPTO_MAIL_TOKEN;
const client = new SendMailClient({ url, token });

// Email templates configuration
const EMAIL_TEMPLATES = {
  WELCOME:
    "2518b.6d1e43aa616e32a8.k1.28cc8560-2bc1-11f0-93e3-cabf48e1bf81.196ae0e78b6",
  // Add other templates as needed
};

// Default sender information
const DEFAULT_SENDER = {
  address: "support@alumnx.com",
  name: "ALUMNX",
};

// Default reply-to information
const DEFAULT_REPLY_TO = [
  {
    address: "support@alumnx.com",
    name: "Support Team",
  },
];

/**
 * Send email using ZeptoMail template
 * @param {Object} options - Email options
 * @returns {Promise} - Response from ZeptoMail
 */
const sendTemplateEmail = async (options) => {
  const {
    templateKey,
    to,
    mergeInfo,
    from = DEFAULT_SENDER,
    replyTo = DEFAULT_REPLY_TO,
    cc,
    bcc,
    clientReference,
    mimeHeaders,
  } = options;

  return client.sendMailWithTemplate({
    template_key: templateKey,
    from,
    to,
    cc,
    bcc,
    merge_info: mergeInfo,
    reply_to: replyTo,
    client_reference: clientReference,
    mime_headers: mimeHeaders,
  });
};

/**
 * Send welcome email to newly registered user
 * @param {Object} user - User data {name, email, phone}
 * @returns {Promise} - Response from ZeptoMail
 */
const sendWelcomeEmail = async (user) => {
  const { name, email, phone } = user;

  return sendTemplateEmail({
    templateKey: EMAIL_TEMPLATES.WELCOME,
    to: [
      {
        email_address: {
          address: email,
          name: name,
        },
      },
    ],
    mergeInfo: {
      contact_number: phone,
      company: "ALUMNX",
      name: "Abhishek S",
      product: "eventbot course",
      "support id": "support@alumnx.com",
      brand: "ALUMNX",
      username: name,
      explore_url: "alumnx.com/labs/ai/event-bot-course",
    },
  });
};

/**
 * Generic function to dispatch emails to multiple recipients
 * @param {Object} options - Email dispatch options
 * @param {string} options.templateId - ZeptoMail template ID
 * @param {string} options.emailList - Semicolon-separated email addresses
 * @param {Object} options.mergeInfo - Optional merge data for template
 * @param {Object} options.from - Optional sender information
 * @param {Array} options.replyTo - Optional reply-to information
 * @returns {Promise} - Response from ZeptoMail
 */
const dispatchEmails = async (options) => {
  const {
    templateId,
    emailList,
    mergeInfo = {},
    from = DEFAULT_SENDER,
    replyTo = DEFAULT_REPLY_TO,
  } = options;

  // Parse and validate email addresses
  const emails = emailList
    .split(";")
    .map((email) => email.trim())
    .filter((email) => email !== "" && isValidEmail(email));

  if (emails.length === 0) {
    throw new Error("No valid email addresses found");
  }

  // Format email addresses for ZeptoMail
  const recipients = emails.map((email) => ({
    email_address: {
      address: email,
      name: email.split("@")[0], // Use part before @ as name fallback
    },
  }));

  return sendTemplateEmail({
    templateKey: templateId,
    to: recipients,
    mergeInfo,
    from,
    replyTo,
  });
};

/**
 * Simple email validation
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  sendTemplateEmail,
  sendWelcomeEmail,
  dispatchEmails,
  EMAIL_TEMPLATES,
};
