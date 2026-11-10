# PSAT Practice

Free, static PSAT/NMSQT practice site: 2 full-length practice tests in the digital format, quick topic practice, and study guides. No login, no backend; progress is saved in the browser (localStorage).

- `site/`: the published website (plain HTML/CSS/JS)
- `build/`: question banks and generators. All questions are original.
  - `verify_math.py` independently checks every math answer key with SymPy and writes `math.json`
  - `build.py` assembles `site/assets/questions.js` and checks answer-key integrity
  - `gen_pages.py` regenerates the study-guide pages
  - `e2e.py` runs a headless-browser test (takes both tests and checks scoring)

Rebuild: `cd build && python verify_math.py && python build.py && python gen_pages.py`

Not affiliated with or endorsed by College Board or National Merit Scholarship Corporation.
