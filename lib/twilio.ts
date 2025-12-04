// Download the helper library from https://www.twilio.com/docs/node/install
// const twilio = require('twilio'); // Or, for ESM: import twilio from "twilio";
import { env } from 'process';
import twilio from 'twilio';

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

export { twilioClient };
// async function createMessage() {
//   const message = await client.messages.create({
//     body: 'Hey ND, Your OTP is 67676767',
//     from: env.TWILIO_PHONE_NUMBER,
//     to: '+917018419491',
//   });

//   console.log(message.body);
// }

// createMessage();
