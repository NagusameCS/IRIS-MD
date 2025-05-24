// Description of the Tool:
// - Parses custom :::quiz blocks
// - Symbolic math support with variable binding
// - LaTeX rendering (KaTeX or MathJax compatible)
// - Interactive checking

import nerdamer from 'nerdamer/all.min.js';

/**
 * Parses :::quiz blocks into interactive elements.
 * @param {string} markdown
 * @returns {string} rendered HTML
 */
export function renderQuizzes(markdown) {
  const quizRegex = /:::quiz\n([\s\S]*?)\n:::/g;

  return markdown.replace(quizRegex, (_, content) => {
    const lines = content.trim().split(/\r?\n/);
    const data = {};
    let currentKey = null;

    for (const line of lines) {
      if (/^\s/.test(line)) {
        // continuation of a hint
        if (currentKey && typeof data[currentKey] === 'string') {
          data[currentKey] += '\n' + line.trim();
        }
      } else {
        const [key, ...rest] = line.split(':');
        data[key.trim()] = rest.join(':').trim();
        currentKey = key.trim();
      }
    }

    const id = `quiz-${Math.random().toString(36).slice(2)}`;
    const questionHTML = data.question.replace(/\$(.*?)\$/g, (_, tex) => `\\(${tex}\\)`);
    const hintHTML = data.hint ? `<details><summary>Hint</summary><pre>${data.hint}</pre></details>` : '';

    return `
<div class="quiz" id="${id}">
  <p class="question">${questionHTML}</p>
  ${hintHTML}
  <input type="text" class="quiz-answer" placeholder="Your answer here">
  <button onclick="checkQuizAnswer('${id}', \`${data.answer}\`)" class="quiz-btn">Check</button>
  <div class="quiz-feedback"></div>
</div>
`;
  });
}

// Attach a global check function
window.checkQuizAnswer = function (id, correctExpr) {
  const container = document.getElementById(id);
  const input = container.querySelector('.quiz-answer').value;
  const feedback = container.querySelector('.quiz-feedback');

  try {
    const user = nerdamer(input).toString();
    const correct = nerdamer(correctExpr).toString();

    if (nerdamer.equals(user, correct)) {
      feedback.textContent = 'Correct!';
      feedback.style.color = 'green';
    } else {
      feedback.textContent = `Incorrect. Try again.`;
      feedback.style.color = 'red';
    }
  } catch (e) {
    feedback.textContent = `Error in expression.`;
    feedback.style.color = 'orange';
  }
};

// Optionally call MathJax or KaTeX after rendering
export function renderMath() {
  if (window.MathJax && window.MathJax.typeset) {
    window.MathJax.typeset();
  }
}
