'use server';

async function otpActions(
  prevState: { success: boolean; message: string },
  formData: { otp: string },
) {
  console.log('Server Actions: ', formData);
  console.log('Server Actions OTP: ', formData.otp);

  return { success: true, message: 'Form Submitted' };
}

export default otpActions;
