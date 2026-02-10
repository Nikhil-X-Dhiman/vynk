/**
 * @fileoverview Login Background Decorations
 *
 * Renders the animated mesh gradient blobs and frosted-glass overlay
 * that sit behind the login card. All elements are `aria-hidden` and
 * purely decorative.
 *
 * Uses `will-change-opacity` to hint at GPU compositing for the
 * pulsing animation, and `backdrop-blur-xl` for the mica/acrylic overlay.
 *
 * @module components/auth/LoginBackground
 */

// ==========================================
// Background Decorations Component
// ==========================================

/**
 * Animated mesh gradient background with a frosted-glass overlay.
 *
 * Three gradient blobs pulse with staggered delays to create an
 * organic, breathing effect. The mica overlay on top blends
 * them into the page's background colour.
 */
export function LoginBackground() {
  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Mesh Gradient — Top-Left Purple/Indigo */}
      <div
        className="
          absolute -top-[20%] -left-[10%] h-[70%] w-[70%]
          rounded-full bg-purple-500/25 blur-[110px]
          animate-pulse will-change-[opacity]
          dark:bg-purple-600/15
        "
      />

      {/* Mesh Gradient — Bottom-Right Blue/Cyan */}
      <div
        className="
          absolute -bottom-[20%] -right-[10%] h-[80%] w-[80%]
          rounded-full bg-blue-500/25 blur-[110px]
          animate-pulse delay-1000 will-change-[opacity]
          dark:bg-blue-600/15
        "
      />

      {/* Mesh Gradient — Centre-Left Deep Indigo */}
      <div
        className="
          absolute top-[20%] -left-[20%] h-[60%] w-[60%]
          rounded-full bg-indigo-500/15 blur-[110px]
          animate-pulse delay-500 will-change-[opacity]
          dark:bg-indigo-600/10
        "
      />

      {/* Mica / Acrylic Overlay */}
      <div
        className="
          absolute inset-0 size-full backdrop-blur-xl
          bg-linear-to-b from-indigo-50/30 via-transparent to-white/85
          dark:from-slate-950/30 dark:via-transparent dark:to-black/85
        "
      />
    </div>
  );
}
