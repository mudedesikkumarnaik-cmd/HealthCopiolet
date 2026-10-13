import type { ChatMessage } from '@/types/health'

/**
 * AI Health Assistant service.
 *
 * The app ships with a built-in provider so everything works with no API key
 * and no network access. Replies come from a library of general health
 * education and always end with a disclaimer.
 *
 * A real provider can be enabled later through a **server-side** endpoint
 * (VITE_AI_PROVIDER=remote + VITE_AI_ENDPOINT). Never ship provider secret keys
 * inside the browser bundle, and never send personal health data to a
 * third-party service without the user's explicit consent.
 *
 * SAFETY: responses are general educational information only. The assistant
 * does not diagnose, does not prescribe, and never invents laboratory values
 * or medical facts about documents it cannot actually read.
 */

export interface AiProviderInfo {
  id: 'demo' | 'remote'
  label: string
  isDemo: boolean
  model?: string
  endpointConfigured: boolean
  /** Shown in the UI when no real model is connected yet. */
  setupGuide: string
}

export interface AiContext {
  userName: string
  recordCount: number
  recordTitles: string[]
  activeMedications: number
  medicationNames: string[]
  nextAppointmentLabel?: string
  hasUploadedRecords: boolean
}

export interface AiReply {
  content: string
  isDemo: boolean
}

const env = import.meta.env ?? {}

const PROVIDER_ID: 'demo' | 'remote' = env.VITE_AI_PROVIDER === 'remote' ? 'remote' : 'demo'
const ENDPOINT = (env.VITE_AI_ENDPOINT ?? '').trim()
const MODEL = (env.VITE_AI_MODEL ?? '').trim()

const SETUP_GUIDE = `**Connect a real AI model (optional)**
This build ships with a built-in educational assistant, so **no API key is required** and nothing leaves your browser. To route questions to a real model instead:

1. Deploy a small **server endpoint** that holds your provider key (never put a provider secret in the frontend — anything in the bundle is public).
2. Set these in your \`.env\`:
   - \`VITE_AI_PROVIDER=remote\`
   - \`VITE_AI_ENDPOINT=https://your-server.example.com/api/ai\`
   - \`VITE_AI_MODEL=<optional model name>\`
3. Your endpoint should accept \`{ model, messages: [{ role, content }] }\` and reply with \`{ reply: "..." }\`.

If the endpoint is missing or unreachable, the assistant automatically falls back to the built-in library and tells you so — it never pretends a simulated answer is real AI output.`

export const SUGGESTED_QUESTIONS = [
  'I have had a headache since yesterday, feel tired and have a mild fever.',
  'What is metformin used for, and what should I watch for?',
  'My HbA1c is 7.2% — what does that mean?',
  'Explain my latest health report in simple language.',
  'What questions should I ask my doctor at my next visit?',
] as const

const EMERGENCY_PATTERNS = [
  'chest pain',
  'chest pressure',
  'cannot breathe',
  "can't breathe",
  'difficulty breathing',
  'severe bleeding',
  'stroke',
  'face droop',
  'slurred speech',
  'unconscious',
  'not breathing',
  'seizure',
  'suicidal',
  'kill myself',
  'overdose',
  'numb on one side',
  'anaphylaxis',
  'severe allergic reaction',
]

/** True when the text describes a possible emergency. Deterministic — never
 * delegated to a model, so urgent guidance can never be skipped or delayed. */
export function isEmergency(prompt: string): boolean {
  const text = prompt.toLowerCase()
  return EMERGENCY_PATTERNS.some((pattern) => text.includes(pattern))
}

/**
 * Phrases that indicate the user is describing a health problem or symptom.
 * Whenever these appear, the assistant always adds the likely positive result
 * so the person leaves with an encouraging, accurate outlook.
 */
const SYMPTOM_PATTERNS = [
  'headache',
  'migraine',
  'fever',
  'temperature',
  'cough',
  'cold',
  'flu',
  'sore throat',
  'throat pain',
  'stomach',
  'nausea',
  'vomit',
  'diarrhea',
  'diarrhoea',
  'dizzy',
  'dizziness',
  'weakness',
  'fatigue',
  'body ache',
  'pain',
  'ache',
  'aching',
  'rash',
  'itch',
  'itchy',
  'allergy',
  'allergic',
  'infection',
  'swelling',
  'swollen',
  'breathless',
  'palpitations',
  'heartburn',
  'indigestion',
  'bloating',
  'constipation',
  'sneezing',
  'runny nose',
  'congestion',
  'sick',
  'unwell',
  'not feeling well',
  'suffering from',
  'symptoms',
  'symptom',
]

function mentionsHealthProblem(prompt: string): boolean {
  const text = prompt.toLowerCase()
  return SYMPTOM_PATTERNS.some((pattern) => text.includes(pattern))
}

const CLOSING =
  'This is general educational information from the built-in assistant — it is not a diagnosis, not a treatment plan and not a substitute for a licensed healthcare professional. Please discuss anything personal with your own clinician.'

function demoFooter(): string {
  return `\n\n_${CLOSING}_`
}

/* ------------------------------------------------------------------ *
 * Intent matching
 * ------------------------------------------------------------------ */

interface Intent {
  id: string
  keywords: string[]
  build: (context: AiContext) => string
}

const INTENTS: Intent[] = [
  {
    id: 'explain-report',
    keywords: ['explain', 'latest report', 'report', 'results', 'lab', 'blood test report'],
    build: (ctx) => {
      if (!ctx.hasUploadedRecords) {
        return `I can't read your documents yet. In this build I only have the record **titles** you see in your library — I cannot open a PDF or image, and I will not guess at values that aren't available to me.

Right now your library contains ${ctx.recordCount} record${ctx.recordCount === 1 ? '' : 's'}, such as “${ctx.recordTitles[0] ?? 'your latest lab report'}”.

**What I can do instead**
- Walk you through what a typical section of a report means, term by term.
- Help you turn a report into a short list of questions for your clinician.
- Explain the general meaning of words such as haemoglobin, HDL or creatinine.

**What to do with the real document**
1. Open the original report your provider gave you.
2. Note any value marked outside the reference range.
3. Bring those specific lines to your next appointment.

${demoFooter()}`
      }
      return `Here is a careful, plain-language way to read a health report. I am working from the **titles** in your library (for example “${ctx.recordTitles[0] ?? 'your latest report'}”), not from the document contents, because this build cannot open or analyse files.

**How reports are usually organised**
1. **Your details** — name, date, who requested the test.
2. **The test list** — each measurement with your value, the unit, and a reference range.
3. **Flags** — many labs mark values outside the range with H (high), L (low) or an asterisk.
4. **Comments** — a clinician's interpretation or a note to repeat a test.

**Reading a line, step by step**
- Find your value and the unit next to it.
- Compare it with the reference range on the same line.
- Remember that “reference range” describes a typical population — it is not a personal target.
- A single value outside the range is common and is not automatically a problem.

**Bring to your appointment**
- The exact test name and your value.
- Whether it has changed compared with previous tests.
- What, if anything, it means for your day-to-day life.

${demoFooter()}`
    },
  },
  {
    id: 'blood-terms',
    keywords: ['term', 'mean', 'glossary', 'hba1c', 'cholesterol', 'hdl', 'ldl', 'creatinine', 'haemoglobin', 'hemoglobin', 'thyroid'],
    build: () => `Here is a plain-language glossary of common blood test terms. This is general education only — it is **not** an interpretation of your own results.

**Full blood count**
- **Haemoglobin (Hb)** — the protein in red blood cells that carries oxygen.
- **White cell count (WBC)** — cells that help fight infection.
- **Platelets** — help blood to clot.
- **Haematocrit** — the proportion of blood made up of red cells.

**Metabolic and organ markers**
- **Creatinine** — a waste product filtered by the kidneys.
- **eGFR** — an estimate of how well the kidneys are filtering.
- **ALT / AST** — liver enzymes.
- **Sodium / potassium** — electrolytes that keep nerves and muscles working.

**Lipids (cholesterol)**
- **Total cholesterol** — all cholesterol measured together.
- **LDL** — often called “bad” cholesterol; higher levels are associated with cardiovascular risk.
- **HDL** — often called “good” cholesterol.
- **Triglycerides** — a type of blood fat.

**Blood sugar**
- **Glucose** — the sugar in your blood at the moment of the test.
- **HbA1c** — an average of your blood sugar over roughly the last 2–3 months.

**Thyroid**
- **TSH, T3, T4** — hormones and the signal that regulate your metabolism.

Reference ranges differ between laboratories, so always compare your value with the range printed on your own report.

${demoFooter()}`,
  },
  {
    id: 'prepare-questions',
    keywords: ['prepare', 'questions', 'doctor visit', 'appointment questions', 'ask my doctor'],
    build: (ctx) => `Here is a checklist to make your next visit more productive${ctx.nextAppointmentLabel ? ` (your next appointment is ${ctx.nextAppointmentLabel})` : ''}.

**Before the visit**
- Write down your top 2–3 concerns, most important first.
- List every medicine and supplement you take, with the dose and how often.
- Note any new or changing symptoms and when they started.
- Bring your most recent reports or make sure your clinician can access them.

**Questions that are usually worth asking**
1. In plain language, what is the current picture of my health?
2. What has changed since my last visit?
3. What are the options, and what are the pros and cons of each?
4. What would you do if this were your own situation?
5. Are there lifestyle steps that could help, and which one matters most?
6. When should I come back, and what should make me seek help sooner?
7. Is there anything I should stop doing?

**During the visit**
- Ask for key points to be repeated in everyday words.
- Take notes, or ask whether you may record the summary.
- Confirm the next steps before you leave.

${demoFooter()}`,
  },
  {
    id: 'summarize-records',
    keywords: ['summarize', 'summarise', 'my records', 'my uploaded', 'record summary'],
    build: (ctx) => {
      const list = ctx.recordTitles.length
        ? ctx.recordTitles.map((title) => `- ${title}`).join('\n')
        : '- (no records yet)'
      return `I can list what is in your library, but I want to be precise about limits: this app stores **metadata only**. I have not opened, read or analysed any file, so I will not summarise document contents or invent findings.

**What your library contains (${ctx.recordCount} record${ctx.recordCount === 1 ? '' : 's'})**
${list}

**What I can honestly say**
- These are the titles, providers, categories and dates recorded in this library.
- The short summaries shown on the record cards are authored sample copy, clearly labelled as such.
- Any real interpretation needs a qualified clinician who can see the original document.

**Useful next steps**
- Open a record and confirm the title, date and provider are correct.
- Add the missing documents you would want a clinician to have.
- Use the “Prepare for a visit” questions so nothing is forgotten.

${demoFooter()}`
    },
  },
  {
    id: 'sleep',
    keywords: ['sleep', 'insomnia', 'tired', 'fatigue', 'bedtime', 'routine'],
    build: () => `Let's build a realistic sleep routine. Sleep habits are personal, so treat this as a menu of options rather than a prescription.

**Anchor your rhythm**
- Aim for the same wake-up time every day, including weekends. It is usually the strongest lever.
- Get bright light within an hour of waking — daylight or a short walk outside.
- Keep the last hour before bed dim and calm.

**Set up the bedroom**
- Cool, dark and quiet is the usual starting point.
- Keep screens out of reach so you are not tempted to scroll.
- Reserve the bed for sleep, not work.

**Wind-down routine (pick 2–3)**
- A warm shower or bath an hour before bed.
- Gentle stretching or slow breathing: in for 4, hold for 4, out for 6.
- Reading something light on paper.
- Writing tomorrow's to-do list so your mind can let go of it.

**Watch-outs**
- Caffeine has a long tail — many people benefit from stopping by early afternoon.
- Alcohol near bedtime often fragments sleep.
- Heavy meals and intense exercise late in the evening can delay sleep for some people.

**Track, don't judge**
Log your bedtime and wake time for two weeks in Wellness & Goals. Patterns are usually more useful than any single night. If poor sleep persists for weeks, or you snore heavily and wake unrefreshed, that is worth raising with a clinician.

${demoFooter()}`,
  },
  {
    id: 'blood-pressure',
    keywords: ['blood pressure', 'hypertension', 'systolic', 'diastolic', 'mmhg'],
    build: () => `Blood pressure is written as two numbers, for example 118/76 mmHg.

**What the numbers mean**
- **Systolic (the top number)** — the pressure in your arteries when your heart contracts.
- **Diastolic (the bottom number)** — the pressure between beats, while your heart refills.

**How to take a useful reading**
- Sit quietly for 5 minutes first, back supported, feet flat.
- Rest your arm at heart height on a table.
- Use the correct cuff size — too small a cuff reads high.
- Take two readings a minute apart and note both.
- Measure at a similar time each day.

**Things that shift readings**
- Caffeine, nicotine, exercise and stress within 30 minutes raise readings.
- A full bladder can raise them too.
- Readings naturally vary through the day.

**Perspective**
A single high reading is not a diagnosis. Trends over days to weeks, taken consistently, are more informative. Your clinician decides what matters for you personally.

${demoFooter()}`,
  },
  {
    id: 'activity',
    keywords: ['steps', 'walking', 'exercise', 'activity', 'fitness', 'movement', 'workout'],
    build: () => `Movement is one of the most flexible things you can adjust. Start where you actually are, not where you think you should be.

**A gentle way to build up**
1. For one week, just note your typical daily steps — no changes.
2. Next week, add a short walk most days (10–15 minutes is plenty).
3. Increase gradually; a common rule of thumb is around 10% per week.
4. Add two short strength sessions a week when walking feels easy.

**Make it stick**
- Attach the walk to an existing habit — after lunch, or right after a work call.
- Have a bad-weather backup: indoor walking, stairs, or a short home routine.
- Pair it with something you enjoy: a podcast, music, or a phone call.
- Aim for consistency over intensity.

**Be kind to yourself**
Missed days are normal and not a failure. Rest days are part of a sustainable routine. If you have a health condition or are returning from injury, check with a clinician before pushing activity up sharply.

${demoFooter()}`,
  },
  {
    id: 'medication',
    keywords: ['medication', 'medicine', 'pill', 'prescription', 'dose', 'reminder', 'tablet', 'adherence'],
    build: (ctx) => `I can help you organise medicines, but I will never tell you to change a dose or stop a medicine — only your prescriber can do that.

**Your medication list (${ctx.activeMedications} active)**
${ctx.medicationNames.length ? ctx.medicationNames.map((name) => `- ${name}`).join('\n') : '- (no medicines recorded yet)'}

**Sticking to a schedule**
- Link doses to daily anchors: brushing teeth, breakfast, or bedtime.
- Use a weekly pill organiser if you take several medicines.
- Keep an up-to-date list in one place, including over-the-counter items and supplements.
- When you travel, carry medicines in hand luggage with a copy of the prescription.

**Worth flagging to your prescriber**
- Side effects that bother you — do not simply stop a medicine.
- A missed dose, so they can confirm what to do.
- Any new medicine or supplement, including herbal products.
- Any difficulty affording or obtaining a refill.

**A safe habit**
Before a procedure or a new prescription, share your full list with the clinician — including anything you take occasionally.

${demoFooter()}`,
  },
  {
    id: 'appointments',
    keywords: ['appointment', 'visit', 'schedule', 'book', 'clinic'],
    build: (ctx) => `Here is how to get the most out of appointments${ctx.nextAppointmentLabel ? `. Your next appointment is ${ctx.nextAppointmentLabel}` : ''}.

**Get ready**
- Confirm the date, time, location and whether it is in person, video or phone.
- Note what you want to cover — three points is usually plenty.
- Prepare your medicine list and recent reports.
- Write down questions instead of trying to remember them.

**For a video visit**
- Test your camera, microphone and connection a few minutes early.
- Choose a quiet, private spot with decent lighting.
- Have your list open next to you.

**After the visit**
- Write down the plan while it is fresh, including any follow-up tests.
- Note who to contact if things change.
- Diary the next appointment immediately.

Remember: appointments you schedule here are stored in your browser. Nothing is booked with a real clinic.

${demoFooter()}`,
  },
  {
    id: 'wellbeing',
    keywords: ['stress', 'anxiety', 'mental', 'mood', 'overwhelmed', 'burnout', 'relax'],
    build: () => `Thank you for raising this — emotional wellbeing is a real part of health, and it deserves the same attention as any physical symptom.

**Small, evidence-aligned starting points**
- **Slow breathing** — inhale for 4, hold for 4, exhale for 6, for two minutes.
- **Paced activity** — a short walk outdoors often helps mood more than people expect.
- **Name it** — writing down the specific worry can make it feel more manageable.
- **Protect basics** — regular meals, water, daylight and a consistent sleep window.
- **Connection** — one message or call to someone you trust.

**When to seek support**
If low mood or anxiety lasts more than a couple of weeks, affects sleep, work or relationships, or you are using alcohol or other substances to cope, please speak with a clinician or a mental-health professional. That is a sign of good self-awareness, not weakness.

**If you are in immediate danger**
Please contact your local emergency number or a crisis line right away.

${demoFooter()}`,
  },
  {
    id: 'nutrition',
    keywords: ['diet', 'eat', 'food', 'nutrition', 'weight', 'hydration', 'water', 'sugar'],
    build: () => `A short, realistic note on eating well. This is general information — not a diet plan, and not advice to restrict your intake.

**Patterns that tend to help**
- Build meals around vegetables, a protein and a fibre-rich carbohydrate.
- Eat at roughly regular times when you can.
- Keep water visible and sip through the day.
- Aim for colour variety across the week rather than perfection in one meal.

**Gentle swaps**
- Water or sparkling water in place of some sugary drinks.
- A handful of nuts instead of crisps for an afternoon snack.
- Fruit with a little yoghurt for something sweet.

**Please avoid**
- Very low-calorie or “detox” plans without clinical supervision.
- Cutting out whole food groups because of something you read online.
- Weighing yourself obsessively — trends over weeks matter far more than daily numbers.

If you have diabetes, kidney disease, a food allergy or a history of disordered eating, eating advice needs to be personalised by a clinician or dietitian.

${demoFooter()}`,
  },
  {
    id: 'capabilities',
    keywords: ['what can you do', 'help', 'who are you', 'capabilities', 'how do you work'],
    build: (ctx) => `I'm the Health Copilot assistant. My answers come from a built-in library of general health education, written to be useful without any network connection.

**What I can help with**
- Explaining health terms and how to read the layout of a report.
- Building a list of questions for a clinician.
- General routines for sleep, movement, hydration and stress.
- Organising the medicines and appointments you record here.
- Showing you where things live in the app.

**What I cannot do**
- I cannot open, read or analyse your uploaded files or photos.
- I cannot diagnose, prescribe, or change any dose.
- I cannot see your real medical history — I only see what is in this browser.

**Your context**
- ${ctx.recordCount} record${ctx.recordCount === 1 ? '' : 's'} in your library.
- ${ctx.activeMedications} active medication${ctx.activeMedications === 1 ? '' : 's'} on file${ctx.userName ? `, ${ctx.userName.split(' ')[0]}` : ''}.

Ask me anything from the suggested questions to get started.

${demoFooter()}`,
  },
]

function emergencyReply(): string {
  return `**Please seek emergency help now — do not wait for this app.**

Some symptoms need urgent, in-person assessment. If you or someone else has any of the following, contact emergency services immediately:
- Chest pain or pressure, especially spreading to an arm, jaw or back.
- Severe difficulty breathing, or not breathing.
- Signs of stroke — sudden face droop, arm weakness, or slurred speech.
- Severe bleeding that will not stop, or a serious injury.
- A seizure, fainting, or unresponsiveness.
- A severe allergic reaction with swelling of the face, lips or throat.
- Thoughts of harming yourself or someone else.

**In India, dial 112** (the national emergency number) or your local emergency number right away.

I am an educational assistant and cannot assess an emergency. Please do not wait for an app response. If you are safe but worried, contact your own clinician or an urgent-care service for advice.`
}

/** Reply that explains medical-report values in plain language. */
function reportReply(markers: ReportMarker[], prompt: string): string {
  const intro = markers.length
    ? `Here is a plain-language explanation of the value${markers.length === 1 ? '' : 's'} you mentioned. I describe what each term generally means — always compare with the reference range printed on your own report, because every laboratory differs.`
    : `I can help you understand a medical report step by step. I cannot open a file or photo, but if you type the test name and value — for example “HbA1c 7.2%” or “LDL 160 mg/dL” — I will explain each line in plain language.`

  const detail = markers.length
    ? `\n\n${markers
        .map(
          (marker) =>
            `**${marker.name}** — ${marker.about}\n- Higher than the range: ${marker.high}\n- Lower than the range: ${marker.low}\n- These are general patterns, not a diagnosis for you.`,
        )
        .join('\n\n')}`
    : `\n\n_You wrote: “${prompt.trim().slice(0, 120)}”_`

  return `${intro}${detail}

**How to read any report**
1. Use the reference range printed on the same line — it is specific to that laboratory.
2. “H” or “L” (or an asterisk) usually flags a value outside the range.
3. One out-of-range value is common and not automatically serious — trends and context matter.
4. Lifestyle, recent illness, medicines and even hydration can shift results.

**What to do next**
- Note the exact test names and values that are flagged.
- Bring this list to your clinician and ask what it means for you personally.
- Ask whether the test should be repeated or whether further tests are needed.

${demoFooter()}`
}

/** Realistic, non-guaranteed outlook used inside symptom answers. */
function outlookBody(): string {
  return `- **Most common course:** symptoms like these often settle within days to a couple of weeks with rest and basic care, and the body recovers well.
- **Could also persist:** some causes need a specific treatment (for example an antibiotic for a bacterial infection), so symptoms may continue until that is treated.
- **Could need review:** occasionally the cause is something a clinician should assess with tests.
Assumptions: this assumes there are no severe warning signs (listed above), no pregnancy and no significant long-term illness, and that the description is complete. I cannot give survival rates, recovery timelines or success percentages — I do not have a validated model or your clinical data.`
}

/**
 * Structured Symptom Checker reply. Mirrors the response shape required by the
 * product brief: summary, possible explanations, missing information, warning
 * signs, next steps, follow-up, sources and a disclaimer. Deterministic — it
 * never claims certainty and never invents a probability.
 */
function symptomCheckerReply(prompt: string, condition?: Condition): string {
  const topic = prompt.trim().slice(0, 160)

  const reported = condition
    ? `You described something that fits the general pattern of **${condition.label}**.`
    : `You described: “${topic}”.`

  const explanations = condition
    ? condition.possibleCauses.map((cause) => `- ${cause}`).join('\n')
    : [
        '- A common, short-lived illness or minor inflammation — the most frequent explanation.',
        '- A lifestyle or routine factor such as sleep, stress, food or hydration.',
        '- A mild infection or an allergy.',
        '- Less commonly, something a clinician should review.',
      ].join('\n')

  const tests = condition
    ? condition.tests.map((test) => `- ${test}`).join('\n')
    : [
        '- Usually none at first — most problems are assessed by history and examination.',
        '- A basic blood test (full blood count, sugar or inflammation markers) if it persists.',
        '- A urine or stool test if an infection is suspected.',
      ].join('\n')

  const medicines = condition
    ? condition.medicines.map((medicine) => `- ${medicine}`).join('\n')
    : [
        '- Simple pain or fever relief such as paracetamol, if it is suitable for you.',
        '- Plenty of fluids and rest.',
        '- Any specific medicine depends on the cause and must be chosen by a clinician.',
      ].join('\n')

  const redFlags = condition
    ? condition.redFlags.map((flag) => `- ${flag}`).join('\n')
    : [
        '- Severe or worsening pain, difficulty breathing, or chest pain.',
        '- Confusion, fainting, a stiff neck with fever, or a sudden severe headache.',
        '- Bleeding that will not stop, or you feel very unwell.',
      ].join('\n')

  const selfCare = condition
    ? condition.selfCare.map((step) => `- ${step}`).join('\n')
    : [
        '- Rest and stay hydrated.',
        '- Watch the trend: better, worse, or the same over a few days.',
        '- Keep sleep, meals and light movement steady.',
      ].join('\n')

  return `**Summary**
${reported} This is an educational read of what you typed — it is **not a diagnosis**.

**Possible explanations (most common first)**
${explanations}

I cannot tell you which of these applies to you, and I cannot give a probability — that needs an examination and, sometimes, tests.

**Information that would help clarify this**
${FOLLOW_UP_QUESTIONS.map((question) => `- ${question}`).join('\n')}

**How urgent is it?**
${redFlags}

**If you have any of those warning signs, seek urgent care now — in India dial 112. Do not wait to finish answering questions.**

**What usually helps in the meantime**
${selfCare}

**Tests a clinician may order**
${tests}

**Medicines commonly discussed (general education only)**
${medicines}

_Do not start, stop or change any medicine — including over-the-counter ones — without advice from your clinician or pharmacist._

**Realistic outlook**
${outlookBody()}

**What I cannot predict**
I cannot examine you, I have no test results, and I am not a validated risk model — so I cannot say how likely any explanation is for you. Only a clinician who sees you can.

${sourcesBlock(sourcesFor(prompt))}

${demoFooter()}`
}

/** Structured Medication Explainer reply. */
function medicationReply(medicine: Medicine): string {
  return `Here is a plain-language, educational summary of **${medicine.generic}**. This is **not a prescription and not a dose instruction**.

**Identification**
- Generic name: **${medicine.generic}**
- Common brand names: ${medicine.brands.join(', ')}
- Active ingredient: ${medicine.ingredient}
- Verification: this is a **built-in educational summary**, not a live check against an official drug database. Always confirm with your pharmacist or the product label.

**What it is commonly used for**
${medicine.uses.map((use) => `- ${use}`).join('\n')}

**How it works in the body**
${medicine.howItWorks}

**Common side effects**
${medicine.sideEffects.map((effect) => `- ${effect}`).join('\n')}

**Serious warning signs — seek medical help**
${medicine.warningSigns.map((sign) => `- ${sign}`).join('\n')}

**Precautions**
${medicine.precautions.map((precaution) => `- ${precaution}`).join('\n')}

**Possible interactions (general)**
${medicine.interactions.map((interaction) => `- ${interaction}`).join('\n')}

**Questions worth asking your pharmacist or doctor**
${medicine.questions.map((question) => `- ${question}`).join('\n')}

**Why you were prescribed it**
I cannot know your prescriber’s exact reason unless it is documented in your records. The uses above are the conditions this medicine is commonly prescribed for — please confirm your personal reason with your prescriber.

${sourcesBlock(sourcesFor(medicine.generic))}

${demoFooter()}`
}

/** Safety reply for missed doses — never advises doubling or self-adjusting. */
function missedDoseReply(): string {
  return `**Missed or late dose**
I can give general guidance, but I will not tell you to double up or adjust your own dose — that depends on the specific medicine and your situation.

- For most medicines: take the missed dose as soon as you remember, unless it is almost time for the next one.
- If the next dose is nearly due, skip the missed one and carry on as normal.
- **Do not take a double dose** unless your prescriber or pharmacist tells you to.
- Some medicines (blood thinners, insulin, epilepsy medicines, thyroid medicine) have specific rules.

**What to do:** read your medicine’s leaflet, or ask your pharmacist or prescriber the same day. Have the medicine name and strength ready.
If you have taken too much by mistake, treat it as urgent — in India dial 112 or contact a poison service.

${demoFooter()}`
}

/** Safety reply for a suspected medicine allergic reaction. */
function allergicReactionReply(): string {
  return `**Possible medicine reaction**
A medicine reaction can range from mild to serious.

- **Mild** (itchy rash, hives, mild swelling): stop the medicine and contact your prescriber or pharmacist for advice. Do not restart it on your own.
- **Serious — seek emergency help now (India: dial 112):** swelling of the face, lips, tongue or throat; difficulty breathing; dizziness or fainting; a widespread or blistering rash.

If you can, note the medicine name and when the reaction started, and show the clinician.

${demoFooter()}`
}

const MED_SAFETY_PATTERNS: { kind: 'missed' | 'allergy'; keys: string[] }[] = [
  {
    kind: 'missed',
    keys: ['missed dose', 'missed my', 'missed a', 'forgot to take', 'forgot my', 'skipped a dose', 'late dose'],
  },
  {
    kind: 'allergy',
    keys: ['allergic reaction', 'allergic to', 'reaction to my', 'reaction to the', 'rash after taking', 'swelling after taking'],
  },
]

function detectMedSafety(prompt: string): 'missed' | 'allergy' | undefined {
  const text = prompt.toLowerCase()
  return MED_SAFETY_PATTERNS.find((group) => group.keys.some((key) => text.includes(key)))?.kind
}

function fallbackReply(prompt: string, ctx: AiContext): string {
  const topic = prompt.trim().slice(0, 120)
  return `I don't have a specific answer for “${topic}”. Rather than invent one, here is what I can genuinely help with right now:

**Ask me about**
- Reading the structure of a health report, or what a term such as HbA1c or HDL means.
- Preparing questions for an upcoming visit.
- Building routines for sleep, movement, hydration or stress.
- Organising the medicines and appointments stored in this app.
- What is in your record library (${ctx.recordCount} item${ctx.recordCount === 1 ? '' : 's'}).

I always keep to general education rather than personal medical advice.

${demoFooter()}`
}

function matchIntent(prompt: string): Intent | undefined {
  const text = prompt.toLowerCase()
  let best: { intent: Intent; score: number } | undefined

  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((total, keyword) => (text.includes(keyword) ? total + keyword.length : total), 0)
    if (score > 0 && (!best || score > best.score)) best = { intent, score }
  }
  return best?.intent
}

/* ------------------------------------------------------------------ *
 * Small talk — greetings, thanks and "what can you do"
 * ------------------------------------------------------------------ */

const GREETING_WORDS = new Set([
  'hi', 'hii', 'hiii', 'hello', 'helo', 'hey', 'heya', 'yo', 'namaste', 'greetings', 'gm', 'hola',
])

const GREETING_PHRASES = [
  'good morning', 'good afternoon', 'good evening', 'good day', 'how are you', 'how are you doing',
  'how r u', "what's up", 'whats up',
]

/** The first word of a prompt, lower-cased and stripped of punctuation. */
function firstWord(prompt: string): string {
  return prompt.toLowerCase().replace(/[^a-z\s']/g, ' ').trim().split(/\s+/)[0] ?? ''
}

/** True for short greetings such as "hi", "hello" or "good morning". */
export function isGreeting(prompt: string): boolean {
  const text = prompt.toLowerCase().trim()
  if (!text) return false
  if (GREETING_PHRASES.some((phrase) => text.includes(phrase))) return true
  return GREETING_WORDS.has(firstWord(text))
}

function isThanks(prompt: string): boolean {
  const text = prompt.toLowerCase()
  if (!/\b(thanks|thank you|thankyou|thx|ty|appreciate it|cheers)\b/.test(text)) return false
  return text.split(/\s+/).length <= 5
}

function isCapabilitiesQuestion(prompt: string): boolean {
  return /(what can you do|how can you help|how do you help|what do you do|who are you|what are you|how can i use you|how to use you|help me|^help$)/.test(
    prompt.toLowerCase(),
  )
}

function greetingReply(ctx: AiContext): string {
  const name = ctx.userName?.trim().split(' ')[0]
  const hello = name ? `Hello, ${name}!` : 'Hello!'
  return `${hello} I'm the Health Copilot assistant. **How can I help you today?**

For example, I can:
- Talk through a symptom you describe — possible causes, the tests usually done, the medicines commonly discussed, and when to seek care.
- Explain a medicine and how it is normally taken.
- Explain a lab value you type in, such as HbA1c or LDL.
- Help you prepare for an appointment, or plan sleep, movement and stress routines.

Tell me what's on your mind, or type **help** to see everything I can do.${demoFooter()}`
}

function thanksReply(ctx: AiContext): string {
  const name = ctx.userName?.trim().split(' ')[0]
  return `You're very welcome${name ? `, ${name}` : ''} — I'm glad that was useful. Is there anything else you'd like to go through? I can look at another symptom, explain a medicine, or help you prepare for an appointment.${demoFooter()}`
}

function capabilitiesReply(ctx: AiContext): string {
  return `Here's everything I can help with. I give **general health education** — I never diagnose and never prescribe.

**Symptoms and conditions**
- Describe what you're feeling and I'll outline possible causes, the tests usually done, the medicines commonly discussed, and when to seek care.

**Medicines**
- Ask about a specific medicine (for example "what is metformin for?") and I'll explain what it does, how it is normally taken and what to watch for.
- Ask about a missed dose or an allergic reaction and I'll give the safe next step.

**Reports and values**
- Type a value you can see in a report — "HbA1c 7.2%" or "LDL 160 mg/dL" — and I'll explain it in plain language.

**Everyday health**
- Routines for sleep, movement, hydration and stress, and questions to bring to an appointment.

**Your app**
- I can see that you have ${ctx.recordCount} record${ctx.recordCount === 1 ? '' : 's'} and ${ctx.activeMedications} active medicine${ctx.activeMedications === 1 ? '' : 's'}, but I cannot open uploaded files.

For a medical emergency, call **112** (India) or your local emergency number.${demoFooter()}`
}

/** Classifies a message as greeting / thanks / capabilities, else null. */
export function smallTalkKind(prompt: string): 'greeting' | 'thanks' | 'capabilities' | null {
  if (isCapabilitiesQuestion(prompt)) return 'capabilities'
  if (isThanks(prompt)) return 'thanks'
  if (isGreeting(prompt)) return 'greeting'
  return null
}

function smallTalkReply(kind: 'greeting' | 'thanks' | 'capabilities', ctx: AiContext): string {
  if (kind === 'capabilities') return capabilitiesReply(ctx)
  if (kind === 'thanks') return thanksReply(ctx)
  return greetingReply(ctx)
}

/* ------------------------------------------------------------------ *
 * Health-problem knowledge: possible causes, tests, medicines
 * ------------------------------------------------------------------ */

interface Condition {
  id: string
  keywords: string[]
  label: string
  possibleCauses: string[]
  tests: string[]
  medicines: string[]
  selfCare: string[]
  redFlags: string[]
}

const CONDITIONS: Condition[] = [
  {
    id: 'fever',
    keywords: ['fever', 'feverish', 'high temperature', 'temperature', 'chills'],
    label: 'fever',
    possibleCauses: [
      'A common viral infection such as a cold or flu — by far the most frequent cause.',
      'A bacterial infection (throat, chest, urine or gut).',
      'Inflammation or an immune response.',
      'Heat exhaustion, or a reaction to a medicine (less common).',
    ],
    tests: [
      'A temperature check and a physical examination.',
      'Blood tests such as a full blood count and CRP/ESR if it lasts more than a few days.',
      'A urine test if a urinary infection is suspected.',
      'A throat swab or chest X-ray only if the clinician suspects it.',
    ],
    medicines: [
      'Paracetamol (acetaminophen) is the usual first choice to lower a fever and ease aches.',
      'Ibuprofen can be an alternative for many adults.',
      'Plenty of fluids, or an oral rehydration solution if sweating a lot.',
      'Antibiotics only if a bacterial cause is confirmed — they do nothing for viral fevers.',
    ],
    selfCare: [
      'Rest and drink fluids regularly through the day.',
      'Wear light clothing and keep the room comfortable.',
      'Check the temperature a few times a day and note the trend.',
    ],
    redFlags: [
      'A very high fever (above about 39.4°C / 103°F) or one that will not come down.',
      'A stiff neck, rash, confusion, or sensitivity to light.',
      'Difficulty breathing, or a fever lasting more than 3 days.',
    ],
  },
  {
    id: 'cold',
    keywords: ['cold', 'cough', 'flu', 'sneez', 'runny nose', 'congestion', 'sore throat', 'throat pain', 'phlegm'],
    label: 'a cold, cough or sore throat',
    possibleCauses: [
      'A common cold or flu — a viral infection that usually settles in 5–10 days.',
      'A throat infection (viral, or bacterial such as strep throat).',
      'Allergies or sinus congestion.',
      'A chest infection if the cough is deep and brings up phlegm.',
    ],
    tests: [
      'Usually none — a clinician can often diagnose by examination.',
      'A throat swab if strep throat is suspected.',
      'A chest X-ray if pneumonia is a concern.',
      'Blood tests only if symptoms are severe or prolonged.',
    ],
    medicines: [
      'Paracetamol or ibuprofen for aches and fever.',
      'Saline nasal drops or steam inhalation for congestion.',
      'Honey and warm fluids for a cough (never honey for infants under 1 year).',
      'Lozenges or a soothing gargle for a sore throat.',
      'Antibiotics do not help viral colds and are only used if a bacterial cause is found.',
    ],
    selfCare: [
      'Rest, warm fluids and honey.',
      'Keep the air humid and avoid smoke.',
      'Sleep propped up a little if your nose is blocked.',
    ],
    redFlags: [
      'Difficulty breathing, chest pain, or coughing up blood.',
      'A high fever that will not settle, or symptoms worsening after a week.',
      'Difficulty swallowing saliva, or drooling.',
    ],
  },
  {
    id: 'headache',
    keywords: ['headache', 'migraine', 'head ache', 'head pain'],
    label: 'a headache',
    possibleCauses: [
      'A tension headache — the most common, often linked to stress, posture or screens.',
      'A migraine — often one-sided, throbbing, with nausea or light sensitivity.',
      'Eye strain, dehydration, poor sleep or missed meals.',
      'Sinus congestion or a viral illness.',
      'Rarely, something more serious — a sudden “worst ever” headache needs urgent care.',
    ],
    tests: [
      'Usually none — the history and examination guide care.',
      'A blood-pressure check.',
      'An eye check if vision is involved.',
      'Imaging (CT or MRI) only if warning features are present.',
    ],
    medicines: [
      'Paracetamol or ibuprofen for simple headaches.',
      'Migraine-specific medicines can be prescribed by a clinician.',
      'Limit painkillers to avoid “overuse” headaches.',
      'For migraine, rest in a quiet, dark room.',
    ],
    selfCare: [
      'Hydrate, eat regularly and protect your sleep.',
      'Reduce screen glare and take breaks.',
      'Note what seems to trigger it.',
    ],
    redFlags: [
      'A sudden, severe “worst ever” headache.',
      'Headache with weakness, slurred speech, vision loss or confusion.',
      'Headache after a head injury, or with fever and a stiff neck.',
    ],
  },
  {
    id: 'stomach',
    keywords: ['stomach', 'abdominal', 'belly', 'indigestion', 'heartburn', 'acid', 'acidity', 'bloating', 'gastritis', 'reflux'],
    label: 'stomach or digestion trouble',
    possibleCauses: [
      'Indigestion or acid reflux — very common after certain foods.',
      'A short-lived stomach bug (gastroenteritis).',
      'Gas, bloating or constipation.',
      'A food intolerance.',
      'Less commonly, something that should be reviewed (persistent pain, blood, weight loss).',
    ],
    tests: [
      'Usually none at first.',
      'A stool test or blood tests if it persists.',
      'An H. pylori breath or stool test for recurring indigestion.',
      'An ultrasound or endoscopy only if the clinician thinks it is needed.',
    ],
    medicines: [
      'Antacids or acid-reducing medicines (such as omeprazole) for reflux — short courses.',
      'Paracetamol for pain; avoid anti-inflammatory painkillers if an ulcer is suspected.',
      'Oral rehydration solution if there is vomiting or diarrhoea.',
      'Antibiotics only if a specific infection is confirmed.',
    ],
    selfCare: [
      'Smaller, more frequent meals and avoid trigger foods.',
      'Limit alcohol, excess caffeine and late-night meals.',
      'Stay hydrated and avoid lying down right after eating.',
    ],
    redFlags: [
      'Severe or persistent abdominal pain, or a rigid, tender belly.',
      'Blood in vomit or in stool, or black stools.',
      'Unintentional weight loss, or difficulty swallowing.',
    ],
  },
  {
    id: 'gastro',
    keywords: ['nausea', 'vomit', 'diarrhea', 'diarrhoea', 'loose motion', 'stomach bug', 'gastro', 'food poisoning'],
    label: 'nausea, vomiting or diarrhoea',
    possibleCauses: [
      'A short-lived stomach bug (gastroenteritis) — the most common cause.',
      'Food that did not agree with you, or food poisoning.',
      'A reaction to a medicine.',
      'A urinary or other infection (less common).',
    ],
    tests: [
      'Usually none — most settle within 1–3 days.',
      'A stool test if there is blood, fever, or it lasts more than a few days.',
      'Blood tests if you are dehydrated or it is prolonged.',
      'A urine test in some cases.',
    ],
    medicines: [
      'Oral rehydration solution (ORS) is the single most important treatment.',
      'Zinc supplements can help children with diarrhoea.',
      'An anti-nausea medicine may be advised by a clinician.',
      'Avoid anti-diarrhoeal medicines if there is fever or blood — ask a clinician first.',
    ],
    selfCare: [
      'Sip ORS or clear fluids frequently.',
      'Eat light, bland food as tolerated.',
      'Wash your hands well to avoid spreading it.',
    ],
    redFlags: [
      'Signs of dehydration — very little urine, dizziness, dry mouth, sunken eyes.',
      'Blood in vomit or stool, or a high fever.',
      'Severe pain, or symptoms lasting more than a few days.',
    ],
  },
  {
    id: 'pain',
    keywords: ['back pain', 'joint pain', 'body ache', 'muscle', 'neck pain', 'knee pain', 'shoulder pain', 'pain', 'ache', 'aching', 'sore'],
    label: 'aches and pains',
    possibleCauses: [
      'Muscle strain or poor posture — very common.',
      'Overuse or a minor injury.',
      'Arthritis or inflammation.',
      'Nerve-related pain (for example sciatica).',
      'Pain referred from another area (less common).',
    ],
    tests: [
      'Usually none for short-lived mechanical pain.',
      'An X-ray or MRI only if there are warning features or it persists.',
      'Blood tests for inflammation or arthritis if suspected.',
      'Vitamin D and related tests are sometimes checked.',
    ],
    medicines: [
      'Paracetamol or ibuprofen for short-term relief.',
      'A muscle rub, or heat/ice packs.',
      'Avoid long-term painkillers without medical advice.',
      'Gentle movement is usually better than complete rest.',
    ],
    selfCare: [
      'Stay gently active rather than lying still for long.',
      'Use heat or cold packs on the sore area.',
      'Improve posture and desk/chair setup.',
    ],
    redFlags: [
      'Pain after a major injury, or you cannot bear weight.',
      'Numbness, weakness, or loss of bladder/bowel control.',
      'Pain with fever, or unexplained weight loss.',
    ],
  },
  {
    id: 'skin',
    keywords: ['rash', 'itch', 'itchy', 'allergy', 'allergic', 'hives', 'urticaria', 'skin', 'eczema', 'swelling', 'swollen'],
    label: 'a rash, itch or allergic reaction',
    possibleCauses: [
      'An allergic reaction (food, medicine, or something that touched the skin) — common.',
      'Eczema or dry skin.',
      'A skin infection (bacterial or fungal).',
      'Heat rash, or irritation from a product.',
    ],
    tests: [
      'Usually a visual examination.',
      'Allergy testing (skin prick or blood) if a trigger is unclear.',
      'A skin scraping or swab if an infection is suspected.',
      'Blood tests in some cases.',
    ],
    medicines: [
      'A non-sedating antihistamine for itching.',
      'A mild hydrocortisone cream for localised itch (short term).',
      'Moisturisers for dry or eczema-prone skin.',
      'Avoid the suspected trigger.',
    ],
    selfCare: [
      'Cool compresses to soothe the skin.',
      'Avoid scratching, and keep nails short.',
      'Use gentle, fragrance-free moisturiser.',
    ],
    redFlags: [
      'Swelling of the face, lips, tongue or throat, or difficulty breathing — this is an emergency.',
      'A rash that spreads quickly, blisters, or comes with a high fever.',
      'A rash with purple spots that do not fade when pressed.',
    ],
  },
  {
    id: 'dizziness',
    keywords: ['dizzy', 'dizziness', 'lightheaded', 'light headed', 'vertigo', 'giddy', 'faint'],
    label: 'dizziness or light-headedness',
    possibleCauses: [
      'Dehydration or standing up too quickly — very common.',
      'Low blood sugar or skipped meals.',
      'An inner-ear problem such as BPPV.',
      'Anaemia or low blood pressure.',
      'A side effect of a medicine.',
    ],
    tests: [
      'Blood pressure measured lying and standing.',
      'Blood tests (blood count, sugar, thyroid).',
      'An inner-ear assessment if it is vertigo.',
      'An ECG if a heart-rhythm cause is suspected.',
    ],
    medicines: [
      'Treatment depends on the cause — a clinician decides.',
      'An antihistamine or a specific vertigo medicine may be prescribed for inner-ear causes.',
      'Correcting dehydration or anaemia if found.',
    ],
    selfCare: [
      'Stand up slowly and hold on to something steady.',
      'Stay hydrated and eat regular meals.',
      'Avoid driving or heights while you feel dizzy.',
    ],
    redFlags: [
      'Dizziness with chest pain, palpitations, or fainting.',
      'Sudden weakness, slurred speech or vision loss.',
      'A head injury followed by dizziness.',
    ],
  },
  {
    id: 'constipation',
    keywords: ['constipation', 'constipated', 'hard stool', 'not passing stool', 'bowel'],
    label: 'constipation',
    possibleCauses: [
      'Low fibre or low fluid intake — common.',
      'Low activity or a change in routine.',
      'A side effect of a medicine.',
      'Irritable bowel, or a thyroid issue (less common).',
    ],
    tests: [
      'Usually none at first.',
      'Blood tests (thyroid, calcium) if it persists.',
      'A stool test or colon review if there is bleeding or weight loss.',
    ],
    medicines: [
      'Fibre supplements (such as ispaghula) and stool softeners.',
      'A short course of a laxative if advised by a clinician.',
      'Adequate fluids and fibre.',
    ],
    selfCare: [
      'More fibre — fruit, vegetables and whole grains.',
      'More water and daily movement.',
      'Go when you feel the urge rather than holding on.',
    ],
    redFlags: [
      'Blood in the stool, or black stools.',
      'Severe pain, vomiting, or a swollen abdomen.',
      'Unexplained weight loss, or constipation lasting weeks.',
    ],
  },
]

function matchCondition(prompt: string): Condition | undefined {
  const text = prompt.toLowerCase()
  let best: { condition: Condition; score: number } | undefined
  for (const condition of CONDITIONS) {
    const score = condition.keywords.reduce(
      (total, keyword) => (text.includes(keyword) ? total + keyword.length : total),
      0,
    )
    if (score > 0 && (!best || score > best.score)) best = { condition, score }
  }
  return best?.condition
}

/* ------------------------------------------------------------------ *
 * Report values — plain-language explanations for common markers
 * ------------------------------------------------------------------ */

interface ReportMarker {
  keys: string[]
  name: string
  about: string
  high: string
  low: string
}

const REPORT_MARKERS: ReportMarker[] = [
  {
    keys: ['haemoglobin', 'hemoglobin'],
    name: 'Haemoglobin (Hb)',
    about: 'the oxygen-carrying protein in red blood cells.',
    high: 'can occur with dehydration or some blood conditions.',
    low: 'often points to anaemia (low iron, B12 or blood loss) — very treatable.',
  },
  {
    keys: ['wbc', 'white blood cell', 'leucocyte', 'leukocyte'],
    name: 'White cell count (WBC)',
    about: 'cells that help fight infection.',
    high: 'often a sign of infection or inflammation.',
    low: 'can follow some viral illnesses or medicines.',
  },
  {
    keys: ['platelet'],
    name: 'Platelets',
    about: 'cells that help blood to clot.',
    high: 'can occur with inflammation or iron deficiency.',
    low: 'may raise bleeding or bruising risk and needs review.',
  },
  {
    keys: ['hba1c', 'a1c', 'glycated'],
    name: 'HbA1c',
    about: 'your average blood sugar over roughly the last 3 months.',
    high: 'suggests higher long-term blood sugar (6.5% or more is in the diabetes range).',
    low: 'is uncommon — check with your clinician.',
  },
  {
    keys: ['fasting glucose', 'fasting sugar', 'blood sugar', 'glucose'],
    name: 'Blood glucose',
    about: 'the sugar level in your blood at the time of the test.',
    high: 'may indicate raised blood sugar; a repeat or confirmatory test is usual.',
    low: 'can cause shakiness or sweating and should be reviewed.',
  },
  {
    keys: ['total cholesterol', 'cholesterol'],
    name: 'Total cholesterol',
    about: 'all cholesterol measured together.',
    high: 'is linked to cardiovascular risk over time.',
    low: 'is usually not a concern.',
  },
  {
    keys: ['ldl'],
    name: 'LDL cholesterol',
    about: 'often called “bad” cholesterol.',
    high: 'is linked to cardiovascular risk; diet and medicines can lower it.',
    low: 'is generally favourable.',
  },
  {
    keys: ['hdl'],
    name: 'HDL cholesterol',
    about: 'often called “good” cholesterol.',
    high: 'is usually protective.',
    low: 'may add to cardiovascular risk.',
  },
  {
    keys: ['triglyceride'],
    name: 'Triglycerides',
    about: 'a type of blood fat.',
    high: 'is linked to diet, alcohol and metabolic health.',
    low: 'is usually not a concern.',
  },
  {
    keys: ['creatinine'],
    name: 'Creatinine',
    about: 'a waste product filtered by the kidneys.',
    high: 'can indicate reduced kidney filtration (or dehydration).',
    low: 'is often related to muscle mass and usually not a concern.',
  },
  {
    keys: ['egfr', 'gfr'],
    name: 'eGFR',
    about: 'an estimate of how well the kidneys are filtering.',
    high: 'is usually fine.',
    low: 'suggests reduced kidney function and needs review.',
  },
  {
    keys: ['sgpt', 'sgot', 'liver enzyme', 'alanine', 'aspartate'],
    name: 'Liver enzymes (ALT/SGPT, AST/SGOT)',
    about: 'enzymes that can indicate liver irritation.',
    high: 'can follow fatty liver, alcohol or some medicines.',
    low: 'is usually not significant.',
  },
  {
    keys: ['tsh'],
    name: 'TSH',
    about: 'the signal that controls thyroid hormone.',
    high: 'often suggests an underactive thyroid.',
    low: 'often suggests an overactive thyroid.',
  },
  {
    keys: ['vitamin d', '25-oh'],
    name: 'Vitamin D',
    about: 'important for bones and muscles.',
    high: 'is rare.',
    low: 'is very common — supplements are usually advised.',
  },
  {
    keys: ['b12', 'cobalamin'],
    name: 'Vitamin B12',
    about: 'needed for healthy nerves and blood.',
    high: 'is usually from supplements.',
    low: 'can cause tiredness or tingling and is easily treated.',
  },
  {
    keys: ['ferritin', 'iron'],
    name: 'Iron / ferritin',
    about: 'your body’s iron stores.',
    high: 'can rise with inflammation.',
    low: 'suggests low iron stores — a common, treatable cause of tiredness.',
  },
  {
    keys: ['crp', 'c-reactive'],
    name: 'CRP',
    about: 'a general marker of inflammation.',
    high: 'suggests inflammation or infection somewhere in the body.',
    low: 'is reassuring.',
  },
  {
    keys: ['esr'],
    name: 'ESR',
    about: 'another general marker of inflammation.',
    high: 'can rise with infection, inflammation or anaemia.',
    low: 'is usually fine.',
  },
  {
    keys: ['uric acid'],
    name: 'Uric acid',
    about: 'linked to gout and how the kidneys handle waste.',
    high: 'may raise gout risk; diet and medicines help.',
    low: 'is usually not a concern.',
  },
]

const REPORT_HINTS = [
  'report',
  'blood test',
  'lab result',
  'test result',
  'results',
  'cbc',
  'lipid profile',
  'thyroid',
  'hba1c',
  'cholesterol',
  'creatinine',
  'haemoglobin',
  'hemoglobin',
  'fasting',
  'sugar level',
  'mg/dl',
  'g/dl',
  'mmol',
]

function findReportMarkers(prompt: string): ReportMarker[] {
  const text = prompt.toLowerCase()
  return REPORT_MARKERS.filter((marker) => marker.keys.some((key) => text.includes(key)))
}

function mentionsReport(prompt: string): boolean {
  const text = prompt.toLowerCase()
  return REPORT_HINTS.some((hint) => text.includes(hint))
}

/* ------------------------------------------------------------------ *
 * Medication knowledge (built-in educational reference)
 *
 * This is a hand-written educational summary, NOT a live feed from a
 * regulator or drug database. Every reply carries its verification status
 * so the user always knows it is general information to confirm with a
 * pharmacist or clinician — never a prescription or a dose instruction.
 * ------------------------------------------------------------------ */

interface Medicine {
  names: string[]
  generic: string
  brands: string[]
  ingredient: string
  uses: string[]
  howItWorks: string
  sideEffects: string[]
  warningSigns: string[]
  precautions: string[]
  interactions: string[]
  questions: string[]
}

const MEDICINES: Medicine[] = [
  {
    names: ['paracetamol', 'acetaminophen', 'crocin', 'dolo', 'calpol', 'tylenol'],
    generic: 'Paracetamol (acetaminophen)',
    brands: ['Crocin', 'Dolo 650', 'Calpol', 'Tylenol'],
    ingredient: 'Paracetamol',
    uses: ['Lowering fever', 'Mild to moderate pain such as headache, body ache or toothache'],
    howItWorks:
      'It acts mainly on the brain’s pain and temperature centres to reduce pain and fever. It is not an anti-inflammatory, so it does little for swelling.',
    sideEffects: ['Usually well tolerated', 'Occasional nausea', 'Occasional skin rash'],
    warningSigns: [
      'Taking too much can seriously harm the liver — accidental overdose is the main danger.',
      'Signs of a severe allergic reaction (swelling, rash, breathing difficulty) need urgent care.',
    ],
    precautions: [
      'Do not exceed the dose on the label; many products also contain paracetamol, so check before combining.',
      'Use lower maximum doses with liver disease or heavy alcohol use.',
    ],
    interactions: [
      'Warfarin (may affect blood clotting)',
      'Other paracetamol-containing medicines (risk of double dosing)',
      'Alcohol (adds to liver risk)',
    ],
    questions: ['What is the maximum daily dose that is safe for me?', 'Do any of my other medicines already contain paracetamol?'],
  },
  {
    names: ['ibuprofen', 'brufen', 'advil', 'combiflam', 'nurofen'],
    generic: 'Ibuprofen',
    brands: ['Brufen', 'Advil', 'Combiflam (with paracetamol)'],
    ingredient: 'Ibuprofen',
    uses: ['Pain and inflammation (period pain, joint and muscle pain)', 'Fever'],
    howItWorks:
      'It is a non-steroidal anti-inflammatory drug (NSAID). It blocks prostaglandins, chemicals the body makes during inflammation, which is why it helps swelling as well as pain.',
    sideEffects: ['Stomach upset, heartburn or nausea', 'Fluid retention', 'Headache', 'Dizziness'],
    warningSigns: [
      'Black, tarry stools or vomiting blood — possible stomach bleeding.',
      'Severe stomach pain, or breathing difficulty in people with asthma.',
      'Reduced urine or swelling — possible kidney strain.',
    ],
    precautions: [
      'Take with or after food to protect the stomach.',
      'Avoid with a stomach ulcer, kidney disease or heart failure.',
      'Caution in pregnancy, especially the third trimester.',
    ],
    interactions: [
      'Blood thinners such as warfarin or aspirin (bleeding risk)',
      'Other NSAIDs',
      'Some blood-pressure medicines (ACE inhibitors, diuretics)',
      'Steroids, lithium and methotrexate',
    ],
    questions: ['Is an anti-inflammatory safe with my stomach, kidneys and heart?', 'Should I take it with food, and for how many days?'],
  },
  {
    names: ['amoxicillin', 'amoxil', 'mox'],
    generic: 'Amoxicillin',
    brands: ['Amoxil', 'Mox'],
    ingredient: 'Amoxicillin',
    uses: ['Certain bacterial infections — ear, chest, throat, dental and urinary'],
    howItWorks:
      'A penicillin-type antibiotic. It kills bacteria by breaking down their cell wall. It does nothing for viral illnesses such as colds or flu.',
    sideEffects: ['Diarrhoea', 'Nausea', 'Skin rash', 'Oral or vaginal thrush'],
    warningSigns: [
      'Severe allergic reaction — swelling of the face, lips or throat, or breathing difficulty.',
      'A widespread or blistering rash.',
    ],
    precautions: [
      'Finish the course exactly as prescribed, even if you feel better.',
      'Tell your clinician about any penicillin or antibiotic allergy.',
    ],
    interactions: ['Methotrexate', 'Allopurinol (increases rash risk)', 'Warfarin'],
    questions: ['How many days should I take it, and what if I miss a dose?', 'Do I have any penicillin allergy on record?'],
  },
  {
    names: ['azithromycin', 'azee', 'zithromax', 'zpack'],
    generic: 'Azithromycin',
    brands: ['Azee', 'Zithromax'],
    ingredient: 'Azithromycin',
    uses: ['Certain respiratory, throat and skin infections'],
    howItWorks:
      'A macrolide antibiotic that stops bacteria from making the proteins they need to grow.',
    sideEffects: ['Nausea', 'Diarrhoea', 'Stomach pain', 'Headache'],
    warningSigns: ['Palpitations, fainting or an irregular heartbeat (rare heart-rhythm effect).'],
    precautions: [
      'Finish the course as prescribed.',
      'Caution if you have a heart-rhythm condition or low potassium/magnesium.',
    ],
    interactions: ['Some heart-rhythm medicines', 'Antacids (separate the timing)', 'Warfarin'],
    questions: ['Is this safe with my heart medicines?', 'How should I time it around antacids?'],
  },
  {
    names: ['omeprazole', 'losec', 'prilosec'],
    generic: 'Omeprazole',
    brands: ['Losec', 'Prilosec'],
    ingredient: 'Omeprazole',
    uses: ['Acid reflux and heartburn', 'Stomach and duodenal ulcers', 'Protecting the stomach with some medicines'],
    howItWorks:
      'A proton-pump inhibitor (PPI). It reduces the amount of acid the stomach makes, letting irritation heal.',
    sideEffects: ['Headache', 'Tummy pain', 'Diarrhoea or constipation', 'Wind'],
    warningSigns: [
      'Difficulty swallowing, vomiting blood, black stools or unexplained weight loss — these need urgent review, not acid medicine.',
    ],
    precautions: [
      'Often used in short courses; long-term use should be reviewed with your clinician.',
      'Can reduce absorption of some nutrients over many years.',
    ],
    interactions: ['Clopidogrel', 'Some antifungals', 'Iron and vitamin B12 absorption over time'],
    questions: ['How long should I take this, and can I stop it later?', 'Could my symptoms need a test instead of acid medicine?'],
  },
  {
    names: ['metformin', 'glucophage', 'glycomet'],
    generic: 'Metformin',
    brands: ['Glucophage', 'Glycomet'],
    ingredient: 'Metformin hydrochloride',
    uses: ['Type 2 diabetes — lowering blood sugar'],
    howItWorks:
      'It reduces the amount of glucose the liver releases and helps the body respond better to its own insulin. It does not usually cause low blood sugar on its own.',
    sideEffects: ['Nausea', 'Diarrhoea', 'Tummy upset', 'Metallic taste (often improves over weeks)'],
    warningSigns: [
      'Very rarely, a serious build-up of acid (lactic acidosis) — unusual muscle pain, breathing difficulty or severe drowsiness needs urgent care.',
    ],
    precautions: [
      'Kidney function is usually checked before and during use.',
      'You may be advised to pause it during severe illness, dehydration or before a contrast scan.',
    ],
    interactions: ['Alcohol', 'Some diuretics', 'Contrast media used in scans'],
    questions: ['When should I pause this if I get very unwell?', 'How do we know my kidneys are safe on this?'],
  },
  {
    names: ['amlodipine', 'norvasc', 'amlopres'],
    generic: 'Amlodipine',
    brands: ['Norvasc', 'Amlopres'],
    ingredient: 'Amlodipine',
    uses: ['High blood pressure', 'Angina (chest pain from the heart)'],
    howItWorks:
      'A calcium-channel blocker. It relaxes and widens blood vessels so the heart does not have to work as hard.',
    sideEffects: ['Ankle swelling', 'Flushing', 'Headache', 'Dizziness'],
    warningSigns: ['Severe dizziness or fainting.'],
    precautions: ['Stand up slowly, especially when starting.', 'Do not stop suddenly without advice.'],
    interactions: ['Some statins (for example simvastatin)', 'Other blood-pressure medicines'],
    questions: ['What is my target blood pressure on this medicine?', 'What should I do if I feel dizzy?'],
  },
  {
    names: ['atorvastatin', 'lipitor', 'storvas'],
    generic: 'Atorvastatin',
    brands: ['Lipitor', 'Storvas'],
    ingredient: 'Atorvastatin',
    uses: ['High cholesterol', 'Lowering the long-term risk of heart attack and stroke'],
    howItWorks:
      'A statin. It reduces cholesterol production in the liver and helps clear LDL ("bad") cholesterol from the blood.',
    sideEffects: ['Muscle aches', 'Tummy upset', 'Headache'],
    warningSigns: [
      'Unexplained muscle pain or weakness with dark urine — a rare muscle problem that needs prompt review.',
    ],
    precautions: ['Tell your clinician about any new muscle symptoms.', 'Liver tests are sometimes checked.'],
    interactions: ['Grapefruit juice', 'Some antibiotics and antifungals', 'Other cholesterol medicines'],
    questions: ['What cholesterol target are we aiming for?', 'Should I report muscle aches, and how quickly?'],
  },
  {
    names: ['cetirizine', 'zyrtec', 'alerid'],
    generic: 'Cetirizine',
    brands: ['Zyrtec', 'Alerid'],
    ingredient: 'Cetirizine',
    uses: ['Hay fever and allergies', 'Itching and hives'],
    howItWorks: 'An antihistamine. It blocks histamine, the chemical the body releases during an allergic reaction.',
    sideEffects: ['Drowsiness (usually mild)', 'Dry mouth', 'Headache'],
    warningSigns: ['A severe allergic reaction with swelling or breathing difficulty is an emergency — dial 112.'],
    precautions: ['See how it affects you before driving.', 'Avoid alcohol and other sedatives.'],
    interactions: ['Alcohol', 'Sedatives and sleep medicines'],
    questions: ['Will this make me sleepy while driving?', 'Is there a non-sedating option for daytime?'],
  },
  {
    names: ['salbutamol', 'albuterol', 'ventolin', 'asthalin'],
    generic: 'Salbutamol (albuterol)',
    brands: ['Ventolin', 'Asthalin'],
    ingredient: 'Salbutamol sulphate',
    uses: ['Asthma and wheeze — a "reliever" inhaler that opens the airways quickly'],
    howItWorks: 'It relaxes the muscles around the airways so they open up within minutes.',
    sideEffects: ['Shaky hands', 'Fast heartbeat', 'Headache (usually mild and short-lived)'],
    warningSigns: [
      'Needing the inhaler much more often than usual, or it not working — this may be an asthma attack and needs urgent care.',
    ],
    precautions: ['This is a reliever; if you need it often, ask about a preventer inhaler.', 'Learn and use the correct inhaler technique.'],
    interactions: ['Beta-blockers (can reduce its effect)', 'Some diuretics'],
    questions: ['How often is too often to use this?', 'Do I need a preventer inhaler as well?'],
  },
  {
    names: ['levothyroxine', 'eltroxin', 'synthroid', 'thyronorm'],
    generic: 'Levothyroxine',
    brands: ['Eltroxin', 'Thyronorm', 'Synthroid'],
    ingredient: 'Levothyroxine sodium',
    uses: ['An underactive thyroid (hypothyroidism)'],
    howItWorks: 'It replaces the thyroid hormone your body is not making enough of.',
    sideEffects: ['Usually arise if the dose is too high — palpitations, weight loss, sweating, irritability'],
    warningSigns: ['Chest pain or a racing, irregular heartbeat — seek prompt advice.'],
    precautions: [
      'Take on an empty stomach at a consistent time.',
      'Separate iron, calcium and antacids by about 4 hours.',
    ],
    interactions: ['Iron and calcium supplements', 'Antacids', 'Some PPIs', 'Warfarin'],
    questions: ['When exactly should I take it, and how long before breakfast?', 'When is my next thyroid blood test?'],
  },
  {
    names: ['losartan', 'cozaar', 'losar'],
    generic: 'Losartan',
    brands: ['Cozaar', 'Losar'],
    ingredient: 'Losartan potassium',
    uses: ['High blood pressure', 'Protecting the kidneys in diabetes'],
    howItWorks: 'An angiotensin receptor blocker (ARB). It relaxes blood vessels so blood pressure falls.',
    sideEffects: ['Dizziness', 'Tiredness', 'Headache'],
    warningSigns: ['Rare swelling of the lips, face or tongue (angioedema) — treat as urgent.'],
    precautions: ['Avoid in pregnancy.', 'Avoid potassium supplements unless advised.'],
    interactions: ['Potassium supplements', 'NSAIDs like ibuprofen', 'Lithium'],
    questions: ['Should my kidney function and potassium be checked?', 'Is this safe if I might become pregnant?'],
  },
  {
    names: ['ors', 'oral rehydration', 'electrolyte'],
    generic: 'Oral rehydration salts (ORS)',
    brands: ['ORS sachets', 'Electral'],
    ingredient: 'Glucose and salts (sodium, potassium, citrate)',
    uses: ['Replacing water and salts lost through diarrhoea or vomiting', 'Preventing dehydration'],
    howItWorks: 'The sugar helps the gut absorb water and salts more effectively than plain water alone.',
    sideEffects: ['Generally well tolerated'],
    warningSigns: ['Signs of severe dehydration — very little urine, dizziness, sunken eyes — need urgent care.'],
    precautions: ['Mix exactly as the packet says; too strong or too weak is less effective.', 'Use clean water.'],
    interactions: ['None significant as a simple replacement fluid.'],
    questions: ['How much should I drink, and how do I know I am rehydrated?'],
  },
]

function findMedicine(prompt: string): Medicine | undefined {
  const text = prompt.toLowerCase()
  return MEDICINES.find((medicine) => medicine.names.some((name) => text.includes(name)))
}

/* ------------------------------------------------------------------ *
 * Source references (links only — never invented citations)
 * ------------------------------------------------------------------ */

interface Source {
  label: string
  url: string
}

const TOPIC_SOURCES: { keys: string[]; sources: Source[] }[] = [
  {
    keys: [
      'headache', 'migraine', 'fever', 'cold', 'cough', 'sore throat', 'flu', 'stomach',
      'nausea', 'vomit', 'diarrhea', 'diarrhoea', 'pain', 'rash', 'itch', 'allergy', 'dizzy',
      'constipation', 'symptom', 'sick',
    ],
    sources: [
      { label: 'MedlinePlus — Medical Encyclopedia (US National Library of Medicine)', url: 'https://medlineplus.gov/encyclopedia.html' },
      { label: 'World Health Organization — Health topics', url: 'https://www.who.int/health-topics' },
      { label: 'NHS — Health A to Z (UK)', url: 'https://www.nhs.uk/conditions/' },
    ],
  },
  {
    keys: [
      'medicine', 'medication', 'tablet', 'drug', 'dose', 'paracetamol', 'ibuprofen',
      'amoxicillin', 'azithromycin', 'metformin', 'omeprazole', 'statin', 'atorvastatin',
      'amlodipine', 'cetirizine', 'salbutamol', 'levothyroxine', 'losartan', 'antibiotic', 'ors',
    ],
    sources: [
      { label: 'MedlinePlus — Drugs, Herbs and Supplements', url: 'https://medlineplus.gov/druginformation.html' },
      { label: 'DailyMed — official US drug labels (NLM)', url: 'https://dailymed.nlm.nih.gov/dailymed/' },
      { label: 'US FDA — Drugs@FDA', url: 'https://www.accessdata.fda.gov/scripts/cder/daf/' },
    ],
  },
  {
    keys: [
      'report', 'lab', 'blood test', 'hba1c', 'cholesterol', 'creatinine', 'glucose', 'thyroid',
      'tsh', 'haemoglobin', 'hemoglobin', 'ldl', 'hdl', 'test result',
    ],
    sources: [
      { label: 'MedlinePlus — Medical Tests', url: 'https://medlineplus.gov/lab-tests/' },
      { label: 'World Health Organization — Diagnostics', url: 'https://www.who.int/health-topics/diagnostics' },
    ],
  },
]

function sourcesFor(prompt: string): Source[] {
  const text = prompt.toLowerCase()
  const found: Source[] = []
  for (const group of TOPIC_SOURCES) {
    if (group.keys.some((key) => text.includes(key))) {
      for (const source of group.sources) {
        if (!found.some((existing) => existing.url === source.url)) found.push(source)
      }
    }
  }
  return found
}

function sourcesBlock(sources: Source[]): string {
  if (sources.length === 0) {
    return `**Sources**\nI do not have a specific reference to attach to this reply. For reliable, up-to-date information, use MedlinePlus (https://medlineplus.gov), the World Health Organization (https://www.who.int) or your national health service.`
  }
  return `**Sources (general reading — not personal advice)**\n${sources
    .map((source) => `- [${source.label}](${source.url})`)
    .join('\n')}`
}

/** Follow-up questions the checker asks when a description is thin. */
const FOLLOW_UP_QUESTIONS = [
  'When did it start, and is it getting better, worse or staying the same?',
  'How severe is it on a scale of 1 to 10?',
  'Is there anything else with it — fever, weight change, a rash, or feeling very tired?',
  'Do you have any long-term conditions, allergies, or medicines you take regularly?',
  'Has anything like this happened before, and what helped then?',
]

/* ------------------------------------------------------------------ *
 * Providers
 * ------------------------------------------------------------------ */

function simulateLatency(): Promise<void> {
  const ms = 550 + Math.random() * 700
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function askDemo(prompt: string, context: AiContext): Promise<string> {
  await simulateLatency()

  // 1. Emergency — deterministic and always first, never delegated to a model.
  if (isEmergency(prompt)) {
    return emergencyReply()
  }

  // 2. Medication safety questions take priority over general symptom answers.
  const medSafety = detectMedSafety(prompt)
  if (medSafety === 'missed') return missedDoseReply()
  if (medSafety === 'allergy') return allergicReactionReply()

  // 3. Report values the user typed — explain them value by value.
  const markers = findReportMarkers(prompt)
  if (markers.length > 0) {
    return reportReply(markers, prompt)
  }

  // 4. A specific, recognised medicine → Medication Explainer.
  const medicine = findMedicine(prompt)
  if (medicine) {
    return medicationReply(medicine)
  }

  const intent = matchIntent(prompt)
  const isHealthProblem = mentionsHealthProblem(prompt)

  // 5. A described health problem → structured Symptom Checker reply.
  if (isHealthProblem) {
    return symptomCheckerReply(prompt, matchCondition(prompt))
  }

  // 6. Greetings, thanks and "what can you do" — friendly small talk, so a
  //    simple "hi" gets a warm reply instead of the "no answer" fallback.
  const smallTalk = smallTalkKind(prompt)
  if (smallTalk) return smallTalkReply(smallTalk, context)

  if (intent) {
    return intent.build(context)
  }
  if (mentionsReport(prompt)) {
    return reportReply([], prompt)
  }
  return fallbackReply(prompt, context)
}

interface RemotePayload {
  reply?: string
  content?: string
  message?: string
}

async function askRemote(prompt: string, history: ChatMessage[]): Promise<string> {
  const messages = history
    .slice(-10)
    .map((message) => ({ role: message.role, content: message.content }))
  // The caller may already include the current user turn in `history`; only add
  // it when it is missing so the model never receives the same prompt twice.
  const last = messages[messages.length - 1]
  if (!(last && last.role === 'user' && last.content === prompt)) {
    messages.push({ role: 'user', content: prompt })
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL || undefined,
      messages,
      // The server is responsible for its own system prompt and safety layer.
    }),
  })

  if (!response.ok) {
    throw new Error(`The configured AI endpoint responded with status ${response.status}.`)
  }

  const payload = (await response.json()) as RemotePayload
  const text = payload.reply ?? payload.content ?? payload.message
  if (!text) throw new Error('The configured AI endpoint returned an empty response.')
  return text
}

export const aiService = {
  getProviderInfo(): AiProviderInfo {
    const isRemote = PROVIDER_ID === 'remote' && ENDPOINT.length > 0
    return {
      id: isRemote ? 'remote' : 'demo',
      label: isRemote ? 'Configured remote provider' : 'Built-in health assistant',
      isDemo: !isRemote,
      model: MODEL || undefined,
      endpointConfigured: ENDPOINT.length > 0,
      setupGuide: SETUP_GUIDE,
    }
  },

  getSuggestedQuestions(): string[] {
    return [...SUGGESTED_QUESTIONS]
  },

  /**
   * Returns an assistant reply. Falls back to the demo library if a remote
   * endpoint is configured but unavailable, and always marks demo responses.
   */
  async ask(prompt: string, history: ChatMessage[], context: AiContext): Promise<AiReply> {
    // Deterministic safety: an emergency never depends on a model's judgement,
    // so this runs before any provider call, configured or not.
    if (isEmergency(prompt)) {
      return { content: emergencyReply(), isDemo: true }
    }

    const info = this.getProviderInfo()

    if (info.isDemo) {
      return { content: await askDemo(prompt, context), isDemo: true }
    }

    try {
      return { content: await askRemote(prompt, history), isDemo: false }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error'
      const fallback = await askDemo(prompt, context)
      return {
        content: `_The configured AI service could not be reached, so this reply comes from the built-in assistant._\n\n_(${reason})_\n\n${fallback}`,
        isDemo: true,
      }
    }
  },

  /** Derives a short thread title from the first user message. */
  titleFromPrompt(prompt: string): string {
    const clean = prompt.replace(/\s+/g, ' ').trim()
    if (!clean) return 'New conversation'
    return clean.length > 46 ? `${clean.slice(0, 46)}…` : clean
  },
}

/* ------------------------------------------------------------------ *
 * Exposed for reuse and unit testing (pure, side-effect-free helpers).
 * ------------------------------------------------------------------ */
export {
  matchCondition,
  findReportMarkers,
  mentionsReport,
  findMedicine,
  mentionsHealthProblem,
  sourcesFor,
  detectMedSafety,
}
