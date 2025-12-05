'use server';

import { auth } from '@/lib/auth';

async function sendOTPAction(
  prevState: {
    success: boolean;
    message: string;
  },
  formData: FormData,
) {
  try {
    const countryCode = formData.get('countryCode')?.toString();
    const number = formData.get('phone')?.toString().replace(/\D/g, '');
    const phoneNumber = `${countryCode}${number}`;
    console.log(`OTP Server Action -> Send OTP: ${phoneNumber}`);

    const data = await auth.api.sendPhoneNumberOTP({
      body: {
        phoneNumber,
      },
    });
    console.log(data.message);

    return { success: true, message: 'Done' };
  } catch {
    return { success: false, message: 'Error' };
  }
}

async function verifyOTPAction(
  prevState: { success: boolean; message: string },
  formData: FormData,
) {
  try {
    const phoneNumber = formData.get('phone')?.toString();
    const code = formData.get('otp')?.toString();
    if (!phoneNumber || !code) {
      return { success: false, message: 'Missing phone or otp' };
    }
    console.log(
      `OTP Server Action -> Verify OTP: ${phoneNumber} with OTP: ${code}`,
    );
    const data = await auth.api.verifyPhoneNumber({
      body: {
        phoneNumber,
        code,
      },
    });
    return { success: true, message: 'Done' };
  } catch {
    return { success: false, message: 'Error' };
  }
  // const { phone, otp } = Object.fromEntries(formData.entries());
}

export { sendOTPAction, verifyOTPAction };
