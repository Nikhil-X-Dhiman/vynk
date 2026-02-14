/**
 * @fileoverview Login Background Decorations
 *
 * Renders a static, glossy background with mixed colors.
 * Replaces the animated version to improve performance on low-end devices.
 *
 * @module components/auth/LoginBackground
 */

export function LoginBackground() {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden bg-background"
      aria-hidden="true"
    >
      {/*
        Glossy Mixed Colors Background
        Using static radial gradients to create a rich, mixed color effect
        without animation.
      */}

      {/* Base gradient layer - Deep Purple/Blue mix */}
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))]
          from-purple-200/40 via-blue-100/20 to-transparent
          dark:from-purple-900/30 dark:via-blue-900/10 dark:to-transparent
        "
      />

      {/* Secondary accent layer - Pink/Rose mix */}
      <div
        className="
          absolute inset-0
          bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))]
          from-rose-200/40 via-indigo-100/20 to-transparent
          dark:from-rose-900/30 dark:via-indigo-900/10 dark:to-transparent
        "
      />

      {/* Glossy overlay for sheen */}
      <div
        className="
          absolute inset-0
          bg-gradient-to-tr from-white/10 via-transparent to-white/10
          dark:from-black/10 dark:via-transparent dark:to-black/10
          backdrop-blur-[100px]
        "
      />
    </div>
  )
}
