export const COMMENT_MAP: Record<string, string> = {
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

export function getCommentPrefix(languageId: string): string {
	return COMMENT_MAP[languageId] ?? '// ';
}