'use client';
import { useActionState, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formOptions, useForm } from '@tanstack/react-form';
import { Field, FieldGroup } from './ui/field';
import { usernameSchema } from '@/utils/schema/login-schema';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Button } from './ui/button';
import avatarActions from '@/app/login/avatar.actions';
import { avatarList } from '@/lib/avatar-list';

interface userAvatar {
  avatar_id: string;
  username: string;
  consent: boolean;
}

const defaultValues: userAvatar = {
  avatar_id: '',
  username: '',
  consent: false,
};

const formOpts = formOptions({
  defaultValues,
});

function AvatarLogin() {
  const [selectedAvatar, setSelectedAvatar] = useState('avatar/3d_4.png');
  const [state, formAction, isPending] = useActionState(avatarActions, {
    success: false,
    message: '',
  });
  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        console.log(
          'Form Validation upon username Submission',
          JSON.stringify(value),
        );
      },
    },
    onSubmit: ({ value }) => {
      console.log('Form Upon OTP Submission', JSON.stringify(value));
      formAction(value);
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
          <form.Field name="avatar_id">
            {(field) => {
              return (
                <Field>
                  <div>
                    <Avatar>
                      <AvatarImage src={selectedAvatar} alt="main-avatar" />
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
                            setSelectedAvatar(avatar.url);
                            field.handleChange(avatar.id);
                          }}
                          className={`rounded-full p-1 transition ${
                            isSelected
                              ? 'ring-2 ring-primary ring-offset-2'
                              : 'opacity-75 hover:opacity-100'
                          }`}
                        >
                          <Avatar>
                            <AvatarImage src={avatar.url} alt={avatar.name} />
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
                const { success, error } = usernameSchema.safeParse(value);
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
                  <Input
                    type="text"
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
          <form.Field name="consent">
            {(field) => {
              return (
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms-2"
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
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
              disabled={!canSubmit || isPending}
              variant={'outline'}
              size={'lg'}
              aria-label="send-otp"
            >
              {isSubmitting ? '...' : 'Send OTP'}
            </Button>
          )}
        </form.Subscribe>
        {/* Del it too */}
        {state && (
          <p>
            {state.success} .. {state.message}
          </p>
        )}
      </form>
    </>
  );
}

export default AvatarLogin;
