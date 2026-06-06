// web-tree-sitter 초기화 + 언어별 wasm 로드

import * as vscode from 'vscode';

const LANGUAGE_MAP: Record<string, string> = {
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

let ParserClass: any = null;
let parserInitialized = false;
const languageCache = new Map<string, any>();

export async function initParser(extensionUri: vscode.Uri): Promise<void> {
    if (parserInitialized) return;

    const wasmPath = vscode.Uri.joinPath(
        extensionUri,
        'node_modules',
        'web-tree-sitter',
        'tree-sitter.wasm'
    ).fsPath;

    const module = require('web-tree-sitter');

    await module.init({
        locateFile: () => wasmPath,
    });

    ParserClass = module;

    parserInitialized = true;
    console.log('[NECO] Tree-sitter 초기화 완료');
}

export async function loadLanguage(
    languageId: string,
    extensionUri: vscode.Uri
): Promise<any | null> {
    if (languageCache.has(languageId)) {
        return languageCache.get(languageId)!;
    }

    const wasmFile = LANGUAGE_MAP[languageId];
    if (!wasmFile) return null;

    const wasmPath = vscode.Uri.joinPath(
        extensionUri,
        'node_modules',
        'tree-sitter-wasms',
        'out',
        wasmFile
    ).fsPath;

    try {
        const language = await ParserClass.Language.load(wasmPath);
        languageCache.set(languageId, language);
        return language;
    } catch (err) {
        console.error(`[NECO] wasm 로드 실패 (${languageId}):`, err);
        return null;
    }
}

export async function parseCode(
    code: string,
    languageId: string,
    extensionUri: vscode.Uri
): Promise<any | null> {
    if (!parserInitialized || !ParserClass) {
        console.error('[NECO] 파서가 초기화되지 않았어요.');
        return null;
    }

    const language = await loadLanguage(languageId, extensionUri);
    if (!language) return null;

    const parser = new ParserClass();
    parser.setLanguage(language);

    return parser.parse(code);
}