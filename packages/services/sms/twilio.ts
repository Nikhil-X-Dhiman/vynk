import twilio from 'twilio';

// =============================================================================
// Types
// =============================================================================

type SendSmsParams = {
  to: string;
  body: string;
};

type SendSmsResult =
  | { success: true; data: { messageId: string } }
  | { success: false; error: string };

// =============================================================================
// Client Setup
// =============================================================================

function getClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
  }

  return twilio(accountSid, authToken);
}

function getFromNumber(): string {
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    throw new Error('Missing TWILIO_PHONE_NUMBER');
  }
  return fromNumber;
}

// =============================================================================
// SMS Functions
// =============================================================================

/**
 * Sends an SMS message via Twilio.
 */
async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { to, body } = params;

  try {
    const message = await getClient().messages.create({
      body,
      from: getFromNumber(),
      to,
    });

    return { success: true, data: { messageId: message.sid } };
  } catch (error) {
    console.error('Twilio SMS error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to send SMS';

    return { success: false, error: errorMessage };
  }
}

/**
 * Sends an OTP verification code via SMS.
 */
async function sendOtp(
  to: string,
  otp: string,
  appName = 'Vynk',
): Promise<SendSmsResult> {
  const body = `Your ${appName} verification code is: ${otp}. Do not share this code.`;
  return sendSms({ to, body });
}

// =============================================================================
// Exports
// =============================================================================

export { sendSms, sendOtp };
export type { SendSmsParams, SendSmsResult };
