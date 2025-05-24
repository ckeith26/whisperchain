import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, code) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM,
      templateId: process.env.SENDGRID_ONE_TIME_CODE_TEMPLATE_ID,
      dynamicTemplateData: {
        twilio_code: code,
      },
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

export default sendVerificationEmail;
