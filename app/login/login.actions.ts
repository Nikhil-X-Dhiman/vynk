'use server';

interface Login {
  email: string;
  countryCode: string;
  phone: string;
}
// async function loginActions(formData) {
// when using useFormAction hook
async function loginActions(
  prevState: { success: boolean; message: string },
  formData: Login,
) {
  console.log('Server Actions: ', JSON.stringify(formData));
  // console.log('Server Actions: ', formData.phone);
  // console.log('country phone', formData.get('phone'));
  // console.log(formData.entries());

  // const { email, countryCode, phone } = Object.fromEntries(formData.entries());
  const { email, countryCode, phone } = formData;
  console.log(email, countryCode, phone);
  return { success: true, message: 'Form Submitted' };
}

export default loginActions;
