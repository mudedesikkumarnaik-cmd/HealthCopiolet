import { useState } from 'react'
import {
  Accessibility,
  Bell,
  Database,
  Languages,
  Palette,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  Waves,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeading } from '@/components/common/PageHeading'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { PageContainer } from '@/components/layout/PageContainer'
import { useAppData } from '@/context/DataContext'
import { useI18n } from '@/context/I18nContext'
import { usePreferences } from '@/context/PreferencesContext'
import { SettingsSection, ToggleSetting } from '@/components/settings/SettingsSection'
import { useToast } from '@/context/ToastContext'
import { SUPPORTED_LANGUAGES } from '@/i18n/translations'
import type { Locale } from '@/i18n/translations'
import type { ThemePreference } from '@/types/user'

const TIME_ZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
]

export function SettingsPage() {
  const { preferences, updateNested, updatePreferences, resetPreferences } = usePreferences()
  const { resetDemoData, clearChatHistory } = useAppData()
  const { t, locale, setLocale } = useI18n()
  const toast = useToast()
  const [resetOpen, setResetOpen] = useState(false)

  const { theme, notifications, health, ai, accessibility } = preferences

  const confirmReset = () => {
    resetDemoData()
    toast.success(t('My data has been reset'), t('Records, medicines and preferences were restored to the sample set.'))
    setResetOpen(false)
  }

  return (
    <PageContainer>
      <PageHeading
        title={t('Settings')}
        eyebrow={t('Preferences')}
        description={t('Appearance, notifications and privacy options. Preferences are saved in this browser only.')}
      />

      <SettingsSection
        title={t('Appearance')}
        description={t('How the app looks on your screen.')}
        icon={<Palette aria-hidden="true" className="size-4" />}
        action={
          <SegmentedControl<ThemePreference>
            ariaLabel={t('Theme')}
            value={theme}
            onChange={(nextTheme) => updatePreferences({ theme: nextTheme })}
            options={[
              { value: 'light', label: t('Light') },
              { value: 'dark', label: t('Dark') },
              { value: 'system', label: t('System') },
            ]}
          />
        }
      >
        <ToggleSetting
          label={t('Reduce motion')}
          description={t('Minimises animations and transitions across the app.')}
          checked={accessibility.reduceMotion}
          onChange={(checked) => updateNested('accessibility', { reduceMotion: checked })}
        />
        <ToggleSetting
          label={t('Large text')}
          description={t('Increases the base font size for easier reading.')}
          checked={accessibility.largeText}
          onChange={(checked) => updateNested('accessibility', { largeText: checked })}
        />
        <ToggleSetting
          label={t('High-contrast links')}
          description={t('Underlines links and emphasises buttons for clearer navigation.')}
          checked={accessibility.highContrastLinks}
          onChange={(checked) => updateNested('accessibility', { highContrastLinks: checked })}
        />
      </SettingsSection>

      <SettingsSection
        title={t('Language')}
        description={t('Choose the language for the whole app — for patients and doctors alike.')}
        icon={<Languages aria-hidden="true" className="size-4" />}
        action={
          <SegmentedControl<Locale>
            ariaLabel={t('Language')}
            value={locale}
            onChange={(next) => setLocale(next)}
            options={SUPPORTED_LANGUAGES.map((language) => ({
              value: language.code,
              label: language.label,
            }))}
          />
        }
      >
        <div className="py-4 first:pt-0 last:pb-0">
          <p className="text-xs leading-relaxed text-muted">
            {t('The whole interface — navigation, settings, feedback and help — updates instantly. Your choice is saved in this browser.')}
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('Notifications')}
        description={t('In-app notifications shown inside the app. No email, SMS or push notifications are ever sent.')}
        icon={<Bell aria-hidden="true" className="size-4" />}
      >
        <ToggleSetting
          label={t('Appointment reminders')}
          description={t('Remind me about upcoming visits in my calendar.')}
          checked={notifications.appointmentReminders}
          onChange={(checked) => updateNested('notifications', { appointmentReminders: checked })}
        />
        <ToggleSetting
          label={t('Medication reminders')}
          description={t('Show a daily check-in for medications marked active.')}
          checked={notifications.medicationReminders}
          onChange={(checked) => updateNested('notifications', { medicationReminders: checked })}
        />
        <ToggleSetting
          label={t('Wellness reminders')}
          description={t('Gentle prompts for wellness goals and habits.')}
          checked={notifications.wellnessReminders}
          onChange={(checked) => updateNested('notifications', { wellnessReminders: checked })}
        />
        <ToggleSetting
          label={t('Product announcements')}
          description={t('Notes about app features when they change.')}
          checked={notifications.productAnnouncements}
          onChange={(checked) => updateNested('notifications', { productAnnouncements: checked })}
        />
      </SettingsSection>

      <SettingsSection
        title={t('Health & units')}
        description={t('How health values are shown in the app.')}
        icon={<Waves aria-hidden="true" className="size-4" />}
        action={
          <SegmentedControl<'metric' | 'imperial'>
            ariaLabel={t('Units')}
            value={health.units}
            onChange={(units) => updateNested('health', { units })}
            options={[
              { value: 'metric', label: t('Metric') },
              { value: 'imperial', label: t('Imperial') },
            ]}
          />
        }
      >
        <ToggleSetting
          label={t('Track wellness goals & habits')}
          description={t('Keep the Wellness page active in your workspace.')}
          checked={health.trackWellness}
          onChange={(checked) => updateNested('health', { trackWellness: checked })}
        />
        <div className="py-4 first:pt-0 last:pb-0">
          <label htmlFor="settings-timezone" className="hc-label">
            {t('Time zone')}
          </label>
          <select
            id="settings-timezone"
            value={health.timeZone}
            onChange={(event) => updateNested('health', { timeZone: event.target.value })}
            className="hc-input max-w-sm"
          >
            {TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('AI preferences')}
        description={t('Controls for the built-in health assistant.')}
        icon={<Sparkles aria-hidden="true" className="size-4" />}
      >
        <ToggleSetting
          label={t('Enable the AI assistant')}
          description={t('Turn the built-in health assistant on or off everywhere in the app.')}
          checked={ai.assistantEnabled}
          onChange={(checked) => updateNested('ai', { assistantEnabled: checked })}
        />
        <ToggleSetting
          label={t('Consent to external processing')}
          description={t('Required before any future feature could send data to a third-party service. This app never sends anything.')}
          checked={ai.consentToExternalProcessing}
          onChange={(checked) => updateNested('ai', { consentToExternalProcessing: checked })}
          disabled={!ai.assistantEnabled}
        />
      </SettingsSection>

      <SettingsSection
        title={t('Accessibility')}
        description={t('Assistive options for comfortable use.')}
        icon={<Accessibility aria-hidden="true" className="size-4" />}
      >
        <ToggleSetting
          label={t('Reduce motion')}
          description={t('Already applied above — minimises animations app-wide.')}
          checked={accessibility.reduceMotion}
          onChange={(checked) => updateNested('accessibility', { reduceMotion: checked })}
        />
        <div className="py-4 first:pt-0 last:pb-0">
          <p className="text-xs leading-relaxed text-muted">
            {t('The app supports focus outlines, semantic landmarks and keyboard navigation throughout. More options are grouped in Appearance above.')}
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t('Data & privacy')}
        description={t('How your data is stored and reset.')}
        icon={<Database aria-hidden="true" className="size-4" />}
      >
        <div className="py-4 first:pt-0 last:pb-0">
          <p className="text-sm leading-relaxed text-muted">
            {t("Everything you enter — records, medicines, appointments, goals, habits and preferences — is stored in your browser's local storage. Nothing is uploaded, and closing the tab does not erase it. Clearing your browser's site data removes it.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
          <div>
            <p className="text-[0.88rem] font-semibold text-ink">{t('Reset my data')}</p>
            <p className="text-xs text-muted">{t('Restores the fictional sample records, medicines and goals.')}</p>
          </div>
          <Button variant="outline" onClick={() => setResetOpen(true)} leftIcon={<RotateCcw className="size-4" />}>
            {t('Reset my data')}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
          <div>
            <p className="text-[0.88rem] font-semibold text-ink">{t('Clear chat history')}</p>
            <p className="text-xs text-muted">{t('Deletes every assistant conversation in this browser.')}</p>
          </div>
          <Button variant="outline" onClick={clearChatHistory} leftIcon={<Trash2 className="size-4" />}>
            {t('Clear conversations')}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
          <div>
            <p className="text-[0.88rem] font-semibold text-ink">{t('Restore default settings')}</p>
            <p className="text-xs text-muted">{t('Reverts appearance, notifications and accessibility options.')}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              resetPreferences()
              toast.success(t('Settings restored'), t('Preferences returned to their defaults.'))
            }}
            leftIcon={<Undo2 className="size-4" />}
          >
            {t('Reset settings')}
          </Button>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={confirmReset}
        title={t('Reset all data?')}
        description={t('Your local records, medicines, appointments, goals, habits and conversations will be replaced with the original sample set. This cannot be undone.')}
        confirmLabel={t('Reset my data')}
        tone="primary"
      />
    </PageContainer>
  )
}
