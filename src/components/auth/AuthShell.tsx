import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Bot, CalendarDays, FolderOpen, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'

const HIGHLIGHTS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Bot,
    title: 'An assistant that explains clearly',
    description:
      'Ask in plain language — by text, voice or photo — and get a clear, source-linked explanation, never a diagnosis.',
  },
  {
    icon: FolderOpen,
    title: 'Every record in one place',
    description:
      'Lab reports, prescriptions, discharge summaries and imaging held together in a single, private library.',
  },
  {
    icon: CalendarDays,
    title: 'Appointments and medicines',
    description:
      'Keep visits, doses and refills on a clear timeline with reminders and concise summaries.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    description:
      'Your health data stays on your device. Sign-in is secured with Firebase Authentication, and access is role-bound.',
  },
]

const HOW_IT_WORKS = [
  'Create a secure account and choose your role — patient or clinician. Each account is locked to a single role.',
  'Bring your records, prescriptions, appointments and goals together in one organised, private space.',
  'Ask the built-in assistant in everyday language for clear, carefully sourced explanations.',
]

/**
 * Two-column authentication shell used by the sign-in and sign-up screens.
 *
 * The brand panel carries the product story on large screens; on phones it
 * collapses to a compact hero so the form keeps full width and stays easy to
 * use. The whole surface is a vivid, animated aurora so the first impression is
 * distinctive while the form itself remains calm and readable.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#04140a] text-ink">
      {/* Decorative vitals background — fixed so it stays calm while scrolling */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(125%_115%_at_12%_0%,#059669_0%,transparent_55%),radial-gradient(120%_120%_at_88%_100%,#22c55e_0%,transparent_52%),linear-gradient(160deg,#04140a_0%,#06301c_48%,#04140a_100%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(85%_65%_at_50%_18%,#000,transparent)]" />
        {/* Mobile scrim so the brand hero stays legible over the bright greens */}
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/55 via-black/20 to-transparent lg:hidden" />
        <div className="animate-aurora absolute -left-28 -top-24 size-[26rem] rounded-full bg-emerald-500/45 blur-[110px]" />
        <div className="animate-aurora absolute -right-24 top-1/4 size-[24rem] rounded-full bg-green-400/40 blur-[120px] [animation-delay:-6s]" />
        <div className="animate-aurora absolute -bottom-32 left-1/4 size-[28rem] rounded-full bg-lime-400/30 blur-[130px] [animation-delay:-12s]" />
        <div className="animate-aurora absolute -bottom-28 right-1/4 size-[20rem] rounded-full bg-teal-400/30 blur-[120px] [animation-delay:-3s]" />
        {/* A travelling heartbeat trace — a health-forward, unique touch */}
        <svg
          className="animate-ecg absolute inset-x-0 top-[40%] h-28 w-full opacity-[0.24]"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="ecg-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a3e635" stopOpacity="0" />
              <stop offset="45%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 60 H380 l18 -36 l22 72 l20 -56 l18 36 H720 l18 -32 l20 64 l18 -50 l16 32 H1440"
            stroke="url(#ecg-line)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="160 1280"
          />
        </svg>
      </div>

      {/* Public language picker — available before signing in, on every screen. */}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher tone="dark" />
      </div>

      <div className="relative mx-auto grid min-h-dvh w-full max-w-7xl grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
        {/* Brand panel — desktop only, so phones get the full width for the form */}
        <aside className="relative hidden flex-col justify-between gap-10 p-10 lg:flex xl:p-14">
          <Link to="/login" className="flex items-center gap-3 text-white">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Activity aria-hidden="true" className="size-5" />
            </span>
            <span className="text-lg font-bold">Health Copilot</span>
          </Link>

          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Calm, clear, private health
            </span>
            <h2 className="mt-5 text-4xl font-bold leading-[1.1] text-white xl:text-[2.75rem]">
              Your health, organised.
              <br />
              Your questions, answered.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/80">
              Health Copilot brings your medical records, medicines, appointments and wellness goals
              into one calm place — with an assistant that explains everything in simple, everyday
              language.
            </p>

            <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                How it works
              </p>
              <ol className="mt-4 space-y-3">
                {HOW_IT_WORKS.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm leading-relaxed text-white/90">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/20 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/12 text-white ring-1 ring-white/15">
                    <item.icon aria-hidden="true" className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{item.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-white/75">
                      {item.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="max-w-md text-xs text-white/60">
            All health data on this site is fictional sample data and is not real medical information.
          </p>
        </aside>

        {/* Form panel — full-width rectangle on phones, centred card on larger screens */}
        <main className="flex min-h-dvh flex-col items-stretch justify-center sm:items-center sm:px-6 sm:py-10 lg:px-10 xl:px-16">
          <div className="flex w-full flex-1 animate-rise flex-col sm:max-w-md sm:flex-none lg:max-w-lg">
            {/* Compact brand hero — phones and tablets */}
            <div className="px-5 pb-6 pt-10 text-center sm:pb-0 sm:pt-0 lg:hidden">
              <Link to="/login" className="inline-flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-lime-400 text-white shadow-raised ring-1 ring-white/30">
                  <Activity aria-hidden="true" className="size-5" />
                </span>
                <span className="text-lg font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
                  Health Copilot
                </span>
              </Link>
              <p className="mx-auto mt-3 max-w-xs text-sm text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
                Your health, organised. Your questions, answered.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.7rem] font-semibold text-white backdrop-blur">
                <Sparkles aria-hidden="true" className="size-3" />
                Calm, clear, private health
              </span>
            </div>

            <div className="flex flex-1 flex-col rounded-none border-0 bg-surface p-6 ring-1 ring-black/5 backdrop-blur-xl dark:ring-white/10 sm:flex-none sm:rounded-3xl sm:border sm:border-white/15 sm:bg-surface/95 sm:p-8 sm:shadow-pop sm:ring-0">
              <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
              <p className="mt-1.5 text-sm text-muted">{subtitle}</p>

              <div className="mt-6">{children}</div>

              {footer ? (
                <div className="mt-6 border-t border-line pt-5 text-sm text-muted">{footer}</div>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
