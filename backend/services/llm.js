import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

let lastRequestTime = 0;
const MIN_GAP_MS = 4000;

export function isLLMAvailable() {
  return !!(process.env.GEMINI_API_KEY && process.env.LLM_ENABLED === 'true' && model);
}

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_GAP_MS) {
    const delay = MIN_GAP_MS - elapsed;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastRequestTime = Date.now();
}

function parseJsonResult(text) {
  try {
    let t = text.trim();
    if (t.startsWith('```json')) t = t.slice(7, -3).trim();
    else if (t.startsWith('```')) t = t.slice(3, -3).trim();
    return JSON.parse(t);
  } catch (err) {
    console.error('[LLM Error] Failed to parse JSON:', err);
    return null;
  }
}

export async function generateQuestions(description, symptoms, eegData) {
  if (!isLLMAvailable()) return null;
  try {
    await rateLimit();
    const prompt = `Generate 3 targeted clinical mental health questions based on the user's description, symptoms, and optional EEG brainwave data.
Description: ${description || 'None'}
Symptoms: ${JSON.stringify(symptoms || [])}
EEG Data: ${JSON.stringify(eegData || {})}
    
Consider these mental states: ACUTE ANXIETY (Visada), DEPRESSION/LETHARGY (Tamas), STRESS & AGITATION (Krodha), EQUILIBRIUM (Sattva).
Generate questions that help differentiate between these states.
Return ONLY a valid JSON array where each object has: id (string), text (string), and options (array of 3 strings).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseJsonResult(response.text());
  } catch (err) {
    console.error('[LLM Error] generateQuestions:', err);
    return null;
  }
}

export async function analyzeSession(signals, answers, state, description) {
  if (!isLLMAvailable()) return null;
  try {
    await rateLimit();
    const prompt = `Analyze this mental health session data incorporating neuro-spectral (EEG alpha/beta/theta, attention/meditation) and cardiovascular biomarkers (Heart Rate BPM, SpO2 blood oxygen saturation) if present.
Signals: ${JSON.stringify(signals)}
Answers: ${JSON.stringify(answers)}
State: ${state}
Description: ${description}

Return ONLY a JSON object with: 
- summary (2-3 sentence analysis string integrating brainwaves and cardiovascular response)
- insights (array of key observation strings)
- recommendations (array of actionable suggestion strings)
- neuralPattern (description of what the combined physiological pattern suggests string)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseJsonResult(response.text());
  } catch (err) {
    console.error('[LLM Error] analyzeSession:', err);
    return null;
  }
}

export async function calibrateClassification(signals, ruleState, mlState, confidence) {
  if (!isLLMAvailable()) return null;
  try {
    await rateLimit();
    const prompt = `When ML and rule-based classifiers disagree or confidence is low, weigh in on the mental state.
Signals: ${JSON.stringify(signals)}
Rule State: ${ruleState}
ML State: ${mlState}
Confidence: ${confidence}

Consider the mental states: ACUTE ANXIETY (Visada), DEPRESSION/LETHARGY (Tamas), STRESS & AGITATION (Krodha), EQUILIBRIUM (Sattva).
Return ONLY a JSON object with:
- suggestedState (string, one of the above 4 states)
- reasoning (string)
- calibratedConfidence (number between 0 and 1)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return parseJsonResult(response.text());
  } catch (err) {
    console.error('[LLM Error] calibrateClassification:', err);
    return null;
  }
}

export async function generateNeuralInsight(eegData) {
  if (!isLLMAvailable()) return null;
  try {
    await rateLimit();
    const prompt = `Generate human-readable insight about the current brainwave pattern.
EEG Data (attention, meditation, alpha, beta, theta, ba_ratio): ${JSON.stringify(eegData)}
Return ONLY a string description.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    console.error('[LLM Error] generateNeuralInsight:', err);
    return null;
  }
}
