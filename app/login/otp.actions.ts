'use server';

async function otpActions(
  prevState: { success: boolean; message: string },
  formData: FormData,
) {
  console.log('Server action started');
  // console.log('Server Actions: ', formData);
  console.log('Server Actions OTP: ', formData.get('otp'));

  return { success: true, message: 'Form Submitted' };
}

export default otpActions;
