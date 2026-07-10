/**
 * types.ts
 * Type definitions for the E-Sports Recruitment app
 */

export type PageView = 'index' | 'register' | 'game';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  highScore: number;
}

export interface PHPFile {
  name: string;
  code: string;
  language: string;
  description: string;
}
