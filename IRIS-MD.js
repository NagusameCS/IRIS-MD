// File: IRIS-MD.js

import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';

/**
 * Renders markdown into the specified DOM container.
 * Supports MathJax and quiz blocks with basic syntax highlighting.
 * @param {string} markdown - Markdown string to render.
 * @param {HTMLElement} container - DOM element to render into.
 */
export function renderMarkdown(markdown, container) {
  container.innerHTML = ''; // Clear target

  // Custom block parser for :::quiz blocks
  const quizRegex = /:::quiz\s+([\s\S]*?):::/g;

  const replacedMarkdown = markdown.replace(quizRegex, (_, content) => {
    const parsed = Object.fromEntries(
      [...content.matchAll(/^\s*(\w+):(?:\s*([^:\n]+)|\s*\n\s+((?:.|\n)*?))(?=\n\w+:|\n*$)/gm)].map(([, key, inline, block]) => {
        return [key.trim(), (inline || block || '').trim()];
      })
    );

    const question = marked.parseInline(parsed.question || '');
    const hint = parsed.hint ? `<details><summary>Hint</summary><pre>${parsed.hint}</pre></details>` : '';
    const answer = parsed.answer || '';
    const type = parsed.type || '';
    const check = parsed.check || '';

    return `
      <div class="quiz-block">
        <strong>Question:</strong> ${question}<br/>
        ${hint}
        <label>Answer: <input class="quiz-input" data-answer="${answer}" data-check="${check}" data-type="${type}"/></label>
        <button class="quiz-submit">Check</button>
        <span class="quiz-feedback"></span>
      </div>
    `;
  });

  // Render the processed markdown
  const html = marked.parse(replacedMarkdown);
  container.innerHTML = html;

  // Apply MathJax typesetting
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise([container]);
  }

  // Add logic to quiz buttons
  container.querySelectorAll('.quiz-submit').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.previousElementSibling.querySelector('input');
      const feedback = button.nextElementSibling;
      const expected = input.dataset.answer.trim();
      const actual = input.value.trim();

      // Use nerdamer for symbolic comparison if specified
      if (input.dataset.check === 'symbolic' && typeof nerdamer !== 'undefined') {
        try {
          const isEqual = nerdamer(`(${expected})-(${actual})`).evaluate().text() === '0';
          feedback.textContent = isEqual ? 'Correct' : 'Incorrect';
        } catch {
          feedback.textContent = 'Invalid input';
        }
      } else {
        feedback.textContent = (expected === actual) ? 'Correct' : 'Incorrect';
      }
    });
  });
}
