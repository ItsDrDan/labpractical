# Regression check

Checks every question type in `index.html` before a push:

- each question type generates without errors or broken text (NaN, undefined, 1.2e-3)
- the grader accepts the game's own answer and rejects every typed wrong choice
- every wrong choice has feedback
- 300 mock practicals: no student sheet repeats a kind of question

`grading.js` (also run by `npm test`) holds the grading and content rules that were wrong once and must stay fixed: over-rounded answers are wrong (20 for 16, 207 for 207.23), very small answers keep a relative tolerance, negated observations don't count, sig-fig keys for molality and moles of ice, exact-tie rounding of answer keys, real minus signs in worked answers.

```
cd tools/check
npm install
npm test
```
