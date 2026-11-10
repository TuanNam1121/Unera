# UNERA — Software Requirements Specification (SRS)

> **Document purpose:** Specify the functional and non-functional requirements of the UNERA web application. This document is derived from the approved PRD 1.3 business baseline.
>
> **Version:** 1.0  
> **Status:** Initial SRS baseline  
> **Source baseline:** UNERA PRD 1.3 and confirmed business decisions recorded in the project discussion  
> **Audience:** Product owner, developers, testers, UI/UX designers, and AI coding agents

---

## Document Control

| Item | Value |
|---|---|
| Product name | UNERA |
| Document | Software Requirements Specification |
| Version | 1.0 |
| Requirements source | PRD 1.3 |
| Application type | Full-stack web application |
| Target users | Vietnamese university students and platform administrators |
| Primary roles | Student, Admin |
| Mentor account | Not supported; Mentor is an Admin-managed profile |

### Requirement language

- **SHALL** means the system is required to provide the stated behavior.
- **SHOULD** means the behavior is recommended but may be deferred with product-owner approval.
- **MAY** means optional behavior.
- **Confirmed** identifies a behavior explicitly decided in the product requirements discussion.
- **TBD** identifies a rule or value that is not yet decided. An implementation must not invent a permanent business rule for a TBD item.
- **Future** identifies an extension outside the current initial implementation scope.

Requirements are assigned stable IDs. Keep IDs unchanged when refining their wording; add new IDs for genuinely new requirements.

---

# 1. Introduction

## 1.1 Purpose

This SRS defines what UNERA shall do, the constraints under which it shall operate, the principal user interactions, the data it shall manage, and the quality attributes it shall target. It is intended to provide a testable basis for implementation, review, and acceptance testing.

This document focuses on externally observable system behavior and business rules. Framework-specific code structure, exact database implementation, API paths, UI pixel specifications, and detailed algorithms belong in the architecture, database, API, and UI/UX design documents.

## 1.2 Scope

UNERA is a web platform that helps university students:

- explore education and career directions;
- complete an optional onboarding quiz and receive rule-based direction recommendations;
- create and maintain a personal roadmap;
- discover curated opportunities and track selected deadlines;
- manage saved opportunities and application progress;
- receive in-app and email notifications;
- discover mentor profiles and submit booking requests;
- create CVs and use selected education/career tools;
- manage certificates, achievements, and activities;
- read curated Community and news content.

Admins operate the platform, curate and publish content, manage Student accounts, maintain quiz and roadmap templates, and process mentor booking requests.

## 1.3 Product Goals

| ID | Goal |
|---|---|
| GOAL-01 | Help Students identify suitable education and career development directions. |
| GOAL-02 | Provide a structured roadmap organized by academic year, semester, milestone, and task. |
| GOAL-03 | Centralize information about scholarships, study abroad, careers, internships, research, competitions, and student programs. |
| GOAL-04 | Let Students explicitly track deadlines they care about and receive reminders. |
| GOAL-05 | Help Students manage applications, CVs, certificates, achievements, and activities. |
| GOAL-06 | Provide curated information and a managed mentor-request workflow. |

## 1.4 Intended Readers

- Product owner and project team.
- Frontend and full-stack developers.
- Database and architecture designers.
- QA engineers and acceptance testers.
- AI coding agents contributing to the UNERA repository.

## 1.5 Definitions and Acronyms

| Term | Definition |
|---|---|
| Student | Primary user of UNERA; owns personal profile, roadmap, saved items, calendar entries, and application tracking records. |
| Admin | Authenticated administrator who manages platform content and operational records. All Admins have equal privileges in the current scope. |
| Mentor | A person represented by a profile managed by Admin. A Mentor does not have a UNERA login account in the current scope. |
| Opportunity | An externally sourced opportunity such as a scholarship, internship, competition, research program, or student program. |
| Saved Opportunity | An Opportunity bookmarked by a Student for later reference. Saving does not itself activate calendar reminders. |
| Calendar Entry | A Student-initiated tracking record created by clicking “Thêm vào lịch” on an Opportunity detail page. |
| Roadmap | A Student's development plan composed of milestones and tasks, based on an Admin-managed template and the Student's goals/profile information. |
| Active Roadmap | The one current roadmap for a Student. |
| Archived Roadmap | A previous roadmap retained as history after replacement. |
| Onboarding Quiz | Optional questionnaire used to gather Student interests, strengths, current major, year, and goals. |
| Sponsored Content | Content promoted through a sponsorship arrangement and visibly labelled as sponsored. |
| Optimistic Locking | A concurrency-control approach that checks whether a record version has changed since it was loaded for editing. |
| In-app Notification | A notification stored and displayed inside UNERA. |
| Email Notification | A notification delivered to the Student's registered email address. |

## 1.6 References and Source Documents

1. UNERA Product Requirements Document (PRD), version 1.3.
2. UNERA Project Context document, version 1.0.
3. Future design documents: Architecture, Database Design, API Specification, UI/UX Guidelines, and Testing Strategy.

No external product behavior is assumed unless explicitly included in this SRS.

---

# 2. Overall Description

## 2.1 Product Perspective

UNERA is planned as a full-stack web application using Next.js. The current technical direction is TypeScript, MongoDB, and Vercel hosting. Authentication, file storage, and email delivery require integration with appropriate providers; exact provider configuration is a technical-design decision.

The application contains:

- a public-facing content discovery experience;
- authenticated Student functionality;
- authenticated Admin functionality;
- server-side business logic and authorization;
- persistent database storage;
- external identity, file-storage, and email services where configured.

A separate Express or Spring Boot backend is not part of the current technical direction unless the product owner approves an architecture change.

## 2.2 User Classes and Characteristics

### 2.2.1 Visitor

A Visitor is an unauthenticated person browsing public pages. Public access may include the Home page and published content. Actions involving personal data, saved items, calendar entries, booking requests, or Admin functions require authentication.

The exact public/private visibility of each page shall be specified in UI/API design; private Student and Admin data must never be exposed to Visitors.

### 2.2.2 Student

A Student is expected to have basic web and email literacy. Student functionality is designed for desktop, tablet, and mobile browser use. A Student may skip the onboarding quiz and later return to it.

### 2.2.3 Admin

An Admin curates platform information and manages shared platform records. Multiple Admin accounts are supported. All Admin accounts have the same permissions in the current scope; no super-admin or department-level Admin role is defined.

### 2.2.4 Mentor

A Mentor is not a system actor who logs in. Mentor information is maintained by Admin. Mentor availability and direct calendar integration are outside the current scope.

## 2.3 Operating Environment

- Modern desktop and mobile web browsers.
- Current supported versions of Chrome, Edge, and Firefox.
- Next.js-based full-stack web application.
- MongoDB database service.
- Vercel hosting for deployed application environments, subject to final deployment configuration.
- External email delivery and file storage services selected during technical design.

## 2.4 Design and Implementation Constraints

1. The proposed application framework is Next.js with App Router and TypeScript.
2. MongoDB is the selected database direction.
3. The system has exactly two authenticated roles in the current scope: Student and Admin.
4. Mentor is a managed profile, not an authenticated role.
5. Company and organization accounts are not supported.
6. Opportunity and other shared editorial content is managed by Admin.
7. Student cannot self-delete their account.
8. Each Student has no more than one active roadmap.
9. Uploads are restricted to PDF, DOC, DOCX, JPG, JPEG, and PNG, maximum 10 MB per file.
10. Server-side authorization and validation are mandatory; client-side controls alone are insufficient.
11. Secrets and service credentials must remain server-side.

## 2.5 Assumptions and Dependencies

- Students have access to a supported browser and a valid email address.
- Admins are responsible for verifying opportunity information before publication.
- External opportunities may change outside UNERA; Admins must update or close records when information changes.
- Google OAuth depends on valid provider configuration.
- Email notifications depend on a configured email delivery service and valid recipient addresses.
- File uploads depend on a configured file/object storage provider.
- Rule-based quiz recommendations depend on Admin-maintained questions, answer choices, and scoring/configuration rules.
- Roadmap generation depends on suitable Admin-managed roadmap templates and defined goal-to-template mapping rules.

## 2.6 Scope Exclusions

The following are excluded from the current scope unless later approved:

- Company/organization accounts and self-service opportunity publishing.
- Mentor login accounts, Mentor dashboards, direct Mentor availability management, and automatic calendar booking with Mentors.
- Student-created Community posts, comments, groups, or real-time chat.
- AI-based career recommendation, AI-generated roadmap, AI CV review, and AI career chatbot.
- Native Android/iOS applications.
- Integrated payment processing.
- Automatic verification of external application outcomes.

---

# 3. External Interface Requirements

## 3.1 User Interface Requirements

### UI-01 – Responsive Layout

The system shall provide responsive layouts for desktop, tablet, and mobile browser viewports.

### UI-02 – Role-aware Navigation

The interface shall present navigation and available actions appropriate to the authenticated role. Hiding a control shall not replace server-side authorization.

### UI-03 – Form Feedback

Forms shall provide clear validation messages for missing, invalid, or out-of-range values.

### UI-04 – Operation Feedback

The interface shall communicate successful completion, failure, and relevant conflict states for user actions.

### UI-05 – Content Status

Admin interfaces shall make content publication status visible. Student-facing pages shall show only eligible published content, except where a requirement explicitly permits otherwise.

### UI-06 – Calendar Action

An Opportunity detail page shall provide a clearly labelled **“Thêm vào lịch”** action when the Opportunity can be added to the Student's calendar.

### UI-07 – File Upload Feedback

Upload controls shall display accepted formats and the 10 MB per-file size limit before or during upload.

### UI-08 – Concurrent Edit Warning

When the server detects that an Opportunity changed since the Admin loaded it, the interface shall display a warning and provide a way to reload the latest version.

## 3.2 Software Interfaces

### SI-01 – Database

The application shall persist business data in MongoDB. Database access shall be performed in trusted server-side code.

### SI-02 – Google OAuth

The application shall integrate with Google OAuth to authenticate users. OAuth secrets and callbacks shall be configured server-side.

### SI-03 – Email Delivery

The application shall integrate with an email delivery service to send account-related and notification emails as configured.

### SI-04 – File/Object Storage

The application shall store uploaded file content in a suitable file/object storage service and persist file metadata and storage references in MongoDB.

### SI-05 – Application Hosting

The application is intended to be deployed to Vercel. Environment-specific configuration shall separate development, preview/staging, and production.

## 3.3 Communication Interfaces

- Browser-to-application communication shall use HTTPS in deployed environments.
- External provider communication shall use the provider's supported secure protocol.
- Email delivery shall be handled through the configured provider; application code shall record delivery outcomes where supported.

---

# 4. Functional Requirements

## 4.1 Authentication and Account Management

### FR-AUTH-01 – Student Registration

The system shall allow a Visitor to register a Student account using an email address and password.

### FR-AUTH-02 – Google OAuth

The system shall allow a user to authenticate using Google OAuth.

### FR-AUTH-03 – Login

The system shall authenticate users before granting access to protected Student or Admin functionality.

### FR-AUTH-04 – Logout

The system shall allow an authenticated user to end their session.

### FR-AUTH-05 – Password Recovery

The system shall provide a password-recovery flow using the user's registered email address.

### FR-AUTH-06 – Email Verification

The system shall support email verification for email/password registration. Whether verification is mandatory before all access is granted is **TBD** and shall not be assumed.

### FR-AUTH-07 – Role-based Authorization

The system shall distinguish Student and Admin permissions and enforce authorization on the server for every protected operation.

### FR-AUTH-08 – Account Status

The system shall maintain an account status sufficient to distinguish active and disabled accounts. Disabled accounts shall not be able to use protected functionality.

### FR-AUTH-09 – Student Profile Access

An authenticated Student shall be able to view and update permitted fields of their own profile.

### FR-AUTH-10 – Session Management

The system shall maintain authenticated sessions and reject requests with missing, invalid, or expired authentication credentials.

### FR-AUTH-11 – Student Self-deletion Restriction

The system shall not provide a Student-facing account deletion function. Student requests to delete their own account through Student interfaces or APIs shall be rejected. Admin account-status management remains available.

### FR-AUTH-12 – Multiple Admin Accounts

The system shall support multiple Admin accounts.

### FR-AUTH-13 – Equal Admin Permissions

All Admin accounts shall have the same permissions within the current scope. The system shall not require a hierarchy among Admin accounts.

## 4.2 Student Profile Management

### FR-PRO-01 – Personal Information

The system shall allow a Student to maintain permitted personal information, including full name, avatar, university, major, academic year, and short introduction.

### FR-PRO-02 – Development Goals

The system shall allow a Student to maintain development goals, including study abroad, employment, scientific research, startup, and personal development goals.

### FR-PRO-03 – Skills

The system shall allow a Student to add, update, and remove their own skills.

### FR-PRO-04 – Achievements

The system shall allow a Student to maintain their own achievements, awards, and relevant activities.

### FR-PRO-05 – Profile Overview

The system shall provide a Student profile view that presents personal information and relevant skills, achievements, certificates, activities, saved opportunities, and application information.

### FR-PRO-06 – Profile Ownership

The system shall prevent a Student from modifying another Student's private profile data by manipulating client-supplied identifiers or request parameters.

## 4.3 Onboarding Quiz and Career Orientation

### FR-ONB-01 – Quiz Availability

The system shall provide an onboarding quiz to Students after registration or through a later entry point.

### FR-ONB-02 – Optional Quiz

The Student shall be able to skip the onboarding quiz and continue using other available system features. Skipping shall not be treated as an error or block normal platform access.

### FR-ONB-03 – Quiz Content

The quiz shall be capable of collecting information about interests, strengths, current major, academic year, career goals, and preferred development areas.

### FR-ONB-04 – Quiz Submission

The system shall validate and save a Student's submitted quiz answers.

### FR-ONB-05 – Rule-based Evaluation

The system shall evaluate submitted answers using configurable rule-based scoring or mapping rules.

### FR-ONB-06 – Direction Recommendations

The system shall recommend one or two development directions based on the configured evaluation rules.

### FR-ONB-07 – Result Explanation

The system shall display the recommended direction or directions together with an explanation and relevant suggested development areas or next steps.

### FR-ONB-08 – Quiz Result History

The system shall retain completed quiz results so that the Student can review prior results.

### FR-ONB-09 – Retake Quiz

The system shall allow a Student to retake the quiz. A new result shall not silently erase the historical result.

### FR-ONB-10 – Admin Quiz Management

The system shall allow Admins to create, update, activate, deactivate, and manage quiz questions and answer choices.

### FR-ONB-11 – Scoring Configuration

The system shall allow authorized Admins to maintain the rule configuration used to evaluate answers, subject to the supported configuration model.

### FR-ONB-12 – AI Extension Exclusion

AI-based recommendation is not required for SRS 1.0. The initial recommendation capability shall be rule-based.

## 4.4 Personal Roadmap

### FR-RM-01 – Roadmap Creation

The system shall create a Student roadmap based on an applicable Admin-managed template and available Student goals, profile information, and quiz results where available.

### FR-RM-02 – Single Active Roadmap

The system shall enforce that each Student has no more than one roadmap in the Active state at any time.

### FR-RM-03 – Roadmap Structure

A roadmap shall support organization by academic year, semester, milestone, and task.

### FR-RM-04 – Roadmap Templates

The system shall provide Admin-managed roadmap templates for supported development directions.

### FR-RM-05 – Constrained Roadmap Editing

A Student shall be able to edit permitted roadmap content while the roadmap continues to comply with the applicable template constraints. The exact set of editable fields shall be defined in the detailed design and shall not permit arbitrary changes that violate required structure.

### FR-RM-06 – Task Status

A Student shall be able to update the completion status of tasks in their active roadmap.

### FR-RM-07 – Progress Calculation

The system shall calculate and display roadmap progress based on the completion state of its tasks. The exact progress formula shall be defined consistently in design and testing.

### FR-RM-08 – Automatic Regeneration on Goal Change

When a Student changes and saves their development goals, the system shall automatically generate a new roadmap without requiring a separate manual “generate roadmap” action.

### FR-RM-09 – Roadmap Replacement

If new-roadmap generation succeeds, the system shall archive the previous active roadmap and make the newly generated roadmap the Student's active roadmap.

### FR-RM-10 – Roadmap History

The system shall retain previous roadmaps so the Student can review their development history.

### FR-RM-11 – Goal Snapshot

The system shall retain the goal information used to generate each roadmap so that the historical roadmap can be understood in the context of the goals at generation time.

### FR-RM-12 – Roadmap Template Compliance

A newly generated roadmap shall follow the structure and rules of the selected template.

### FR-RM-13 – Generation Failure Preservation

If new-roadmap generation fails, the system shall preserve the currently active roadmap and its progress. The system shall report the failure and shall not leave the Student without an active roadmap as a result of the failed replacement.

### FR-RM-14 – Atomic Replacement Consistency

The system shall perform the activation/archive transition consistently so that the Student does not end up with two active roadmaps or with neither roadmap active after a failed replacement.

### FR-RM-15 – Admin Template Management

The system shall allow Admins to create, update, activate, deactivate, and maintain roadmap templates.

### FR-RM-16 – Historical Roadmap Modification

Whether a Student can edit an archived roadmap is **TBD**. Until the decision is made, implementation shall not expose an edit action for archived roadmaps without product-owner approval.

## 4.5 Explore and Opportunity Management

### FR-EXP-01 – Opportunity Categories

The system shall support at least the following opportunity categories:

1. Study Abroad.
2. Careers by Discipline.
3. Multinational Companies.
4. Scientific Research.
5. Management Trainee.
6. Competitions.
7. Ambassador Programs.

### FR-EXP-02 – Opportunity Listing

The system shall display a list of eligible published opportunities to Students and Visitors where public visibility is enabled.

### FR-EXP-03 – Opportunity Details

The system shall display available opportunity details, including title, description, category, eligibility, requirements, benefits, application instructions, opening date, deadline, location, domestic/international classification, source name, source URL, and verification information.

### FR-EXP-04 – Opportunity Status

The system shall support at least Draft, Published, Closed, and Archived opportunity states.

### FR-EXP-05 – Admin Opportunity Creation

An Admin shall be able to create an Opportunity record.

### FR-EXP-06 – Admin Opportunity Update

An Admin shall be able to update an Opportunity record.

### FR-EXP-07 – Admin Opportunity Publication

An Admin shall be able to publish or unpublish an Opportunity according to its supported status transitions.

### FR-EXP-08 – Opportunity Verification

The Admin workflow shall support checking opportunity information before publication.

### FR-EXP-09 – Opportunity Source Information

The system shall store source name and source URL, and shall support storing a verification date or timestamp where available.

### FR-EXP-10 – Sponsored Opportunity Label

The system shall visibly identify sponsored opportunities as sponsored content.

### FR-EXP-11 – Optional Deadline

The system shall allow an Opportunity to have no deadline when the source opportunity does not specify one. An Opportunity without a valid deadline shall not generate deadline reminders.

### FR-EXP-12 – Expired Opportunity Handling

The system shall support closing or archiving expired opportunities so that they are not misleadingly presented as currently open.

### FR-EXP-13 – Admin-only Opportunity Publishing

Only authenticated Admins shall be able to create, edit, publish, close, or archive Opportunity records. Student and Visitor requests to perform these operations shall be rejected.

### FR-EXP-14 – Opportunity Version

The system shall maintain a version identifier or equivalent concurrency token for each Opportunity so concurrent edits can be detected.

### FR-EXP-15 – Last Updated Metadata

The system shall maintain the last update timestamp and the Admin identity responsible for the latest successful update.

## 4.6 Search and Filtering

### FR-SRCH-01 – Keyword Search

The system shall allow users to search eligible opportunities by keyword.

### FR-SRCH-02 – Category Filter

The system shall allow filtering opportunities by category.

### FR-SRCH-03 – Major/Discipline Filter

The system shall allow filtering by relevant major or discipline when such metadata is available.

### FR-SRCH-04 – Academic Year Filter

The system shall allow filtering by academic year or eligibility year when the information is available.

### FR-SRCH-05 – Deadline Filter

The system shall allow filtering by deadline or deadline range where a deadline exists.

### FR-SRCH-06 – Opportunity Type Filter

The system shall allow filtering by opportunity type.

### FR-SRCH-07 – Location Filter

The system shall allow filtering between domestic and international opportunities.

### FR-SRCH-08 – Sorting

The system shall support sorting search results by relevant attributes, including deadline and publication/update date where available.

### FR-SRCH-09 – Pagination

The system shall provide paginated search results.

### FR-SRCH-10 – Empty Results

The system shall display a clear empty state when no opportunities match the search or filters.

### FR-SRCH-11 – Combined Filters

The system shall allow supported filters to be combined in one search request.

## 4.7 Saved Opportunities and Application Tracking

### FR-APP-01 – Save Opportunity

An authenticated Student shall be able to save/bookmark an Opportunity.

### FR-APP-02 – Unsave Opportunity

A Student shall be able to remove an Opportunity from their saved list.

### FR-APP-03 – Saved List

A Student shall be able to view their own saved opportunities.

### FR-APP-04 – Application Record

A Student shall be able to create and maintain a personal application-tracking record associated with an Opportunity.

### FR-APP-05 – Application Status

The system shall support the following proposed application statuses unless refined in product design: Interested, Preparing, Applied, Interviewing, Accepted, Rejected, and Withdrawn.

### FR-APP-06 – Application Notes

A Student shall be able to maintain personal notes associated with their application record.

### FR-APP-07 – Application History

The system shall retain status-change history sufficient for the Student to review the progress of their own application record.

### FR-APP-08 – Personal Record Ownership

A Student shall only be able to access and modify their own saved-opportunity and application-tracking records.

### FR-APP-09 – External Application Limitation

Application status is a personal tracking value. The system shall not represent a status as externally verified by the Opportunity provider unless an approved integration supplies that information.

### FR-APP-10 – Saved List and Calendar Separation

Saving an Opportunity shall not automatically create a Calendar Entry or activate deadline notifications. Calendar enrollment requires the explicit action specified in Section 4.8.

## 4.8 Calendar and Opportunity Tracking

### FR-CAL-01 – Add to Calendar Action

The Opportunity detail page shall provide a **“Thêm vào lịch”** action to an authenticated Student when the Opportunity is eligible to be tracked.

### FR-CAL-02 – Explicit Calendar Enrollment

When a Student selects “Thêm vào lịch”, the system shall create or activate a Calendar Entry linking that Student to the Opportunity.

### FR-CAL-03 – No Automatic Enrollment on View

Viewing an Opportunity list item or detail page shall not, by itself, create a Calendar Entry.

### FR-CAL-04 – Calendar Listing

The Student's personal calendar shall display Opportunities that the Student has explicitly added and that remain actively tracked.

### FR-CAL-05 – Deadline Display

For a tracked Opportunity with a valid deadline, the personal calendar shall display the deadline.

### FR-CAL-06 – Calendar Views

The system shall provide at least a monthly calendar view and a list view of tracked deadlines.

### FR-CAL-07 – Upcoming Deadlines

The system shall provide a view of upcoming deadlines for actively tracked Opportunities.

### FR-CAL-08 – Remove from Calendar

A Student shall be able to remove/unfollow a tracked Opportunity from their calendar.

### FR-CAL-09 – Stop Future Reminders

After a Student removes an Opportunity from their calendar, the system shall stop scheduling or sending future deadline reminders for that Calendar Entry.

### FR-CAL-10 – Preserve Sent Notification History

Removing an Opportunity from the calendar shall not erase notifications already sent to the Student.

### FR-CAL-11 – Duplicate Calendar Entry Prevention

Repeated Add to Calendar actions shall not create multiple active Calendar Entries for the same Student and Opportunity.

### FR-CAL-12 – No Deadline Behavior

An Opportunity without a valid deadline may appear in the Student's tracked-opportunity list/calendar context, but it shall not receive 7/3/1-day deadline reminders.

### FR-CAL-13 – Calendar Ownership

A Student shall only be able to view, add, or remove their own Calendar Entries.

### FR-CAL-14 – Saved Opportunity Independence

Calendar enrollment and Saved Opportunity status shall be represented as distinct concepts. Removing one shall not implicitly remove the other unless a later approved business rule explicitly defines that behavior.

## 4.9 Notifications

### FR-NOTI-01 – In-app Notifications

The system shall create and display in-app notifications for supported events.

### FR-NOTI-02 – Email Notifications

The system shall support sending email notifications for supported events to the Student's registered email address.

### FR-NOTI-03 – Notification Center

The system shall provide a notification center where a Student can view their own notifications.

### FR-NOTI-04 – Read Status

The system shall allow a Student to mark a notification as read and shall retain its read state.

### FR-NOTI-05 – Notification Preferences

The system shall support a notification-preference capability. Whether Students may independently disable one channel while keeping the other is **TBD**; do not assume an opt-out policy without approval.

### FR-NOTI-06 – Duplicate Prevention

The system shall prevent duplicate notifications for the same Student, event, Opportunity, deadline, reminder offset, and delivery purpose.

### FR-NOTI-07 – Notification History

The system shall retain notification records so Students can review previously generated/sent notifications.

### FR-NOTI-08 – Email Delivery Status

The system shall record available email delivery outcomes, including success or failure, to support operational review.

### FR-NOTI-09 – Calendar Eligibility

Deadline reminders shall only be generated for Opportunities that the Student has actively added to their calendar.

### FR-NOTI-10 – Reminder Schedule

For eligible tracked Opportunities with a valid future deadline, the system shall support reminders at 7 days, 3 days, and 1 day before the deadline.

### FR-NOTI-11 – Dual Channel Support

The system shall support both an in-app notification and an email notification for eligible reminders.

### FR-NOTI-12 – Removed Entry Handling

When the related Calendar Entry becomes inactive, future reminder jobs for that entry shall be cancelled or ignored.

### FR-NOTI-13 – Late Enrollment

If a Student adds an Opportunity after one or more reminder offsets have already passed, the system shall not send those missed reminders retroactively. Remaining future reminder offsets may be scheduled. This is a technical interpretation to avoid sending stale reminders; confirm during acceptance if product behavior changes.

### FR-NOTI-14 – Notification Failure Isolation

Failure to deliver an email shall not delete the in-app notification record. The system shall preserve the in-app record and record the email delivery failure where supported.

## 4.10 Mentor Connection

### FR-MEN-01 – Mentor Directory

The system shall display Mentor profiles managed by Admin.

### FR-MEN-02 – Mentor Profile Details

A Mentor profile shall support information such as name, avatar, current position, organization, expertise, experience, introduction, and mentoring topics.

### FR-MEN-03 – Mentor Search

The system shall support finding Mentors by name, expertise, or related field where metadata is available.

### FR-MEN-04 – Booking Request Submission

An authenticated Student shall be able to submit a booking request for a Mentor.

### FR-MEN-05 – Booking Request Information

A booking request shall capture the selected Mentor, requested mentoring topic, preferred time information, and a message or context from the Student. Exact mandatory fields and scheduling format shall be specified in UI/API design.

### FR-MEN-06 – Admin Booking Management

An Admin shall be able to view and process booking requests.

### FR-MEN-07 – Booking Status

The system shall support Pending, Approved, Rejected, Cancelled, and Completed statuses unless the detailed workflow refines the lifecycle.

### FR-MEN-08 – Admin Booking Response

An Admin shall be able to update the booking status and provide a response or relevant information to the Student.

### FR-MEN-09 – Booking Notifications

The system shall notify the Student when an Admin updates the booking request.

### FR-MEN-10 – Mentor Profile Management

An Admin shall be able to create, update, publish/hide, and maintain Mentor profiles.

### FR-MEN-11 – No Mentor Account

The system shall not require Mentors to create or use UNERA accounts in the current scope.

### FR-MEN-12 – Admin-mediated Scheduling

A booking request shall be treated as a request for Admin handling, not as an automatically confirmed appointment with the Mentor.

### FR-MEN-13 – Student Booking Cancellation

Whether and under which conditions a Student can cancel a booking request is **TBD**. Do not implement cancellation rules beyond the status handling explicitly approved by the product owner.

## 4.11 Student Tools

### FR-TOOL-01 – CV Builder

The system shall provide a tool that allows a Student to create a CV using available templates.

### FR-TOOL-02 – Bilingual CV Templates

The system shall support Vietnamese and English CV templates.

### FR-TOOL-03 – CV PDF Export

The system shall allow a Student to export a created CV as a PDF file.

### FR-TOOL-04 – CV Management

The system shall allow a Student to manage their CV records and associated files. Whether multiple versions are supported is **TBD**; do not limit or promise a specific number until decided.

### FR-TOOL-05 – Letter Templates

The system shall provide Cover Letter and Motivation Letter templates or examples.

### FR-TOOL-06 – Application Kanban

The system shall provide a Kanban-style view for managing application progress, based on the Student's application-tracking data.

### FR-TOOL-07 – GPA Calculator

The system shall provide a GPA calculation tool. Supported grading scales and conversion rules require confirmation before implementation is finalized.

### FR-TOOL-08 – IELTS/TOEIC Converter

The system shall provide a reference conversion tool for IELTS and TOEIC scores. The conversion basis and disclaimer shall be defined before release.

### FR-TOOL-09 – Study-abroad Cost Estimator

The system shall provide an estimator for approximate study-abroad costs based on user-entered information and configured reference values. Exact countries, cost categories, and calculation rules require further specification.

### FR-TOOL-10 – Mock Interview Question Bank

The system shall provide a collection of mock interview questions for practice.

### FR-TOOL-11 – AI CV Review

AI CV review is a future extension and is not required in SRS 1.0.

### FR-TOOL-12 – AI Career Chatbot

An AI career chatbot is a future extension and is not required in SRS 1.0.

## 4.12 Certificates and Student Activities

### FR-CERT-01 – Certificate Catalog

The system shall provide a catalog of certificates grouped by relevant fields or disciplines.

### FR-CERT-02 – Certificate Details

The system shall display available certificate information such as name, provider, category, description, and relevant reference information.

### FR-CERT-03 – Certificate Resources

The system shall support links or resources related to certificate learning and preparation.

### FR-CERT-04 – Personal Certificate Wallet

A Student shall be able to add, update, view, and remove their own certificate records.

### FR-CERT-05 – Certificate Evidence

A Student certificate record may include certificate name, issuing organization, issue date, expiry date where applicable, and an evidence file or link.

### FR-CERT-06 – Admin Certificate Management

Admins shall be able to create, update, publish, and hide certificate catalog entries.

### FR-ACT-01 – Activity Catalog

The system shall provide an activity catalog that can include clubs, volunteering, events, workshops, and scientific activities.

### FR-ACT-02 – Activity Details

The system shall display the available details of an activity, including description, eligibility, timing, and registration information where provided.

### FR-ACT-03 – Activity Registration Information

The system shall display registration instructions or an external registration link where applicable. Direct in-platform registration is not confirmed for the current baseline.

### FR-ACT-04 – Save Activity

A Student shall be able to save an activity of interest.

### FR-ACT-05 – Personal Activity History

A Student shall be able to maintain a personal record of activities they have participated in.

### FR-ACT-06 – Admin Activity Management

Admins shall be able to create, update, publish, hide, and maintain activity records.

### FR-ACT-07 – Activity Profile Integration

The system shall make Student-maintained activity information available for presentation in the personal profile and CV-related workflows where applicable.

## 4.13 Community Content

### FR-COM-01 – Community Listing

The system shall display published Community content managed by Admin.

### FR-COM-02 – Community Details

A Student shall be able to view the details of a published Community item.

### FR-COM-03 – Community Categories

The system shall support categories or topics for organizing Community content.

### FR-COM-04 – Admin Community Management

Admins shall be able to create, update, publish, hide, and archive Community content as supported by the content lifecycle.

### FR-COM-05 – Student Read-only Access

Students shall have read-only access to Community content.

### FR-COM-06 – No Student Publishing

The system shall not provide Student functions or APIs for creating Community posts, comments, groups, or direct messages in the current scope.

## 4.14 News and Information

### FR-NEWS-01 – News Listing

The system shall display published news items.

### FR-NEWS-02 – News Categories

The system shall support news categories such as events, scholarship announcements, recruitment, competitions, education, and career development.

### FR-NEWS-03 – News Details

The system shall display the detail page for a published news item.

### FR-NEWS-04 – Admin News Management

Admins shall be able to create, update, publish, hide, and archive news items.

### FR-NEWS-05 – Featured Content

The system shall support marking eligible content as featured.

### FR-NEWS-06 – Sponsored Content Label

Sponsored content shall be clearly labelled as sponsored.

### FR-NEWS-07 – Admin Sponsored Content Management

Admins shall be able to manage sponsored-content records and their visibility. Exact schedule rules and billing/contract functions are outside the current requirements baseline.

## 4.15 Admin Dashboard and Content Management

### FR-ADM-01 – Admin Dashboard

The system shall provide an Admin dashboard with an overview of relevant platform data and operational activity.

### FR-ADM-02 – Student Management

Admins shall be able to list, search, view, and manage Student account status.

### FR-ADM-03 – Opportunity Management

Admins shall be able to create, view, update, publish, close, and archive Opportunities.

### FR-ADM-04 – News Management

Admins shall be able to manage news records.

### FR-ADM-05 – Mentor Management

Admins shall be able to manage Mentor profiles.

### FR-ADM-06 – Booking Management

Admins shall be able to view and process Mentor booking requests.

### FR-ADM-07 – Certificate Management

Admins shall be able to manage the shared certificate catalog.

### FR-ADM-08 – Activity Management

Admins shall be able to manage activity records.

### FR-ADM-09 – Community Management

Admins shall be able to manage Community content.

### FR-ADM-10 – Quiz Management

Admins shall be able to manage quiz content and supported scoring configuration.

### FR-ADM-11 – Roadmap Template Management

Admins shall be able to manage roadmap templates.

### FR-ADM-12 – Sponsored Content Management

Admins shall be able to manage sponsored content and its visible label.

### FR-ADM-13 – Content Status Management

The system shall support content status management, including Draft, Published, Closed, Hidden, or Archived states where appropriate to the content type.

### FR-ADM-14 – Admin Audit History

The system shall record important administrative actions with the Admin identity, action, target entity, and timestamp. Before/after values should be retained for sensitive or consequential updates where appropriate.

### FR-ADM-15 – Shared Admin Access

All Admins shall be able to access shared Admin management functions under the same permission model.

### FR-ADM-16 – Opportunity Concurrent Update Detection

The system shall detect when an Opportunity has been updated after the current Admin loaded the version being edited.

### FR-ADM-17 – Opportunity Concurrent Update Warning

When a stale update is detected, the system shall warn the Admin and provide information about the latest update, including updater identity and update time where available and permitted.

### FR-ADM-18 – Opportunity Version Conflict Protection

The system shall prevent a stale Opportunity update from silently overwriting a newer saved version. A stale update shall be rejected or otherwise resolved through an explicit refresh/reconciliation flow.

### FR-ADM-19 – Reload Latest Opportunity

After a conflict warning, the Admin shall be able to reload the latest saved Opportunity before continuing.

### FR-ADM-20 – Admin Audit Metadata

For important content updates, the system shall maintain the responsible Admin identity and update timestamp.

## 4.16 File Upload and File Access

### FR-FILE-01 – Upload Capability

The system shall allow Student file uploads for supported profile, CV, certificate, and evidence workflows.

### FR-FILE-02 – Maximum File Size

The system shall accept files no larger than 10 MB per file and reject files larger than 10 MB.

### FR-FILE-03 – Allowed File Formats

The system shall accept only the following file formats for the supported upload workflows:

- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- JPEG images (`.jpg`, `.jpeg`)
- PNG images (`.png`)

### FR-FILE-04 – File Extension and Content Validation

The system shall validate the file extension and the actual content/MIME type where feasible. A renamed file with a disallowed content type shall not be accepted merely because its filename has an allowed extension.

### FR-FILE-05 – File Size Validation

The system shall enforce the 10 MB per-file limit on the server. Client-side size checks may be used for user feedback but shall not be the only enforcement point.

### FR-FILE-06 – File Ownership

A Student shall only be able to view, download, replace, or delete their own private uploaded files, subject to the relevant feature's permissions.

### FR-FILE-07 – File Storage Separation

The system shall store file bytes in an appropriate file/object storage service and store file metadata and storage references in MongoDB. Storing file binaries directly in ordinary business documents is not the expected design.

### FR-FILE-08 – Upload Error Feedback

The system shall communicate upload failures caused by unsupported format, excessive size, permission denial, or storage failure.

### FR-FILE-09 – File Metadata

The system shall retain metadata sufficient to identify an uploaded file, including owner, original filename, size, detected content type, storage reference, and upload timestamp.

### FR-FILE-10 – Secure File Access

Private file access shall require appropriate authorization. Publicly guessable storage URLs shall not be used for private files unless access is protected by a suitable mechanism.

---

# 5. Business Rules

The following rules are mandatory unless explicitly marked TBD.

| ID | Rule |
|---|---|
| BR-01 | A registered email address shall be unique within the system. |
| BR-02 | An account shall have one system role in the current scope: Student or Admin. |
| BR-03 | A Student may access and modify only their own private data. |
| BR-04 | The onboarding quiz is optional and may be completed later. |
| BR-05 | Quiz evaluation in the initial implementation is rule-based. |
| BR-06 | The system may recommend one or two directions based on configured rules. |
| BR-07 | Each Student shall have no more than one active roadmap. |
| BR-08 | A saved and confirmed goal change triggers automatic roadmap generation. |
| BR-09 | A successfully generated roadmap replaces the previous active roadmap; the previous roadmap is archived. |
| BR-10 | If replacement generation fails, the previous active roadmap remains intact. |
| BR-11 | Students may edit their roadmap only within the applicable template constraints. |
| BR-12 | Only published content is shown in Student-facing content listings, except where public/private preview requirements state otherwise. |
| BR-13 | Only Admins may create or manage Opportunities. |
| BR-14 | Opportunity information shall include source information where available. |
| BR-15 | An Opportunity may have no deadline. |
| BR-16 | Viewing an Opportunity does not create a Calendar Entry. |
| BR-17 | An Opportunity enters a Student's personal calendar only after the Student explicitly selects “Thêm vào lịch”. |
| BR-18 | A Calendar Entry, a Saved Opportunity, and an Application record are separate concepts. |
| BR-19 | Only actively tracked Calendar Entries with valid deadlines are eligible for deadline reminders. |
| BR-20 | Deadline reminders are supported at 7, 3, and 1 day before the deadline. |
| BR-21 | Notification capability includes both in-app and email channels. |
| BR-22 | A Student removing a Calendar Entry shall not receive future reminders for that entry. |
| BR-23 | Already-sent notifications remain in notification history after calendar removal. |
| BR-24 | Duplicate reminder notifications for the same event and offset shall be prevented. |
| BR-25 | Mentor is a profile, not an authenticated system role. |
| BR-26 | Admin processes Mentor booking requests; a request is not automatically a confirmed appointment. |
| BR-27 | Students have read-only access to Community content. |
| BR-28 | Only Admins may publish Community content. |
| BR-29 | Student cannot self-delete their account through the application. |
| BR-30 | Multiple Admins are supported and have equal permissions. |
| BR-31 | Upload file size shall not exceed 10 MB per file. |
| BR-32 | Allowed upload formats are PDF, DOC, DOCX, JPG, JPEG, and PNG. |
| BR-33 | Private uploaded files shall be protected by ownership and authorization checks. |
| BR-34 | Opportunity edits shall detect stale versions and warn the Admin. |
| BR-35 | A stale Opportunity update shall not silently overwrite a newer version. |
| BR-36 | Sponsored content shall be visibly labelled. |
| BR-37 | Admin is responsible for checking and maintaining published opportunity information. |
| BR-38 | Application Tracking reflects Student-entered progress and is not an external verification of application outcomes. |

---

# 6. Data Requirements

This section identifies conceptual data objects. It is not the final MongoDB collection design. Embedding, referencing, indexes, and exact field types shall be decided in `DATABASE_DESIGN.md`.

## 6.1 Conceptual Data Objects

| Object | Purpose | Indicative data |
|---|---|---|
| User | Authentication and role | Email, password credential reference/hash, role, status, timestamps |
| StudentProfile | Student information | Name, avatar, university, major, academic year, goals, skills, achievements |
| Quiz | Quiz configuration | Title, description, status |
| QuizQuestion | Quiz question | Content, question type, answer options, ordering, status |
| QuizAnswer | Student responses | Student reference, question reference, selected answer, submission reference |
| QuizResult | Evaluation result | Student reference, scores/mapping result, recommended directions, timestamp |
| RoadmapTemplate | Reusable roadmap definition | Title, direction, structure, milestones, tasks, status |
| Roadmap | Student roadmap | Student reference, template reference, status, goal snapshot, generated time, archive time |
| RoadmapMilestone | Roadmap milestone | Roadmap reference, title, academic year, semester, order |
| RoadmapTask | Roadmap task | Milestone reference, title, description, status, order |
| Opportunity | Curated opportunity | Title, description, category, requirements, deadline, location, source, status, version, updated by/time |
| OpportunityCategory | Opportunity classification | Name, description, status |
| SavedOpportunity | Student bookmark | Student reference, Opportunity reference, saved time |
| CalendarEntry | Explicit deadline tracking | Student reference, Opportunity reference, active state, added time, removed time |
| Application | Personal application tracker | Student reference, Opportunity reference, status, notes, timestamps |
| ApplicationStatusHistory | Application progress history | Application reference, prior/new status, timestamp |
| Notification | In-app notification | Student reference, type, title/content, read state, event reference, creation time |
| NotificationDelivery | Channel delivery result | Notification reference, channel, status, provider reference, sent time/error |
| Mentor | Admin-managed profile | Name, organization, role, expertise, experience, biography, status |
| MentorBooking | Student request | Student reference, Mentor reference, requested topic/time, message, status, Admin response |
| Certificate | Shared catalog | Name, provider, category, description, resource references, status |
| StudentCertificate | Personal certificate record | Student reference, certificate information, issue/expiry date, evidence reference |
| Activity | Shared activity | Title, category, description, schedule, eligibility, registration instructions, status |
| StudentActivity | Personal activity record | Student reference, Activity reference, participation status, dates, notes |
| CommunityPost | Admin-authored content | Title, body, category, publication status, author Admin, timestamps |
| News | Curated news | Title, body, category, source, publication status, timestamps |
| CVDocument | Student CV information/file | Student reference, CV content/template, language, file reference, timestamps |
| UploadedFile | File metadata | Owner, original name, detected type, size, storage reference, uploaded time |
| AdminAuditLog | Audit record | Admin reference, action, entity type/id, time, relevant before/after values |

## 6.2 Data Integrity Requirements

### DR-01 – Unique Email

The data model shall enforce uniqueness for normalized registered email addresses.

### DR-02 – Ownership References

Student-owned records shall be associated with the authenticated Student's user identifier.

### DR-03 – One Active Roadmap

The data model and write operations shall enforce at most one Active roadmap per Student.

### DR-04 – Calendar Entry Uniqueness

The system shall prevent more than one active Calendar Entry for the same Student and Opportunity.

### DR-05 – Notification Deduplication

The data model shall support a stable deduplication key for reminder event, Student, Opportunity, deadline, and reminder offset.

### DR-06 – Opportunity Versioning

Opportunity updates shall use a version or concurrency token that changes after each successful update.

### DR-07 – File Ownership Metadata

Every private uploaded file shall retain its owner reference and access-control metadata.

### DR-08 – Historical Roadmap Preservation

Archiving a roadmap shall preserve the content and progress necessary for historical review.

### DR-09 – Auditability

Important Admin operations shall be traceable to the Admin account that performed them.

## 6.3 Data Retention and Deletion

Student self-deletion is not available. The detailed policy for data retention, Admin-initiated disablement, any future deletion request, and legal/operational retention obligations is **TBD**. The implementation shall not invent permanent deletion behavior for account-related data.

---

# 7. Use Cases and System Workflows

## 7.1 Actors

| Actor | Type | Description |
|---|---|---|
| Visitor | External user | Browses available public content and accesses registration/login. |
| Student | Authenticated user | Uses personal development, opportunity, calendar, tools, and profile functionality. |
| Admin | Authenticated user | Manages students and shared platform content, processes mentor requests. |
| Google OAuth Provider | External system | Authenticates users through Google. |
| Email Provider | External system | Delivers system emails and notifications. |
| File Storage Provider | External system | Stores file content and returns storage references. |

Mentor and Company are not system actors because neither has a UNERA account or self-service workflow in the current scope.

## 7.2 Use Case List

| Use Case ID | Use Case | Primary Actor |
|---|---|---|
| UC-01 | Register Student Account | Visitor |
| UC-02 | Log In | Visitor |
| UC-03 | Complete Onboarding Quiz | Student |
| UC-04 | Skip Onboarding Quiz | Student |
| UC-05 | Update Development Goals and Regenerate Roadmap | Student |
| UC-06 | Manage Active Roadmap Tasks | Student |
| UC-07 | Search and View Opportunities | Student/Visitor |
| UC-08 | Save or Unsave Opportunity | Student |
| UC-09 | Add Opportunity to Calendar | Student |
| UC-10 | Remove Opportunity from Calendar | Student |
| UC-11 | View Notifications | Student |
| UC-12 | Track Application Progress | Student |
| UC-13 | Submit Mentor Booking Request | Student |
| UC-14 | Process Mentor Booking Request | Admin |
| UC-15 | Manage Opportunity Content | Admin |
| UC-16 | Update Opportunity with Version Conflict | Admin |
| UC-17 | Upload a Personal File | Student |
| UC-18 | Manage Certificates and Activities | Student |
| UC-19 | View Community and News | Student/Visitor |
| UC-20 | Manage Shared Content | Admin |

## 7.3 Detailed Use Cases

### UC-01 – Register Student Account

**Primary actor:** Visitor  
**Preconditions:** Visitor is not authenticated.  
**Trigger:** Visitor selects registration.

**Main flow:**
1. System displays registration form.
2. Visitor enters required registration information.
3. System validates required fields and email format.
4. System checks that the normalized email is not already registered.
5. System securely creates a Student account.
6. System initiates email verification if configured as required by the account policy.
7. System confirms account creation and provides the next appropriate action.

**Alternative flows:**
- A required field is invalid: system displays field-level feedback and does not create the account.
- Email already exists: system informs the Visitor and does not create a duplicate account.
- Account creation fails: system reports a recoverable error and does not expose internal details.

**Postconditions:** A Student account exists if registration succeeds. The Student may proceed according to the configured verification policy.

### UC-02 – Log In

**Primary actor:** Visitor  
**Preconditions:** A registered account exists.  
**Trigger:** Visitor submits credentials or selects Google sign-in.

**Main flow:**
1. System presents supported login methods.
2. Visitor submits email/password or completes Google OAuth.
3. System validates the authentication result.
4. System checks account status and role.
5. System establishes an authenticated session.
6. System redirects the user to an appropriate page based on role.

**Alternative flows:**
- Credentials are invalid: system rejects login and displays a generic authentication error.
- Account is disabled: system denies access.
- OAuth is cancelled or fails: system returns the user to the login flow with suitable feedback.

**Postconditions:** An authenticated session exists only if authentication and account-status checks succeed.

### UC-03 – Complete Onboarding Quiz

**Primary actor:** Student  
**Preconditions:** Student is authenticated. Quiz is active.  
**Trigger:** Student selects the onboarding quiz.

**Main flow:**
1. System displays active quiz questions.
2. Student enters answers.
3. Student submits the quiz.
4. System validates required answers.
5. System stores the response set.
6. System applies configured rule-based evaluation.
7. System stores the result and recommends one or two directions.
8. System displays the result and suggested next steps.

**Alternative flows:**
- Student leaves before submitting: incomplete responses are not treated as a completed result.
- Required answer is missing: system identifies the missing answer.
- Evaluation configuration is unavailable: system reports that a result could not be generated and preserves submitted data where feasible.

**Postconditions:** A completed quiz result is stored if evaluation succeeds.

### UC-04 – Skip Onboarding Quiz

**Primary actor:** Student  
**Preconditions:** Student is authenticated and has not completed the quiz in the current flow.  
**Trigger:** Student selects Skip or an equivalent option.

**Main flow:**
1. System records or recognizes that the quiz was skipped, if status tracking is implemented.
2. System allows the Student to continue to the application.
3. System keeps the quiz available for later completion.

**Postconditions:** The Student can use other permitted functions without completing the quiz.

### UC-05 – Update Development Goals and Regenerate Roadmap

**Primary actor:** Student  
**Preconditions:** Student is authenticated and has an active profile.  
**Trigger:** Student saves changed development goals.

**Main flow:**
1. System displays the Student's current development goals.
2. Student changes one or more goals and saves.
3. System validates the new goal values.
4. System identifies a suitable roadmap template using configured rules.
5. System generates a new roadmap from the updated goals and available Student information.
6. If generation succeeds, system archives the previous active roadmap.
7. System activates the newly generated roadmap.
8. System confirms the update and displays the new roadmap.

**Alternative flows:**
- Goal values are invalid: system rejects the update and displays validation feedback.
- No applicable template or generation failure: system preserves the previous active roadmap, reports the failure, and does not leave the Student without an active roadmap.
- Concurrent goal update: system handles the conflict without silently losing one update; exact profile concurrency behavior is defined in technical design.

**Postconditions:** On success, exactly one new active roadmap exists and the prior roadmap is retained as history. On failure, the previous active roadmap remains active.

### UC-06 – Manage Active Roadmap Tasks

**Primary actor:** Student  
**Preconditions:** Student has an active roadmap.  
**Trigger:** Student opens My Roadmap.

**Main flow:**
1. System displays years, semesters, milestones, and tasks.
2. Student changes an allowed task status or an editable field permitted by the template.
3. System validates that the edit complies with template constraints.
4. System saves the change.
5. System recalculates and displays progress.

**Alternative flows:**
- Student attempts an unsupported edit: system rejects the change and explains the constraint.
- Student attempts to edit another Student's roadmap: system denies access.

**Postconditions:** The active roadmap reflects valid Student updates.

### UC-07 – Search and View Opportunities

**Primary actor:** Student or Visitor  
**Preconditions:** Eligible published Opportunities exist.  
**Trigger:** User opens Explore or submits a search.

**Main flow:**
1. System displays eligible published Opportunities.
2. User enters a keyword and/or selects filters.
3. System returns matching paginated results.
4. User opens an Opportunity detail page.
5. System displays available description, eligibility, requirements, deadline, source, and application information.

**Alternative flows:**
- No matching Opportunity exists: system displays an empty state.
- Opportunity is no longer published: system does not expose it as a public current opportunity.

**Postconditions:** Opportunity is viewed. No Calendar Entry is created merely by viewing it.

### UC-08 – Save or Unsave Opportunity

**Primary actor:** Student  
**Preconditions:** Student is authenticated.  
**Trigger:** Student selects Save or Unsave.

**Main flow:**
1. Student selects Save on an eligible Opportunity.
2. System creates a saved-opportunity association.
3. System displays the saved state and makes it available in the Student's saved list.

**Alternative flows:**
- Student selects Unsave: system removes or deactivates the saved association.
- Duplicate Save: system keeps a single effective saved association.

**Postconditions:** Saved list reflects the Student's action. Calendar enrollment is unchanged.

### UC-09 – Add Opportunity to Calendar

**Primary actor:** Student  
**Preconditions:** Student is authenticated and viewing an eligible Opportunity detail page.  
**Trigger:** Student clicks **“Thêm vào lịch”**.

**Main flow:**
1. Student selects “Thêm vào lịch”.
2. System verifies ownership/session and Opportunity eligibility.
3. System creates or activates one Calendar Entry for the Student and Opportunity.
4. System displays the Opportunity in the Student's personal calendar.
5. If the Opportunity has a valid deadline, system evaluates future 7/3/1-day reminder offsets and schedules eligible reminders.
6. System confirms that the Opportunity was added.

**Alternative flows:**
- Entry already active: system does not create a duplicate and displays the existing tracked state.
- Opportunity has no deadline: system may add it to the calendar/tracked list but schedules no deadline reminders.
- Opportunity is no longer eligible: system prevents adding it and explains why.

**Postconditions:** An active Calendar Entry exists. Merely viewing or saving the Opportunity is not sufficient to create this entry.

### UC-10 – Remove Opportunity from Calendar

**Primary actor:** Student  
**Preconditions:** Student has an active Calendar Entry.  
**Trigger:** Student selects Remove from Calendar/Unfollow.

**Main flow:**
1. Student selects the remove action.
2. System verifies that the Calendar Entry belongs to the Student.
3. System deactivates or removes the active tracking association according to the data-retention design.
4. System cancels or invalidates future reminders.
5. System updates the calendar view.

**Alternative flows:**
- Entry is already inactive: system returns the current state without creating duplicate effects.
- Entry belongs to another Student: system denies access.

**Postconditions:** The Opportunity no longer appears as actively tracked and no future reminders are sent for that entry. Previous notification history remains.

### UC-11 – View Notifications

**Primary actor:** Student  
**Preconditions:** Student is authenticated.  
**Trigger:** Student opens the notification center.

**Main flow:**
1. System retrieves notifications belonging to the Student.
2. System displays notification content, time, and read state.
3. Student opens or marks a notification as read.
4. System updates the read state.

**Postconditions:** Notification history and read state reflect the Student's actions.

### UC-12 – Track Application Progress

**Primary actor:** Student  
**Preconditions:** Student is authenticated.  
**Trigger:** Student creates or updates an application record.

**Main flow:**
1. Student selects an Opportunity for personal application tracking.
2. System creates an application record linked to the Student and Opportunity.
3. Student sets or updates the status.
4. Student optionally adds notes.
5. System saves the status and history.
6. System displays updated progress in list/Kanban views.

**Postconditions:** The Student's personal application tracker is updated. No external application status is implied.

### UC-13 – Submit Mentor Booking Request

**Primary actor:** Student  
**Preconditions:** Student is authenticated and the Mentor profile is available.  
**Trigger:** Student selects a booking/request action on a Mentor profile.

**Main flow:**
1. System displays the booking-request form.
2. Student enters the requested topic, preferred time information, and message.
3. Student submits the request.
4. System validates the request and creates it with Pending status.
5. System makes the request available to Admins.
6. System confirms submission to the Student.

**Postconditions:** A Pending booking request exists. No appointment is considered automatically confirmed.

### UC-14 – Process Mentor Booking Request

**Primary actor:** Admin  
**Preconditions:** Admin is authenticated and a Pending request exists.  
**Trigger:** Admin opens the booking-management area.

**Main flow:**
1. System displays booking requests.
2. Admin opens a request.
3. Admin reviews Student details and requested Mentor/topic/time.
4. Admin updates the status and enters a response or next-step information.
5. System saves the decision and records the responsible Admin.
6. System notifies the Student through supported notification channels.

**Postconditions:** Booking request reflects the Admin's latest decision and the Student is notified.

### UC-15 – Manage Opportunity Content

**Primary actor:** Admin  
**Preconditions:** Admin is authenticated.  
**Trigger:** Admin opens Opportunity Management.

**Main flow:**
1. System displays managed Opportunities.
2. Admin creates a new Opportunity or opens an existing one.
3. Admin enters or updates content, source, status, and deadline information.
4. System validates the data.
5. System checks that the submitted version is current.
6. System saves the update and increments the version.
7. Admin may publish, close, or archive the Opportunity as permitted.
8. System updates Student-facing content according to publication status.

**Alternative flows:**
- Invalid input: system displays validation feedback.
- Source or deadline information is missing: system applies field rules and allows optional deadline where appropriate.
- Version conflict: system rejects the stale update and follows UC-16.

**Postconditions:** The Opportunity is saved with update metadata and a new version if the operation succeeds.

### UC-16 – Update Opportunity with Version Conflict

**Primary actor:** Admin  
**Preconditions:** An Admin has loaded an Opportunity version that has since been updated by another Admin.  
**Trigger:** The first Admin submits a stale update.

**Main flow:**
1. Admin submits changed data with the version originally loaded.
2. System compares the submitted version with the current stored version.
3. System detects a mismatch.
4. System rejects the stale write.
5. System returns a conflict response containing the latest version metadata where available.
6. Interface displays a warning identifying that another Admin updated the Opportunity and shows the latest updater/time where available.
7. Admin reloads the latest Opportunity and reviews the new data.
8. Admin reapplies necessary edits and submits against the current version.

**Postconditions:** The latest saved Opportunity data is not silently overwritten by the stale update.

### UC-17 – Upload a Personal File

**Primary actor:** Student  
**Preconditions:** Student is authenticated and a feature supports file upload.  
**Trigger:** Student selects a file and submits the upload.

**Main flow:**
1. System displays the allowed formats and 10 MB per-file limit.
2. Student selects a file.
3. System validates file size and format on the server.
4. System stores the file in configured storage.
5. System records file metadata and ownership.
6. System confirms upload success.

**Alternative flows:**
- File exceeds 10 MB: system rejects it.
- File format/content is unsupported: system rejects it.
- Storage fails: system reports the failure and does not create a valid metadata record pointing to a nonexistent file.
- User attempts to access another Student's private file: system denies access.

**Postconditions:** On success, a private file record owned by the authenticated Student exists.

### UC-18 – Manage Certificates and Activities

**Primary actor:** Student  
**Preconditions:** Student is authenticated.  
**Trigger:** Student opens Certificates or Activities.

**Main flow:**
1. System displays the shared catalog.
2. Student views a certificate/activity.
3. Student may save an activity or add a personal certificate/participation record.
4. System validates and saves the personal data.
5. System displays the updated personal records.

**Postconditions:** Personal certificate/activity information is available in the Student profile where applicable.

### UC-19 – View Community and News

**Primary actor:** Student or Visitor  
**Preconditions:** Published Community or news content exists.  
**Trigger:** User opens Community or News.

**Main flow:**
1. System displays published content.
2. User selects an item.
3. System displays its details.

**Postconditions:** Content is viewed. Student write actions are not available for Community.

### UC-20 – Manage Shared Content

**Primary actor:** Admin  
**Preconditions:** Admin is authenticated.  
**Trigger:** Admin opens a supported management module.

**Main flow:**
1. System displays the relevant managed records.
2. Admin creates, updates, publishes, hides, closes, or archives a record according to its type.
3. System validates the data and Admin authorization.
4. System records important changes in the audit history.
5. System updates the public/Student view according to publication status.

**Postconditions:** Shared content reflects the Admin's successful operation.

---

# 8. Non-functional Requirements

Quantitative targets below are initial targets from the PRD and must be verified under a defined test environment. They are not a guarantee independent of network, provider, or deployment conditions.

## 8.1 Performance

### NFR-PERF-01 – Standard Page Load

Ordinary application pages should load within approximately 2–3 seconds under the agreed test conditions.

### NFR-PERF-02 – Standard CRUD Response

Ordinary CRUD operations should respond within approximately 2 seconds under the agreed test conditions.

### NFR-PERF-03 – Search Responsiveness

Search and filter operations should return results within an agreed response-time target under representative data volume. The precise target and data volume are TBD.

### NFR-PERF-04 – Pagination

List endpoints and views should use pagination or an equivalent bounded-result strategy where data can grow significantly.

## 8.2 Security

### NFR-SEC-01 – Password Protection

Passwords shall never be stored in plain text. A suitable password-hashing approach shall be used.

### NFR-SEC-02 – Server-side Authorization

All protected data operations shall enforce authentication and role/ownership authorization on the server.

### NFR-SEC-03 – Secret Management

Database credentials, OAuth secrets, email-provider keys, storage credentials, and authentication secrets shall not be committed to source control or exposed to browser code.

### NFR-SEC-04 – Input Validation

Server-side validation shall be performed for data received from browser clients and external callbacks.

### NFR-SEC-05 – Secure Transport

Deployed environments shall use HTTPS.

### NFR-SEC-06 – Access Control for Private Files

Private uploaded files shall not be accessible solely through an easily guessable public URL.

### NFR-SEC-07 – Abuse Protection

Authentication, password recovery, upload, and other abuse-prone endpoints should use appropriate rate limiting or abuse controls. Exact limits are TBD.

### NFR-SEC-08 – Sensitive Error Handling

Error messages shown to users shall not expose stack traces, secrets, database details, or internal implementation information.

## 8.3 Reliability and Data Integrity

### NFR-REL-01 – Failure-safe Roadmap Replacement

Roadmap generation/replacement shall preserve the previously active roadmap if generation fails.

### NFR-REL-02 – Duplicate Prevention

The system shall prevent duplicate active Calendar Entries and duplicate deadline reminders for the same logical event.

### NFR-REL-03 – Concurrent Opportunity Update Safety

Stale Opportunity edits shall not silently overwrite newer data.

### NFR-REL-04 – Consistent Data Updates

Multi-step operations that change linked business state shall be designed to avoid partially applied states. Where database transactions are unavailable or unsuitable, the system shall use compensating or idempotent operations.

### NFR-REL-05 – Email Failure Isolation

Email delivery failure shall not erase the associated in-app notification.

## 8.4 Usability and Compatibility

### NFR-USE-01 – Responsive UI

The application shall support desktop, tablet, and mobile browser layouts.

### NFR-USE-02 – Browser Compatibility

The application shall support current versions of Chrome, Edge, and Firefox.

### NFR-USE-03 – Clear Validation

Validation and error messages should explain what the user can do to correct the issue.

### NFR-USE-04 – Accessibility Basics

The interface should use semantic structure, keyboard-accessible controls, visible focus indicators, and appropriate labels for form controls.

## 8.5 Maintainability and Scalability

### NFR-MNT-01 – Modular Code

The codebase shall organize business functionality into maintainable modules with clear responsibilities.

### NFR-MNT-02 – Consistent Conventions

The codebase shall follow documented naming, formatting, error-handling, and validation conventions.

### NFR-MNT-03 – Testability

Core business logic shall be structured so it can be tested independently where practical.

### NFR-SCL-01 – Extensible Design

The application design should allow additional features and increased user/data volume without requiring a complete architectural replacement.

## 8.6 Availability, Backup, Logging, and Privacy

### NFR-OPS-01 – Availability Target

A numeric availability target is TBD and shall be agreed before production service-level commitments are made.

### NFR-OPS-02 – Backup and Recovery

The deployment shall use a database backup and recovery approach appropriate to the selected MongoDB service and project risk. Recovery point and recovery time targets are TBD.

### NFR-OPS-03 – Operational Logging

The application shall record application errors and important operational events without logging secrets or unnecessary personal data.

### NFR-OPS-04 – Admin Audit

Important Admin content and account-management operations shall be traceable through audit records.

### NFR-PRIV-01 – Data Minimization

The system should collect and retain only information needed for the documented product functions and operational requirements.

### NFR-PRIV-02 – Private Data Isolation

Private Student data shall be isolated by authenticated ownership checks.

## 8.7 SEO

### NFR-SEO-01 – Public Content Metadata

Public-facing content pages should provide appropriate page titles, descriptions, and indexability behavior. Private pages and account data shall not be exposed for indexing.

---

# 9. Validation and Acceptance Criteria

The following criteria provide a high-level acceptance baseline. Detailed test cases shall be documented in the testing strategy and test suite.

| ID | Acceptance criterion |
|---|---|
| AC-01 | A Visitor can register with a unique email and valid password. |
| AC-02 | A user can authenticate using Google OAuth when provider configuration is valid. |
| AC-03 | Student can skip the onboarding quiz and access other permitted features. |
| AC-04 | A completed quiz produces a rule-based result with one or two recommended directions when configuration is valid. |
| AC-05 | A Student can have one active roadmap. |
| AC-06 | Saving changed goals triggers automatic roadmap generation without a separate manual generation action. |
| AC-07 | On successful generation, the previous roadmap is archived and the new roadmap becomes active. |
| AC-08 | On generation failure, the previous active roadmap and progress remain intact. |
| AC-09 | Student roadmap edits are constrained by the applicable template. |
| AC-10 | Student can search and filter published opportunities. |
| AC-11 | Student can save and unsave opportunities. |
| AC-12 | Viewing an Opportunity alone does not create a Calendar Entry. |
| AC-13 | Clicking “Thêm vào lịch” creates or activates one Calendar Entry. |
| AC-14 | An active Calendar Entry with a valid deadline is eligible for 7/3/1-day reminders. |
| AC-15 | Removing an Opportunity from the calendar prevents future reminders for that entry. |
| AC-16 | Both in-app and email notification channels are supported. |
| AC-17 | Repeated Add to Calendar actions do not create duplicate active entries. |
| AC-18 | Student can manage personal application status and notes. |
| AC-19 | Student can submit a Mentor booking request and Admin can process it. |
| AC-20 | Student can view Community content but cannot create posts or comments. |
| AC-21 | Only Admin can create or edit Opportunities and other shared content. |
| AC-22 | Multiple Admin accounts can access shared Admin functions with equal permissions. |
| AC-23 | Student cannot delete their own account through the application. |
| AC-24 | Uploads accept PDF, DOC, DOCX, JPG, JPEG, PNG files no larger than 10 MB each. |
| AC-25 | Uploads over 10 MB or in unsupported formats are rejected server-side. |
| AC-26 | Student cannot access another Student's private profile records or uploaded files. |
| AC-27 | An Admin editing a stale Opportunity version receives a conflict warning. |
| AC-28 | A stale Opportunity update does not silently overwrite the latest saved version. |
| AC-29 | Published content is visible according to its visibility rules; Draft/Archived content is not presented as a currently published opportunity. |
| AC-30 | Sponsored content is visibly labelled. |
| AC-31 | The responsive application can be used on supported desktop and mobile browsers. |

---

# 10. Traceability Matrix

This matrix connects product modules to requirement groups and the principal use cases. It will be expanded to individual test-case IDs in `TESTING_STRATEGY.md`.

| Product module | Requirement IDs | Main use cases |
|---|---|---|
| Authentication | FR-AUTH-01–13 | UC-01, UC-02 |
| Student Profile | FR-PRO-01–06 | UC-05, UC-18 |
| Onboarding | FR-ONB-01–12 | UC-03, UC-04 |
| Roadmap | FR-RM-01–16 | UC-05, UC-06 |
| Explore/Opportunity | FR-EXP-01–15 | UC-07, UC-15, UC-16 |
| Search | FR-SRCH-01–11 | UC-07 |
| Saved/Application | FR-APP-01–10 | UC-08, UC-12 |
| Calendar | FR-CAL-01–14 | UC-09, UC-10 |
| Notification | FR-NOTI-01–14 | UC-11, UC-09, UC-10, UC-14 |
| Mentor | FR-MEN-01–13 | UC-13, UC-14 |
| Student Tools | FR-TOOL-01–12 | CV/tool workflows (detailed use cases to be added) |
| Certificates/Activities | FR-CERT-01–06, FR-ACT-01–07 | UC-18 |
| Community | FR-COM-01–06 | UC-19, UC-20 |
| News | FR-NEWS-01–07 | UC-19, UC-20 |
| Admin | FR-ADM-01–20 | UC-14, UC-15, UC-16, UC-20 |
| File Upload | FR-FILE-01–10 | UC-17 |

---

# 11. Open Issues and Decisions Pending

The following topics were not fully decided in the PRD discussion. They are explicitly left unresolved and shall be handled in detailed design only after product-owner confirmation.

| ID | Open issue | Current status / note |
|---|---|---|
| OI-01 | Can Student edit archived roadmaps? | TBD. Do not expose edit behavior without approval. |
| OI-02 | Can Student save multiple CV versions? | TBD. |
| OI-03 | Can Admin permanently delete an Opportunity, or only archive it? | TBD. Archive is the proposed default, not confirmed. |
| OI-04 | Does Student register for activities directly in UNERA? | TBD. External instructions/links are the current proposal. |
| OI-05 | Can Student independently disable In-app or Email notifications? | TBD. Both channels are required; channel preference behavior is unresolved. |
| OI-06 | Can Student cancel a Mentor booking request, and under what conditions? | TBD. |
| OI-07 | What start/end scheduling rules apply to sponsored content? | TBD. |
| OI-08 | Which GPA grading scales and conversion formulas are supported? | TBD. |
| OI-09 | Are Student-entered certificates verified by Admin? | TBD. |
| OI-10 | What file count is allowed per upload action? | TBD. Per-file size and allowed formats are confirmed. |
| OI-11 | Which file storage provider and retention rules are used? | Technical/product decision pending. |
| OI-12 | What happens to Student data when Admin disables an account? | TBD. Student self-deletion is not available. |
| OI-13 | Is email verification mandatory before protected access? | The system supports verification; gating policy is TBD. |
| OI-14 | What exact goal-to-roadmap-template matching and task-generation rules apply? | Must be defined before roadmap generation can be implemented reliably. |
| OI-15 | What are the exact performance, availability, backup, RPO, and RTO targets? | TBD. Initial page/CRUD response targets are in Section 8. |
| OI-16 | What precise public visibility rules apply to each page type? | To be finalized in UI/API design. |
| OI-17 | What mandatory fields and scheduling rules apply to Mentor booking requests? | To be finalized in detailed workflow design. |
| OI-18 | What data fields are mandatory for each Opportunity category? | To be specified in data validation design. |

---

# 12. Release Scope Guidance

The PRD proposes staged delivery. The order below is guidance for planning, not a change to the overall product scope.

| Release | Suggested scope |
|---|---|
| R1 – Foundation | Authentication, Student Profile, role-based authorization, Admin foundation |
| R2 – Core Discovery | Opportunity CMS, Explore, Search, News |
| R3 – Personalization | Optional onboarding quiz, rule-based result, roadmap templates, automatic roadmap generation and history |
| R4 – Tracking | Saved Opportunities, Application Tracking, explicit Calendar Entries, reminder scheduling, in-app/email notifications |
| R5 – Development Tools | CV builder/export, GPA and language-score tools, certificates, activities, file upload |
| R6 – Mentor and Community | Mentor directory, Admin-mediated booking requests, Admin-only Community content |
| R7 – Advanced | AI extensions and advanced personalization, subject to a separate approved scope |

---

# 13. SRS Completion Notes

SRS 1.0 captures the current approved product requirements and expresses them as system-level behaviors. It is sufficiently structured to begin architecture and implementation planning, but several workflows still require detailed design before coding can be considered unambiguous.

The next recommended design artifacts are:

1. `DATABASE_DESIGN.md` — MongoDB collections, fields, references/embedded documents, indexes, uniqueness, versioning, and transactional boundaries.
2. `ARCHITECTURE.md` — Next.js module boundaries, server/client responsibilities, authentication, authorization, storage, and email integration.
3. `API_SPECIFICATION.md` — endpoint or server-action contracts, request/response schemas, errors, ownership checks, and concurrency conflict behavior.
4. `USE_CASES.md` — expanded use-case descriptions and alternate flows if the project needs a separate use-case document.
5. `UI_UX_GUIDELINES.md` — routes, pages, navigation, form states, empty states, loading states, and responsive behavior.
6. `TESTING_STRATEGY.md` — requirement-linked unit, integration, authorization, concurrency, upload, notification, and end-to-end tests.

Any change to a confirmed business decision must be reflected in this SRS and the Project Context before implementation proceeds.
