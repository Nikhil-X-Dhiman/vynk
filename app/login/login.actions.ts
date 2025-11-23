'use server';

// async function loginActions(formData) {
// when using useFormAction hook
async function loginActions(prevState, formData) {
  console.log('Server Actions: ', formData);
  console.log('country phone', formData.get('phone'));
  console.log(formData.entries());

  const { email, countryCode, phone } = Object.fromEntries(formData.entries());
  console.log(email, countryCode, phone);
  return { success: true, message: 'Form Submitted' };
}

export default loginActions;
