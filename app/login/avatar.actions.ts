'use server';

interface userAvatar {
  avatar_id: string;
  username: string;
  consent: boolean;
}

async function avatarActions(
  prevState: { success: boolean; message: string },
  formData: userAvatar,
) {
  const { avatar_id, username, consent } = formData;
  console.log(
    `Server Action for Avatar Username: ${avatar_id} ${username} ${consent}`,
  );
  return { success: true, message: 'Form Submitted' };
}

export default avatarActions;
