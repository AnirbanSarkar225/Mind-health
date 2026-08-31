/**
 * GitaVerse data — Multilingual (English, Hindi, Bengali, Hinglish)
 * Sanskrit verses with Transliteration, Translations, and 3-Stage Somatic Grounding
 */

import { MentalState } from './states.js';

export const GITA_VERSES = {
  [MentalState.ANXIETY]: {
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    sanskritBengali: 'কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন।\nমা কর্মফলহেতুর্ভুর্মা তে সঙ্গোঽস্ত্বকৰ্মণি॥',
    transliteration: 'karmanhy evadhikaras te ma phaleshu kadachana\nma karma-phala-hetur bhur ma te sango \'stv akarmani',
    
    // Concept
    concept: 'Nishkama Karma',
    concept_hi: 'निष्काम कर्म (Nishkama Karma)',
    concept_bn: 'নিষ্কাম কর্ম (Nishkama Karma)',
    concept_hl: 'Nishkama Karma (Bina Phal Ki Chinta Kiye Karm)',

    // Translations
    translation: 'You have the right to perform your duty, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, and never be attached to inaction.',
    translation_hi: 'तुम्हारा अधिकार केवल कर्म करने में है, उसके फलों में कभी नहीं। इसलिए कर्मफल के कारण मत बनो और न ही कर्म न करने में तुम्हारी आसक्ति हो।',
    translation_bn: 'কর্মে তোমার অধিকার আছে, কিন্তু কর্মফলে কখনো অধিকার নেই। অতএব কর্মফলের হেতু হয়ো না এবং কর্মত্যাগেও তোমার যেন আসক্তি না থাকে।',
    translation_hl: 'Aapka adhikaar sirf karm karne mein hai, uske phal par kabhi nahi. Isliye phal ki chinta karke karm mat roko aur na hi aalas mein phaso.',

    // Grounding Steps
    groundingSteps: [
      'BREATHE — Close your eyes. Inhale 4 counts, hold 4, exhale 6. Repeat 5 cycles. Focus only on the breath, not the outcome.',
      'RE-FRAME — Write down the anxious thought. Beside it write: "I control the effort, not the result." Read it aloud.',
      'ACT WITHOUT ATTACHMENT — Pick one small task you have been avoiding. Do it for 10 minutes with zero expectation of perfection.',
    ],
    groundingSteps_hi: [
      'प्राणायाम (श्वास लें) — आँखें बंद करें। 4 सेकंड सांस लें, 4 सेकंड रोकें, 6 सेकंड छोड़ें। 5 बार दोहराएं। केवल सांस पर ध्यान दें, परिणाम पर नहीं।',
      'सकारात्मक विचार — मन की चिंता को लिखें। उसके पास लिखें: "मेरा नियंत्रण केवल प्रयास पर है, परिणाम पर नहीं।" इसे ज़ोर से पढ़ें।',
      'आसक्ति रहित कर्म — कोई एक छोटा कार्य चुनें जिसे आप टाल रहे हैं। बिना पूर्णता की चिंता किए इसे 10 मिनट तक करें।',
    ],
    groundingSteps_bn: [
      'শ্বাসপ্রশ্বাস নিয়ন্ত্রণ — চোখ বন্ধ করুন। ৪ সেকেন্ড শ্বাস নিন, ৪ সেকেন্ড ধরে রাখুন, ৬ সেকেন্ডে ধীরে ধীরে শ্বাস ছাড়ুন। ৫ বার করুন। ফলাফলের কথা ভুলে শুধু শ্বাসে মন দিন।',
      'চিন্তার পরিবর্তন — দুশ্চিন্তার কারণটি লিখুন এবং পাশে লিখুন: "আমার নিয়ন্ত্রণ শুধু আমার প্রচেষ্টায়, ফলাফলে নয়।" এটি মন দিয়ে পড়ুন।',
      'কর্ম সম্পাদন — যে কাজটি করতে ভয় পাচ্ছেন বা পিছিয়ে যাচ্ছেন, তা কোনো ত্রুটিহীনতার চাপ ছাড়াই ১০ মিনিটের জন্য শুরু করুন।',
    ],
    groundingSteps_hl: [
      'SAANS LEIN — Aankhein band karein. 4 second saans andar lein, 4 second rokein, 6 second mein dheere-dheere chhodein. 5 baar repeat karein. Result par nahi, sirf saans par focus karein.',
      'THOUGHT REFRAME — Jo chinta sataye use likhein aur paas mein likhein: "Mera control sirf meri mehnat par hai, outcome par nahi." Isse bolkar padhein.',
      'ACTION LEIN — Ek chhota sa kaam jise aap procrastinate kar rahe the, bina perfection ki chinta kiye 10 minute ke liye shuru karein.',
    ],
  },

  [MentalState.DEPRESSION]: {
    chapter: 6,
    verse: 5,
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    sanskritBengali: 'উদ্ধরেদাত্মনাত্মানং নাত্মানমবসাদয়েৎ।\nআত্মৈব হ্যাত্মনো বন্ধুরত্মৈব রিপুরাত্মনঃ॥',
    transliteration: 'uddhared atmanatmanam natmanam avasadayet\natmaiva hy atmano bandhur atmaiva ripur atmanah',

    // Concept
    concept: 'Atma-Uddhara (Self-Elevation)',
    concept_hi: 'आत्मोद्धार एवं आत्म-शक्ति (Atma-Uddhara)',
    concept_bn: 'আত্মোদ্ধার ও আত্মশক্তি (Atma-Uddhara)',
    concept_hl: 'Atma-Uddhara (Khud Ko Uthana Aur Aage Badhana)',

    // Translations
    translation: 'Elevate yourself through the power of your own mind, and do not degrade yourself. The mind can be the friend and also the enemy of the self.',
    translation_hi: 'मनुष्य को चाहिए कि वह अपने मन द्वारा अपना उद्धार करे, अपने आपको नीचे न गिरने दे। क्योंकि मन ही जीवात्मा का सच्चा मित्र है और मन ही उसका शत्रु भी है।',
    translation_bn: 'নিজের মন দ্বারা নিজেকে উন্নত করো, নিজেকে অবসাদগ্রস্ত বা অধঃপতিত করো না। কারণ মনই নিজের পরম বন্ধু এবং মনই নিজের চরম শত্রু।',
    translation_hl: 'Apne man ki shakti se khud ka uddhar karein, khud ko giraane na dein. Kyunki man hi aapka sabse bada dost hai aur man hi sabse bada dushman.',

    // Grounding Steps
    groundingSteps: [
      'MORNING ANCHOR — Place both feet on the ground. Say aloud: "I am my own ally. I choose to rise today."',
      'MICRO-VICTORY — Complete one tiny achievable task (drink water, make bed, step outside). Acknowledge it as a win.',
      'CONNECTION — Reach out to one person today — a text, a call, even a smile. You are not meant to fight alone.',
    ],
    groundingSteps_hi: [
      'आत्म-संकल्प — सीधे खड़े हों और दोनों पैर जमीन पर रखें। कहें: "मैं स्वयं का मित्र हूँ। मैं आज प्रगति चुनता हूँ।" ',
      'लघु-सफलता — एक छोटा काम पूरा करें (पानी पीना, बिस्तर ठीक करना, 2 मिनट खुली हवा में जाना)। इसे अपनी विजय मानें।',
      'सम्पर्क व सहयोग — आज किसी एक प्रियजन से बात करें या संदेश भेजें। आप इस संघर्ष में अकेले नहीं हैं।',
    ],
    groundingSteps_bn: [
      'আত্ম-জাগরণ — সোজা হয়ে দাঁড়ান এবং মাটিতে পা রাখুন। মনে মনে বলুন: "আমি নিজেই আমার সবচেয়ে বড় শক্তি। আজ আমি অবসাদ মুক্ত হব।" ',
      'ক্ষুদ্র বিজয় — যেকোনো একটি ছোট কাজ সম্পূর্ণ করুন (যেমন এক গ্লাস জল খাওয়া, বিছানা গোছানো বা ২ মিনিট মুক্ত বাতাসে হাঁটা)।',
      'যোগাযোগ — আজ আপনার পরিচিত কারো সাথে সামান্য কথা বলুন বা বার্তা পাঠান। মনে রাখবেন, আপনি একা নন।',
    ],
    groundingSteps_hl: [
      'MORNING ANCHOR — Seedhe khade ho kar dono pair zameen par rakhein. Khud se kahein: "Main khud ka saathi hoon, main aaj aage badhoonga."',
      'MICRO-VICTORY — Ek chhota sa task poora karein (paani peena, bistar theek karna, 2 minute taazi hawa mein jaana). Isse apni jeet maanein.',
      'CONNECTION — Aaj kisi ek dost ya family member ko call ya message karein. Aap akele nahi hain.',
    ],
  },

  [MentalState.STRESS]: {
    chapter: 2,
    verse: 63,
    sanskrit: 'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः ।\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति ॥',
    sanskritBengali: 'ক্রোধাদ্ভবতি সংমোহঃ সংমোহাৎস্মৃতিবিভ্রমঃ।\nস্মৃতিভ্রংশাদ বুদ্ধিনাশো বুদ্ধিনাশাৎপ্রণশ্যতি॥',
    transliteration: 'krodhad bhavati sammohah sammohat smriti-vibhramah\nsmriti-bhramsad buddhi-nasho buddhi-nashat pranashyati',

    // Concept
    concept: 'Indriya-Nigraha (Sensory Calming)',
    concept_hi: 'इन्द्रिय-निग्रह एवं मानसिक शांति (Indriya-Nigraha)',
    concept_bn: 'ইন্দ্রিয় সংযম ও মানসিক প্রশান্তি (Indriya-Nigraha)',
    concept_hl: 'Indriya-Nigraha (Gusse Aur Tension Ko Shaant Karna)',

    // Translations
    translation: 'From anger arises delusion; from delusion, confusion of memory; from confusion of memory, loss of reason; and from loss of reason, one falls into ruin.',
    translation_hi: 'क्रोध से सम्मोहन (अविवेक) उत्पन्न होता है, अविवेक से स्मृति भ्रमित होती है, स्मृति-भ्रम से बुद्धि का नाश होता है और बुद्धि नष्ट होने से मनुष्य का पतन हो जाता है।',
    translation_bn: 'ক্রোধ থেকে সংমোহ (বিচারহীনতা) জন্ম নেয়, সংমোহ থেকে স্মৃতিভ্রংশ হয়, স্মৃতিভ্রষ্ট হলে বুদ্ধিনাশ ঘটে এবং বুদ্ধি বিনষ্ট হলে মানুষের পতন ঘটে।',
    translation_hl: 'Gusse se samajh khatam hoti hai, samajh khone se memory bhatak jaati hai, aur memory bhatakne se buddhi ka nash hota hai jisse insaan gir jaata hai.',

    // Grounding Steps
    groundingSteps: [
      'PAUSE — When agitation peaks, physically stop. Press your palms together firmly for 10 seconds to interrupt the anger loop.',
      '5-4-3-2-1 GROUNDING — Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste. Anchor into the present.',
      'DHYANA RESET — Close your eyes and take 10 slow diaphragmatic breaths. Let your nervous system recalibrate.',
    ],
    groundingSteps_hi: [
      'विराम (शांत हों) — जब गुस्सा या तनाव बढ़े, तुरंत रुकें। दोनों हथेलियों को 10 सेकंड तक आपस में दबाएं। इससे तनाव का चक्र टूटता है।',
      'इन्द्रिय-केंद्रण (5-4-3-2-1) — 5 चीज़ें देखें, 4 स्पर्श करें, 3 सुनें, 2 सूंघें और 1 का स्वाद महसूस करें। वर्तमान में लौटें।',
      'ध्यान व शीतलन — आँखें बंद करके 10 गहरी सांसें लें। अपने तंत्रिका तंत्र को पुनः संतुलित करें।',
    ],
    groundingSteps_bn: [
      'স্থিরতা ও বিরতি — উত্তেজনা বা রাগ অনুভব হলে সাথে সাথে থামুন। ১০ সেকেন্ডের জন্য দুই হাতের তালু একসাথে চেপে রাখুন।',
      'ইন্দ্রিয় সচেতনতা (৫-৪-৩-২-১) — চোখের সামনে ৫টি জিনিস দেখুন, ৪টি জিনিস স্পর্শ করুন, ৩টি শব্দ শুনুন, ২টি গন্ধ নিন এবং ১টি স্বাদ অনুভব করুন।',
      'গভীর শ্বাসপ্রশ্বাস — চোখ বন্ধ করে ধীরে ধীরে ১০টি দীর্ঘ শ্বাস নিন এবং শরীরকে শান্ত করুন।',
    ],
    groundingSteps_hl: [
      'PAUSE KAREIN — Jab gussa ya stress badhe, turant rukein. Dono hatho ko 10 second ke liye aapas mein zor se press karein. Isse stress loop break hota hai.',
      '5-4-3-2-1 GROUNDING — 5 cheezein dekhein, 4 touch karein, 3 sunein, 2 smell karein aur 1 taste feel karein. Present moment mein lautein.',
      'DHYANA RESET — Aankhein band karke 10 gehri saansein lein. Apne nervous system ko shaant aur reboot hone dein.',
    ],
  },

  [MentalState.EQUILIBRIUM]: {
    chapter: 2,
    verse: 56,
    sanskrit: 'दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः ।\nवीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते ॥',
    sanskritBengali: 'দুঃখেষ্বনুদ্ধিগ্নমনাঃ সুখেষু বিগতস্পৃহঃ।\nবীতরাগভয়ক্রোধঃ স্থিতধীর্যুনিরুচ্যতে॥',
    transliteration: 'duhkheshv anudvigna-manah sukheshu vigata-sprhah\nvita-raga-bhaya-krodhah sthita-dhir munir ucyate',

    // Concept
    concept: 'Sthitaprajna (Steady Wisdom)',
    concept_hi: 'स्थितप्रज्ञ (अटल समत्व) (Sthitaprajna)',
    concept_bn: 'স্থিতপ্রজ্ঞ (স্থির প্রজ্ঞা ও সমত্ব) (Sthitaprajna)',
    concept_hl: 'Sthitaprajna (Har Haalat Mein Shaant Aur Steady Rehna)',

    // Translations
    translation: 'One whose mind remains undisturbed amidst sorrow, who does not crave pleasure, and who is free from attachment, fear, and anger — such a person is called a sage of steady wisdom.',
    translation_hi: 'जो दुःखों की प्राप्ति में उद्विग्न नहीं होता, सुखों की प्राप्ति में सर्वथा निःस्पृह रहता है, तथा जिसके राग, भय और क्रोध नष्ट हो चुके हैं, ऐसा स्थिर बुद्धि वाला मुनि कहलाता है।',
    translation_bn: 'দুঃখে যার মন উদ্বিগ্ন হয় না, সুখে যার কোনো আসক্তি নেই এবং যিনি অনুরাগ, ভয় ও ক্রোধ থেকে মুক্ত — তিনিই স্থিতপ্রজ্ঞ অর্থাৎ স্থির বুদ্ধিসম্পন্ন পুরুষ।',
    translation_hl: 'Jo dukh mein ghabrata nahi, sukh mein behakta nahi, aur jiske man se dar, gussa aur attachment khatam ho chuka hai — wahi sthitaprajna yaani sthir buddhi wala hai.',

    // Grounding Steps
    groundingSteps: [
      'GRATITUDE PAUSE — You are in balance. Close your eyes and mentally list 3 things you are grateful for right now.',
      'DEEPEN WISDOM — Reflect on the witness state (Sakshi Bhava), observing events without impulsive attachment.',
      'PAY IT FORWARD — Share a calming word, smile, or constructive act with someone around you. Equilibrium grows when shared.',
    ],
    groundingSteps_hi: [
      'कृतज्ञता ध्यान — आप पूर्ण संतुलन में हैं। आँखें बंद करें और 3 ऐसी बातों का स्मरण करें जिनके प्रति आप आभारी हैं।',
      'साक्षी भाव — घटनाओं को केवल एक शांत साक्षी (Observer) के रूप में देखें, बिना विचलित हुए।',
      'सकारात्मक ऊर्जा का प्रसार — अपने आसपास के लोगों के साथ मधुरता, धैर्य और शांतिपूर्ण व्यवहार साझा करें।',
    ],
    groundingSteps_bn: [
      'কৃতজ্ঞতা প্রকাশ — আপনি বর্তমানে পরম শান্তিতে আছেন। চোখ বন্ধ করে ৩টি বিষয়ের কথা স্মরণ করুন যার জন্য আপনি কৃতজ্ঞ।',
      'সাক্ষী ভাব — জীবনের ঘটনাগুলোকে স্থিরভাবে অবলোকন করুন, কোনো আবেগের দ্বারা প্রভাবিত না হয়ে।',
      'প্রশান্তি ছড়িয়ে দিন — আপনার পরিবার বা সহকর্মীদের সাথে এক টুকরো হাসি ও ভালোবাসাপূর্ণ ব্যবহার ভাগ করে নিন।',
    ],
    groundingSteps_hl: [
      'GRATITUDE PAUSE — Aap abhi balance mein hain. Aankhein band karke aisi 3 cheezein sochein jinke liye aap thankful hain.',
      'SAKSHI BHAV — Zindagi ke events ko ek shaant observer bankar dekhein, kisi emotion mein impulsive behave kiye bina.',
      'SHANTI SPREAD KAREIN — Apne aas-paas kisi ke saath ek sweet smile ya positive gesture share karein.',
    ],
  },
};
