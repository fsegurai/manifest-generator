// Extending Jest to include your custom matchers
import '@jest/globals';

declare module '@jest/globals' {
  interface Matchers<R> {
    toContainSubstring(expected: string): R;
  }
}
