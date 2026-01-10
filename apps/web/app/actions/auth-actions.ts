'use server';

import { auth } from '@/lib/auth/auth-server';
import { loginSchema } from '@repo/validation';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

async function sendOTPAction(
  prevState: {
    success: boolean;
    message: string;
  },
  formData: FormData
) {
  try {
    const countryCode = formData.get('countryCode')?.toString();
    const number = formData.get('phoneNumber')?.toString().trim();
    const phoneNumber = `+${countryCode}${number}`;
    // Validating Phone Number
    const { success, error } =
      loginSchema.shape.phoneNumber.safeParse(phoneNumber);
    if (!success) return { success: false, message: error.issues[0].message };
    // {assing Phone Number to Send OTP
    await auth.api.sendPhoneNumberOTP({
      body: {
        phoneNumber,
      },
    });

    return { success: true, message: 'Done' };
  } catch (error) {
    console.error('Verification Error:', error);
    return { success: false, message: `Error during verification: ${error}` };
  }
}

async function verifyOTPAction(
  prevState: { success: boolean; message: string },
  formData: FormData
) {
  try {
    let phoneNumber = formData.get('phoneNumber')?.toString();
    phoneNumber = `+${phoneNumber}`;
    const code = formData.get('otp')?.toString();
    if (!phoneNumber || !code) {
      return { success: false, message: 'Missing phone or otp' };
    }
    console.log(
      `OTP Server Action -> Verify OTP: ${phoneNumber} with OTP: ${code}`
    );
    await auth.api.verifyPhoneNumber({
      body: {
        phoneNumber,
        code,
      },
    });
    return { success: true, message: 'Done' };
  } catch (error) {
    console.error('Verification Error:', error);
    return { success: false, message: 'Error during verification' };
  }
}

async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect('/login');
}
export { sendOTPAction, verifyOTPAction, signOutAction };
