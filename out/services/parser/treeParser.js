"use strict";
// web-tree-sitter 초기화 + 언어별 wasm 로드
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
exports.initParser = initParser;
exports.loadLanguage = loadLanguage;
exports.parseCode = parseCode;
const vscode = __importStar(require("vscode"));
const LANGUAGE_MAP = {
    typescript: 'tree-sitter-typescript.wasm',
    typescriptreact: 'tree-sitter-tsx.wasm',
    javascript: 'tree-sitter-javascript.wasm',
    javascriptreact: 'tree-sitter-javascript.wasm',
    python: 'tree-sitter-python.wasm',
    java: 'tree-sitter-java.wasm',
    cpp: 'tree-sitter-cpp.wasm',
    c: 'tree-sitter-c.wasm',
    rust: 'tree-sitter-rust.wasm',
    go: 'tree-sitter-go.wasm',
    kotlin: 'tree-sitter-kotlin.wasm',
    swift: 'tree-sitter-swift.wasm',
    csharp: 'tree-sitter-c_sharp.wasm',
    ruby: 'tree-sitter-ruby.wasm',
};
let ParserClass = null;
let parserInitialized = false;
const languageCache = new Map();
async function initParser(extensionUri) {
    if (parserInitialized)
        return;
    const wasmPath = vscode.Uri.joinPath(extensionUri, 'node_modules', 'web-tree-sitter', 'tree-sitter.wasm').fsPath;
    const module = require('web-tree-sitter');
    await module.init({
        locateFile: () => wasmPath,
    });
    ParserClass = module;
    parserInitialized = true;
    console.log('[NECO] Tree-sitter 초기화 완료');
}
async function loadLanguage(languageId, extensionUri) {
    if (languageCache.has(languageId)) {
        return languageCache.get(languageId);
    }
    const wasmFile = LANGUAGE_MAP[languageId];
    if (!wasmFile)
        return null;
    const wasmPath = vscode.Uri.joinPath(extensionUri, 'node_modules', 'tree-sitter-wasms', 'out', wasmFile).fsPath;
    try {
        const language = await ParserClass.Language.load(wasmPath);
        languageCache.set(languageId, language);
        return language;
    }
    catch (err) {
        console.error(`[NECO] wasm 로드 실패 (${languageId}):`, err);
        return null;
    }
}
async function parseCode(code, languageId, extensionUri) {
    if (!parserInitialized || !ParserClass) {
        console.error('[NECO] 파서가 초기화되지 않았어요.');
        return null;
    }
    const language = await loadLanguage(languageId, extensionUri);
    if (!language)
        return null;
    const parser = new ParserClass();
    parser.setLanguage(language);
    return parser.parse(code);
}
//# sourceMappingURL=treeParser.js.map