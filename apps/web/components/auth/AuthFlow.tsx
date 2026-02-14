'use client'

/**
 * @fileoverview Multi-Step Authentication Flow
 * @module components/auth/AuthFlow
 */

import { useLoginStore } from '@/store/login'
import { useAuthStore } from '@/store/auth'
import PhoneNumberStep from './PhoneNumberStep'
import OTPStep from './OTPStep'
import ProfileStep from './ProfileStep'
import { LoginBranding } from './LoginBranding'
import type { LoginStep } from '@/store/types'

interface StepConfig {
  component: React.ReactNode
  guard: () => boolean
  fallbackMessage: string
}

export default function AuthFlow() {
  const step = useLoginStore((s) => s.step)
  const phoneNumber = useLoginStore((s) => s.phoneNumber)
  const session = useAuthStore((s) => s.session)
  const setStep = useLoginStore((s) => s.setStep)

  const steps: Record<LoginStep, StepConfig> = {
    1: {
      component: <PhoneNumberStep />,
      guard: () => true,
      fallbackMessage: '',
    },
    2: {
      component: <OTPStep />,
      guard: () => !!phoneNumber,
      fallbackMessage: 'Phone number missing. Please start again.',
    },
    3: {
      component: <ProfileStep />,
      guard: () => !!session,
      fallbackMessage: 'Session expired. Please sign in again.',
    },
  }

  const current = steps[step]
  const isGuardSatisfied = current.guard()
  const isProfileStep = step === 3

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center">
      {/* Branding (Hidden on Profile Step) */}
      {!isProfileStep && (
        <div className="mb-6">
          <LoginBranding />
        </div>
      )}

      {/* Steps with Animation */}
      <div
        key={step}
        className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500"
      >
        {isGuardSatisfied ? (
          current.component
        ) : (
          <StepError
            message={current.fallbackMessage}
            onReset={() => setStep(1)}
          />
        )}
      </div>
    </div>
  )
}

interface StepErrorProps {
  message: string
  onReset: () => void
}

function StepError({ message, onReset }: StepErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <p className="text-sm font-medium text-destructive">{message}</p>
      <button
        type="button"
        onClick={onReset}
        className="text-sm font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        Start over
      </button>
    </div>
  )
}
