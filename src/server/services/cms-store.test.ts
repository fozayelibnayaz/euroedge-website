import { describe, it, expect } from 'vitest';
import {
  createFormChallenge,
  sanitizePlainText,
  verifyFormChallenge,
} from './cms-store';

describe('cms-store security utilities', () => {
  it('sanitizes HTML and inline script tags cleanly', () => {
    const raw = 'Hello <script>alert(1)</script><b>World</b>!';
    expect(sanitizePlainText(raw)).toBe('Hello World!');
  });

  it('creates and verifies a valid math form challenge', () => {
    const challenge = createFormChallenge();
    const operands = challenge.question.split('+').map((part) => Number(part.trim()));
    const expectedAnswer = String((operands[0] ?? 0) + (operands[1] ?? 0));

    const okResult = verifyFormChallenge(challenge.challengeToken, expectedAnswer);
    expect(okResult.valid).toBe(true);

    const wrongResult = verifyFormChallenge(challenge.challengeToken, '999');
    expect(wrongResult.valid).toBe(false);
  });
});
