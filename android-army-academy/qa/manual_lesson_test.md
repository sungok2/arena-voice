## Manual test — module reader
1. Launch app → 과목 → 검색 ‘데이터 기초’ → 학습 열기
2. Tap 01 데이터·정보·지식 구분. Confirm real lesson text and examples appear
3. Tap completion with no exercise: should warn and NOT count as completed
4. Enter at least 30 characters describing the synthetic case, select two correct quiz answers and press completion
5. Confirm 1/6 학습 근거 확인
6. Restart app, confirm verified progress still 1/6
7. Open another module without authored lesson; should state content is not yet ready and offer no completion button
8. Export JSON → import into test installation and confirm completed and draft lesson records persist
9. Check the sound toggle and Android Back navigation with modal open
