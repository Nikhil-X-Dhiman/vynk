'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formOptions, useForm } from '@tanstack/react-form';
import { FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import avatarList from '@/lib/data/avatars.json' assert { type: 'json' };
import { avatarActions } from '@/app/actions/avatar-actions';
import { useRouter } from 'next/navigation';
import { useLoginStore } from '@/store';
import { handleCloudinarySignature } from '@/app/actions/cloudinary-actions';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import {
  avatarPageSchema,
  bioOnlySchema,
  usernameOnlySchema,
} from '@repo/validation/login.schema';
import { authClient } from '@/lib/auth/auth-client';
import { useAuthStore } from '@/store/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Camera } from 'lucide-react';
import { cn } from '@/lib/utils/tailwind-helpers';

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

function ProfileStep() {
  const phoneNumber = useLoginStore((state) => state.phoneNumber);
  const countryCode = useLoginStore((state) => state.countryCode);
  const setAvatarURL = useLoginStore((state) => state.setAvatarURL);
  const setName = useLoginStore((state) => state.setName);
  const setAbout = useLoginStore((state) => state.setAbout);
  const resetAuth = useAuthStore((state) => state.reset);
  const resetLogin = useLoginStore((state) => state.reset);

  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoading, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('/assets/avatar/3d_4.png');

  const [state, formAction, isPending] = useActionState(avatarActions, {
    success: false,
    message: '',
  });

  useEffect(() => {
    // Initial Load Disable Toast
    if (state.message === '' && !state.success) return;

    if (state.success) {
      toast.success('Profile setup complete!');
      router.push('/chats');
    } else {
      toast.error(
        typeof state.message === 'string'
          ? state.message
          : 'Something Went Wrong!!!',
      );
    }
  }, [state, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tmpFile = e.target.files?.[0];
    if (!tmpFile) return;

    setFile(tmpFile);
    setPreview(URL.createObjectURL(tmpFile));
  };

  const handleBack = async () => {
    try {
      await authClient.signOut();
      resetAuth();
      resetLogin();
    } catch (error) {
      console.error('Sign out failed', error);
      toast.error('Sign out failed');
      resetLogin();
    }
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

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
      fd.append('signature', signature!);
      fd.append('timestamp', timestamp!.toString());
      fd.append('folder', 'vynk_profilePic');

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

      return { success: true, data: data.secure_url };
    } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Upload failed');
        return { success: false, data: null, message: '', error: error };
    } finally {
      setLoading(false);
    }
  };
  // TODO: When avatar upload failed user should see retry button or icon to again attempt to upload

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        if (!value.consent) return 'You have not given consent yet';
        const { success, error } = avatarPageSchema.safeParse(value);
        if (!success) {
          return error.issues.map((i) => i.message).join(', ');
        }
      },
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      const formData = new FormData();
      formData.append('phoneNumber', phoneNumber);
      formData.append('countryCode', countryCode);
      formData.append('username', value.username);
      setName(value.username);
      formData.append('consent', value.consent === 'true' ? 'true' : 'false');
      formData.append('bio', value.bio);
      setAbout(value.bio);

      if (file) {
        const uploadResult = await handleAvatarUpload();
        if (uploadResult.success) {
          setAvatarURL(uploadResult.data);
          formData.append('avatarUrl', uploadResult.data);
        } else {
          // If the user explicitly tried to upload a file and it failed, stop here.
          setLoading(false);
          toast.error(
            'Profile image upload failed. Please try again or select a default avatar.',
          );
          return;
        }
      } else {
        setAvatarURL(preview);
        formData.append('avatarUrl', preview);
      }
      formData.append('avatarID', value.avatarUrl); // Keeping original logic, though strictly duplicate if updated

      setLoading(false);
      startTransition(() => {
        formAction(formData);
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Setup Profile</CardTitle>
        <CardDescription className="text-center">
          Tell us a bit about yourself
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <FieldGroup>
            <form.Field name="avatarUrl">
              {(field) => (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 cursor-pointer ring-2 ring-offset-2 ring-primary">
                      <AvatarImage
                        src={preview}
                        alt="Profile preview"
                        className="object-cover"
                      />
                      <AvatarFallback>UP</AvatarFallback>
                    </Avatar>
                    <div
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-6 w-6" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  <div className="flex gap-2 pb-2 overflow-x-auto max-w-full px-2 scrollbar-hide">
                    {avatarList.map((avatar) => {
                      const isSelected =
                        field.state.value === avatar.id && !file;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            setPreview(avatar.url);
                            setFile(null);
                            field.handleChange(avatar.id);
                          }}
                          className={cn(
                            'relative h-10 w-10 shrink-0 rounded-full overflow-hidden transition-all',
                            isSelected
                              ? 'ring-2 ring-primary scale-110'
                              : 'opacity-70 hover:opacity-100',
                          )}
                        >
                          <Avatar className="h-full w-full">
                            <AvatarImage
                              src={avatar.url}
                              alt={avatar.name}
                            />
                          </Avatar>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose an avatar or upload your own
                  </p>
                </div>
              )}
            </form.Field>

            <form.Field
              name="username"
              validators={{
                onChange: ({ value }) => {
                  const { success, error } = usernameOnlySchema.safeParse({
                    username: value,
                  });
                  if (!success) return error.issues[0].message;
                  return undefined;
                },
              }}
            >
              {(field) => (
                <div className="space-y-1">
                  <Input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {!field.state.meta.isValid && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="bio"
              validators={{
                onChange: ({ value }) => {
                  const { success, error } = bioOnlySchema.safeParse({
                    bio: value,
                  });
                  if (!success) return error.issues[0].message;
                },
              }}
            >
              {(field) => (
                <div className="space-y-1">
                  <Label
                    htmlFor="bio"
                    className="sr-only"
                  >
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="resize-none"
                  />
                </div>
              )}
            </form.Field>

            <form.Field
              name="consent"
              validators={{
                onChange: (value) => {
                  if (!value) return 'Consent is Required to Continue';
                },
              }}
            >
              {(field) => (
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="consent"
                    checked={field.state.value === 'true'}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true ? 'true' : null)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="consent"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Accept terms and conditions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      By clicking this checkbox, you agree to our terms of
                      service and privacy policy.
                    </p>
                  </div>
                </div>
              )}
            </form.Field>
          </FieldGroup>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isPending || isLoading || loading}
                className="w-full bg-linear-to-r from-indigo-500/90 via-sky-500/90 to-teal-500/90 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white border-0 transition-all duration-500 shadow-md hover:shadow-lg active:scale-[0.98]"
                size={'lg'}
              >
                {isSubmitting || isPending || isLoading || loading ? (
                  <Spinner />
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <Button
          variant="link"
          onClick={handleBack}
          className="text-muted-foreground hover:text-destructive gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel and go back
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProfileStep;
