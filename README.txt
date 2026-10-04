AI4ALL Workshop Handout Demo
============================

Files
-----
index.html   Main page/app shell
styles.css   Responsive visual design matching the supplied screenshot
app.js       Modules, form handling, progress tracking, localStorage autosave,
             evidence list, print-to-PDF flow, and mailto email draft.

How to run
----------
1. Keep all three files in the same folder.
2. Open index.html in a modern browser.
3. Fill in the form fields. Your responses are saved locally in that browser.
4. Use Review & Submission to review progress.
5. Download PDF uses the browser print dialog. Choose "Save as PDF".
6. Email submission opens your default email application with a prepared draft.

Notes
-----
- Evidence file names and sizes are saved locally; the actual file bytes are not uploaded.
- For true server-side upload, authentication, PDF generation, or email sending,
  connect this frontend to a backend service.
- The module/question data lives at the top of app.js and can be edited easily.
