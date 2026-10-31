{\rtf1\ansi\ansicpg1252\cocoartf2868
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # AGENTS.md\
\
## Project\
This project is an MVP for an engineering knowledge continuity app.\
\
The problem:\
Engineering firms with ageing workforces are at risk of losing critical technician knowledge through retirement and attrition. The app must preserve practical know-how, troubleshooting logic, lessons learned, field observations, and task-specific expertise.\
\
This is not a generic document library. It is an operational memory and knowledge transfer system.\
\
## Core product goals\
- Capture technician knowledge in the flow of work\
- Preserve tacit knowledge, not just formal procedures\
- Make knowledge searchable by asset, system, task, and symptom\
- Support expert interviews and mentoring/shadowing records\
- Separate approved methods from informal field notes\
- Support management visibility of knowledge risk\
- Be simple for practical users, including older non-digital users\
\
## MVP scope\
Build only the MVP first.\
\
Required MVP capabilities:\
- Authentication and role-based access\
- Role-aware dashboard\
- Knowledge record creation and viewing\
- Rich media attachments (design for photo/audio support even if mocked first)\
- Taxonomy: asset / system / task / symptom / environment\
- Search and filters\
- Expert interview workflow\
- Shadowing / mentoring log\
- Review / approval states\
- Version history\
- Basic management dashboard for knowledge risk\
\
## Roles\
- Technician\
- Senior Technician / Expert\
- Supervisor / Team Lead\
- Reviewer / Approver\
- Admin\
\
## Primary record types\
- Job Story\
- Procedure\
- Field Note\
- Failure Pattern\
- Decision Rationale\
- Lesson Learned\
- Expert Interview\
- Shadowing Record\
\
## UX principles\
- Mobile-first\
- Minimal typing\
- Large tap targets\
- Strong contrast\
- Plain English\
- One clear primary action per screen\
- Search accessible from everywhere\
- \'93Capture knowledge\'94 and \'93Show approved method\'94 should be prominent\
- The interface should feel like a technician\'92s assistant, not admin software\
\
## Technical defaults\
Unless a strong reason appears otherwise, use:\
- Next.js\
- TypeScript\
- Tailwind CSS\
- PostgreSQL\
- Prisma\
- Auth.js or Clerk\
- Clean server/client separation\
- Modular feature folders\
- Sensible seed data\
\
## Engineering rules\
- Keep the MVP realistic and buildable\
- Avoid overengineering\
- Avoid microservices\
- Prefer clarity over cleverness\
- Keep files tidy and naming consistent\
- Add comments only where they genuinely help\
- Keep components reusable but do not abstract too early\
- Use strict typing\
- Do not introduce large dependencies without justification\
\
## Delivery expectations\
When implementing:\
1. Explain the plan briefly\
2. Create or update files cleanly\
3. Keep changes scoped to the requested task\
4. Show the file tree for major additions\
5. State how to run the project\
6. State what is complete and what is stubbed\
7. Flag assumptions clearly\
\
## Definition of done for each task\
- App builds successfully\
- No broken imports\
- No placeholder code without marking it clearly\
- UI is coherent and usable\
- Mock data is realistic\
- Naming matches the domain\
- Output is aligned with the product goals above}