# UNERA — Project Context

> **Document purpose:** Persistent project context for AI coding agents (including Antigravity), developers, and collaborators. Read this file before planning or modifying the codebase.
>
> **Baseline:** Product requirements from PRD 1.3. This file summarizes stable project context; detailed, testable system requirements are in `SRS_1.0.md`.

- **Project:** UNERA
- **Document version:** 1.0
- **Requirements baseline:** PRD 1.3
- **Product type:** Full-stack web application
- **Primary audience:** Vietnamese university students
- **System roles:** `STUDENT`, `ADMIN`
- **Business language:** Vietnamese; user-facing content may support Vietnamese and English where specified (for example, CV templates).

---

## 1. Product Overview

UNERA helps university students explore education and career directions, discover opportunities, create and follow a personal development roadmap, track deadlines and applications, prepare their profiles, and access curated development resources.

The platform addresses fragmented opportunity information, unclear development paths during university, missed application deadlines, and scattered management of CVs, certificates, achievements, and applications.

### Product objectives

1. Help students identify one or more suitable education/career directions.
2. Provide a structured personal roadmap organized by academic year, semester, milestone, and task.
3. Centralize opportunities such as scholarships, study-abroad programs, internships, competitions, research programs, management trainee programs, and ambassador programs.
4. Let students explicitly select the opportunities whose deadlines they want to track.
5. Help students manage applications, CVs, certificates, activities, and development progress.
6. Provide curated mentor information and an Admin-mediated booking-request workflow.
7. Keep platform content curated and managed by Admin accounts.

## 2. Confirmed Roles and Administration Model

### Student

A Student is the primary platform user. A Student can manage their own profile, take or skip the onboarding quiz, manage one active roadmap, discover and save opportunities, add opportunities to their calendar, track applications, receive notifications, request mentor sessions, use supported tools, manage certificates and activities, and view Admin-published content.

A Student:
- can only access and modify their own private data;
- cannot create or edit opportunities, news, Community content, mentor profiles, or shared catalogs;
- cannot publish Community posts or comments;
- cannot create an Admin or Mentor account;
- cannot delete their own account through the application.

### Admin

Admin users manage and curate the platform. **Multiple Admin accounts are supported and all Admins are at the same permission level** in the current requirements baseline. There is no super-admin hierarchy or differentiated Admin role in scope.

Admins manage Student accounts, opportunities, news, mentor profiles and booking requests, certificates, activities, Community content, quiz questions, roadmap templates, sponsored content, and other shared platform content.

Admin responsibilities include collecting, checking, editing, and publishing external opportunity information. Companies and organizations do not have accounts and cannot directly publish content.

### Mentor

A Mentor is a profile managed by Admin, not a system account. A Mentor does not log in, manage availability, or operate a dashboard in the current scope. Students submit booking requests; Admin processes those requests and communicates the outcome through the system.

## 3. Confirmed Business Decisions

These are confirmed requirements and must not be changed by an implementation agent without explicit approval.

| Topic | Confirmed decision |
|---|---|
| Onboarding quiz | Optional. A Student may skip it and complete it later. Skipping must not block normal platform access. |
| Initial recommendation | Rule-based scoring first. AI-based recommendations are a future extension, not an MVP dependency. |
| Active roadmap | Each Student has exactly one active/primary roadmap at a time. |
| Roadmap editing | Students may edit their roadmap within the structure and constraints of the applicable template. |
| Changed goals | When a Student changes and saves their development goals, the system automatically generates a new roadmap immediately. The previous roadmap is archived as history and the new roadmap becomes active. |
| Roadmap generation failure | If the new roadmap cannot be generated, preserve the current roadmap; do not partially replace or lose it. |
| Roadmap history | Previous roadmaps are retained so the Student can review them. Editing historical roadmaps is not yet confirmed; treat as read-only only if this is later approved. |
| Opportunity administration | Only Admins create, edit, verify, publish, close, and archive opportunities. |
| Opportunity provenance | Opportunity records retain source name/URL and verification information where available. |
| Calendar enrollment | Merely viewing an opportunity does not add it to the calendar. The Student must click **“Thêm vào lịch”** (Add to Calendar) on the opportunity detail page. |
| Calendar reminders | Only opportunities explicitly added to the Student's calendar are eligible for deadline reminders. |
| Calendar removal | Student can remove/unfollow an opportunity from the calendar. Future reminders for that calendar entry must stop. Already-sent notifications remain in history. |
| Reminder schedule | Deadline reminders are supported at 7, 3, and 1 day before the deadline. |
| Notification channels | In-app notifications and email notifications are both supported. |
| Mentor workflow | Student sends a booking request; Admin processes it. Mentor has no account. |
| Community | Admin publishes Community content; Students have read-only access. No Student-created posts, comments, groups, or chat. |
| Account deletion | Student cannot delete their own account through the system. Admin can manage account status. Detailed account/data-retention policy remains to be specified. |
| Admin roles | Multiple Admins may exist. All Admins have equal privileges in the current scope. |
| File size | Maximum file size is 10 MB per file. |
| Allowed upload formats | PDF, DOC, DOCX, JPG, JPEG, PNG. |
| Concurrent opportunity editing | The system warns an Admin if an opportunity has been updated by another Admin since the current Admin loaded it. The system should prevent stale data from silently overwriting a newer version. Optimistic version checking is the recommended implementation. |

## 4. Product Modules

1. **Authentication & Account Management** — email/password, Google OAuth, logout, verification/recovery, roles, account status, session handling.
2. **Student Profile** — university, major, academic year, goals, skills, achievements, personal details.
3. **Onboarding & Career Orientation** — optional quiz, questions, rule-based evaluation, one or two suggested directions, results and retake.
4. **Personal Roadmap** — templates, one active roadmap, years/semesters/milestones/tasks, progress, constrained editing, automatic regeneration and history.
5. **Explore & Opportunity Management** — curated opportunities in seven categories, details, source, deadline, eligibility, status, sponsorship labels.
6. **Search & Filtering** — keyword, category, major, academic year, deadline, type, domestic/international, sorting and pagination.
7. **Saved Opportunities & Application Tracking** — save/unsave opportunities, personal application statuses, notes and history.
8. **Calendar & Notifications** — explicit Add to Calendar action, personal calendar, 7/3/1 day reminders, in-app and email delivery, read status and delivery history.
9. **Mentor Connection** — Admin-managed mentor directory and Student booking requests processed by Admin.
10. **Student Tools** — CV builder/export, letter templates, application Kanban, GPA calculator, IELTS/TOEIC conversion, study-abroad cost estimator, mock interview question bank.
11. **Certificates & Activities** — certificate catalog, personal certificate wallet, resources, activity catalog, saved activities and participation history.
12. **Community Content** — Admin-authored content, Student read-only.
13. **News & Information** — curated news and announcements, categories, featured and sponsored content.
14. **Admin Dashboard & CMS** — shared content and user management, booking processing, quiz/roadmap configuration, audit trail and operational overview.

## 5. Opportunity Tracking: Important Domain Distinction

Do not treat **Saved Opportunities** and **Calendar Entries** as the same concept.

- **Saved Opportunity:** Student bookmarks an opportunity to revisit it. Saving alone does not put it on the calendar and does not activate deadline reminders.
- **Calendar Entry:** Student explicitly clicks **“Thêm vào lịch”** on the opportunity detail page. This records the Student's intent to track the deadline, makes the opportunity visible in the personal calendar, and makes it eligible for 7/3/1-day reminders if a valid deadline exists.
- A Student may save an opportunity without adding it to the calendar.
- A Student may add an opportunity to the calendar without the system inferring that they have applied to it.
- Removing a calendar entry stops future reminders; it must not erase already-sent notification history.
- Repeated Add to Calendar actions must not create duplicate active entries.

## 6. Roadmap Lifecycle

When the Student changes and saves development goals:

1. Validate and persist the new goal values as part of a consistent operation.
2. Select an applicable roadmap template and generate a new roadmap from the latest goals and available profile/quiz information.
3. If generation succeeds, archive the previous active roadmap and activate the newly generated roadmap.
4. Preserve the previous roadmap's content and progress as history.
5. Ensure that no more than one roadmap is active for the Student.
6. If generation fails, preserve the previous active roadmap and report the failure. Do not leave the Student without an active roadmap.

The exact rules for mapping goals to templates and the contents of templates must be defined in the roadmap design/configuration. Do not invent scoring or template-matching rules.

## 7. File Upload Rules

Allowed extensions/formats:

- Documents: `.pdf`, `.doc`, `.docx`
- Images: `.jpg`, `.jpeg`, `.png`

Maximum size: **10 MB per file**.

Implementation must validate on the server, not only in the browser. Validate the actual content/MIME type as well as the extension where feasible. Store file bytes in an appropriate object/file storage provider; store file metadata and storage references in MongoDB. Do not put file binaries directly into ordinary MongoDB documents unless a separately approved technical decision requires it.

The precise upload locations, per-request file count, retention period, and provider are not yet fixed.

## 8. Concurrent Admin Editing

For shared content such as Opportunity, use version-aware updates (recommended: optimistic locking):

1. API returns the current version with the Opportunity.
2. The Admin editing form retains the version it loaded.
3. On save, the client sends the expected version.
4. Backend updates only if the stored version still matches the expected version.
5. If the versions differ, reject the stale update and return a conflict response.
6. UI shows a warning identifying the latest updater/time where permitted and offers a reload action.
7. Do not silently overwrite newer data with stale form values.

A version field can be an integer incremented on every successful update. Apply the same pattern to other shared content if needed, but the confirmed requirement specifically calls out Opportunity editing.

## 9. Technical Direction

The current technical direction is:

- **Framework:** Next.js with App Router.
- **Language:** TypeScript.
- **UI:** React, Tailwind CSS, shadcn/ui, Lucide React.
- **Database:** MongoDB (Atlas for hosted environments), with Mongoose as the proposed ODM.
- **Authentication:** Email/password and Google OAuth. Auth.js is a candidate implementation; verify compatibility and select the exact configuration during technical design.
- **Validation:** Zod is a proposed validation library.
- **Hosting:** Vercel.
- **Source control:** GitHub.
- **File storage:** A dedicated object/file storage provider; provider selection is pending.
- **Email:** An email delivery provider; provider selection is pending.

This is a full-stack Next.js application in the current direction. Do not introduce a separate Express or Spring Boot backend unless the project owner explicitly changes the architecture.

### Environment separation

Keep development, preview/staging, and production data isolated. Do not use production credentials or production user data in local development. Keep secrets in environment variables and never expose server secrets through `NEXT_PUBLIC_` variables.

## 10. Architecture and Coding Guardrails for AI Agents

Before changing code:

1. Read this file, `SRS_1.0.md`, `README.md`, `AGENTS.md` (if present), and relevant module documentation.
2. Inspect the existing project structure and conventions. Do not assume the repository is empty or replace working architecture without reason.
3. Identify impacted modules, data models, authorization checks, API/server actions, UI, tests, and docs.
4. Present an implementation plan for approval when the task is broad or changes business rules/data structures.

While implementing:

- Implement only the requested and approved scope.
- Do not invent business rules for pending questions.
- Enforce authorization on the server; hiding UI controls is not authorization.
- Never trust Student-supplied `studentId` to decide data ownership; derive the current identity from the authenticated session.
- Validate inputs on the server and use consistent error handling.
- Keep database access out of Client Components.
- Avoid duplicating domain logic across pages and components.
- Preserve existing public APIs and data unless a migration/change is planned.
- Use version checks for concurrent Opportunity editing.
- Preserve the old active roadmap if generating the replacement fails.
- Avoid duplicate active calendar entries and duplicate scheduled notifications.
- Keep secrets out of source control and logs.
- Test unauthorized access, cross-user access, invalid inputs, race conditions, and failure paths—not only the happy path.

After implementing a feature:

1. Run applicable lint, type-check, unit/integration tests, and production build.
2. Fix regressions caused by the change.
3. Update relevant docs and `IMPLEMENTATION_STATUS.md` if the repository uses it.
4. Report files changed, behaviors implemented, tests executed, and known limitations.
5. Keep commits focused on one coherent feature or fix.

## 11. Explicitly Out of Scope / Future Extensions

Unless separately approved, do not implement as current MVP requirements:

- Company or organization accounts and self-service publishing.
- Mentor accounts, mentor dashboard, or direct mentor scheduling.
- Student-created Community posts, comments, groups, or real-time chat.
- AI-powered recommendations, AI roadmap generation, AI CV review, or AI career chatbot.
- Native Android/iOS applications.
- Integrated payment processing.

## 12. Pending Decisions — Do Not Guess

The following items were proposed but not confirmed in the PRD discussion:

- Whether Student may save multiple CV versions.
- Whether Admin should permanently delete or only archive published opportunities.
- Whether activity registration happens inside UNERA or via external links (the current proposed behavior is external instructions/links only).
- Whether Students can independently enable/disable each notification channel.
- Whether a Student may cancel a mentor booking request and under what conditions.
- Exact sponsored-content scheduling rules.
- Exact GPA scales and conversion rules.
- Whether Student-entered certificates require verification.
- Whether historical roadmaps are editable or strictly read-only.
- File upload per-request count, exact provider, retention rules, and detailed access-link expiry.
- Account deactivation/deletion/data-retention policy when an Admin disables an account.
- Exact performance, availability, concurrency, and backup targets.

When a feature depends on one of these items, isolate the behavior behind a clear configuration or report the unresolved decision rather than silently choosing a business rule.

## 13. Documentation Baseline

- `PROJECT_CONTEXT.md`: project-wide context and implementation guardrails.
- `SRS_1.0.md`: system requirements specification derived from PRD 1.3.
- `PRD.md`: product objectives, scope, and business requirements (maintain separately if available).
- Future documents: `DATABASE_DESIGN.md`, `ARCHITECTURE.md`, `API_SPECIFICATION.md`, `UI_UX_GUIDELINES.md`, `TESTING_STRATEGY.md`.

If this context conflicts with a newer, explicitly approved requirement, use the newer approved requirement and update the documentation. Do not let implementation code silently redefine the business baseline.
