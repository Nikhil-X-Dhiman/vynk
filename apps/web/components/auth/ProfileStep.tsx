'use client'

/**
 * @fileoverview Profile Setup Step
 * @module components/auth/ProfileStep
 */

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import { formOptions, useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { ArrowLeft, Camera } from 'lucide-react'

import {
  profileSchema,
  usernameOnlySchema,
  bioOnlySchema,
} from '@repo/validation'
import { useLoginStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { authClient } from '@/lib/auth/auth-client'
import { avatarActions } from '@/app/actions/avatar-actions'
import { handleCloudinarySignature } from '@/app/actions/cloudinary-actions'
import avatarList from '@/lib/data/avatars.json' assert { type: 'json' }
import { cn } from '@/lib/utils/tailwind-helpers'

import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const GRADIENT_BUTTON =
  'w-full bg-linear-to-r from-indigo-500/90 via-sky-500/90 to-teal-500/90 hover:from-indigo-600 hover:via-sky-600 hover:to-teal-600 text-white border-0 transition-all duration-500 shadow-md hover:shadow-lg active:scale-[0.98]'

const DEFAULT_AVATAR_URL = '/assets/avatar/3d_4.png'
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`

const formOpts = formOptions({
  defaultValues: {
    avatarUrl: '',
    username: '',
    bio: '',
    consent: null as string | null,
  },
})

async function uploadToCloudinary(
  file: File,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  // 1. Signature
  const signatureResult = await handleCloudinarySignature()
  if (!signatureResult.success) {
    return { success: false, error: signatureResult.error }
  }
  const { signature, timestamp } = signatureResult.data

  // 2. Upload
  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!)
  fd.append('signature', signature)
  fd.append('timestamp', timestamp.toString())
  fd.append('folder', 'vynk_profilePic')

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: fd,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error?.message || 'Cloudinary upload failed')
  }

  return { success: true, url: data.secure_url as string }
}

export default function ProfileStep() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(DEFAULT_AVATAR_URL)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const phoneNumber = useLoginStore((s) => s.phoneNumber)
  const countryCode = useLoginStore((s) => s.countryCode)
  const setAvatarURL = useLoginStore((s) => s.setAvatarURL)
  const setName = useLoginStore((s) => s.setName)
  const setAbout = useLoginStore((s) => s.setAbout)
  const resetAuth = useAuthStore((s) => s.reset)
  const resetLogin = useLoginStore((s) => s.reset)

  const [actionState, formAction, isActionPending] = useActionState(
    avatarActions,
    { success: false, message: '' },
  )

  useEffect(() => {
    if (!actionState.message) return
    if (actionState.success) {
      toast.success('Profile setup complete!')
      router.push('/chats')
    } else {
      const errorMsg =
        typeof actionState.message === 'string'
          ? actionState.message
          : 'Setup failed.'
      toast.error(errorMsg)
    }
  }, [actionState, router])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  async function handleBack() {
    try {
      await authClient.signOut()
      resetAuth()
      resetLogin()
    } catch {
      resetLogin()
    }
  }

  const form = useForm({
    ...formOpts,
    validators: {
      onSubmit: ({ value }) => {
        if (!value.consent) return 'You must accept the terms to continue'
        const result = profileSchema.safeParse({
          username: value.username,
          bio: value.bio,
          avatarUrl: file ? 'placeholder' : preview,
        })
        if (!result.success) {
          return result.error.issues
            .map((i: { message: string }) => i.message)
            .join(', ')
        }
        return undefined
      },
    },
    onSubmit: async ({ value }) => {
      if (!navigator.onLine) {
        toast.error('You are offline')
        return
      }
      setIsUploading(true)
      try {
        let avatarUrl = preview
        if (file) {
          const uploadResult = await uploadToCloudinary(file)
          if (!uploadResult.success) {
            toast.error('Image upload failed.')
            return
          }
          avatarUrl = uploadResult.url
        }

        setAvatarURL(avatarUrl)
        setName(value.username)
        setAbout(value.bio)

        const formData = new FormData()
        formData.append('phoneNumber', phoneNumber)
        formData.append('countryCode', countryCode)
        formData.append('username', value.username)
        formData.append('bio', value.bio)
        formData.append('avatarUrl', avatarUrl)
        formData.append('consent', value.consent === 'true' ? 'true' : 'false')

        startTransition(() => {
          formAction(formData)
        })
      } catch (error) {
        console.error(error)
        toast.error('Something went wrong.')
      } finally {
        setIsUploading(false)
      }
    },
  })

  const isBusy = isUploading || isPending || isActionPending

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Setup Profile</CardTitle>
        <CardDescription className="text-center">
          Tell us a bit about yourself
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          <FieldGroup>
            {/* Avatar */}
            <form.Field name="avatarUrl">
              {(field) => (
                <div className="flex flex-col items-center gap-4">
                  <div className="group relative">
                    <Avatar className="size-24 cursor-pointer ring-2 ring-primary ring-offset-2">
                      <AvatarImage
                        src={preview}
                        alt="Profile"
                        className="object-cover"
                      />
                      <AvatarFallback>UP</AvatarFallback>
                    </Avatar>
                    <div
                      className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="size-6" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  <div className="scrollbar-hide flex max-w-full gap-2 overflow-x-auto px-2 pb-2">
                    {avatarList.map((avatar) => {
                      const isSelected =
                        field.state.value === avatar.id && !file
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => {
                            setPreview(avatar.url)
                            setFile(null)
                            field.handleChange(avatar.id)
                          }}
                          className={cn(
                            'relative size-10 shrink-0 overflow-hidden rounded-full transition-all',
                            isSelected
                              ? 'scale-110 ring-2 ring-primary'
                              : 'opacity-70 hover:opacity-100',
                          )}
                        >
                          <Avatar className="size-full">
                            <AvatarImage
                              src={avatar.url}
                              alt={avatar.name}
                            />
                          </Avatar>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose or upload a photo
                  </p>
                </div>
              )}
            </form.Field>

            {/* Username */}
            <form.Field
              name="username"
              validators={{
                onChange: ({ value }) => {
                  const result = usernameOnlySchema.safeParse({
                    username: value,
                  })
                  return result.success
                    ? undefined
                    : result.error.issues[0]?.message
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

            {/* Bio */}
            <form.Field
              name="bio"
              validators={{
                onChange: ({ value }) => {
                  const result = bioOnlySchema.safeParse({ bio: value })
                  return result.success
                    ? undefined
                    : result.error.issues[0]?.message
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
                  {!field.state.meta.isValid && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Consent */}
            <form.Field
              name="consent"
              validators={{
                onChange: ({ value }) =>
                  !value ? 'Consent is required' : undefined,
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
                      className="text-sm font-medium leading-none"
                    >
                      Accept terms and conditions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      I agree to the Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </div>
              )}
            </form.Field>
          </FieldGroup>

          {/* Submit */}
          <form.Subscribe
            selector={(state) =>
              [state.canSubmit, state.isSubmitting, state.errors] as const
            }
          >
            {([canSubmit, isSubmitting, errors]) => (
              <>
                {Array.isArray(errors) && errors.length > 0 && (
                  <p className="text-center text-xs text-destructive">
                    {errors.join(', ')}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSubmit || isBusy || isSubmitting}
                  className={GRADIENT_BUTTON}
                >
                  {isSubmitting || isBusy ? <Spinner /> : 'Complete Setup'}
                </Button>
              </>
            )}
          </form.Subscribe>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Button
          variant="link"
          onClick={handleBack}
          className="gap-2 text-muted-foreground hover:text-destructive"
        >
          <ArrowLeft className="size-4" />
          Cancel and go back
        </Button>
      </CardFooter>
    </Card>
  )
}
