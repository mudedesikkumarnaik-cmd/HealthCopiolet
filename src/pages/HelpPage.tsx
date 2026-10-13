import {
  BookOpen,
  LifeBuoy,
  Mail,
  MessageCircleQuestion,
  MessageSquarePlus,
  Rocket,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { PageHeading } from '@/components/common/PageHeading'
import { PageContainer } from '@/components/layout/PageContainer'
import { FeedbackForm } from '@/components/feedback/FeedbackForm'
import { FeedbackList } from '@/components/feedback/FeedbackList'
import { useAppData } from '@/context/DataContext'
import { useI18n } from '@/context/I18nContext'

const FAQS: Array<{ q: string; a: string }> = [
  /* Account */
  {
    q: 'How do I get an account?',
    a: 'Anyone can create a free account using the “Create a new account” link on the login page — just add your name, email and password and choose whether you are a patient or a doctor. Every account is locked to one role, so a patient account can never sign in as a doctor, and a doctor account can never sign in as a patient. A new doctor account opens the practice portal with an empty practice; the built-in sample doctor account (doctor@healthcopilot.app) comes pre-filled with sample patients and requests.',
  },
  {
    q: 'What are the two built-in sample accounts?',
    a: 'Two accounts come pre-filled with sample data so you can explore the full experience: patient@healthcopilot.app (patient, “Alex Morgan”) with password Health@2026, and doctor@healthcopilot.app (doctor, “Priya Raman”) with the same password. Every other account starts with its own empty space — data is always scoped to your account.',
  },
  {
    q: 'Can one account be both a patient and a doctor?',
    a: 'No. Accounts are locked to the role chosen at sign-up, so a patient account can never open the practice portal and a doctor account can never open a personal health space. To explore both sides, create two separate accounts — or use the two built-in sample accounts.',
  },
  {
    q: 'What is the difference between the patient and doctor experience?',
    a: 'Patients get a personal health space: dashboard, medical records, prescriptions, appointments, analytics, wellness goals and the AI assistant. Doctors get a separate practice portal: an overview of their practice, a patient roster with records and medicines, a patient-reports inbox, prescribable medicines and a visit calendar.',
  },
  /* Health data */
  {
    q: 'Where does my health data come from?',
    a: 'The values in Health Analytics and on the dashboard are fictional. Ninety days of daily samples are generated in your browser from a fixed seed, tuned to plausible adult ranges — resting heart rate, blood pressure, sleep, steps and weight all fluctuate naturally around typical values with a gentle improving trend. No medical device, wearable or clinic is connected, and the numbers are not a diagnosis.',
  },
  {
    q: 'Can I edit my weight?',
    a: 'Yes. Open Health Analytics → Weight → Edit weight and enter your reading. It is saved only in this browser for your account, shown as your current weight on the chart, and Reset to sample brings the generated value back. The other readings are generated sample data — Settings → Data & privacy restores the defaults at any time.',
  },
  {
    q: 'How are my health details calculated and shown?',
    a: 'Summary cards show the average of the selected period and compare it with the previous period of equal length (the change badge). Charts plot one point per day in the 7- and 30-day views, and weekly averages in the 90-day view. Weight always shows your most recent — or edited — reading.',
  },
  /* AI assistant */
  {
    q: 'How does the AI assistant work?',
    a: 'The assistant runs entirely in the browser and answers from a built-in library of general health education, matched to your question. You can type, speak (voice input works in Chrome, Edge and Safari), or attach a photo. Photos are kept in the conversation as a record — the assistant cannot open or analyse images.',
  },
  {
    q: 'Can the assistant read my uploaded files or photos?',
    a: 'No. Uploads are stored as metadata only (title, category, provider, date), and photos are kept as previews in the conversation. The app never opens, parses or analyses the contents of a document or image, and the assistant never pretends otherwise.',
  },
  /* Privacy & data */
  {
    q: 'Is my data private?',
    a: 'Your health data is stored in your browser’s local storage under your account’s own key, and sign-in is handled by Firebase Authentication. Nothing is sold or shared. Because there is no clinic connected, you should treat everything you enter as sample data and avoid entering sensitive real-world medical details.',
  },
  {
    q: 'Where is my data stored, and how do I erase it?',
    a: 'Everything lives in your browser’s local storage under this site’s origin, scoped to your account. Use Settings → Data & privacy to reset your data, clear conversations or restore defaults (including any weight you have edited). Clearing your browser’s site data also removes it.',
  },
  {
    q: 'Does the app send notifications?',
    a: 'Notifications are in-app only — they are never emailed, texted or pushed. They exist to keep your reminders and updates visible inside the app.',
  },
  /* Records & prescriptions */
  {
    q: 'Can my doctor see the medical records I upload?',
    a: 'Yes. When a patient uploads a record it is added to their own library and also shared with the care-team inbox in the doctor portal, labelled with the patient’s name. A clinician opens “Patient reports” (or the patient’s file) to review it; when they mark it as seen, the patient receives an in-app notification that their report was reviewed.',
  },
  {
    q: 'Who can add prescriptions?',
    a: 'Only doctors. In the doctor portal a clinician opens “Prescriptions”, selects one of their patients from the dropdown, and adds the medication. It is delivered straight into that patient’s own Prescriptions list and the patient is notified. Patients can view their medicines and mark doses as taken, but cannot add or change a prescription themselves.',
  },
  /* Feedback */
  {
    q: 'Can I send feedback, and who sees it?',
    a: 'Yes — use the Send feedback form on this page. It is open to both patients and doctors, and whatever you post appears on the shared feedback board, which every patient and doctor using this app on this device can read. You can send as many notes as you like; there is no limit, and the form stays open after each one.',
  },
]

const STEPS = [
  {
    title: 'Create your account',
    body: 'Create a free patient or doctor account in a minute — or use the pre-filled built-in sample accounts to explore instantly.',
  },
  {
    title: 'Explore your space',
    body: 'Patients see a personal health dashboard; doctors open a practice portal with their patients and calendar.',
  },
  {
    title: 'Organise your health',
    body: 'Add records (metadata only, shared with your care team for review), track medicines your doctors prescribe, and schedule appointments.',
  },
  {
    title: 'Ask the assistant',
    body: 'Type, speak or attach a photo in AI Health Assistant, and get plain-language educational answers.',
  },
]

const LIMITATIONS = [
  'No hospital or clinic is connected — nothing is booked with, sent to, or read by a real provider.',
  'Uploaded documents and photos are stored as metadata/previews only; there is no OCR or AI analysis of file contents.',
  'The assistant provides general education only and will never diagnose or prescribe.',
  'No email, SMS or push notifications are sent.',
  'No API keys are bundled; connecting a real AI model requires your own server-side endpoint.',
]

export function HelpPage() {
  const { feedback } = useAppData()
  const { t } = useI18n()

  return (
    <PageContainer size="narrow">
      <PageHeading
        title={t('Help & Support')}
        eyebrow={t('Resources')}
        description={t('Answers about Health Copilot, straight to the point.')}
      />

      <Card>
        <CardHeader
          icon={<Rocket className="size-4" />}
          title={t('Getting started')}
          description={t('Four steps to make the most of Health Copilot.')}
        />
        <CardBody>
          <ol className="space-y-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{step.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<MessageCircleQuestion className="size-4" />}
          title={t('Frequently asked questions')}
          description={t('Click any question to expand the answer.')}
        />
        <CardBody>
          <div className="divide-y divide-line">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink transition-colors hover:text-brand-700 dark:hover:text-brand-300">
                  {faq.q}
                  <span
                    aria-hidden="true"
                    className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs text-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 pl-1 text-sm leading-relaxed text-ink-soft">{faq.a}</p>
              </details>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<MessageSquarePlus className="size-4" />}
          title={t('Send feedback')}
          description={t('Open to both patients and doctors. Your note appears on the shared board for everyone using this app on this device.')}
        />
        <CardBody>
          <FeedbackForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<Users className="size-4" />}
          title={t('Feedback from everyone')}
          description={t('Patients and doctors on this device read the same board — this is what they have shared.')}
          action={
            <Badge tone="neutral">
              {feedback.length} {feedback.length === 1 ? 'entry' : 'entries'}
            </Badge>
          }
        />
        <CardBody>
          <FeedbackList />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<ShieldAlert className="size-4" />}
          title={t('Good to know')}
          description={t('What this product deliberately does not do.')}
        />
        <CardBody>
          <ul className="space-y-2.5">
            {LIMITATIONS.map((limitation) => (
              <li key={limitation} className="flex items-start gap-2 text-sm text-ink-soft">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                {limitation}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<LifeBuoy className="size-4" />}
          title={t('Still curious?')}
          description={t('The README in the project explains how everything is built.')}
        />
        <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm text-muted">
            <BookOpen aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Read the README file in the project for architecture notes, setup steps and the deploy
            workflow.
          </p>
          <a
            href="mailto:hello@healthcopilot.app?subject=Health%20Copilot"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-200 dark:hover:bg-brand-500/25"
          >
            <Mail aria-hidden="true" className="size-4" />
            {t('Contact us')}
          </a>
        </CardBody>
      </Card>
    </PageContainer>
  )
}