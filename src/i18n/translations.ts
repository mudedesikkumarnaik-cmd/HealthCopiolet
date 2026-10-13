/**
 * Lightweight in-app translations.
 *
 * There is no i18n library here on purpose — the dictionary is small and the
 * lookup is a plain object access. English text is used as the lookup key, so
 * any string that has not been translated yet simply falls back to English.
 *
 * Supported languages: English, Hindi, Telugu, Tamil.
 */

export type Locale = 'en' | 'hi' | 'te' | 'ta'

export interface SupportedLanguage {
  code: Locale
  /** Native name, shown in the language picker. */
  label: string
  /** English name, used for the document `lang` attribute and mapping. */
  english: string
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English', english: 'English' },
  { code: 'hi', label: 'हिन्दी', english: 'Hindi' },
  { code: 'te', label: 'తెలుగు', english: 'Telugu' },
  { code: 'ta', label: 'தமிழ்', english: 'Tamil' },
]

/** Maps a stored language label (e.g. "English (India)", "हिन्दी") to a locale. */
export function resolveLocale(language: string | undefined | null): Locale {
  const value = (language ?? '').toLowerCase()
  if (value.includes('telugu') || (language ?? '').includes('తెలు')) return 'te'
  if (
    value.includes('hindi') ||
    (language ?? '').includes('हिन्दी') ||
    (language ?? '').includes('हिंदी')
  ) {
    return 'hi'
  }
  if (value.includes('tamil') || (language ?? '').includes('தமிழ்')) return 'ta'
  return 'en'
}

/** Returns the native label to store for a locale code. */
export function languageLabel(code: Locale): string {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? 'English'
}

export const DEFAULT_LOCALE: Locale = 'en'

type Dictionary = Record<string, string>

/**
 * Translation dictionaries keyed by the English source string. English itself
 * is intentionally empty — the lookup returns the key unchanged, so untranslated
 * text always renders in English instead of breaking.
 */
export const translations: Record<Locale, Dictionary> = {
  en: {},

  hi: {
    // Navigation & shell
    Dashboard: 'डैशबोर्ड',
    'AI Health Assistant': 'एआई स्वास्थ्य सहायक',
    'Medical Records': 'चिकित्सा रिकॉर्ड',
    Prescriptions: 'नुस्खे',
    Appointments: 'अपॉइंटमेंट',
    'Health Analytics': 'स्वास्थ्य विश्लेषण',
    'Wellness & Goals': 'स्वास्थ्य और लक्ष्य',
    Profile: 'प्रोफ़ाइल',
    Settings: 'सेटिंग्स',
    'Help & Support': 'सहायता और समर्थन',
    Overview: 'अवलोकन',
    Patients: 'मरीज़',
    Requests: 'अनुरोध',
    'Patient reports': 'मरीज़ रिपोर्ट',
    Account: 'खाता',
    Logout: 'लॉग आउट',
    'Practice portal': 'प्रैक्टिस पोर्टल',
    'Personal health': 'व्यक्तिगत स्वास्थ्य',
    'Your health space': 'आपका स्वास्थ्य स्थान',
    'Your practice': 'आपकी प्रैक्टिस',
    'Your records, medicines and routines stay private to your account.':
      'आपके रिकॉर्ड, दवाइयाँ और दिनचर्या आपके खाते तक ही सीमित रहते हैं।',
    'Patients, records and visits for your practice — private to your account.':
      'आपकी प्रैक्टिस के मरीज़, रिकॉर्ड और विज़िट — आपके खाते तक ही सीमित।',
    Unread: 'अपठित',
    Visits: 'विज़िट',
    Pending: 'लंबित',
    'Search…': 'खोजें…',
    Notifications: 'सूचनाएँ',
    Doctor: 'डॉक्टर',
    Patient: 'मरीज़',
    'Skip to main content': 'मुख्य सामग्री पर जाएँ',
    'Open navigation menu': 'नेविगेशन मेन्यू खोलें',
    'Open account menu': 'खाता मेन्यू खोलें',
    'Close navigation': 'नेविगेशन बंद करें',
    'Open search (Control K)': 'खोज खोलें (Control K)',
    'Switch to light theme': 'लाइट थीम पर स्विच करें',
    'Switch to dark theme': 'डार्क थीम पर स्विच करें',

    // Settings
    Preferences: 'प्राथमिकताएँ',
    'Appearance, notifications and privacy options. Preferences are saved in this browser only.':
      'रूप-रंग, सूचनाएँ और गोपनीयता विकल्प। प्राथमिकताएँ केवल इस ब्राउज़र में सहेजी जाती हैं।',
    Appearance: 'रूप-रंग',
    'How the app looks on your screen.': 'आपकी स्क्रीन पर ऐप कैसा दिखता है।',
    Language: 'भाषा',
    'Choose the language for the whole app — for patients and doctors alike.':
      'पूरे ऐप की भाषा चुनें — मरीज़ों और डॉक्टरों दोनों के लिए।',
    Theme: 'थीम',
    Light: 'लाइट',
    Dark: 'डार्क',
    System: 'सिस्टम',
    'Reduce motion': 'गति कम करें',
    'Minimises animations and transitions across the app.': 'ऐप में एनिमेशन और बदलाव कम करता है।',
    'Large text': 'बड़ा टेक्स्ट',
    'Increases the base font size for easier reading.': 'पढ़ने में आसानी के लिए फ़ॉन्ट का आकार बढ़ाता है।',
    'High-contrast links': 'उच्च-कंट्रास्ट लिंक',
    'Underlines links and emphasises buttons for clearer navigation.':
      'स्पष्ट नेविगेशन के लिए लिंक को रेखांकित करता है और बटन को उजागर करता है।',
    'In-app notifications shown inside the app. No email, SMS or push notifications are ever sent.':
      'ऐप के अंदर दिखाई देने वाली सूचनाएँ। कोई ईमेल, एसएमएस या पुश सूचना कभी नहीं भेजी जाती।',
    'Appointment reminders': 'अपॉइंटमेंट रिमाइंडर',
    'Remind me about upcoming visits in my calendar.': 'मेरे कैलेंडर में आने वाली विज़िट की याद दिलाएँ।',
    'Medication reminders': 'दवा रिमाइंडर',
    'Show a daily check-in for medications marked active.':
      'सक्रिय दवाओं के लिए प्रतिदिन चेक-इन दिखाएँ।',
    'Wellness reminders': 'स्वास्थ्य रिमाइंडर',
    'Gentle prompts for wellness goals and habits.': 'स्वास्थ्य लक्ष्यों और आदतों के लिए सौम्य संकेत।',
    'Product announcements': 'उत्पाद घोषणाएँ',
    'Notes about app features when they change.': 'ऐप सुविधाओं में बदलाव की सूचनाएँ।',
    'Health & units': 'स्वास्थ्य और इकाइयाँ',
    'How health values are shown in the app.': 'ऐप में स्वास्थ्य मान कैसे दिखाए जाते हैं।',
    Units: 'इकाइयाँ',
    Metric: 'मीट्रिक',
    Imperial: 'इम्पीरियल',
    'Track wellness goals & habits': 'स्वास्थ्य लक्ष्य और आदतें ट्रैक करें',
    'Keep the Wellness page active in your workspace.': 'अपने कार्यक्षेत्र में स्वास्थ्य पृष्ठ सक्रिय रखें।',
    'Time zone': 'समय क्षेत्र',
    'AI preferences': 'एआई प्राथमिकताएँ',
    'Controls for the built-in health assistant.': 'अंतर्निहित स्वास्थ्य सहायक के लिए नियंत्रण।',
    'Enable the AI assistant': 'एआई सहायक सक्षम करें',
    'Turn the built-in health assistant on or off everywhere in the app.':
      'पूरे ऐप में अंतर्निहित स्वास्थ्य सहायक को चालू या बंद करें।',
    'Consent to external processing': 'बाहरी प्रोसेसिंग की सहमति',
    'Required before any future feature could send data to a third-party service. This app never sends anything.':
      'भविष्य की किसी सुविधा द्वारा तृतीय-पक्ष सेवा को डेटा भेजने से पहले आवश्यक। यह ऐप कुछ नहीं भेजता।',
    Accessibility: 'सुगम्यता',
    'Assistive options for comfortable use.': 'आरामदायक उपयोग के लिए सहायक विकल्प।',
    'Data & privacy': 'डेटा और गोपनीयता',
    'How your data is stored and reset.': 'आपका डेटा कैसे सहेजा और रीसेट किया जाता है।',
    'Reset my data': 'मेरा डेटा रीसेट करें',
    'Clear chat history': 'चैट इतिहास साफ़ करें',
    'Clear conversations': 'बातचीत साफ़ करें',
    'Restore default settings': 'डिफ़ॉल्ट सेटिंग्स बहाल करें',
    'Reset settings': 'सेटिंग्स रीसेट करें',

    // Feedback
    'How would you rate Health Copilot?': 'आप हेल्थ कोपायलट को कैसे रेट करेंगे?',
    'Your feedback': 'आपकी प्रतिक्रिया',
    'Send feedback': 'प्रतिक्रिया भेजें',
    'Feedback sent': 'प्रतिक्रिया भेजी गई',
    'No feedback yet': 'अभी तक कोई प्रतिक्रिया नहीं',
    'Send as many notes as you like — there is no limit.': 'जितने चाहें नोट भेजें — कोई सीमा नहीं।',
    'Shared feedback': 'साझा प्रतिक्रिया',

    // Shell / ARIA
    Navigation: 'नेविगेशन',
    'Main navigation': 'मुख्य नेविगेशन',
    Breadcrumb: 'ब्रेडक्रंब',
    Practice: 'प्रैक्टिस',

    // Settings extras
    'Restores the fictional sample records, medicines and goals.':
      'काल्पनिक नमूना रिकॉर्ड, दवाइयाँ और लक्ष्य बहाल करता है।',
    'Deletes every assistant conversation in this browser.':
      'इस ब्राउज़र में सहायक की हर बातचीत हटा देता है।',
    'Reverts appearance, notifications and accessibility options.':
      'रूप-रंग, सूचनाएँ और सुगम्यता विकल्प पूर्ववत करता है।',
    'Already applied above — minimises animations app-wide.':
      'ऊपर पहले से लागू — पूरे ऐप में एनिमेशन कम करता है।',
    'My data has been reset': 'मेरा डेटा रीसेट कर दिया गया',
    'Records, medicines and preferences were restored to the sample set.':
      'रिकॉर्ड, दवाइयाँ और प्राथमिकताएँ नमूना सेट पर बहाल कर दी गईं।',
    'Settings restored': 'सेटिंग्स बहाल',
    'Preferences returned to their defaults.': 'प्राथमिकताएँ उनके डिफ़ॉल्ट पर लौट आईं।',
    'Reset all data?': 'सारा डेटा रीसेट करें?',
    'Your local records, medicines, appointments, goals, habits and conversations will be replaced with the original sample set. This cannot be undone.':
      'आपके स्थानीय रिकॉर्ड, दवाइयाँ, अपॉइंटमेंट, लक्ष्य, आदतें और बातचीत मूल नमूना सेट से बदल दी जाएँगी। इसे पूर्ववत नहीं किया जा सकता।',
    'The whole interface — navigation, settings, feedback and help — updates instantly. Your choice is saved in this browser.':
      'पूरा इंटरफ़ेस — नेविगेशन, सेटिंग्स, प्रतिक्रिया और सहायता — तुरंत बदल जाता है। आपका चयन इस ब्राउज़र में सहेजा जाता है।',
    'The app supports focus outlines, semantic landmarks and keyboard navigation throughout. More options are grouped in Appearance above.':
      'ऐप पूरे में फ़ोकस आउटलाइन, सेमांटिक लैंडमार्क और कीबोर्ड नेविगेशन का समर्थन करता है। और विकल्प ऊपर रूप-रंग में समूहित हैं।',
    "Everything you enter — records, medicines, appointments, goals, habits and preferences — is stored in your browser's local storage. Nothing is uploaded, and closing the tab does not erase it. Clearing your browser's site data removes it.":
      'आप जो कुछ भी दर्ज करते हैं — रिकॉर्ड, दवाइयाँ, अपॉइंटमेंट, लक्ष्य, आदतें और प्राथमिकताएँ — आपके ब्राउज़र के लोकल स्टोरेज में सहेजा जाता है। कुछ भी अपलोड नहीं होता, और टैब बंद करने से यह मिटता नहीं। ब्राउज़र का साइट डेटा साफ़ करने पर यह हट जाता है।',

    // Feedback extras
    'Share what is working well, what is confusing, or what you would like to see next…':
      'जो अच्छा चल रहा है, जो उलझन में डालता है, या जो आगे देखना चाहते हैं वह साझा करें…',
    'Please write at least {count} characters.': 'कृपया कम से कम {count} अक्षर लिखें।',
    'Please keep it under {count} characters.': 'कृपया इसे {count} अक्षरों से कम रखें।',
    '{count}/{max} characters — visible to every patient and doctor on this device.':
      '{count}/{max} अक्षर — इस डिवाइस पर हर मरीज़ और डॉक्टर को दिखते हैं।',
    'It is now on the shared board for every patient and doctor.':
      'अब यह हर मरीज़ और डॉक्टर के लिए साझा बोर्ड पर है।',
    'Be the first to share your thoughts — the form above is open to every patient and doctor.':
      'अपने विचार साझा करने वाले पहले व्यक्ति बनें — ऊपर का फ़ॉर्म हर मरीज़ और डॉक्टर के लिए खुला है।',

    // Help extras
    'Answers about Health Copilot, straight to the point.':
      'हेल्थ कोपायलट के बारे में सीधे-सीधे जवाब।',
    'Four steps to make the most of Health Copilot.':
      'हेल्थ कोपायलट का पूरा लाभ उठाने के चार कदम।',
    'Click any question to expand the answer.': 'उत्तर देखने के लिए किसी भी प्रश्न पर क्लिक करें।',
    'Open to both patients and doctors. Your note appears on the shared board for everyone using this app on this device.':
      'मरीज़ों और डॉक्टरों दोनों के लिए खुला। आपका नोट इस डिवाइस पर ऐप इस्तेमाल करने वाले सभी के साझा बोर्ड पर दिखता है।',
    'Patients and doctors on this device read the same board — this is what they have shared.':
      'इस डिवाइस पर मरीज़ और डॉक्टर एक ही बोर्ड पढ़ते हैं — यही उन्होंने साझा किया है।',
    'What this product deliberately does not do.': 'यह उत्पाद जानबूझकर क्या नहीं करता।',
    'The README in the project explains how everything is built.':
      'प्रोजेक्ट की README बताती है कि सब कुछ कैसे बनाया गया है।',

    // Help
    Resources: 'संसाधन',
    'Getting started': 'शुरुआत करें',
    'Frequently asked questions': 'अक्सर पूछे जाने वाले प्रश्न',
    'Feedback from everyone': 'सबकी प्रतिक्रिया',
    'Good to know': 'जानने योग्य',
    'Still curious?': 'और जानना चाहते हैं?',
    'Contact us': 'संपर्क करें',
  },

  te: {
    Dashboard: 'డాష్బోర్డ్',
    'AI Health Assistant': 'ఏఐ ఆరోగ్య సహాయకుడు',
    'Medical Records': 'వైద్య రికార్డులు',
    Prescriptions: 'ప్రిస్క్రిప్షన్లు',
    Appointments: 'అపాయింట్మెంట్లు',
    'Health Analytics': 'ఆరోగ్య విశ్లేషణ',
    'Wellness & Goals': 'ఆరోగ్యం & లక్ష్యాలు',
    Profile: 'ప్రొఫైల్',
    Settings: 'సెట్టింగ్‌లు',
    'Help & Support': 'సహాయం & మద్దతు',
    Overview: 'అవలోకనం',
    Patients: 'రోగులు',
    Requests: 'అభ్యర్థనలు',
    'Patient reports': 'రోగి నివేదికలు',
    Account: 'ఖాతా',
    Logout: 'లాగ్ అవుట్',
    'Practice portal': 'ప్రాక్టీస్ పోర్టల్',
    'Personal health': 'వ్యక్తిగత ఆరోగ్యం',
    'Your health space': 'మీ ఆరోగ్య ప్రదేశం',
    'Your practice': 'మీ ప్రాక్టీస్',
    'Your records, medicines and routines stay private to your account.':
      'మీ రికార్డులు, మందులు మరియు దినచర్యలు మీ ఖాతాకే పరిమితం.',
    'Patients, records and visits for your practice — private to your account.':
      'మీ ప్రాక్టీస్ రోగులు, రికార్డులు మరియు సందర్శనలు — మీ ఖాతాకే పరిమితం.',
    Unread: 'చదవనివి',
    Visits: 'సందర్శనలు',
    Pending: 'పెండింగ్',
    'Search…': 'వెతకండి…',
    Notifications: 'నోటిఫికేషన్లు',
    Doctor: 'డాక్టర్',
    Patient: 'రోగి',
    'Skip to main content': 'ప్రధాన కంటెంట్‌కు వెళ్లండి',
    'Open navigation menu': 'నావిగేషన్ మెనూ తెరవండి',
    'Open account menu': 'ఖాతా మెనూ తెరవండి',
    'Close navigation': 'నావిగేషన్ మూసివేయండి',
    'Open search (Control K)': 'శోధన తెరవండి (Control K)',
    'Switch to light theme': 'లైట్ థీమ్‌కు మారండి',
    'Switch to dark theme': 'డార్క్ థీమ్‌కు మారండి',

    Preferences: 'ప్రాధాన్యతలు',
    Appearance: 'రూపురేఖలు',
    'How the app looks on your screen.': 'మీ స్క్రీన్‌పై యాప్ ఎలా కనిపిస్తుంది.',
    Language: 'భాష',
    'Choose the language for the whole app — for patients and doctors alike.':
      'మొత్తం యాప్ భాషను ఎంచుకోండి — రోగులు, డాక్టర్లు ఇద్దరికీ.',
    Theme: 'థీమ్',
    Light: 'లైట్',
    Dark: 'డార్క్',
    System: 'సిస్టమ్',
    'Reduce motion': 'కదలిక తగ్గించు',
    'Minimises animations and transitions across the app.': 'యాప్‌లో యానిమేషన్లు, మార్పులు తగ్గిస్తుంది.',
    'Large text': 'పెద్ద వచనం',
    'Increases the base font size for easier reading.': 'సులభంగా చదవడానికి ఫాంట్ పరిమాణం పెంచుతుంది.',
    'High-contrast links': 'అధిక కాంట్రాస్ట్ లింకులు',
    'Underlines links and emphasises buttons for clearer navigation.':
      'స్పష్టమైన నావిగేషన్ కోసం లింకులను అండర్‌లైన్ చేసి బటన్లను హైలైట్ చేస్తుంది.',
    'In-app notifications shown inside the app. No email, SMS or push notifications are ever sent.':
      'యాప్‌లో చూపించే నోటిఫికేషన్లు. ఇమెయిల్, SMS లేదా పుష్ నోటిఫికేషన్లు ఎప్పుడూ పంపబడవు.',
    'Appointment reminders': 'అపాయింట్‌మెంట్ రిమైండర్లు',
    'Remind me about upcoming visits in my calendar.': 'నా క్యాలెండర్‌లో రాబోయే సందర్శనలను గుర్తు చేయండి.',
    'Medication reminders': 'మందుల రిమైండర్లు',
    'Show a daily check-in for medications marked active.': 'క్రియాశీల మందుల కోసం రోజువారీ చెక్-ఇన్ చూపించండి.',
    'Wellness reminders': 'ఆరోగ్య రిమైండర్లు',
    'Gentle prompts for wellness goals and habits.': 'ఆరోగ్య లక్ష్యాలు, అలవాట్ల కోసం సున్నితమైన సూచనలు.',
    'Product announcements': 'ఉత్పత్తి ప్రకటనలు',
    'Notes about app features when they change.': 'యాప్ ఫీచర్ల మార్పుల గురించిన నోట్లు.',
    'Health & units': 'ఆరోగ్యం & యూనిట్లు',
    'How health values are shown in the app.': 'యాప్‌లో ఆరోగ్య విలువలు ఎలా చూపబడతాయి.',
    Units: 'యూనిట్లు',
    Metric: 'మెట్రిక్',
    Imperial: 'ఇంపీరియల్',
    'Track wellness goals & habits': 'ఆరోగ్య లక్ష్యాలు & అలవాట్లు ట్రాక్ చేయండి',
    'Keep the Wellness page active in your workspace.': 'మీ వర్క్‌స్పేస్‌లో ఆరోగ్య పేజీని యాక్టివ్‌గా ఉంచండి.',
    'Time zone': 'టైమ్ జోన్',
    'AI preferences': 'ఏఐ ప్రాధాన్యతలు',
    'Controls for the built-in health assistant.': 'అంతర్నిర్మిత ఆరోగ్య సహాయకుడి నియంత్రణలు.',
    'Enable the AI assistant': 'ఏఐ సహాయకుడిని ప్రారంభించండి',
    'Turn the built-in health assistant on or off everywhere in the app.':
      'యాప్ అంతటా అంతర్నిర్మిత ఆరోగ్య సహాయకుడిని ఆన్ లేదా ఆఫ్ చేయండి.',
    'Consent to external processing': 'బాహ్య ప్రాసెసింగ్‌కు అనుమతి',
    'Required before any future feature could send data to a third-party service. This app never sends anything.':
      'భవిష్యత్ ఫీచర్ మూడవ-పక్ష సేవకు డేటా పంపే ముందు అవసరం. ఈ యాప్ ఏమీ పంపదు.',
    Accessibility: 'ప్రాప్యత',
    'Assistive options for comfortable use.': 'సుఖంగా వాడడానికి సహాయక ఎంపికలు.',
    'Data & privacy': 'డేటా & గోప్యత',
    'How your data is stored and reset.': 'మీ డేటా ఎలా నిల్వ చేయబడి రీసెట్ చేయబడుతుంది.',
    'Reset my data': 'నా డేటాను రీసెట్ చేయండి',
    'Clear chat history': 'చాట్ చరిత్రను క్లియర్ చేయండి',
    'Clear conversations': 'సంభాషణలను క్లియర్ చేయండి',
    'Restore default settings': 'డిఫాల్ట్ సెట్టింగ్‌లను పునరుద్ధరించండి',
    'Reset settings': 'సెట్టింగ్‌లను రీసెట్ చేయండి',

    'How would you rate Health Copilot?': 'మీరు హెల్త్ కోపైలట్‌ను ఎలా రేట్ చేస్తారు?',
    'Your feedback': 'మీ అభిప్రాయం',
    'Send feedback': 'అభిప్రాయం పంపండి',
    'Feedback sent': 'అభిప్రాయం పంపబడింది',
    'No feedback yet': 'ఇంకా అభిప్రాయం లేదు',
    'Send as many notes as you like — there is no limit.': 'మీకు నచ్చినన్ని నోట్లు పంపండి — పరిమితి లేదు.',
    'Shared feedback': 'భాగస్వామ్య అభిప్రాయం',

    // Shell / ARIA
    Navigation: 'నావిగేషన్',
    'Main navigation': 'ప్రధాన నావిగేషన్',
    Breadcrumb: 'బ్రెడ్‌క్రంబ్',
    Practice: 'ప్రాక్టీస్',

    // Settings extras
    'Restores the fictional sample records, medicines and goals.':
      'కాల్పనిక నమూనా రికార్డులు, మందులు, లక్ష్యాలను పునరుద్ధరిస్తుంది.',
    'Deletes every assistant conversation in this browser.':
      'ఈ బ్రౌజర్‌లో సహాయకుడి ప్రతి సంభాషణను తొలగిస్తుంది.',
    'Reverts appearance, notifications and accessibility options.':
      'రూపురేఖలు, నోటిఫికేషన్లు, ప్రాప్యత ఎంపికలను తిరిగి మారుస్తుంది.',
    'Already applied above — minimises animations app-wide.':
      'పైన ఇప్పటికే వర్తించబడింది — యాప్ అంతటా యానిమేషన్లు తగ్గిస్తుంది.',
    'My data has been reset': 'నా డేటా రీసెట్ చేయబడింది',
    'Records, medicines and preferences were restored to the sample set.':
      'రికార్డులు, మందులు, ప్రాధాన్యతలు నమూనా సెట్‌కు పునరుద్ధరించబడ్డాయి.',
    'Settings restored': 'సెట్టింగ్‌లు పునరుద్ధరించబడ్డాయి',
    'Preferences returned to their defaults.': 'ప్రాధాన్యతలు వాటి డిఫాల్ట్‌లకు తిరిగి వచ్చాయి.',
    'Reset all data?': 'మొత్తం డేటాను రీసెట్ చేయాలా?',
    'Your local records, medicines, appointments, goals, habits and conversations will be replaced with the original sample set. This cannot be undone.':
      'మీ స్థానిక రికార్డులు, మందులు, అపాయింట్‌మెంట్లు, లక్ష్యాలు, అలవాట్లు, సంభాషణలు అసలు నమూనా సెట్‌తో భర్తీ చేయబడతాయి. దీన్ని వెనక్కి తీసుకోలేరు.',
    'The whole interface — navigation, settings, feedback and help — updates instantly. Your choice is saved in this browser.':
      'మొత్తం ఇంటర్‌ఫేస్ — నావిగేషన్, సెట్టింగ్‌లు, అభిప్రాయం, సహాయం — వెంటనే మారుతుంది. మీ ఎంపిక ఈ బ్రౌజర్‌లో సేవ్ చేయబడుతుంది.',
    'The app supports focus outlines, semantic landmarks and keyboard navigation throughout. More options are grouped in Appearance above.':
      'యాప్ అంతటా ఫోకస్ అవుట్‌లైన్లు, సెమాంటిక్ ల్యాండ్‌మార్క్‌లు, కీబోర్డ్ నావిగేషన్ మద్దతు ఇస్తుంది. మరిన్ని ఎంపికలు పైన రూపురేఖలలో ఉన్నాయి.',
    "Everything you enter — records, medicines, appointments, goals, habits and preferences — is stored in your browser's local storage. Nothing is uploaded, and closing the tab does not erase it. Clearing your browser's site data removes it.":
      'మీరు నమోదు చేసే ప్రతిదీ — రికార్డులు, మందులు, అపాయింట్‌మెంట్లు, లక్ష్యాలు, అలవాట్లు, ప్రాధాన్యతలు — మీ బ్రౌజర్ లోకల్ స్టోరేజ్‌లో నిల్వ ఉంటుంది. ఏమీ అప్‌లోడ్ కాదు, ట్యాబ్ మూసినా పోదు. బ్రౌజర్ సైట్ డేటా క్లియర్ చేస్తే తొలగిపోతుంది.',

    // Feedback extras
    'Share what is working well, what is confusing, or what you would like to see next…':
      'బాగా పనిచేస్తున్నది, గందరగోళం కలిగించేది, లేదా తర్వాత చూడాలనుకునేది పంచుకోండి…',
    'Please write at least {count} characters.': 'దయచేసి కనీసం {count} అక్షరాలు రాయండి.',
    'Please keep it under {count} characters.':
      'దయచేసి దీన్ని {count} అక్షరాల కంటే తక్కువ ఉంచండి.',
    '{count}/{max} characters — visible to every patient and doctor on this device.':
      '{count}/{max} అక్షరాలు — ఈ పరికరంలోని ప్రతి రోగి, డాక్టర్‌కు కనిపిస్తాయి.',
    'It is now on the shared board for every patient and doctor.':
      'ఇప్పుడు ఇది ప్రతి రోగి, డాక్టర్ కోసం భాగస్వామ్య బోర్డ్‌పై ఉంది.',
    'Be the first to share your thoughts — the form above is open to every patient and doctor.':
      'మీ ఆలోచనలు పంచుకునే మొదటి వ్యక్తి అవ్వండి — పైనున్న ఫారమ్ ప్రతి రోగి, డాక్టర్‌కు తెరిచి ఉంది.',

    // Help extras
    'Answers about Health Copilot, straight to the point.':
      'హెల్త్ కోపైలట్ గురించి నేరుగా సమాధానాలు.',
    'Four steps to make the most of Health Copilot.':
      'హెల్త్ కోపైలట్‌ను పూర్తిగా వినియోగించుకోడానికి నాలుగు దశలు.',
    'Click any question to expand the answer.':
      'సమాధానం చూడటానికి ఏదైనా ప్రశ్నపై క్లిక్ చేయండి.',
    'Open to both patients and doctors. Your note appears on the shared board for everyone using this app on this device.':
      'రోగులు, డాక్టర్లు ఇద్దరికీ తెరిచి ఉంది. మీ నోట్ ఈ పరికరంలో యాప్ వాడే అందరి భాగస్వామ్య బోర్డ్‌పై కనిపిస్తుంది.',
    'Patients and doctors on this device read the same board — this is what they have shared.':
      'ఈ పరికరంలో రోగులు, డాక్టర్లు ఒకే బోర్డు చదువుతారు — వారు పంచుకున్నది ఇదే.',
    'What this product deliberately does not do.':
      'ఈ ఉత్పత్తి ఉద్దేశపూర్వకంగా ఏమి చేయదు.',
    'The README in the project explains how everything is built.':
      'ప్రాజెక్ట్‌లోని README ప్రతిదీ ఎలా నిర్మించబడిందో వివరిస్తుంది.',

    Resources: 'వనరులు',
    'Getting started': 'ప్రారంభించండి',
    'Frequently asked questions': 'తరచుగా అడిగే ప్రశ్నలు',
    'Feedback from everyone': 'అందరి అభిప్రాయం',
    'Good to know': 'తెలుసుకోవాల్సినవి',
    'Still curious?': 'ఇంకా తెలుసుకోవాలనుకుంటున్నారా?',
    'Contact us': 'మమ్మల్ని సంప్రదించండి',
  },

  ta: {
    Dashboard: 'டாஷ்போர்டு',
    'AI Health Assistant': 'AI சுகாதார உதவியாளர்',
    'Medical Records': 'மருத்துவ பதிவுகள்',
    Prescriptions: 'மருந்துச் சீட்டுகள்',
    Appointments: 'சந்திப்புகள்',
    'Health Analytics': 'சுகாதார பகுப்பாய்வு',
    'Wellness & Goals': 'நலம் & இலக்குகள்',
    Profile: 'சுயவிவரம்',
    Settings: 'அமைப்புகள்',
    'Help & Support': 'உதவி & ஆதரவு',
    Overview: 'மேலோட்டம்',
    Patients: 'நோயாளிகள்',
    Requests: 'கோரிக்கைகள்',
    'Patient reports': 'நோயாளி அறிக்கைகள்',
    Account: 'கணக்கு',
    Logout: 'வெளியேறு',
    'Practice portal': 'மருத்துவ போர்ட்டல்',
    'Personal health': 'தனிப்பட்ட சுகாதாரம்',
    'Your health space': 'உங்கள் சுகாதார இடம்',
    'Your practice': 'உங்கள் மருத்துவம்',
    'Your records, medicines and routines stay private to your account.':
      'உங்கள் பதிவுகள், மருந்துகள், வழக்கங்கள் உங்கள் கணக்கிற்கு மட்டுமே.',
    'Patients, records and visits for your practice — private to your account.':
      'உங்கள் மருத்துவமனையின் நோயாளிகள், பதிவுகள், வருகைகள் — உங்கள் கணக்கிற்கு மட்டுமே.',
    Unread: 'படிக்காதவை',
    Visits: 'வருகைகள்',
    Pending: 'நிலுவையில்',
    'Search…': 'தேடு…',
    Notifications: 'அறிவிப்புகள்',
    Doctor: 'மருத்துவர்',
    Patient: 'நோயாளி',
    'Skip to main content': 'முதன்மை உள்ளடக்கத்திற்குச் செல்',
    'Open navigation menu': 'வழிசெலுத்தல் மெனுவைத் திற',
    'Open account menu': 'கணக்கு மெனுவைத் திற',
    'Close navigation': 'வழிசெலுத்தலை மூடு',
    'Open search (Control K)': 'தேடலைத் திற (Control K)',
    'Switch to light theme': 'ஒளி தீமுக்கு மாறு',
    'Switch to dark theme': 'இருள் தீமுக்கு மாறு',

    Preferences: 'விருப்பங்கள்',
    Appearance: 'தோற்றம்',
    'How the app looks on your screen.': 'உங்கள் திரையில் செயலி எப்படித் தெரிகிறது.',
    Language: 'மொழி',
    'Choose the language for the whole app — for patients and doctors alike.':
      'முழு செயலிக்கும் மொழியைத் தேர்ந்தெடுக்கவும் — நோயாளிகள், மருத்துவர்கள் இருவருக்கும்.',
    Theme: 'தீம்',
    Light: 'ஒளி',
    Dark: 'இருள்',
    System: 'சிஸ்டம்',
    'Reduce motion': 'இயக்கத்தைக் குறை',
    'Minimises animations and transitions across the app.': 'செயலியில் அனிமேஷன்களையும் மாற்றங்களையும் குறைக்கிறது.',
    'Large text': 'பெரிய உரை',
    'Increases the base font size for easier reading.': 'எளிதாகப் படிக்க எழுத்துரு அளவை அதிகரிக்கிறது.',
    'High-contrast links': 'உயர் மாறுபாடு இணைப்புகள்',
    'Underlines links and emphasises buttons for clearer navigation.':
      'தெளிவான வழிசெலுத்தலுக்கு இணைப்புகளை அடிக்கோடிட்டு பொத்தான்களை வலியுறுத்துகிறது.',
    'In-app notifications shown inside the app. No email, SMS or push notifications are ever sent.':
      'செயலிக்குள் காட்டப்படும் அறிவிப்புகள். மின்னஞ்சல், SMS அல்லது புஷ் அறிவிப்புகள் எதுவும் அனுப்பப்படுவதில்லை.',
    'Appointment reminders': 'சந்திப்பு நினைவூட்டல்கள்',
    'Remind me about upcoming visits in my calendar.': 'என் நாட்காட்டியில் வரவிருக்கும் வருகைகளை நினைவூட்டு.',
    'Medication reminders': 'மருந்து நினைவூட்டல்கள்',
    'Show a daily check-in for medications marked active.': 'செயலில் உள்ள மருந்துகளுக்கு தினசரி செக்-இன் காட்டு.',
    'Wellness reminders': 'நல நினைவூட்டல்கள்',
    'Gentle prompts for wellness goals and habits.': 'நல இலக்குகள், பழக்கங்களுக்கு மென்மையான நினைவூட்டல்கள்.',
    'Product announcements': 'தயாரிப்பு அறிவிப்புகள்',
    'Notes about app features when they change.': 'செயலி அம்சங்கள் மாறும்போது அறிவிப்புகள்.',
    'Health & units': 'சுகாதாரம் & அலகுகள்',
    'How health values are shown in the app.': 'செயலியில் சுகாதார மதிப்புகள் எப்படிக் காட்டப்படுகின்றன.',
    Units: 'அலகுகள்',
    Metric: 'மெட்ரிக்',
    Imperial: 'இம்பீரியல்',
    'Track wellness goals & habits': 'நல இலக்குகள் & பழக்கங்களைக் கண்காணி',
    'Keep the Wellness page active in your workspace.': 'உங்கள் பணியிடத்தில் நலப் பக்கத்தைச் செயலில் வைக்கவும்.',
    'Time zone': 'நேர மண்டலம்',
    'AI preferences': 'AI விருப்பங்கள்',
    'Controls for the built-in health assistant.': 'உள்ளமைந்த சுகாதார உதவியாளருக்கான கட்டுப்பாடுகள்.',
    'Enable the AI assistant': 'AI உதவியாளரை இயக்கு',
    'Turn the built-in health assistant on or off everywhere in the app.':
      'செயலி முழுவதும் உள்ளமைந்த சுகாதார உதவியாளரை ஆன் அல்லது ஆஃப் செய்.',
    'Consent to external processing': 'வெளிப்புற செயலாக்கத்திற்கு ஒப்புதல்',
    'Required before any future feature could send data to a third-party service. This app never sends anything.':
      'எதிர்கால அம்சம் மூன்றாம் தரப்பு சேவைக்கு தரவை அனுப்பும் முன் தேவை. இந்த செயலி எதையும் அனுப்புவதில்லை.',
    Accessibility: 'அணுகல்தன்மை',
    'Assistive options for comfortable use.': 'வசதியான பயன்பாட்டிற்கான உதவி விருப்பங்கள்.',
    'Data & privacy': 'தரவு & தனியுரிமை',
    'How your data is stored and reset.': 'உங்கள் தரவு எப்படிச் சேமிக்கப்பட்டு மீட்டமைக்கப்படுகிறது.',
    'Reset my data': 'என் தரவை மீட்டமை',
    'Clear chat history': 'அரட்டை வரலாற்றை அழி',
    'Clear conversations': 'உரையாடல்களை அழி',
    'Restore default settings': 'இயல்புநிலை அமைப்புகளை மீட்டமை',
    'Reset settings': 'அமைப்புகளை மீட்டமை',

    'How would you rate Health Copilot?': 'ஹெல்த் கோபைலட்டை எப்படி மதிப்பிடுவீர்கள்?',
    'Your feedback': 'உங்கள் கருத்து',
    'Send feedback': 'கருத்தை அனுப்பு',
    'Feedback sent': 'கருத்து அனுப்பப்பட்டது',
    'No feedback yet': 'இன்னும் கருத்து இல்லை',
    'Send as many notes as you like — there is no limit.': 'விரும்பிய அளவு குறிப்புகளை அனுப்புங்கள் — வரம்பு இல்லை.',
    'Shared feedback': 'பகிரப்பட்ட கருத்து',

    // Shell / ARIA
    Navigation: 'வழிசெலுத்தல்',
    'Main navigation': 'முதன்மை வழிசெலுத்தல்',
    Breadcrumb: 'ப்ரெட்‌கிரம்ப்',
    Practice: 'மருத்துவம்',

    // Settings extras
    'Restores the fictional sample records, medicines and goals.':
      'கற்பனை மாதிரி பதிவுகள், மருந்துகள், இலக்குகளை மீட்டமைக்கிறது.',
    'Deletes every assistant conversation in this browser.':
      'இந்த உலாவியில் உதவியாளரின் ஒவ்வொரு உரையாடலையும் நீக்குகிறது.',
    'Reverts appearance, notifications and accessibility options.':
      'தோற்றம், அறிவிப்புகள், அணுகல்தன்மை விருப்பங்களை மீட்டமைக்கிறது.',
    'Already applied above — minimises animations app-wide.':
      'மேலே ஏற்கனவே பயன்படுத்தப்பட்டது — செயலி முழுவதும் அனிமேஷன்களைக் குறைக்கிறது.',
    'My data has been reset': 'என் தரவு மீட்டமைக்கப்பட்டது',
    'Records, medicines and preferences were restored to the sample set.':
      'பதிவுகள், மருந்துகள், விருப்பங்கள் மாதிரி தொகுப்பிற்கு மீட்டமைக்கப்பட்டன.',
    'Settings restored': 'அமைப்புகள் மீட்டமைக்கப்பட்டன',
    'Preferences returned to their defaults.': 'விருப்பங்கள் இயல்புநிலைக்குத் திரும்பின.',
    'Reset all data?': 'எல்லா தரவையும் மீட்டமைக்கவா?',
    'Your local records, medicines, appointments, goals, habits and conversations will be replaced with the original sample set. This cannot be undone.':
      'உங்கள் உள்ளூர் பதிவுகள், மருந்துகள், சந்திப்புகள், இலக்குகள், பழக்கங்கள், உரையாடல்கள் அசல் மாதிரி தொகுப்பால் மாற்றப்படும். இதை மீட்க முடியாது.',
    'The whole interface — navigation, settings, feedback and help — updates instantly. Your choice is saved in this browser.':
      'முழு இடைமுகமும் — வழிசெலுத்தல், அமைப்புகள், கருத்து, உதவி — உடனடியாக மாறும். உங்கள் தேர்வு இந்த உலாவியில் சேமிக்கப்படும்.',
    'The app supports focus outlines, semantic landmarks and keyboard navigation throughout. More options are grouped in Appearance above.':
      'செயலி முழுவதும் ஃபோகஸ் அவுட்லைன்கள், சொற்பொருள் அடையாளங்கள், விசைப்பலகை வழிசெலுத்தலை ஆதரிக்கிறது. கூடுதல் விருப்பங்கள் மேலே தோற்றத்தில் தொகுக்கப்பட்டுள்ளன.',
    "Everything you enter — records, medicines, appointments, goals, habits and preferences — is stored in your browser's local storage. Nothing is uploaded, and closing the tab does not erase it. Clearing your browser's site data removes it.":
      'நீங்கள் உள்ளிடும் அனைத்தும் — பதிவுகள், மருந்துகள், சந்திப்புகள், இலக்குகள், பழக்கங்கள், விருப்பங்கள் — உங்கள் உலாவியின் லோக்கல் சேமிப்பில் சேமிக்கப்படுகிறது. எதுவும் பதிவேற்றப்படாது, தாவலை மூடினாலும் அழியாது. உலாவியின் தள தரவை அழித்தால் நீங்கும்.',

    // Feedback extras
    'Share what is working well, what is confusing, or what you would like to see next…':
      'நன்றாக இருப்பது, குழப்பமானது, அல்லது அடுத்து பார்க்க விரும்புவதைப் பகிருங்கள்…',
    'Please write at least {count} characters.': 'குறைந்தது {count} எழுத்துகள் எழுதுங்கள்.',
    'Please keep it under {count} characters.': 'இதை {count} எழுத்துகளுக்குள் வைக்கவும்.',
    '{count}/{max} characters — visible to every patient and doctor on this device.':
      '{count}/{max} எழுத்துகள் — இந்த சாதனத்தில் உள்ள ஒவ்வொரு நோயாளி, மருத்துவருக்கும் தெரியும்.',
    'It is now on the shared board for every patient and doctor.':
      'இப்போது இது ஒவ்வொரு நோயாளி, மருத்துவருக்கும் பகிரப்பட்ட பலகையில் உள்ளது.',
    'Be the first to share your thoughts — the form above is open to every patient and doctor.':
      'உங்கள் கருத்துகளைப் பகிரும் முதல் நபராகுங்கள் — மேலே உள்ள படிவம் ஒவ்வொரு நோயாளி, மருத்துவருக்கும் திறந்திருக்கிறது.',

    // Help extras
    'Answers about Health Copilot, straight to the point.':
      'ஹெல்த் கோபைலட் பற்றிய நேரடியான பதில்கள்.',
    'Four steps to make the most of Health Copilot.':
      'ஹெல்த் கோபைலட்டை முழுமையாகப் பயன்படுத்த நான்கு படிகள்.',
    'Click any question to expand the answer.': 'பதிலைப் பார்க்க எந்தக் கேள்வியையும் கிளிக் செய்யவும்.',
    'Open to both patients and doctors. Your note appears on the shared board for everyone using this app on this device.':
      'நோயாளிகள், மருத்துவர்கள் இருவருக்கும் திறந்திருக்கிறது. உங்கள் குறிப்பு இந்த சாதனத்தில் செயலியைப் பயன்படுத்தும் அனைவரின் பகிரப்பட்ட பலகையில் தெரியும்.',
    'Patients and doctors on this device read the same board — this is what they have shared.':
      'இந்த சாதனத்தில் நோயாளிகளும் மருத்துவர்களும் ஒரே பலகையைப் படிக்கின்றனர் — அவர்கள் பகிர்ந்ததே இது.',
    'What this product deliberately does not do.':
      'இந்த தயாரிப்பு வேண்டுமென்றே செய்யாதவை.',
    'The README in the project explains how everything is built.':
      'திட்டத்தில் உள்ள README எல்லாம் எப்படிக் கட்டப்பட்டது என்பதை விளக்குகிறது.',

    Resources: 'வளங்கள்',
    'Getting started': 'தொடங்குங்கள்',
    'Frequently asked questions': 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    'Feedback from everyone': 'அனைவரின் கருத்து',
    'Good to know': 'தெரிந்து கொள்ள வேண்டியவை',
    'Still curious?': 'இன்னும் தெரிந்து கொள்ள வேண்டுமா?',
    'Contact us': 'எங்களைத் தொடர்பு கொள்ளுங்கள்',
  },
}

/**
 * Looks up a translation, falling back to English (the key) then the key
 * itself, and fills any `{token}` placeholders from `vars`.
 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const template = translations[locale]?.[key] ?? translations.en[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    token in vars ? String(vars[token]) : match,
  )
}
