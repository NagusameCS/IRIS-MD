export function renderMarkdown(input, container) {
  const lines = input.split('\n');
  let html = '';
  let inQuiz = false;
  let quizBlock = [];

  for (let line of lines) {
    if (line.trim().startsWith(':::quiz')) {
      inQuiz = true;
      quizBlock = [];
      continue;
    } else if (line.trim() === ':::') {
      inQuiz = false;
      html += renderQuizBlock(quizBlock);
      continue;
    }

    if (inQuiz) {
      quizBlock.push(line);
    } else {
      html += parseStandardMarkdown(line);
    }
  }

  container.innerHTML = html;
  if (window.MathJax && window.MathJax.typeset) {
    window.MathJax.typeset();
  }
}

function parseStandardMarkdown(line) {
  if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
  if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
  if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
  if (line.startsWith('> ')) return `<blockquote>${renderMath(line.slice(2))}</blockquote>`;
  if (line.trim() === '---') return '<hr />';
  return `<p>${renderMath(line)}</p>`;
}

function renderMath(text) {
  return text.replace(/\$(.+?)\$/g, (_, tex) => `\\(${tex}\\)`);
}

function renderQuizBlock(blockLines) {
  const data = {};
  let key = null;
  for (let line of blockLines) {
    if (/^\s{2,}/.test(line)) {
      const content = line.trim();
      if (Array.isArray(data[key])) {
        data[key].push(renderMath(content));
      } else {
        data[key] = [renderMath(content)];
      }
    } else {
      const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
      if (match) {
        key = match[1];
        data[key] = renderMath(match[2]);
      }
    }
  }

  const questionHTML = `<p><strong>Question:</strong> ${data.question}</p>`;
  const hintHTML = data.hint
    ? `<details><summary>Hint</summary><div>${Array.isArray(data.hint) ? data.hint.join('<br>') : data.hint}</div></details>`
    : '';
  const inputID = `quiz-${Math.random().toString(36).slice(2)}`;

  return `
    <div class="quiz-block">
      ${questionHTML}
      ${hintHTML}
      <input type="text" id="${inputID}" placeholder="Enter your answer" />
      <button onclick="checkQuizAnswer('${inputID}', \"${data.answer.replace(/\\/g, '\\\\')}\", '${data.check || 'symbolic'}')">Check</button>
      <div class="quiz-result" id="${inputID}-result"></div>
    </div>
  `;
}

window.checkQuizAnswer = function(inputID, correctExpr, checkType) {
  const input = document.getElementById(inputID).value;
  const resultDiv = document.getElementById(`${inputID}-result`);

  try {
    if (checkType === 'symbolic') {
      const user = nerdamer(input).evaluate().text();
      const correct = nerdamer(correctExpr).evaluate().text();
      if (user === correct) {
        resultDiv.innerHTML = '<span style="color: green">Correct</span>';
      } else {
        resultDiv.innerHTML = `<span style="color: red">Incorrect. You entered: ${user}</span>`;
      }
    } else {
      if (input.trim() === correctExpr.trim()) {
        resultDiv.innerHTML = '<span style="color: green">Correct</span>';
      } else {
        resultDiv.innerHTML = '<span style="color: red">Incorrect</span>';
      }
    }
    if (window.MathJax && window.MathJax.typeset) {
      window.MathJax.typeset();
    }
  } catch (e) {
    resultDiv.innerHTML = `<span style="color: red">Error: ${e.message}</span>`;
  }
};
