import fs from 'fs';
import path from 'path';

/**
 * Generate Markdown from quiz JSON data.
 * @param {object} quizData - The structured quiz data.
 * @param {object} options - Options like saving to file.
 * @returns {string} - The generated Markdown string.
 */
export function generateMarkdown(quizData, options = {}) {
  const {
    save = false,
    outputDir = './output',
    filename = 'quiz.md',
  } = options;

  const md = [];

  // Metadata
  md.push(`# ${quizData.metadata?.title || 'Untitled Quiz'}`);
  if (quizData.metadata?.description) {
    md.push(`> ${quizData.metadata.description}`);
  }
  if (quizData.metadata?.difficulty) {
    md.push(`**Difficulty:** ${quizData.metadata.difficulty}`);
  }
  if (quizData.metadata?.tags?.length) {
    md.push(`**Tags:** ${quizData.metadata.tags.join(', ')}`);
  }
  md.push('\n---\n');

  // Questions
  quizData.questions?.forEach((q, idx) => {
    md.push(`### Q${idx + 1}:\n`);
    md.push(`${renderTemplate(q.template, q.variables)}`);

    // Answer in collapsible block
    const answerRendered = renderAnswer(q);
    if (answerRendered) {
      md.push(`<details><summary>Answer</summary>\n\n${answerRendered}\n\n</details>`);
    }

    // Explanation (optional, math-wrapped)
    if (q.explanation?.template) {
      const expl = q.explanation.template.trim();
      md.push(`\n**Explanation:**\n`);
      md.push(`$$${expl}$$`);
    }

    // Markscheme in collapsible block
    if (q.markscheme?.length) {
      md.push(`<details><summary>Markscheme</summary>\n`);
      q.markscheme.forEach((step) => {
        md.push(`- [${step.marks} mark${step.marks !== 1 ? 's' : ''}] ${step.step}  `);
      });
      md.push(`\n</details>`);
    }

    md.push('\n---\n');
  });

  const markdown = md.join('\n');

  if (save) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, filename), markdown, 'utf8');
  }

  return markdown;
}

/**
 * Replace {{variable}} placeholders with resolved values.
 */
function renderTemplate(template, variables) {
  return template.replace(/\{\{(.*?)\}\}/g, (_, varName) => {
    const val = variables?.[varName];
    return val ? resolveVariable(val) : `[${varName}]`;
  });
}

/**
 * Convert variable definitions into display-ready strings.
 */
function resolveVariable(v) {
  if (typeof v === 'string') return v;

  if (v.type === 'choice') return `$$${v.choices?.[0] || '?'}$$`;
  if (v.type === 'expr') return `$$${v.expression || '?'}$$`;
  if (v.type === 'int' || v.type === 'float') {
    const [min, max] = v.range || ['?', '?'];
    return `$$${min} \\rightarrow ${max}$$`;
  }
  if (v.type === 'latex') return `$$${v.content || '?'}$$`;

  return '[unsupported]';
}

/**
 * Render answer block content.
 */
function renderAnswer(q) {
  if (q.answer?.method === 'manual') {
    return `$$${q.answer.input}$$`;
  }
  if (q.answer?.method === 'computed') {
    return `*(auto-generated via computation: ${q.answer.expression || 'unknown'})*`;
  }
  return null;
}