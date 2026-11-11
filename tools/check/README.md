# Regression check

Checks every question type in `index.html` before a push:

- each question type generates without errors or broken text (NaN, undefined, 1.2e-3)
- the grader accepts the game's own answer and rejects every typed wrong choice
- every wrong choice has feedback
- 300 mock practicals: no student sheet repeats a kind of question

```
cd tools/check
npm install
npm test
```
