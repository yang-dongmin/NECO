// 노트를 로컬 JSON 파일에 저장하고 읽어오는 서비스

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ParsedCode } from './parser/types';

export interface NecoNote {
  id: string;
  code: string;
  comment: string;
  parsedCode: ParsedCode | null;
  isPublic: boolean;
  languageId: string;
  fileName: string;
  createdAt: string;
  quiz?: {
    blankedCode: string;
    answer: string;
    hint: string;
  };
}

// 저장 파일 경로: 홈 디렉토리/.neco/notes.json
const SAVE_DIR = path.join(os.homedir(), '.neco');
const SAVE_PATH = path.join(SAVE_DIR, 'notes.json');

function ensureDir() {
  if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
  }
}

export function loadNotes(): NecoNote[] {
  ensureDir();
  if (!fs.existsSync(SAVE_PATH)) return [];
  try {
    const raw = fs.readFileSync(SAVE_PATH, 'utf-8');
    return JSON.parse(raw) as NecoNote[];
  } catch {
    return [];
  }
}

export function saveNote(note: NecoNote): void {
  ensureDir();
  const notes = loadNotes();
  // 같은 id가 있으면 업데이트, 없으면 추가
  const idx = notes.findIndex(n => n.id === note.id);
  if (idx >= 0) {
    notes[idx] = note;
  } else {
    notes.unshift(note); // 최신순으로 앞에 추가
  }
  fs.writeFileSync(SAVE_PATH, JSON.stringify(notes, null, 2), 'utf-8');
}

export function deleteNote(id: string): void {
  ensureDir();
  const notes = loadNotes().filter(n => n.id !== id);
  fs.writeFileSync(SAVE_PATH, JSON.stringify(notes, null, 2), 'utf-8');
}

export function getPublicNotes(): NecoNote[] {
  return loadNotes().filter(n => n.isPublic);
}