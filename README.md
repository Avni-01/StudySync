# StudySync: Smart Study Group Matcher

StudySync is a web platform that helps students find compatible study partners
and manage study groups, instead of relying on scattered WhatsApp groups and
personal contacts. Built as a DBMS course project at VIT Vellore.

## Features
- Secure registration & login (JWT + bcrypt password hashing)
- Student profile, subjects, study preferences and weekly availability
- Study partner recommendations using a weighted compatibility score
- Connection requests, one-to-one chat and notifications
- Study groups: create, join requests, invites, members, shared resources
- Session scheduling, attendance tracking, ratings and feedback

## Matching Algorithm
Compatibility Score = Subjects 40% + Availability overlap 30% + Study style 15%
+ Study goal 10% + Location 5%.
Students are scored, sorted, and shown as ranked recommendations. No training
data is needed, so it works for brand-new users.

## Tech Stack
| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React (Vite)                  |
| Backend  | Node.js, Express (REST APIs)  |
| Database | MySQL (normalized schema)     |
| Auth     | JWT, bcrypt                   |

## Database
20+ relational tables, including Student, StudentProfile, Subjects,
StudentSubjects (M:N), Preferences, Availability, Recommendation,
ConnectionRequests, Chats, Messages, StudyGroup, GroupMembers (M:N),
Sessions, Attendance and Feedback.

## Getting Started
### Backend
cd studysync-backend
npm install
# create .env with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT=5000
npm start

### Frontend
cd studysync-frontend
npm install
npm run dev

## Performance
GET /api/preferences/:id averaged ~11.37 ms over 5 trials (local, Chrome DevTools).

