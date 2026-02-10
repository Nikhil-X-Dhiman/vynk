/**
 * @fileoverview Multi-Step Authentication Flow
 *
 * Orchestrates the 3-step login/registration process:
 *
 * | Step | Component        | Guard                        |
 * |------|------------------|------------------------------|
 * | 1    | PhoneNumberStep  | _(none — always accessible)_ |
 * | 2    | OTPStep          | `phoneNumber` must be set    |
 * | 3    | ProfileStep      | `session` must exist         |
 *
 * The `key={step}` on the animation wrapper forces React to unmount
 * the previous step and mount the new one, which triggers the entrance
 * animation on every transition.
 *
 * If a step's guard fails (e.g. the user lands on step 2 but the
 * phone number was lost from the store), an inline error with a
 * recovery button is shown instead of silently rendering nothing.
 *
 * @module components/auth/AuthFlow
 */

'use client';

import { useLoginStore } from '@/store/login';
import { useAuthStore } from '@/store/auth';
import PhoneNumberStep from './PhoneNumberStep';
import OTPStep from './OTPStep';
import ProfileStep from './ProfileStep';
import { LoginBranding } from './LoginBranding'
import type { LoginStep } from '@/store/types';

// ==========================================
// Types
// ==========================================

/**
 * Configuration for a single auth step.
 *
 * `guard` is evaluated at render time — if it returns `false`, the
 * `fallbackMessage` is shown with a "Go back" button.
 */
interface StepConfig {
  /** React element to render when the guard passes. */
  component: React.ReactNode;
  /** Returns `true` if the step is ready to render. */
  guard: () => boolean;
  /** Message shown when the guard fails. */
  fallbackMessage: string;
}

// ==========================================
// Component
// ==========================================

/**
 * Multi-step auth flow controller.
 *
 * Reads `step` from the login store and renders the corresponding
 * step component with an entrance animation. Guards prevent rendering
 * a step when its prerequisite state is missing.
 */
export default function AuthFlow() {
  const step = useLoginStore((s) => s.step);
  const phoneNumber = useLoginStore((s) => s.phoneNumber);
  const session = useAuthStore((s) => s.session);
  const setStep = useLoginStore((s) => s.setStep);

  /**
   * Step registry — maps each `LoginStep` to its component, guard, and
   * fallback. Adding a new step is a single object addition here.
   */
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
  };

  const current = steps[step];
  const isGuardSatisfied = current.guard();

  const isProfileStep = step === 3

  return (
    <div className="mx-auto flex w-full max-w-md flex-col justify-center">
      {/* Hide branding on ProfileStep — the form fills the screen */}
      {!isProfileStep && (
        <div className="mb-6">
          <LoginBranding />
        </div>
      )}

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

// ==========================================
// Error Fallback
// ==========================================

/**
 * Props for the inline step error component.
 */
interface StepErrorProps {
  /** User-facing error message. */
  message: string;
  /** Callback to recover (typically resets to step 1). */
  onReset: () => void;
}

/**
 * Inline error state shown when a step's guard is not satisfied.
 *
 * Provides a clear message and a single-action recovery button
 * so the user is never stuck on a blank screen.
 */
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
  );
}
