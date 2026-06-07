"use strict";
// 노트를 로컬 JSON 파일에 저장하고 읽어오는 서비스
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadNotes = loadNotes;
exports.saveNote = saveNote;
exports.deleteNote = deleteNote;
exports.getPublicNotes = getPublicNotes;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// 저장 파일 경로: 홈 디렉토리/.neco/notes.json
const SAVE_DIR = path.join(os.homedir(), '.neco');
const SAVE_PATH = path.join(SAVE_DIR, 'notes.json');
function ensureDir() {
    if (!fs.existsSync(SAVE_DIR)) {
        fs.mkdirSync(SAVE_DIR, { recursive: true });
    }
}
function loadNotes() {
    ensureDir();
    if (!fs.existsSync(SAVE_PATH))
        return [];
    try {
        const raw = fs.readFileSync(SAVE_PATH, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
function saveNote(note) {
    ensureDir();
    const notes = loadNotes();
    // 같은 id가 있으면 업데이트, 없으면 추가
    const idx = notes.findIndex(n => n.id === note.id);
    if (idx >= 0) {
        notes[idx] = note;
    }
    else {
        notes.unshift(note); // 최신순으로 앞에 추가
    }
    fs.writeFileSync(SAVE_PATH, JSON.stringify(notes, null, 2), 'utf-8');
}
function deleteNote(id) {
    ensureDir();
    const notes = loadNotes().filter(n => n.id !== id);
    fs.writeFileSync(SAVE_PATH, JSON.stringify(notes, null, 2), 'utf-8');
}
function getPublicNotes() {
    return loadNotes().filter(n => n.isPublic);
}
//# sourceMappingURL=noteStorageService.js.map