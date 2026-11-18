// VerseLight i18n 构建期插件（v2）
//
// 把"展示型"英文字面量改写为 __t("English")，运行时按当前语言查表。
//
// 覆盖范围：
//   1. JSX 文本子节点：            <span>Save All</span>
//   2. 展示型 JSX 属性：           <Input placeholder="Search" />
//   3. JSX 子表达式里的字符串：    {on ? 'Output ON' : 'Output OFF'}
//   4. 展示型对象属性（含三元）：  showToast({ title: on ? 'A' : 'B' })
//
// 明确不碰：
//   * 比较运算（===/!==/==/!=）与 switch/case 的值
//   * includes/indexOf/startsWith/endsWith 等查找调用的参数
//   * 对象键、数组枚举、import 说明符、路径、URL、纯小写标识符
//   * 事件回调（箭头函数体）里的字符串

import { parseAst } from 'rolldown/parseAst';
import fs from 'node:fs';
import path from 'node:path';

const DISPLAY_ATTRS = new Set([
  'placeholder',
  'title',
  'label',
  'message',
  'description',
  'alt',
  'aria-label',
  'tooltip',
  'content',
  'heading',
  'confirmLabel',
  'cancelLabel',
  'dismissLabel',
  'toastTitle',
  'toastMessage',
  'emptyMessage',
]);

const DISPLAY_KEYS = new Set([
  ...DISPLAY_ATTRS,
  'body',
  'detail',
  'text',
  'hint',
  'subtitle',
  'caption',
  'summary',
  'errorMessage',
]);

const SKIP_CALLS = new Set([
  'includes',
  'indexOf',
  'lastIndexOf',
  'startsWith',
  'endsWith',
  'has',
  'get',
  'test',
  'match',
  'exec',
  'replace',
  'split',
  'querySelector',
  'getElementById',
  'querySelectorAll',
  'dispatchEvent',
  'require',
  'import',
]);

const COMPARE_OPS = new Set(['===', '!==', '==', '!=']);

const MIN_LENGTH = 2;
const MAX_LENGTH = 400;

function needsTranslate(value) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (s.length < MIN_LENGTH || s.length > MAX_LENGTH) return false;
  if (!/[A-Za-z]{2}/.test(s)) return false;
  if (s.includes('${')) return false;
  if (/^[a-z0-9_-]+$/.test(s)) return false;
  if (/^[\w./-]+\.(png|jpe?g|svg|webp|ico|css|js|json|md|ldsong|lrc|txt|pdf)$/i.test(s)) return false;
  if (/^(https?:\/\/|\/|\.\.?\/|data:|blob:)/.test(s)) return false;
  if (/^[A-Za-z0-9+/=]{40,}$/.test(s)) return false;
  return true;
}

const jsonString = (value) => JSON.stringify(value.replace(/\s+/g, ' ').trim());

function isStringLiteral(node) {
  return (
    !!node &&
    (node.type === 'Literal' || node.type === 'StringLiteral') &&
    typeof node.value === 'string'
  );
}

function staticTemplate(node) {
  if (!node || node.type !== 'TemplateLiteral') return null;
  if (!Array.isArray(node.expressions) || node.expressions.length > 0) return null;
  const quasi = node.quasis?.[0]?.value?.cooked ?? node.quasis?.[0]?.value?.raw;
  return typeof quasi === 'string' ? quasi : null;
}

function jsxAttributeName(node) {
  const name = node?.name;
  return name && name.type === 'JSXIdentifier' && typeof name.name === 'string' ? name.name : null;
}

function propertyKeyName(node) {
  const key = node?.key;
  if (!key) return null;
  if (key.type === 'Identifier' && typeof key.name === 'string') return key.name;
  if (isStringLiteral(key)) return key.value;
  return null;
}

function isPropertyNode(node) {
  return node && (node.type === 'ObjectProperty' || node.type === 'Property');
}

/** 判断字面量是否处于"不能翻译"的位置 */
function isProtectedPosition(node, parent, grandparent) {
  if (!parent) return false;

  if (parent.type === 'BinaryExpression' && COMPARE_OPS.has(parent.operator)) return true;
  if (parent.type === 'SwitchCase' && parent.test === node) return true;
  if (isPropertyNode(parent) && parent.key === node) return true;
  if (parent.type === 'ImportDeclaration' || parent.type === 'ExportAllDeclaration') return true;
  if (parent.type === 'ExportNamedDeclaration' || parent.type === 'ImportExpression') return true;

  if (parent.type === 'CallExpression') {
    if (parent.callee?.type === 'Import') return true;
    const calleeName = parent.callee?.property?.name || parent.callee?.name;
    if (calleeName && SKIP_CALLS.has(calleeName)) return true;
  }

  // new Set([...]) / new Map([...]) 之类的枚举
  if (parent.type === 'ArrayExpression' && grandparent?.type === 'NewExpression') return true;

  return false;
}

export function i18nPlugin() {
  // 构建期间收集所有需要翻译的英文原文，构建结束写到 .i18n-keys.json，
  // 用于统计覆盖率 / 找出还没翻译的条目。
  const collected = new Set();

  return {
    name: 'verselight-i18n',
    enforce: 'pre',
    buildEnd() {
      try {
        const out = path.resolve(process.cwd(), '.i18n-keys.json');
        fs.writeFileSync(out, `${JSON.stringify([...collected].sort(), null, 1)}\n`, 'utf8');
      } catch {
        // 统计失败不影响构建
      }
    },
    transform(code, id) {
      const normalizedId = id.replace(/\\/g, '/');
      if (!/\/src\//.test(normalizedId)) return null;
      if (/\/src\/i18n\//.test(normalizedId)) return null;
      if (!/\.(jsx?|tsx?)$/.test(normalizedId)) return null;

      let ast;
      try {
        ast = parseAst(code, { lang: 'jsx' });
      } catch {
        return null;
      }

      const edits = [];
      const seen = new Set();

      const push = (node, text, source) => {
        const key = `${node.start}:${node.end}`;
        if (seen.has(key)) return;
        seen.add(key);
        edits.push({ start: node.start, end: node.end, text });
        if (typeof source === 'string') collected.add(source.replace(/\s+/g, ' ').trim());
      };

      // 上下文：jsxChildren 表示当前在 JSX 子节点位置；displayValue 表示在展示型属性值内
      const visit = (node, parent, grandparent, ctx) => {
        if (!node || typeof node !== 'object') return;

        if (Array.isArray(node)) {
          for (const child of node) visit(child, parent, grandparent, ctx);
          return;
        }
        if (typeof node.type !== 'string') return;

        const type = node.type;
        let nextCtx = ctx;

        if (type === 'JSXElement' || type === 'JSXFragment') {
          nextCtx = { ...ctx, jsxChildren: true };
        } else if (type === 'JSXOpeningElement' || type === 'JSXClosingElement') {
          // 属性位置上只有白名单属性才算展示文案（避免 className/type 等被翻译）
          nextCtx = { ...ctx, jsxChildren: false };
        } else if (
          type === 'ArrowFunctionExpression' ||
          type === 'FunctionExpression' ||
          type === 'FunctionDeclaration'
        ) {
          // 事件回调里的字符串通常是逻辑值，不翻译
          nextCtx = { ...ctx, jsxChildren: false, displayValue: false };
        } else if (type === 'JSXAttribute') {
          const name = jsxAttributeName(node);
          nextCtx = { ...ctx, displayValue: ctx.displayValue || (name ? DISPLAY_ATTRS.has(name) : false) };
        } else if (isPropertyNode(node)) {
          const name = propertyKeyName(node);
          nextCtx = { ...ctx, displayValue: ctx.displayValue || (name ? DISPLAY_KEYS.has(name) : false) };
        } else if (type === 'ConditionalExpression' || type === 'LogicalExpression' || type === 'SequenceExpression') {
          nextCtx = ctx; // 分支继承上下文
        } else if (type === 'JSXExpressionContainer') {
          nextCtx = ctx;
        }

        // JSX 文本子节点：<span>Save All</span>
        if (type === 'JSXText') {
          const raw = typeof node.value === 'string' ? node.value : '';
          if (ctx.jsxChildren && needsTranslate(raw)) {
            const lead = raw.match(/^\s*/)[0];
            const trail = raw.match(/\s*$/)[0];
            const core = raw.slice(lead.length, raw.length - trail.length);
            if (core) {
              push(node, `${lead}{__t(${jsonString(core)})}${trail}`, core);
              return;
            }
          }
        }

        // 具体的字面量处理
        if (isStringLiteral(node) || staticTemplate(node)) {
          const value = isStringLiteral(node) ? node.value : staticTemplate(node);
          const eligible =
            (ctx.jsxChildren || ctx.displayValue) &&
            !isProtectedPosition(node, parent, grandparent) &&
            needsTranslate(value);

          if (eligible) {
            // JSX 属性值需要包成表达式容器，其余位置直接调用
            const inAttributeValue = parent?.type === 'JSXAttribute';
            push(node, inAttributeValue ? `{__t(${jsonString(value)})}` : `__t(${jsonString(value)})`, value);
            return;
          }
        }

        for (const key of Object.keys(node)) {
          if (key === 'parent' || key === 'loc' || key === 'start' || key === 'end') continue;
          const value = node[key];
          if (value && typeof value === 'object') visit(value, node, parent, nextCtx);
        }
      };

      visit(ast, null, null, { jsxChildren: false, displayValue: false });

      if (edits.length === 0) return null;

      edits.sort((a, b) => b.start - a.start);
      let output = code;
      for (const edit of edits) {
        output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
      }

      if (!/\b__t\b/.test(output)) return null;
      output = `import { t as __t } from '@/i18n';\n${output}`;

      return { code: output, map: null };
    },
  };
}

export default i18nPlugin;