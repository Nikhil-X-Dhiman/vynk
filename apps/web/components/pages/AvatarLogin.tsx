'use client';
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formOptions, useForm } from '@tanstack/react-form';
import { Field, FieldGroup } from '../ui/field';

import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import avatarList from '@/lib/data/avatars.json' assert { type: 'json' };
// import { avatarList } from '@/lib/avatar-list';
import { avatarActions } from '@/app/actions/avatar-actions';
import { useRouter } from 'next/navigation';
import { useLoginStore } from '@/store';
import { handleCloudinarySignature } from '@/app/actions/cloudinary-actions';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { Spinner } from '../ui/spinner';
import {
  avatarPageSchema,
  bioOnlySchema,
  usernameOnlySchema,
} from '@repo/validation/login.schema';

interface userAvatar {
  avatarUrl: string;
  username: string;
  consent: string | null;

  bio: string;
}

const defaultValues: userAvatar = {
  avatarUrl: '',
  username: '',
  consent: null,
  bio: '',
};

const formOpts = formOptions({
  defaultValues,
});

function AvatarLogin() {
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const countryCode = useLoginStore((state) => state.countryCode);
  const setAvatarURL = useLoginStore((state) => state.setAvatarURL);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('assets/avatar/3d_4.png');
  const setName = useLoginStore((state) => state.setName);
  const setAbout = useLoginStore((state) => state.setAbout);
  const reset = useLoginStore((state) => state.reset);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoading, startTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(avatarActions, {
    success: false,
    message: '',
  });

  useEffect(() => {
    console.log('State Changed: ', state);
    if (state.message === '' && !state.success) return;

    if (state.success) {
      router.push('/chats');
      reset();
    } else {
      toast.error(
        typeof state.message === 'string'
          ? state.message
          : 'Something Went Wrong!!!',
      );
    }
    console.log('State Changed Ended: ', state.message);
  }, [state, router, reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tmpFile = e.target.files?.[0];
    if (!tmpFile) return;

    setFile(tmpFile);
    // Show local preview immediately
    setPreview(URL.createObjectURL(tmpFile));
  };

  const handleAvatarUpload = async () => {
    if (!file)
      return {
        success: false,
        data: null,
        message: '',
        error: 'File Not Selected to upload',
      };
    setLoading(true);

    try {
      // 1. Get Permission (Signature) from Server
      const { success, response: result } = await handleCloudinarySignature();
      const { signature, timestamp, error } = result;
      if (!success) {
        toast.error(`${error}`);
        return {
          success: false,
          data: null,
          message: '',
          error: 'Avatar Signing Failed',
        };
      }
      // 2. Prepare Form Data
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
      fd.append('signature', signature!);
      fd.append('timestamp', timestamp!.toString());
      fd.append('folder', 'vynk_profilePic'); // Must match what you signed

      // 3. Direct Upload to Cloudinary
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: fd,
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);
      // const fdx = new FormData();
      // fdx.append('phoneNumber', phoneNumber);
      // fdx.append('countryCode', countryCode);
      // fdx.append('username', name);
      // fdx.append('bio', about);

      return { success: true, data: data.secure_url };
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
      return { success: false, data: null, message: '', error: error };
    } finally {
      setLoading(false);
    }
  };

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        console.log(
          'Form Validation upon username Submission',
          JSON.stringify(value)
        );
        if (!value.consent) return 'You have not given consent yet';
        const { success, error } = avatarPageSchema.safeParse(value);
        const formattedError = error?.flatten();
        if (!success)
          return `Submission Failed. Check Values Again: ${JSON.stringify(formattedError?.fieldErrors)}`;
      },
    },
    onSubmit: async ({ value }) => {
      // console.log('Consent: ', typeof value.consent);
      console.log(`onSubmit Begins`);

      setLoading(true);
      const formData = new FormData();
      formData.append('phoneNumber', phoneNumber);
      formData.append('countryCode', countryCode);
      formData.append('username', value.username);
      setName(value.username);
      formData.append('consent', value.consent === 'true' ? 'true' : 'false');
      formData.append('bio', value.bio);
      setAbout(value.bio);
      // formData requires string or Blob to be appended
      console.log('Form Upon OTP Submission', JSON.stringify(value));
      if (file) {
        const { success, data } = await handleAvatarUpload();
        if (success) {
          setAvatarURL(data);
          formData.append('avatarUrl', data);
        }
      } else {
        setAvatarURL(preview);
        formData.append('avatarUrl', preview);
      }
      formData.append('avatarID', value.avatarUrl);
      setAvatarURL(value.avatarUrl);

      setLoading(false);
      startTransition(() => {
        console.log('Form Action Transition Begins');
        formAction(formData);
      });
    },
  });
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="avatarUrl">
            {(field) => {
              return (
                <Field>
                  <div>
                    <Avatar className="relative">
                      <input
                        type="hidden"
                        name="avatarUrl"
                        value={preview}
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <AvatarImage
                        src={preview}
                        alt="main-avatar"
                      />
                      <div
                        className="w-2 h-2 font-bold border border-b-neutral-900 rounded-full absolute cursor-pointer opacity-80 hover:opacity-100 transition"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        +
                      </div>
                    </Avatar>
                  </div>
                  <p>Choose an Avatar</p>
                  <div className="flex ">
                    {avatarList.map((avatar) => {
                      const isSelected = field.state.value === avatar.id;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            setPreview(avatar.url);
                            setFile(null);
                            field.handleChange(avatar.id);
                          }}
                          className={`rounded-full p-1 transition ${
                            isSelected
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'opacity-75 hover:opacity-100'
                          }`}
                        >
                          <Avatar>
                            <AvatarImage
                              src={avatar.url}
                              alt={avatar.name}
                            />
                            <AvatarFallback>{avatar.name}</AvatarFallback>
                          </Avatar>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              );
            }}
          </form.Field>
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                const { success, error } = usernameOnlySchema.safeParse({
                  username: value,
                });
                if (!success) {
                  console.log(error.issues[0]);
                  return error.issues[0].message;
                }
                return undefined;
              },
            }}
          >
            {(field) => {
              return (
                <Field>
                  <Input
                    type="text"
                    name="username"
                    placeholder="Enter Usesrname"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    // onChange={field.handleChange()}
                  />
                  {!field.state.meta.isValid && (
                    <em role="alert">{field.state.meta.errors.join(', ')}</em>
                  )}
                </Field>
              );
            }}
          </form.Field>
          <form.Field
            name="bio"
            validators={{
              onChange: ({ value }) => {
                const { success, error } = bioOnlySchema.safeParse({
                  bio: value,
                });
                if (!success) {
                  console.log(error.issues[0]);
                  return error.issues[0].message;
                }
              },
            }}
          >
            {(field) => {
              return (
                <Field>
                  <Label htmlFor="about">User About</Label>
                  <Textarea
                    placeholder="Type your bio here."
                    id="about"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              );
            }}
          </form.Field>
          <form.Field
            name="consent"
            validators={{
              onChange: (value) => {
                if (!value) return 'Consent is Required to Continue';
              },
            }}
          >
            {(field) => {
              return (
                <div className="flex items-start gap-3">
                  <Checkbox
                    name="consent"
                    id="terms-2"
                    checked={field.state.value === 'true'}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true ? 'true' : null)
                    }
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="terms-2">Accept terms and conditions</Label>
                    <p className="text-muted-foreground text-sm">
                      By clicking this checkbox, you agree to the terms and
                      conditions.
                    </p>
                  </div>
                </div>
              );
            }}
          </form.Field>
        </FieldGroup>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isPending || isLoading || loading}
              variant={'outline'}
              size={'lg'}
              aria-label="Continue-to-chats"
            >
              {isSubmitting || isPending || isLoading || loading ? (
                <Spinner />
              ) : (
                'Save & Continue'
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </>
  );
}

export default AvatarLogin;
