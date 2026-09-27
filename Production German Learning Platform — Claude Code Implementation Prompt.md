# Build a Production-Ready German Learning & Goethe Exam Preparation Platform

You are working inside an **existing Next.js project**.

Your task is to transform the existing project into a **production-ready German language learning and Goethe exam preparation platform**.

The product should eventually support:

**A1 → A2 → B1 → B2 → C1 → C2**

However, **Phase 1 is A1 only**.

The architecture must be designed so that A2–C2 can be added later without major rewrites.

---

# 1. Non-Negotiable Tech Constraints

Use only:

- Next.js
- JavaScript
- Tailwind CSS
- MongoDB

Do NOT introduce:

- TypeScript
- Redis
- Docker
- Separate backend application
- Separate API server
- Unnecessary frameworks or infrastructure

The existing Next.js application must contain both:

- Frontend
- Backend/API/server-side logic
- MongoDB integration
- Authentication/authorization
- Admin functionality

Use Next.js-native server/API capabilities.

Before making changes, inspect the existing project and preserve useful existing architecture.

Do not replace or rewrite working functionality without a concrete reason.

---

# 2. First: Audit the Existing Project

Before implementing anything:

1. Read the existing project structure.
2. Read `package.json`.
3. Inspect Next.js version and current configuration.
4. Inspect existing app/router structure.
5. Inspect Tailwind configuration.
6. Inspect existing components/layouts.
7. Inspect existing database configuration if present.
8. Inspect existing authentication if present.
9. Inspect environment configuration.
10. Inspect existing design system/components.
11. Identify reusable code.
12. Identify incomplete or placeholder functionality.
13. Identify architectural problems that would prevent production readiness.

Also inspect any existing project documentation, README, rules, or task files.

Do not start by blindly generating a new architecture.

---

# 3. Product Vision

This is NOT simply a vocabulary or grammar website.

The application is a complete German learning platform designed around:

> Learn → Understand → Practice → Produce → Test → Review → Master

The learner should progressively develop:

- Vocabulary
- Grammar
- Reading
- Listening
- Speaking
- Writing

The platform should combine structured learning with exam preparation.

---

# 4. CEFR Level Architecture

The platform must support:

```text
A1
A2
B1
B2
C1
C2
```

Only A1 content needs to be implemented initially.

Do NOT create fake A2–C2 content just to fill the UI.

Instead, build reusable architecture that supports future levels.

Example conceptual structure:

```text
Level
 └── Module
      └── Lesson
           ├── Vocabulary
           ├── Grammar
           ├── Reading
           ├── Listening
           ├── Speaking
           ├── Writing
           └── Practice/Test
```

---

# 5. A1 Curriculum

A1 should be a complete learning path, not a collection of random lessons.

The curriculum should cover appropriate beginner topics such as:

- Greetings
- Personal information
- Family
- Numbers
- Time
- Dates
- Daily routine
- Food and drinks
- Shopping
- Home
- Work
- School
- Hobbies
- Appointments
- Travel
- Directions
- Basic everyday communication

Do not invent a random curriculum and immediately implement everything.

First establish a coherent curriculum structure.

The final detailed A1 curriculum should be based on:

- CEFR A1 learning objectives
- Goethe A1 exam skill requirements
- Appropriate German-learning curriculum structure
- Netzwerk neu A1 as a reference/mapping source
- Grammatik aktiv as a grammar reference

---

# 6. Netzwerk neu A1 Integration

The application must NOT copy or reproduce copyrighted textbook content.

Do not copy:

- Kursbuch text
- Übungsbuch exercises
- Images
- Audio
- Dialogues
- Answer keys
- PDF pages
- Proprietary exercises

Instead, use Netzwerk neu A1 as a **curriculum/reference mapping**.

Example:

```text
Application:
A1 → Module → Familie

Reference:
Netzwerk neu A1
→ relevant chapter/topic
```

Our application must provide its own original:

- explanations
- examples
- exercises
- dialogues
- listening content
- questions
- practice activities

The relationship should conceptually be:

```text
Goethe / CEFR Requirements
          ↓
     Our Curriculum
          ↓
Network neu reference mapping
```

If licensing is not explicitly provided, do not embed or reproduce the textbook content.

---

# 7. Grammatik aktiv Integration

Treat Grammatik aktiv as a grammar reference/mapping source.

Do not copy its:

- explanations
- exercises
- examples
- answer keys
- page content

Instead:

```text
Application Grammar Topic
        ↓
Original explanation
        ↓
Original examples
        ↓
Interactive exercises
        ↓
Production practice
        ↓
Exam practice
```

Optionally associate a grammar topic with a reference such as:

```text
Grammatik aktiv
→ relevant grammar topic
```

Keep the application content original.

---

# 8. Six Core Skills

Every appropriate lesson/module should support:

### Wortschatz
Vocabulary

### Grammatik
Grammar

### Lesen
Reading

### Hören
Listening

### Sprechen
Speaking

### Schreiben
Writing

Do not force every skill into every lesson if pedagogically inappropriate.

The curriculum should use the skills intentionally.

---

# 9. Vocabulary System

Vocabulary must be structured.

A vocabulary item should be capable of storing information such as:

```text
word
translation/meaning
article
plural
pronunciation
example sentence
level
topic
related words
difficulty
```

For nouns, prioritize learning the article with the word:

```text
der Tisch
die Lampe
das Buch
```

Do not treat:

```text
Tisch = table
```

as the primary learning representation.

Implement a reusable vocabulary review mechanism.

Prepare the architecture for spaced repetition.

A learner should be able to encounter vocabulary through:

- lesson
- flashcard
- quiz
- listening
- reading
- sentence building
- revision

---

# 10. Grammar System

Grammar should not be only static explanations.

Each grammar topic should support:

```text
Explanation
↓
Examples
↓
Recognition
↓
Interactive exercise
↓
Sentence construction
↓
Production
↓
Review
```

For example:

```text
sein
haben
personal pronouns
articles
plural
W-Fragen
verb conjugation
modal verbs
possessive articles
negation
Nominativ
Akkusativ
etc.
```

Only include grammar appropriate to the actual A1 curriculum.

---

# 11. Listening / Hören

Listening is one of the highest-priority features.

The application should progressively train the learner from clear beginner German to more natural speech.

Target progression:

```text
Clear / Slow German
        ↓
Natural German
        ↓
Normal-speed German
        ↓
Two-person conversations
        ↓
Real-life situations
        ↓
Multiple speakers
        ↓
More natural speech
```

Listening exercises should support:

- audio
- duration
- transcript
- speakers
- difficulty
- questions
- answers
- explanation
- related vocabulary

Transcript should normally be hidden during the first listening attempt.

After answering, the learner may see:

- transcript
- vocabulary
- explanation
- correct answers

Do not use copyrighted Netzwerk neu audio.

Use original/licensed audio or appropriate TTS where legally and technically appropriate.

Prefer high-quality German `de-DE` voices for generated audio.

Prepare the architecture so native speaker recordings can replace generated audio later.

---

# 12. Listening Exercise UX

Example:

```text
🎧 Listen

[Play]

Question:
What does Anna want?

A. Kaffee
B. Tee
C. Wasser
D. Saft
```

After submission:

```text
Correct Answer

Transcript

Vocabulary

Explanation
```

Do not show the transcript before the learner has meaningfully attempted the listening exercise unless the exercise explicitly intends transcript-assisted practice.

---

# 13. Shadowing Practice

Prepare the system for:

```text
Native Speaker
↓
Audio
↓
Learner listens
↓
Learner repeats
↓
Voice recording
↓
Feedback
```

The architecture should allow future pronunciation evaluation.

Do not pretend that AI pronunciation scoring is equivalent to an official language examination score.

---

# 14. Speaking / Sprechen

A1 should already contain speaking practice.

Examples:

```text
Wie heißen Sie?
Woher kommen Sie?
Wo wohnen Sie?
Was machen Sie?
```

Support:

- speaking prompts
- role-play
- answer recording
- speaking attempts
- feedback
- exam-style speaking tasks

Design the architecture so future AI conversation can be added.

Do not make AI dependency mandatory for the initial MVP if it is not already available/configured.

---

# 15. Writing / Schreiben

Progress from:

```text
Words
↓
Sentences
↓
Short paragraph
↓
Message
↓
Email
↓
Exam-style task
```

Store writing prompts and learner submissions.

Prepare architecture for future AI-assisted feedback.

The application should be able to provide:

- grammar correction
- vocabulary feedback
- structure feedback
- suggested correction
- explanation

Do not invent claims about official exam grading.

---

# 16. Reading / Lesen

Use original application content and realistic everyday materials.

Examples:

- short messages
- emails
- signs
- menus
- advertisements
- schedules
- forms
- notices
- short dialogues

Reading exercises should support:

- question types
- answers
- explanations
- difficulty
- skill
- level

---

# 17. Lesson Flow

A typical lesson should be able to follow:

```text
Introduction
↓
Vocabulary
↓
Grammar
↓
Reading
↓
Listening
↓
Speaking
↓
Writing
↓
Practice
↓
Mini Test
↓
Mastery Check
```

Do not force every lesson to have every component.

The content model must be flexible.

---

# 18. Progress Tracking

Track meaningful learner progress.

Example:

```text
A1 Progress

Vocabulary      82%
Grammar         71%
Listening       63%
Reading         91%
Speaking        54%
Writing         74%
```

Track:

- lesson completion
- exercise attempts
- correct/incorrect answers
- listening attempts
- speaking attempts
- writing attempts
- vocabulary review
- grammar mastery
- module completion
- exam attempts
- scores

Avoid calculating progress merely from page visits.

---

# 19. Mastery System

A lesson/module should have meaningful completion criteria.

For example:

```text
Vocabulary >= threshold
Grammar >= threshold
Listening >= threshold
Reading >= threshold
```

Speaking/Writing thresholds should be configurable.

Do not hardcode one global rule that cannot evolve.

Mastery requirements should be configurable per module/level.

---

# 20. Mock Exam

Provide A1 mock exams.

The system should support:

```text
Lesen
Hören
Schreiben
Sprechen
```

Mock exam:

- timed
- structured
- separate sections
- attempt tracking
- score
- review

Questions should be original or appropriately licensed.

Do not copy official exam questions unless explicitly licensed.

---

# 21. A1 Final Exam

At the end of A1, provide a complete final assessment.

Conceptually:

```text
A1 Final Exam

Lesen
Hören
Schreiben
Sprechen
```

Exam mode should support:

- timer
- section navigation
- controlled answer submission
- no hints
- no translation
- no transcript during listening attempt
- attempt persistence
- final submission
- score calculation
- section breakdown

After completion:

```text
Lesen
Hören
Schreiben
Sprechen

Overall performance
```

Then:

```text
Weak Areas
Recommended Revision
```

Do not claim:

"Pass guaranteed."

Position it as:

"Goethe-aligned preparation / practice."

---

# 22. Exam Analytics

After an exam:

```text
A1 Final Assessment

Lesen       86%
Hören       74%
Schreiben   81%
Sprechen    69%
```

Then identify areas needing additional practice.

Example:

```text
Recommended:

→ Hören: Daily routine
→ Grammar: Verb conjugation
→ Sprechen: Personal introduction
```

Recommendations should be based on actual learner performance.

---

# 23. User Dashboard

Create a production-quality learner dashboard.

It should communicate:

```text
Current Level
Overall Progress
Continue Learning
Today's Practice
Weak Areas
Vocabulary Review
Upcoming Exam
Recent Results
```

Avoid unnecessary gamification.

Gamification can exist, but learning quality must remain primary.

---

# 24. Admin Panel

Create an admin content-management architecture.

Admin must eventually be able to manage:

```text
Levels
Modules
Lessons
Vocabulary
Grammar
Reading
Listening
Speaking
Writing
Exercises
Questions
Answers
Mock Exams
Final Exams
References
```

Support:

- draft
- published
- archived
- ordering
- difficulty
- level
- skill
- topic
- tags

Do not require developer code changes for normal content creation.

---

# 25. Content References

Create a generic reference model.

Example:

```text
ReferenceBook
ReferenceChapter
ReferenceTopic
ApplicationLesson
```

Support references such as:

```text
Netzwerk neu A1
Grammatik aktiv
Goethe / CEFR alignment
```

Do not store copyrighted content unless explicit licensing exists.

The reference system is for curriculum alignment and metadata.

---

# 26. Database Design

Use MongoDB.

Design a clean schema/model architecture.

Potential collections:

```text
users
levels
modules
lessons
vocabulary
grammarTopics
readingExercises
listeningExercises
speakingExercises
writingExercises
questions
exams
examAttempts
userProgress
userVocabulary
lessonAttempts
references
```

Do not create unnecessary collections.

Choose the final structure based on actual access patterns.

Use indexes where appropriate.

Avoid unbounded embedded documents where they will create future scaling problems.

---

# 27. Authentication & Authorization

Implement production-ready authentication if the project does not already have it.

Roles should at minimum support:

```text
USER
ADMIN
```

Protect:

- admin routes
- admin APIs
- content mutation
- exam configuration
- user data

Never rely only on client-side role checks.

Authorization must be enforced server-side.

---

# 28. Security

Treat the application as production software.

Consider:

- authentication security
- authorization
- input validation
- server-side validation
- MongoDB query safety
- rate limiting where appropriate without Redis
- secure cookies/session handling
- CSRF considerations where applicable
- XSS prevention
- file upload validation
- audio upload validation
- authorization on media/resources
- sensitive environment variables
- error handling
- logging

Do not expose secrets to the client.

---

# 29. File / Audio Architecture

The application should not hardcode audio files directly into components.

Create a media abstraction.

For example:

```text
AudioAsset
MediaAsset
```

The application should reference media through stable IDs/URLs.

Prepare the architecture so storage can later be changed without rewriting the lesson/exercise system.

Do not add MinIO/S3 unless explicitly requested.

---

# 30. UI / UX

Use Tailwind CSS.

The UI should feel like a real commercial learning platform.

Priorities:

- clean
- accessible
- responsive
- mobile friendly
- desktop friendly
- fast
- clear learning hierarchy
- strong German-language typography
- obvious audio controls
- clear progress states
- minimal cognitive overload

Do not create unnecessary visual complexity.

---

# 31. German Language UX

The platform should support German characters correctly:

```text
ä
ö
ü
Ä
Ö
Ü
ß
```

Store and render Unicode safely.

Content may include:

```text
Deutsch
English
Bangla
```

depending on future requirements.

Do not assume English-only content architecture.

---

# 32. Performance

Build with production performance in mind.

Consider:

- Server Components where appropriate
- Client Components only when interaction requires them
- optimized data fetching
- pagination for admin/content lists
- MongoDB indexes
- lazy loading
- audio loading optimization
- image optimization
- avoiding unnecessary client-side state
- caching where safe

Do not introduce Redis.

Do not introduce unnecessary state-management libraries.

---

# 33. Accessibility

The application should support:

- keyboard navigation
- semantic HTML
- labels
- accessible buttons
- focus states
- sufficient contrast
- audio controls accessible to keyboard/screen-reader users
- form validation feedback

---

# 34. Architecture Principles

Maintain clear separation between:

```text
UI
↓
Application logic
↓
Server/API
↓
Database
```

Even though frontend and backend live in the same Next.js project.

Do not create a separate backend project.

Avoid putting database queries directly throughout UI components.

Create reusable server-side data/service modules.

---

# 35. No Premature AI Dependency

AI is useful for:

- speaking conversation
- writing feedback
- pronunciation assistance
- personalized explanations

But the core A1 curriculum must work without requiring an AI provider.

Design interfaces/services so AI providers can be added later.

Do not hardcode one AI provider deeply into the learning domain.

---

# 36. Content Quality

Do not generate large quantities of low-quality placeholder German content just to make the application appear complete.

For implemented A1 content:

- German must be grammatically correct.
- Articles must be correct.
- Plurals must be correct.
- Examples must be natural.
- Audio scripts must sound natural.
- Exercises must have unambiguous answers.
- Difficulty must be appropriate for A1.
- English/Bangla explanations must not introduce incorrect German concepts.

When uncertain, flag the content for review instead of inventing confidence.

---

# 37. Goethe Model Exam PDF

A Goethe model exam PDF may be provided separately.

If the PDF is available in the project:

1. Inspect it carefully.
2. Extract its exam structure.
3. Identify sections.
4. Identify task types.
5. Identify timing.
6. Identify scoring structure where documented.
7. Identify skill expectations.
8. Use it to inform our exam architecture and curriculum mapping.

Do NOT copy the PDF's copyrighted questions, audio, images, or text into the application unless explicit rights/licensing are provided.

Use it as a reference for:

- exam structure
- competency mapping
- task patterns
- difficulty analysis
- preparation strategy

Clearly distinguish:
- official exam information
- our original practice material
- our internal curriculum.

---

# 38. Development Workflow

Before coding:

1. Audit the project.
2. Inspect existing architecture.
3. Identify reusable components.
4. Identify missing infrastructure.
5. Propose the target architecture.
6. Propose database model.
7. Propose A1 curriculum structure.
8. Identify risks and ambiguities.

Then provide a concise implementation plan.

Do NOT perform a huge rewrite without approval.

After the architecture is approved, implement in logical phases.

---

# 39. Suggested Implementation Phases

### Phase 0
Existing project audit + architecture

### Phase 1
Foundation:

- database
- authentication
- roles
- base layout
- content model
- level/module/lesson structure

### Phase 2
A1 curriculum/content engine:

- lessons
- vocabulary
- grammar
- reading
- listening
- exercises
- progress

### Phase 3
Speaking + writing infrastructure

### Phase 4
Mock exams

### Phase 5
A1 final exam

### Phase 6
Admin CMS

### Phase 7
Production hardening:

- validation
- security
- performance
- accessibility
- error handling
- tests
- responsive QA

Adjust phase boundaries based on the existing project after audit.

---

# 40. Testing

Do not consider a feature complete because the UI renders.

Test:

### Unit
Core business logic.

### Integration
Database + server/API behavior.

### E2E
Critical user journeys.

At minimum:

```text
Register/login
↓
Start A1
↓
Open lesson
↓
Complete exercises
↓
Progress updates
↓
Take mock exam
↓
Submit exam
↓
View results
```

Also test:

```text
Admin login
↓
Create content
↓
Publish
↓
User sees content
```

And authorization:

```text
USER cannot mutate admin content
```

---

# 41. Production Readiness Checklist

Before declaring production-ready, verify:

- No TypeScript introduced
- No Redis
- No Docker
- No separate backend
- No unnecessary dependencies
- MongoDB indexes
- secure authentication
- server-side authorization
- validation
- error states
- loading states
- empty states
- responsive UI
- accessibility
- audio failure handling
- exam submission safety
- duplicate submission protection
- progress consistency
- database error handling
- environment configuration
- production build
- lint
- tests

---

# 42. Important Product Rule

Do NOT optimize for:

> "How many features can we build?"

Optimize for:

> "Can a real learner successfully learn A1 German using this application?"

Every feature should support that goal.

---

# 43. Final Deliverables

At the end of implementation, provide:

1. Architecture summary
2. Database/schema summary
3. A1 curriculum structure
4. Implemented features
5. Partially implemented features
6. Remaining features
7. Security considerations
8. Testing status
9. Production-readiness status
10. Known limitations
11. Recommended next phase for A2

Also update project documentation/changelog/task tracking if those files already exist.

---

# 44. Critical Constraints Summary

Remember:

```text
Next.js
JavaScript only
Tailwind CSS
MongoDB

NO TypeScript
NO Redis
NO Docker
NO separate backend

Existing Next.js project
↓
Frontend + Backend in same application
↓
A1 first
↓
Architecture ready for A2-C2
↓
Goethe-aligned
↓
Netzwerk neu reference mapping
↓
Grammatik aktiv reference mapping
↓
Original learning content
↓
Production-ready
```

Start by auditing the existing project.

Do not start by implementing UI blindly.

After the audit, report:

- current architecture
- reusable pieces
- problems
- proposed architecture
- proposed MongoDB models
- proposed A1 curriculum structure
- implementation phases

Then wait for approval before making large architectural changes.