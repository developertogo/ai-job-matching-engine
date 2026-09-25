import { atom } from 'jotai';

// Raw natural language job query text
export const rolePromptAtom = atom<string>('');

// User email address for notifications and subscriptions
export const userEmailAtom = atom<string>('');

// Submission state
export const submissionStatusAtom = atom<'idle' | 'parsing' | 'success' | 'error'>('idle');

// Known technology keywords to scan for
export const KNOWN_KEYWORDS = [
  'Fastify',
  'Python',
  'TypeScript',
  'JavaScript',
  'Next.js',
  'React',
  'Node.js',
  'SQLite',
  'Turso',
  'libSQL',
  'OpenTelemetry',
  'Docker',
  'PyTorch',
  'MLX',
  'Ollama',
  'Embeddings',
  'Remote',
  'Founding',
  'Hybrid',
];

// Derived atom: extracts detected tech keywords in real-time as user types
export const detectedSkillsAtom = atom((get) => {
  const prompt = get(rolePromptAtom);
  if (!prompt || prompt.trim() === '') {
    return [];
  }

  const detected: string[] = [];
  for (const keyword of KNOWN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace('.', '\\.')}\\b`, 'i');
    if (regex.test(prompt)) {
      detected.push(keyword);
    }
  }

  return detected;
});
