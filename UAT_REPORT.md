# IHURIRO Rwanda — User Acceptance Testing Report

**Date:** 2026-10-30
**Environment:** Local (XAMPP MySQL 3306 · Express API 4000 · Vite 5173)
**Runtime:** Node v26.11.1, Vite 5.4.8, React 18
**Tester:** Qoder (automated UAT run)
**Data state:** seeded demo dataset restored after testing

---

## 1. Scope

End-to-end acceptance testing of the citizen-facing product:

| Area | Covered |
| --- | --- |
| Authentication | sign in, invalid credentials, registration, validation, role escalation |
| Home dashboard | live statistics, announcements, quick access |
| CitizenConnect | report a complaint, my complaints, track complaint, submit idea, announcements, government services, surveys |
| Education | overview, students, teachers, add student, roles/permissions |
| ParentCare23 | overview, health topics, consultation entry |
| Biz360 Rwanda | products, stock movement, sales, loans, summary |
| Learn Rwanda | quizzes availability |
| Notifications | list, mark read, mark all read |
| AI Assistant | chat reply and provider labelling |
| Profile | view, update phone, password-change guard |
| Admin | users list/create/suspend, audit logs, role isolation |

Out of scope: production deployment, load/performance testing, SMS gateway delivery, external AI provider.

---

## 2. Method

1. **API smoke suite** — `backend/scripts/smoke-test.js` (26 checks).
2. **UAT API suite** — `backend/scripts/uat-checks.mjs` (29 cross-role checks written for this run).
3. **Browser walkthrough** — in-app browser against `http://localhost:5173` (structural snapshots; the hidden automation viewport prevented reliable screenshots).
4. **Data verification** — MySQL queries after each mutation; all UAT records removed afterwards.

---

## 3. Results summary

| Suite | Passed | Failed |
| --- | --- | --- |
| API smoke | 25 | 1 (stale assertion — see OBS-01) |
| UAT API cross-role | 28 | 1 (authorization gap — DEF-02) |
| Browser flows | All executed flows passed except DEF-01 |

**Overall: Conditional PASS.** No blocking defect in the core citizen journey; one high-severity authorization gap and one broken button require fixes.

---

## 4. Test cases

| ID | Test case | Expected | Result |
| --- | --- | --- | --- |
| TC-01 | Sign in with demo citizen | Dashboard loads with live data | PASS |
| TC-02 | Sign in with wrong password | Clear inline error, no session | PASS |
| TC-03 | Register new account | Account created, signed in | PASS |
| TC-04 | Register with duplicate email | 409 with message | PASS |
| TC-05 | Register with missing fields | 422 with field details | PASS |
| TC-06 | Register as `admin` | Rejected (role enum) | PASS |
| TC-07 | Citizen opens admin API | 403 | PASS |
| TC-08 | Dashboard statistics | Users/students/products match DB | PASS |
| TC-09 | Submit complaint with empty form | Validation message | PASS |
| TC-10 | Submit valid complaint | Record created with reference ID | PASS |
| TC-11 | Complaint appears in My Complaints | Listed as Pending with ID | PASS |
| TC-12 | Track Complaint | List with status visible | PASS (see OBS-02) |
| TC-13 | Submit an idea | Confirmation + persisted | PASS |
| TC-14 | Government moves complaint to in-review | Status updated, citizen sees it | PASS |
| TC-15 | Submit survey without answers | "Answer all N questions" error | PASS |
| TC-16 | Submit completed survey | Submitted badge + confirmation | PASS (after fix) |
| TC-17 | Education overview renders | Stats + 14 submodules | PASS |
| TC-18 | Add student from Education overview | Form opens | **FAIL — DEF-01** |
| TC-19 | Add student from Students section | Record created | PASS |
| TC-20 | Citizen creates a student via UI/API | Should be 403 | **FAIL — DEF-02** |
| TC-21 | Teacher creates lesson/quiz/student | Allowed | PASS |
| TC-22 | Parent/teacher publish announcements/health topics | 403 where not permitted | PASS |
| TC-23 | Business stock out | Stock 10 → 7 | PASS |
| TC-24 | Business sale | Amount = 2 × 500 = 1,000 | PASS |
| TC-25 | Business loan + summary | Loan recorded, revenue aggregated | PASS |
| TC-26 | Notifications mark all read | All read | PASS |
| TC-27 | Profile update + revert | Phone updated and restored | PASS |
| TC-28 | Password change with wrong current | Rejected | PASS |
| TC-29 | Admin create + suspend user | Created, status suspended | PASS |
| TC-30 | Audit log | UAT actions recorded | PASS |
| TC-31 | AI assistant reply | Reply with source label | PASS |

---

## 5. Defects

### DEF-01 — "Add Student" on Education overview does nothing (Medium)
`src/components/modules/EducationModule.tsx:103` sets `showAddStudent`, but `AddPersonModal` is only mounted inside the `students` (`:218`) and `teachers` (`:257`) branches. On the overview the state changes with no visible result; the modal appears only after navigating to Students/Teachers.
**Fix:** render `AddPersonModal` in the overview branch (both types) or hide the button there.

### DEF-02 — Missing authorization on student creation (High)
`backend/src/routes/education.js:175` (`POST /students`) has no role check, while `PATCH /students/:id` (`:214`) requires `canManageEducation` (teacher/admin). Any signed-in citizen can create student records; the UI also shows "Add Student" to every role.
**Fix:** apply `canManageEducation` to the POST route and gate the button by role.
**Evidence:** UAT check expected 403, received 201; record was created and later removed.

### DEF-03 — Auth 500s caused by API process being down (Operational)
`/api/auth/login` and `/api/auth/register` returned 500 through the Vite proxy because the Express process had stopped listening on 4000; Vite reports proxy connection failures as 500. The React DevTools message is informational, not an error.
**Resolution:** restarting the API restored 200/201; edge cases verified (401, 409, 422). Keep the API process supervised (e.g. `npm run dev` in a dedicated terminal / service) during demos.

---

## 6. Observations

- **OBS-01 (test maintenance):** `smoke-test.js:91` expects exactly 8 students; the seed creates 9 (including one dropped student). Change to `>= 8` or derive from seed.
- **OBS-02 (UX):** "Track Complaint" renders the same list as "My Complaints"; there is no lookup by reference ID (`CitizenConnectModule.tsx:247`). Consider an ID search box.
- **OBS-03 (fixed this run):** Surveys previously had a non-functional "Start Survey" button with no survey data visible. Replaced with inline questions, answer progress, validation and persisted submissions (`CitizenConnectModule.tsx`, survey catalog + `SURVEY_STORAGE_KEY`).
- **OBS-04 (environment):** In the hidden automation tab, Chrome throttles the passive effect that restores the session, so the app can appear stuck on "Loading your IHURIRO workspace…". Direct fetch from the page succeeds in ~17 ms; this does not reproduce in a visible browser.

---

## 7. Recommendation

1. Fix **DEF-02** before any production/demo exposure (data-integrity and authorization risk).
2. Fix **DEF-01** (small change, user-visible dead control).
3. Update the smoke assertion (OBS-01) so CI stays trustworthy.
4. Run the API under a supervisor during demos to avoid DEF-03-style 500s.
5. Consider reference-ID lookup for complaint tracking (OBS-02).

With DEF-01 and DEF-02 fixed, the build meets acceptance for the tested scope.
