"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMENT_MAP = void 0;
exports.getCommentPrefix = getCommentPrefix;
exports.COMMENT_MAP = {
    python: '# [py] : ',
    javascript: '// [js] : ',
    typescript: '// [ts] : ',
    typescriptreact: '// [tsx] : ',
    javascriptreact: '// [jsx] : ',
    cpp: '// [c++] : ',
    c: '// [c] : ',
    java: '// [java] : ',
    rust: '// [rs] : ',
    go: '// [go] : ',
    kotlin: '// [kt] : ',
    swift: '// [swift] : ',
    csharp: '// [c#] : ',
    php: '// [php] : ',
    ruby: '# [rb] : ',
    shellscript: '# [sh] : ',
    yaml: '# [yaml] : ',
};
function getCommentPrefix(languageId) {
    return exports.COMMENT_MAP[languageId] ?? '// ';
}
//# sourceMappingURL=commentPrefix.js.map