// AST를 받아서 함수명, 매개변수, 반환타입, 핵심 로직을 추출한다.
// 언어별로 노드 타입이 다르기 때문에 언어별 추출 전략을 분리해서 관리한다.

import * as vscode from 'vscode';
import { parseCode } from './treeParser';
import { ParsedCode, ParsedParam, ParseResult } from './types';

// ===== 언어별 함수 노드 타입 =====
// Tree-sitter는 언어마다 함수를 표현하는 노드 이름이 다르다.
const FUNCTION_NODE_TYPES: Record<string, string[]> = {
    typescript: ['function_declaration', 'method_definition', 'arrow_function', 'function_expression'],
    typescriptreact: ['function_declaration', 'method_definition', 'arrow_function', 'function_expression'],
    javascript: ['function_declaration', 'method_definition', 'arrow_function', 'function_expression'],
    javascriptreact: ['function_declaration', 'method_definition', 'arrow_function', 'function_expression'],
    python: ['function_definition'],
    java: ['method_declaration', 'constructor_declaration'],
    cpp: ['function_definition'],
    c: ['function_definition'],
    rust: ['function_item'],
    go: ['function_declaration', 'method_declaration'],
    kotlin: ['function_declaration'],
    swift: ['function_declaration'],
    csharp: ['method_declaration', 'constructor_declaration'],
    ruby: ['method', 'singleton_method'],
};

// ===== 언어별 함수명 노드 =====
const NAME_NODE_TYPES: Record<string, string> = {
    typescript: 'identifier',
    typescriptreact: 'identifier',
    javascript: 'identifier',
    javascriptreact: 'identifier',
    python: 'identifier',
    java: 'identifier',
    cpp: 'function_declarator',
    c: 'function_declarator',
    rust: 'identifier',
    go: 'identifier',
    kotlin: 'simple_identifier',
    swift: 'simple_identifier',
    csharp: 'identifier',
    ruby: 'identifier',
};

// ===== 언어별 매개변수 목록 노드 =====
const PARAMS_NODE_TYPES: Record<string, string> = {
    typescript: 'formal_parameters',
    typescriptreact: 'formal_parameters',
    javascript: 'formal_parameters',
    javascriptreact: 'formal_parameters',
    python: 'parameters',
    java: 'formal_parameters',
    cpp: 'parameter_list',
    c: 'parameter_list',
    rust: 'parameters',
    go: 'parameter_list',
    kotlin: 'function_value_parameters',
    swift: 'function_value_parameters',
    csharp: 'parameter_list',
    ruby: 'method_parameters',
};

const CALL_NODE_TYPES: Record<string, string> = {
  c:               'call_expression',
  cpp:             'call_expression',
  typescript:      'call_expression',
  typescriptreact: 'call_expression',
  javascript:      'call_expression',
  javascriptreact: 'call_expression',
  python:          'call',
  java:            'method_invocation',
  rust:            'call_expression',
  go:              'call_expression',
  kotlin:          'call_expression',
  swift:           'call_expression',
  csharp:          'invocation_expression',
  ruby:            'call',
};

function extractCalledFunctions(
  node: any,
  languageId: string,
  result: Set<string> = new Set()
): string[] {
  const callType = CALL_NODE_TYPES[languageId];
  if (!callType) return [];

  if (node.type === callType) {
    // 함수명 노드는 첫 번째 자식 (identifier 또는 member_expression)
    const nameNode = node.children.find((c: any) =>
      c.type === 'identifier' ||
      c.type === 'field_identifier' ||
      c.type === 'member_expression'
    );
    if (nameNode) result.add(nameNode.text);
  }

  for (const child of node.children) {
    extractCalledFunctions(child, languageId, result);
  }

  return [...result];
}

/*
  AST 노드를 순회해서 함수/메서드 노드를 찾는다.
  - 선택한 코드의 루트 레벨에서 가장 가까운 함수 노드를 반환한다.
  - 중첩 함수의 경우 가장 바깥쪽을 우선한다.
*/
function findFunctionNode(
    node: any,
    languageId: string
): any | null {
    const functionTypes = FUNCTION_NODE_TYPES[languageId] ?? [];

    

    if (functionTypes.includes(node.type)) {
        return node;
    }

    for (const child of node.children) {
        const found = findFunctionNode(child, languageId);
        if (found) return found;
    }

    return null;
}

/*
  매개변수 노드에서 이름과 타입을 추출한다.
  - TypeScript: (userId: string, options?: RequestOptions)
  - Python: (self, user_id, options=None)
  - Java: (String userId, RequestOptions options)
*/
function extractParams(
    paramsNode: any,
    languageId: string
): ParsedParam[] {
    const params: ParsedParam[] = [];

    for (const child of paramsNode.children) {
        // 괄호, 콤마 등 구분자 노드는 건너뜀
        if (child.type === ',' || child.type === '(' || child.type === ')') continue;

        // TypeScript / JavaScript: required_parameter, optional_parameter
        if (
            ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(languageId)
        ) {
            if (
                child.type === 'required_parameter' ||
                child.type === 'optional_parameter' ||
                child.type === 'rest_pattern'
            ) {
                const nameNode = child.children.find((c: any) => c.type === 'identifier' || c.type === 'rest_pattern');
                const typeNode = child.children.find((c: any) => c.type === 'type_annotation');
                params.push({
                    name: nameNode?.text ?? child.text,
                    type: typeNode?.children.find((c: any) => c.type !== ':')?.text,
                });
                continue;
            }

            // arrow function 단일 파라미터 (괄호 없는 경우)
            if (child.type === 'identifier') {
                params.push({ name: child.text });
                continue;
            }
        }

        // Python: identifier
        if (languageId === 'python') {
            if (child.type === 'identifier') {
                params.push({ name: child.text });
            } else if (child.type === 'typed_parameter') {
                const nameNode = child.children.find((c: any) => c.type === 'identifier');
                const typeNode = child.children.find((c: any) => c.type === 'type');
                params.push({
                    name: nameNode?.text ?? child.text,
                    type: typeNode?.text,
                });
            } else if (child.type === 'default_parameter') {
                const nameNode = child.children.find((c: any) => c.type === 'identifier');
                params.push({ name: nameNode?.text ?? child.text });
            }
            continue;
        }

        // Java / C# : formal_parameter
        if (['java', 'csharp'].includes(languageId)) {
            if (child.type === 'formal_parameter') {
                const typeNode = child.children.find((c: any) => c.type === 'type_identifier' || c.type === 'integral_type' || c.type === 'generic_type');
                const nameNode = child.children.find((c: any) => c.type === 'identifier');
                params.push({
                    name: nameNode?.text ?? child.text,
                    type: typeNode?.text,
                });
            }
            continue;
        }
        if (['c', 'cpp'].includes(languageId)) {
            if (child.type === 'parameter_declaration') {
                params.push({ name: child.text });
            }
            continue;
        }
        // Go: parameter_declaration
        if (languageId === 'go') {
            if (child.type === 'parameter_declaration') {
                const nameNode = child.children.find((c: any) => c.type === 'identifier');
                const typeNode = child.children.find((c: any) => c.type !== 'identifier' && c.type !== ',');
                params.push({
                    name: nameNode?.text ?? child.text,
                    type: typeNode?.text,
                });
            }
            continue;
        }

        // Rust: parameter
        if (languageId === 'rust') {
            if (child.type === 'parameter') {
                const nameNode = child.children.find((c: any) => c.type === 'identifier' || c.type === 'pattern');
                const typeNode = child.children.find((c: any) => c.type !== 'identifier' && c.type !== ':' && c.type !== 'pattern');
                params.push({
                    name: nameNode?.text ?? child.text,
                    type: typeNode?.text,
                });
            }
            continue;
        }

        // 그 외 언어: 노드 텍스트 그대로 사용
        if (child.isNamed) {
            params.push({ name: child.text });
        }
    }

    return params;
}

/*
  반환 타입 노드를 찾아서 텍스트를 반환한다.
  - TypeScript: type_annotation 안의 타입
  - Java: 함수 노드의 첫 번째 type 노드
  - 없으면 undefined
*/
function extractReturnType(
    funcNode: any,
    languageId: string
): string | undefined {
    if (['typescript', 'typescriptreact', 'javascript', 'javascriptreact'].includes(languageId)) {
        const returnTypeNode = funcNode.children.find((c: any) => c.type === 'type_annotation');
        return returnTypeNode?.children.find((c: any) => c.type !== ':')?.text;
    }

    if (['java', 'csharp'].includes(languageId)) {
        const typeNode = funcNode.children.find(
            (c: any) => c.type === 'type_identifier' || c.type === 'integral_type' || c.type === 'void_type' || c.type === 'generic_type'
        );
        return typeNode?.text;
    }

    if (languageId === 'go') {
        // Go는 파라미터 목록 뒤에 반환 타입이 온다
        const paramIdx = funcNode.children.findIndex((c: any) => c.type === 'parameter_list');
        if (paramIdx !== -1) {
            const returnNode = funcNode.children[paramIdx + 1];
            if (returnNode && returnNode.type !== 'block') {
                return returnNode.text;
            }
        }
    }

    if (languageId === 'rust') {
        const returnNode = funcNode.children.find((c: any) => c.type === 'return_type');
        return returnNode?.children.find((c: any) => c.type !== '->')?.text;
    }

    return undefined;
}

/*
  메인 분석 함수
  - 코드 문자열과 언어 id를 받아서 ParseResult를 반환한다.
  - 파싱 실패 or 함수 노드를 못 찾으면 success: false
  - 성공하면 ParsedCode를 담아서 반환
*/
export async function analyzeCode(
    code: string,
    languageId: string,
    extensionUri: vscode.Uri
): Promise<ParseResult> {
    // 지원하지 않는 언어면 바로 실패
    if (!FUNCTION_NODE_TYPES[languageId]) {
        return { success: false, reason: `지원하지 않는 언어예요: ${languageId}` };
    }

    // AST 생성
    const tree = await parseCode(code, languageId, extensionUri);
    if (!tree) {
        return { success: false, reason: 'AST 파싱에 실패했어요.' };
    }

    // 함수 노드 탐색
    const funcNode = findFunctionNode(tree.rootNode, languageId);
    if (!funcNode) {
        // 함수가 아닌 코드 선택 시 - raw 코드만 담아서 반환
        return {
            success: true,
            parsed: {
                params: [],
                calledFunctions: [],
                languageId,
                raw: code,
            },
        };
    }

    // 함수명 + 매개변수
    let functionName: string | undefined;
    let params: ParsedParam[] = [];

    if (['c', 'cpp'].includes(languageId)) {
        const declarator = funcNode.children.find((c: any) => c.type === 'function_declarator');
        if (declarator) {
            functionName = declarator.children.find((c: any) => c.type === 'identifier')?.text;
            const paramsNode = declarator.children.find((c: any) => c.type === 'parameter_list');
            if (paramsNode) params = extractParams(paramsNode, languageId);
        }
    } else {
        const nameNode = funcNode.children.find(
            (c: any) => c.type === (NAME_NODE_TYPES[languageId] ?? 'identifier')
        );
        functionName = nameNode?.text;
        const paramsNodeType = PARAMS_NODE_TYPES[languageId] ?? 'formal_parameters';
        const paramsNode = funcNode.children.find((c: any) => c.type === paramsNodeType);
        params = paramsNode ? extractParams(paramsNode, languageId) : [];
    }

    // 반환 타입
    const returnType = extractReturnType(funcNode, languageId);

    // 핵심 로직
    const bodyNode = funcNode.children.find(
        (c: any) => c.type === 'block' || c.type === 'statement_block' || c.type === 'body' || c.type === 'compound_statement'
    );

    // 바디 노드에서 호출 함수 추출
    const calledFunctions = bodyNode
        ? extractCalledFunctions(bodyNode, languageId)
        : [];

    return {
        success: true,
        parsed: {
            functionName,
            params,
            returnType,
            calledFunctions,
            languageId,
            raw: code,
        },
    };
}