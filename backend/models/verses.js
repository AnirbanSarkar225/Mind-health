/**
 * GitaVerse data — Multilingual (English, Hindi, Bengali, Hinglish)
 * Sanskrit verses with Transliteration, Translations, Physical Activity / Movement, and 3-Stage Somatic Grounding
 */

import { MentalState } from './states.js';

export const GITA_VERSES = {
  [MentalState.ANXIETY]: {
    chapter: 2,
    verse: 47,
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    sanskritBengali: 'কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন।\nমা কর্মফলহেতুর্ভুর্মা তে সঙ্গোঽস্ত্বকৰ্মণি॥',
    transliteration: "karmanhy evadhikaras te ma phaleshu kadachana\nma karma-phala-hetur bhur ma te sango 'stv akarmani",
    
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

    // Dedicated Physical Activity
    physicalActivity: {
      name: "Balasana (Child's Pose) & Diaphragmatic Grounding",
      duration: "5 Minutes (3 Reps)",
      instructions: "Kneel on the floor, bring big toes together, sit on your heels, and fold forward resting your forehead on the ground. Extend your arms forward.",
      benefit: "Triggers the oculocardiac vagal reflex through gentle forehead pressure, slowing accelerated heart rate and halting somatic panic.",
    },
    physicalActivity_hi: {
      name: "बालासन (Balasana / Child's Pose) एवं शारीरिक विश्राम",
      duration: "5 मिनट (3 चक्र)",
      instructions: "घुटनों के बल बैठें, दोनों पैरों के अंगूठे मिलाएं, आगे झुकते हुए माथा जमीन पर टिकाएं और दोनों हाथ आगे फैलाएं।",
      benefit: "माथे पर दबाव से वेगस नर्व सक्रिय होती है, जिससे तेज धड़कन सामान्य होती है और पैनिक शांत होता है।",
    },
    physicalActivity_bn: {
      name: "বালাসন (Balasana / Child's Pose) ও শারীরিক প্রশান্তি",
      duration: "৫ মিনিট (৩ বার)",
      instructions: "হাঁটু গেড়ে বসুন, পায়ের বুড়ো আঙুল জোড়া করুন, সামনের দিকে ঝুঁকে কপাল মেঝেতে রাখুন এবং হাত দুটি সামনের দিকে প্রসারিত করুন।",
      benefit: "কপালে মৃদু চাপ ভেগাস নার্ভকে উদ্দীপিত করে এবং হৃদস্পন্দন স্বাভাবিক করে তাৎক্ষণিক উদ্বেগ কমায়।",
    },
    physicalActivity_hl: {
      name: "Balasana (Child's Pose) & Body Grounding",
      duration: "5 Minute (3 Reps)",
      instructions: "Ghutno ke bal baithein, aage jhukte hue apna maatha zameen par rakhein aur dono haath aage failayein.",
      benefit: "Maathe par halka pressure vagus nerve activate karta hai jisse tez dil ki dhadkan shaant hoti hai.",
    },

    // Grounding Steps
    groundingSteps: [
      "1. PHYSICAL ASANA — Enter Balasana (Child's Pose) for 3 minutes. Feel the floor supporting your entire body.",
      '2. PRANAYAMA (4-4-6) — Inhale 4 seconds, hold 4 seconds, exhale slowly 6 seconds. Repeat 5 cycles to deactivate somatic panic.',
      '3. COGNITIVE RE-FRAME — Write: "I control the effort, not the result." Pick one micro-action and do it for 10 minutes without fear of failure.',
    ],
    groundingSteps_hi: [
      '1. शारीरिक आसन — 3 मिनट के लिए बालासन में बैठें और अपने पूरे शरीर को जमीन पर विश्राम करने दें।',
      '2. प्राणायाम (4-4-6) — 4 सेकंड सांस लें, 4 सेकंड रोकें, 6 सेकंड छोड़ें। 5 बार दोहराएं।',
      '3. विचार शुद्धि — लिखें: "मेरा नियंत्रण केवल प्रयास पर है, परिणाम पर नहीं।" 10 मिनट के लिए कोई एक छोटा कार्य शुरू करें।',
    ],
    groundingSteps_bn: [
      '১. শারীরিক আসন — ৩ মিনিটের জন্য বালাসনে বসুন এবং মাটির সংস্পর্শ অনুভব করে শরীর শিথিল করুন।',
      '২. শ্বাসপ্রশ্বাস নিয়ন্ত্রণ — ৪ সেকেন্ড শ্বাস নিন, ৪ সেকেন্ড ধরে রাখুন, ৬ সেকেন্ডে ধীরে ধীরে শ্বাস ছাড়ুন। ৫ বার করুন।',
      '৩. চিন্তার পরিবর্তন — মনে বলুন: "নিয়ন্ত্রণ শুধু প্রচেষ্টায়, ফলাফলে নয়।" ত্রুটিহীনতার চাপ ছাড়া ১০ মিনিট একটি কাজ করুন।',
    ],
    groundingSteps_hl: [
      '1. PHYSICAL MOVEMENT — 3 minute ke liye Balasana posture mein baithein aur body ko zameen par relax hone dein.',
      '2. SAANS LEIN (4-4-6) — 4 second saans andar lein, 4 second rokein, 6 second mein dheere-dheere chhodein.',
      '3. THOUGHT REFRAME — Kahein: "Mera control sirf mehnat par hai, outcome par nahi." 10 minute ek chhota task karein.',
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

    // Dedicated Physical Activity
    physicalActivity: {
      name: 'Surya Namaskar (Sun Salutation) & Brisk Dynamic Walk',
      duration: '8–10 Minutes (4–6 Rounds)',
      instructions: 'Stand tall in Pranamasana, inhale arms overhead into Hasta Uttanasana, forward fold into Padahastasana, and flow through Cobra Pose (Bhujangasana). Follow with 5 minutes of brisk walking.',
      benefit: 'Breaks psychomotor lethargy, stimulates prefrontal dopamine and serotonin production, and elevates body temperature.',
    },
    physicalActivity_hi: {
      name: 'सूर्य नमस्कार (Surya Namaskar) एवं तीव्र गति से चहलकदमी',
      duration: '8–10 मिनट (4–6 चक्र)',
      instructions: 'प्रणामासन में सीधे खड़े हों, हस्तउत्तानासन में हाथ ऊपर ले जाएं, पादहस्तासन में आगे झुकें और भुजंगासन में आएं। इसके बाद 5 मिनट तेज टहलें।',
      benefit: 'शारीरिक सुस्ती दूर होती है, डोपामाइन का स्तर बढ़ता है और मन में सकारात्मक ऊर्जा का संचार होता है।',
    },
    physicalActivity_bn: {
      name: 'সূর্য নমস্কার (Surya Namaskar) ও দ্রুত হাঁটা',
      duration: '৮–১০ মিনিট (৪–৬ বার)',
      instructions: 'প্রণামাসনে সোজা হয়ে দাঁড়ান, হস্তউত্থানাসনে হাত উপরে তুলুন, পাদহস্তাসনে সামনে ঝুঁকুন এবং ভুজঙ্গাসনে আসুন। এরপর ৫ মিনিট দ্রুত হাঁটুন।',
      benefit: 'শারীরিক অবসাদ দূর করে মস্তিষ্কে ডোপামিন হরমোনের নিঃসরণ বৃদ্ধি পায় এবং উদ্যম ফিরে আসে।',
    },
    physicalActivity_hl: {
      name: 'Surya Namaskar & Brisk Movement Walk',
      duration: '8–10 Minute (4–6 Rounds)',
      instructions: 'Seedhe khade hokar Surya Namaskar ke steps karein (Pranamasana, Forward fold, Cobra pose), fir 5 min brisk walk karein.',
      benefit: 'Body ka aalas aur sluggishness door hoti hai aur dopamine hormones release hote hain.',
    },

    // Grounding Steps
    groundingSteps: [
      '1. PHYSICAL MOVEMENT — Stand upright, open chest wide, take 10 deep expansive breaths, and perform 4 rounds of Surya Namaskar or a 5-minute brisk walk.',
      '2. MICRO-VICTORY — Complete one tiny physical task (make your bed, drink a full glass of water, step into direct sunlight). Acknowledge it as an intentional win.',
      '3. SOCIAL ANCHOR — Send a text or call one friend or loved one today. Break isolation deliberately.',
    ],
    groundingSteps_hi: [
      '1. शारीरिक गतिशीलता — सीधे खड़े हों, सीना चौड़ा करें, 10 गहरी सांसें लें और 4 चक्र सूर्य नमस्कार या 5 मिनट तेज टहलें।',
      '2. लघु-सफलता — एक छोटा भौतिक कार्य पूरा करें (बिस्तर ठीक करना, एक गिलास पानी पीना, धूप में जाना)।',
      '3. संपर्क — आज किसी एक प्रियजन को संदेश भेजें या बात करें। अकेलेपन को तोड़ें।',
    ],
    groundingSteps_bn: [
      '১. শারীরিক সক্রিয়তা — সোজা হয়ে দাঁড়ান, বুক চওড়া করুন, ১০টি দীর্ঘ শ্বাস নিন এবং ৪ বার সূর্য নমস্কার বা ৫ মিনিট দ্রুত হাঁটুন।',
      '২. ক্ষুদ্র বিজয় — যেকোনো একটি ছোট কাজ সম্পন্ন করুন (যেমন বিছানা গোছানো বা এক গ্লাস জল খাওয়া)।',
      '৩. যোগাযোগ — প্রিয় কাউকে আজ একটি বার্তা বা ফোন করুন। নিঃসঙ্গতা দূর করুন।',
    ],
    groundingSteps_hl: [
      '1. PHYSICAL ACTIVITY — Seedhe khade ho kar 10 gehri saansein lein aur 4 Surya Namaskar ya 5 min brisk walk karein.',
      '2. MICRO-VICTORY — Ek chhota task poora karein (bistar theek karna, 1 glass paani peena). Isse apni jeet maanein.',
      '3. SOCIAL CONNECTION — Aaj kisi dost ya family member ko call ya message karein.',
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

    // Dedicated Physical Activity
    physicalActivity: {
      name: 'Marjaryasana-Bitilasana (Cat-Cow Stretch) & Palm Tension Release',
      duration: '6 Minutes (10 Slow Breath Cycles)',
      instructions: 'Get onto hands and knees. Inhale arching spine down and looking up (Cow); exhale rounding spine tucking chin to chest (Cat). Firmly press palms together for 10s.',
      benefit: 'Decompresses cervical and lumbar spine, releases trapped muscular tension from neck and jaw, and lowers cortisol.',
    },
    physicalActivity_hi: {
      name: 'मार्जरी-बिटिलासन (Cat-Cow Pose) एवं हथेली दबाव क्रिया',
      duration: '6 मिनट (10 श्वास चक्र)',
      instructions: 'हाथों और घुटनों के बल आएं। सांस लेते हुए कमर नीचे झुकाएं व ऊपर देखें (Cow); सांस छोड़ते हुए रीढ़ ऊपर उठाएं व ठुड्डी सीने से लगाएं (Cat)। दोनों हथेलियों को 10 सेकंड दबाएं।',
      benefit: 'गर्दन और कंधों का तनाव निकलता है, रीढ़ की हड्डी लचीली होती है और तनाव हार्मोन (कोर्टिसोल) कम होता है।',
    },
    physicalActivity_bn: {
      name: 'মার্জারি-বিড়ালাসন (Cat-Cow Stretch) ও করতল চাপ মুক্তি',
      duration: '৬ মিনিট (১০টি শ্বাস চক্র)',
      instructions: 'হাত ও হাঁটুর ওপর ভর দিয়ে বসুন। শ্বাস নিয়ে পিঠ নিচের দিকে নামিয়ে ওপরের দিকে তাকান; শ্বাস ছেড়ে পিঠ ধনুকের মতো বাঁকিয়ে চিবুক বুকে লাগান। ১০ সেকেন্ড দুই হাতের তালু চাপুন।',
      benefit: 'ঘাড় ও কাঁধের জমাট বাঁধা পেশীর চাপ দূর হয় এবং কর্টিসোল হরমোনের মাত্রা দ্রুত হ্রাস পায়।',
    },
    physicalActivity_hl: {
      name: 'Cat-Cow Spinal Stretch & Palm Tension Release',
      duration: '6 Minute (10 Breath Cycles)',
      instructions: 'Hands aur knees par aayein. Inhale karke spine neeche karein (Cow), exhale karke spine round karein (Cat). Dono palms ko 10s press karein.',
      benefit: 'Gardan aur shoulders ka physical tension release hota hai aur cortisol level drop hota hai.',
    },

    // Grounding Steps
    groundingSteps: [
      '1. PHYSICAL DECOMPRESSION — Perform 10 cycles of Cat-Cow spinal stretches or press your palms together firmly for 10 seconds to discharge somatic tension.',
      '2. SITALI COOLING BREATH — Inhale cooling air through teeth/curled tongue; exhale slowly through nose. Repeat 8 times.',
      '3. 90-SECOND IMPULSE BUFFER — Step back from the frustrating stimulus for 90 seconds. Let the autonomic adrenaline surge clear naturally.',
    ],
    groundingSteps_hi: [
      '1. शारीरिक तनाव मुक्ति — 10 चक्र मार्जरी-बिटिलासन करें या दोनों हथेलियों को 10 सेकंड तक मजबूती से दबाएं।',
      '2. शीतली प्राणायाम — दांतों या जीभ से ठंडी सांस अंदर लें; नाक से धीरे-धीरे बाहर छोड़ें। 8 बार दोहराएं।',
      '3. 90-सेकंड विराम — गुस्से या तनाव की स्थिति से 90 सेकंड के लिए अलग हट जाएं ताकि एड्रेनालाईन शांत हो सके।',
    ],
    groundingSteps_bn: [
      '১. শারীরিক শিথিলকরণ — ১০ বার ক্যাট-কাউ স্ট্রেচ করুন বা ১০ সেকেন্ডের জন্য দুই হাতের তালু শক্ত করে চেপে ধরে শারীরিক উত্তেজনা দূর করুন।',
      '২. শীতলী প্রাণায়াম — দাঁতের ফাঁক দিয়ে শীতল বাতাস টেনে নিন এবং নাক দিয়ে ধীরে ধীরে শ্বাস ছাড়ুন। ৮ বার করুন।',
      '৩. ৯০ সেকেন্ডের বিরতি — যেকোনো উত্তেজনাকর পরিস্থিতি থেকে ৯০ সেকেন্ডের জন্য সরে আসুন যাতে স্নায়ুতন্ত্র শান্ত হতে পারে।',
    ],
    groundingSteps_hl: [
      '1. PHYSICAL MOVEMENT — 10 Cat-Cow stretches karein ya dono hatho ko 10s zor se dabayein.',
      '2. SITALI COOLING BREATH — Daanto ke beech se thandi saans andar lein, naak se dheere chhodein (8 reps).',
      '3. 90-SECOND BUFFER — Gusse ki situation se 90s ke liye dur ho jayein taaki adrenaline settle ho sake.',
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

    // Dedicated Physical Activity
    physicalActivity: {
      name: 'Vrikshasana (Tree Pose) & Nadi Shodhana Pranayama',
      duration: '5 Minutes (2.5 Mins Per Side)',
      instructions: 'Stand on your left foot, place right sole against your inner left thigh. Bring palms together in front of your heart (Anjali Mudra). Fix your gaze on a stationary point.',
      benefit: 'Enhances neuromuscular coordination, activates cerebellar balance circuits, and sustains bilateral alpha brainwave coherence.',
    },
    physicalActivity_hi: {
      name: 'वृक्षासन (Tree Pose / Vrikshasana) एवं नाड़ी शोधन',
      duration: '5 मिनट (दोनों पैरों पर 2.5 मिनट)',
      instructions: 'बाएं पैर पर खड़े हों, दाएं पैर का तलवा बाईं जांघ पर रखें। दोनों हथेलियों को सीने के सामने नमस्कार मुद्रा में जोड़ें और किसी स्थिर बिंदु पर ध्यान केंद्रित करें।',
      benefit: 'मस्तिष्क के दोनों गोलार्द्धों में संतुलन बनता है और अल्फा तरंगों (शांत एकाग्रता) की स्थिरता बनी रहती है।',
    },
    physicalActivity_bn: {
      name: 'বৃক্ষাসন (Tree Pose / Vrikshasana) ও নাড়ী শোধন',
      duration: '৫ মিনিট (উভয় পায়ে ২.৫ মিনিট)',
      instructions: 'বাঁ পায়ে ভর দিয়ে দাঁড়ান, ডান পায়ের পাতা বাঁ উরুর ভেতরের দিকে রাখুন। বুকের সামনে হাত দুটি জোড় করে প্রণাম মুদ্রায় আনুন এবং একটি নির্দিষ্ট বিন্দুতে দৃষ্টি স্থির রাখুন।',
      benefit: 'মস্তিষ্কের উভয় অংশের নিউরোমাসকুলার ভারসাম্য উন্নত করে এবং আলফা ব্রেনওয়েভের স্থিরতা বজায় রাখে।',
    },
    physicalActivity_hl: {
      name: 'Vrikshasana (Tree Pose Balance) & Nadi Shodhana',
      duration: '5 Minute (2.5 Mins each leg)',
      instructions: 'Ek pair par khade hokar doosra pair thigh par rakhein aur dono haatho ko Namaste pose mein laayein.',
      benefit: 'Brain ka neuromuscular balance improve hota hai aur alpha waves steady rehti hain.',
    },

    // Grounding Steps
    groundingSteps: [
      '1. PHYSICAL BALANCE — Hold Vrikshasana (Tree Pose) for 2.5 minutes per side. Anchor physical stability through micro-adjustments.',
      '2. NADI SHODHANA — Perform 5 minutes of alternate nostril breathing to maintain bilateral cerebral equilibrium.',
      '3. WITNESS REFLECTION — Reflect on Sakshi Bhava (detached witness). Share a calm, positive word with someone around you.',
    ],
    groundingSteps_hi: [
      '1. शारीरिक संतुलन — दोनों तरफ 2.5 मिनट वृक्षासन करें और शारीरिक स्थिरता का अनुभव करें।',
      '2. नाड़ी शोधन प्राणायाम — 5 मिनट अनुलोम-विलोम करें ताकि मस्तिष्क का संतुलन बना रहे।',
      '3. साक्षी भाव — घटनाओं को शांत साक्षी बनकर देखें और आसपास किसी के साथ सकारात्मक ऊर्जा साझा करें।',
    ],
    groundingSteps_bn: [
      '১. শারীরিক ভারসাম্য — প্রতি পায়ে ২.৫ মিনিট বৃক্ষাসন করুন এবং শারীরিক স্থিরতা অনুভব করুন।',
      '২. নাড়ী শোধন — ৫ মিনিট অনুলোম-বিলোম প্রাণায়াম করুন যাতে মস্তিষ্কের সমত্ব বজায় থাকে।',
      '৩. সাক্ষী ভাব — জীবনের ঘটনাগুলোকে স্থিরভাবে অবলোকন করুন এবং অপরকে উৎসাহিত করুন।',
    ],
    groundingSteps_hl: [
      '1. PHYSICAL BALANCE — Dono leg par 2.5 min Vrikshasana (Tree pose) balance hold karein.',
      '2. NADI SHODHANA — 5 min Anulom-Vilom saans lein taaki dono brain hemispheres balanced rahein.',
      '3. SAKSHI BHAV — Shaant observer bankar dekhein aur positive energy share karein.',
    ],
  },
};
