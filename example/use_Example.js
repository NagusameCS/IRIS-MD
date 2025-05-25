import { generateMarkdown } from 'iris-md';
import quiz from './quiz.json' assert { type: 'json' };

const markdown = generateMarkdown(quiz, { save: true });