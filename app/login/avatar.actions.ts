'use server';

interface userAvatar {
  avatar_id: string;
  username: string;
  consent: boolean;
}

async function avatarActions(
  prevState: { success: boolean; message: string },
  formData: FormData,
) {
  const { avatarID, username, consent } = Object.fromEntries(
    formData.entries(),
  );

  console.log(
    `Server Action for Avatar Username: ${avatarID} ${username} ${consent}`,
  );
  return { success: true, message: 'Form Submitted' };
}

// export default avatarActions;
