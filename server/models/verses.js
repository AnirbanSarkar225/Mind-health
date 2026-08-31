/**
 * GitaVerse data — port of backend/models/verses.py.
 * All 4 Gita verses with Sanskrit, transliteration, translation, grounding steps.
 */

import { MentalState } from './states.js';

export const GITA_VERSES = {
  [MentalState.ANXIETY]: {
    chapter: 2,
    verse: 47,
    sanskrit:
      'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
    transliteration:
      'karmanhy evadhikaras te ma phaleshu kadachana\nma karma-phala-hetur bhur ma te sango \'stv akarmani',
    translation:
      'You have the right to perform your duty, but you are not entitled to the fruits of your actions. Never consider yourself the cause of the results, and never be attached to inaction.',
    concept: 'Nishkama Karma',
    conceptSanskrit: 'निष्काम कर्म',
    groundingSteps: [
      'BREATHE — Close your eyes. Inhale 4 counts, hold 4, exhale 6. Repeat 5 cycles. Focus only on the breath, not the outcome.',
      'RE-FRAME — Write down the anxious thought. Beside it write: "I control the effort, not the result." Read it aloud.',
      'ACT WITHOUT ATTACHMENT — Pick one small task you have been avoiding. Do it for 10 minutes with zero expectation of perfection.',
    ],
  },

  [MentalState.DEPRESSION]: {
    chapter: 6,
    verse: 5,
    sanskrit:
      'उद्धरेदात्मनात्मानं नात्मानमवसादयेत् ।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः ॥',
    transliteration:
      'uddhared atmanatmanam natmanam avasadayet\natmaiva hy atmano bandhur atmaiva ripur atmanah',
    translation:
      'Elevate yourself through the power of your own mind, and do not degrade yourself. The mind can be the friend and also the enemy of the self.',
    concept: 'Atma-Shatru / Atma-Uddhara',
    conceptSanskrit: 'आत्म-शत्रु / आत्मोद्धार',
    groundingSteps: [
      'MORNING ANCHOR — Upon waking, place both feet on the ground. Say aloud: "I am my own ally. I choose to rise today."',
      'MICRO-VICTORY — Complete one tiny achievable task (make your bed, drink water, step outside 2 min). Acknowledge it as a win.',
      'CONNECTION — Reach out to one person today — a text, a call, even a smile. You are not meant to fight alone.',
    ],
  },

  [MentalState.STRESS]: {
    chapter: 2,
    verse: 63,
    sanskrit:
      'क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः ।\nस्मृतिभ्रंशाद् बुद्धिनाशो बुद्धिनाशात्प्रणश्यति ॥',
    transliteration:
      'krodhad bhavati sammohah sammohat smriti-vibhramah\nsmriti-bhramsad buddhi-nasho buddhi-nashat pranashyati',
    translation:
      'From anger arises delusion; from delusion, confusion of memory; from confusion of memory, loss of reason; and from loss of reason, one falls into ruin.',
    concept: 'Dhyana & Indriya-Nigraha',
    conceptSanskrit: 'ध्यान एवं इन्द्रिय-निग्रह',
    groundingSteps: [
      'PAUSE — When agitation peaks, physically stop. Press your palms together firmly for 10 seconds. This interrupts the anger cascade.',
      '5-4-3-2-1 GROUNDING — Name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste. Anchor into the present.',
      'DHYANA RESET — Listen to 3 minutes of calming sound (Om chanting, nature, binaural beats). Let your senses recalibrate.',
    ],
  },

  [MentalState.EQUILIBRIUM]: {
    chapter: 2,
    verse: 56,
    sanskrit:
      'दुःखेष्वनुद्विग्नमनाः सुखेषु विगतस्पृहः ।\nवीतरागभयक्रोधः स्थितधीर्मुनिरुच्यते ॥',
    transliteration:
      'duhkheshv anudvigna-manah sukheshu vigata-sprhah\nvita-raga-bhaya-krodhah sthita-dhir munir ucyate',
    translation:
      'One whose mind remains undisturbed amidst sorrow, who does not crave pleasure, and who is free from attachment, fear, and anger — such a person is called a sage of steady wisdom.',
    concept: 'Sthitaprajna',
    conceptSanskrit: 'स्थितप्रज्ञ',
    groundingSteps: [
      'GRATITUDE PAUSE — You are in balance. Close your eyes and mentally list 3 things you are grateful for right now.',
      'DEEPEN WISDOM — Read one additional verse from Bhagavad Gita Chapter 2 (verses 54-72) to strengthen Sthitaprajna understanding.',
      'PAY IT FORWARD — Share a calming word or gesture with someone around you. Equilibrium grows when given away.',
    ],
  },
};
