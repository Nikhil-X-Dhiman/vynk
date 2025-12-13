import { env } from 'process';
import twilio from 'twilio';

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

export { twilioClient };
