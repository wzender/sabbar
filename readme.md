# Sabbar

Sabbar is an app for teaching Hebrew-speaking students Palestinian dialect Arabic.

The app would have a Google Auth (basic) for each student and a special one for the teacher (the teacher email will be hardcoded in an env file).

The practice would consist of days, each day will have a set of lessons (e.g. Day 01, Lesson 01, Lesson 02, Lesson 03).
Each lesson would consist of a set of exercises.
Each exercise would contain:

- Hebrew sentence
- Arabic transliterated answer

Upon identifying, the student could choose a day, and then a lesson.

On choosing a lesson, the exercises would be shown to the user one by one.

The Hebrew sentence would appear on the screen (`prompt_he`), the student would say it, and will press the show translation button.
The system would show the transliterated answer (`answer_he_tatiq`) with some tips (`tips_for_hebrew_speaking`), parsed in a user-friendly manner.
The user would press next to move to the next exercise.

The app would keep track of each student's progress.
