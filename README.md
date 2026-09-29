# Missio

## Personal Execution & Mission System

Missio is a personal execution system designed to turn goals into specific actions that can be executed immediately.

Instead of simply telling a user what they should achieve, Missio continuously answers:

> "What should I do right now?"

The system reduces decision-making and turns a high-level goal into a personalized sequence of executable missions.

---

## Core Idea

Missio follows this execution loop:

    Goal
      ↓
    Personalized Plan
      ↓
    Mission Generation
      ↓
    Ready-to-Execute Mission
      ↓
    Action
      ↓
    Verification
      ↓
    Progress
      ↓
    Adaptive Replanning
      ↓
    Next Mission

The important part is that Missio does not stop at planning.

It converts the plan into a concrete mission that the user can immediately execute.

---

## The Problem

Most productivity and learning applications tell users what they should achieve, but still leave the user responsible for deciding the actual next action.

For example, a user may have the goal:

    Prepare for software engineering interviews

A traditional application may show:

    Study DSA
    Study DBMS
    Study OS
    Practice SQL
    Practice Aptitude

But the user still has to decide:

    What should I study?
    Which topic?
    Which problem?
    What difficulty?
    How long should I spend?
    What should I do if I have less time today?
    What should I do tomorrow?

Missio removes this decision burden.

It transforms the goal into an executable mission.

---

## Product Vision

Missio is designed as a general-purpose Personal Execution & Mission System.

The same execution engine can support different goal domains, including:

- DSA
- DBMS
- Operating Systems
- Computer Networks
- OOP
- SQL
- Aptitude
- HR / Project Interview Preparation
- Exercise and Fitness

The domains provide their own curated content, while the underlying mission system remains reusable.

    User Goal
        ↓
    Planning Engine
        ↓
    Mission Engine
        ↓
    Domain Content Library
        ↓
    Executable Mission
        ↓
    User Action
        ↓
    Verification
        ↓
    Progress
        ↓
    Adaptive Replanning

---

## Core Mission System

A mission is not simply a task description.

It contains enough information for the user to actually perform the task.

A mission can include:

- What to do
- How long to spend
- Difficulty
- Ordered steps
- Expected outcome
- Verification method
- Completion state

### Mission Variants

Missio supports different execution levels.

### Ideal

The complete version of the planned mission.

Example:

    Solve 3 DSA problems
    45 minutes
    Review mistakes

### Minimum

A reduced version when the user has limited time or energy.

Example:

    Solve 1 DSA problem
    15 minutes

### Rescue

The smallest useful action that keeps the user moving forward.

Example:

    Read the problem
    Identify the approach
    Write the first step

The goal is to prevent an imperfect day from becoming a completely lost day.

---

## Execution Mode

Missio provides an execution-oriented flow instead of requiring the user to repeatedly navigate through planning screens.

A mission can be executed step by step.

    Mission
       ↓
    Step 1
       ↓
    Step 2
       ↓
    Step 3
       ↓
    Verification
       ↓
    Completed

This makes the application focused on execution rather than passive tracking.

---

## Adaptive Planning

Missio uses progress and execution history to adjust future missions.

The planner can consider factors such as:

- User goal
- Available time
- Difficulty
- Previous missions
- Completion history
- Current progress
- Topic rotation
- Prerequisites
- Check-in information

For example:

    Normal day
        ↓
    Ideal Mission

    Limited time
        ↓
    Minimum Mission

    Very low capacity
        ↓
    Rescue Mission

The result of the current mission can influence what the system generates next.

---

## AI Usage

AI is used as an assistance layer, not as the source of learning content.

The content comes from curated domain libraries.

    Curated Content
          ↓
    Mission Engine selects content
          ↓
    AI packages / personalizes mission
          ↓
    User executes mission

AI can help with:

- Mission wording
- Personalization
- Structuring instructions
- Packaging selected content
- Adapting presentation to the user's context

AI should not invent:

- DSA problems
- SQL questions
- Exercises
- Interview questions
- Learning content

This keeps the system predictable and allows the content libraries to remain controlled.

A deterministic fallback is also used when AI is unavailable.

---

## Architecture

Missio follows a simple full-stack architecture.

    React + Vite
          │
          │ REST API
          ↓
    Node.js + Express
          │
          ├── Authentication
          ├── Planning
          ├── Mission Generation
          ├── Progress Engine
          ├── Adaptive Planner
          ├── Check-ins
          └── AI Assistance
          │
          ↓
    Repository Layer
          │
          ├── User Repository
          ├── Content Repository
          ├── Mission Repository
          ├── Plan Repository
          ├── Progress Repository
          └── Check-in Repository
          │
          ↓
    Persistence
          │
          ├── Local JSON Store
          └── MongoDB / Mongoose

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Node.js
- Express.js
- REST APIs

### Database / Persistence

- MongoDB
- Mongoose
- Repository abstraction
- Local JSON persistence for development and testing

### Authentication

- JWT
- bcrypt

### AI

- Anthropic API integration
- Deterministic fallback when AI is unavailable

---

## Project Structure

    missio/
    │
    ├── client/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── pages/
    │   │   ├── api/
    │   │   ├── App.jsx
    │   │   └── main.jsx
    │   ├── public/
    │   └── package.json
    │
    ├── server/
    │   ├── seed/
    │   └── src/
    │       ├── ai/
    │       ├── db/
    │       ├── middleware/
    │       ├── repositories/
    │       ├── routes/
    │       └── services/
    │           ├── adaptivePlanner/
    │           ├── contentLibrary/
    │           ├── missionGenerator/
    │           └── progressEngine/
    │
    ├── e2e/
    │
    ├── README.md
    └── package.json

---

## Main Backend Components

### Content Library

Provides curated domain-specific content.

    DSA
    DBMS
    OS
    CN
    OOP
    SQL
    Aptitude
    HR / Project
    Exercise

The mission engine should not need to know the internal details of every domain.

### Mission Generator

Converts selected content into an executable mission.

    Goal + Content + Constraints
                ↓
         Mission Generator
                ↓
        Executable Mission

It also supports different mission variants such as Ideal, Minimum, and Rescue.

### Adaptive Planner

Uses execution history and user context to determine what should happen next.

    Previous Result
          ↓
    Adaptive Planner
          ↓
    Updated Plan
          ↓
    Next Mission

The adaptive logic is intentionally rule-based rather than relying on a black-box ML system.

### Progress Engine

Tracks execution and progress over time.

Progress is not simply:

    Task completed = +1

The system can use completed missions, topics, and history to influence future planning.

### Check-ins

Check-ins provide additional context that can affect planning.

Examples include:

- Available time
- Energy / capacity
- Daily conditions

The planner can use this information when generating subsequent missions.

---

## Authentication

Missio uses JWT and bcrypt for authentication and password protection.

The main user flow is:

    Signup
       ↓
    Login
       ↓
    Onboarding
       ↓
    Personalized Plan
       ↓
    Today's Missions
       ↓
    Execution
       ↓
    Progress

---

## End-to-End User Flow

A typical user journey is:

    1. Create account
           ↓
    2. Complete onboarding
           ↓
    3. Define a goal
           ↓
    4. Missio creates a personalized plan
           ↓
    5. Mission is generated
           ↓
    6. User enters Execution Mode
           ↓
    7. User completes mission steps
           ↓
    8. Mission is verified
           ↓
    9. Progress is recorded
           ↓
    10. Adaptive planner updates future planning
           ↓
    11. Next mission is generated

The user should not need to repeatedly decide what to do next.

---

## Design Principle

The central design principle of Missio is:

> Reduce decision-making and increase execution.

Instead of:

    Goal → List of Things → User Decides

Missio aims for:

    Goal → Plan → Mission → Execute → Verify → Adapt

---

## Development Philosophy

Missio intentionally avoids unnecessary complexity.

The system does not require:

- Microservices
- Complex ML pipelines
- Autonomous agents
- Large orchestration frameworks
- Over-engineered infrastructure

The focus is on building a reliable execution loop using:

- A reusable mission engine
- Curated content
- Rule-based adaptation
- Lightweight AI assistance
- Simple backend architecture

---

## Current Implementation

The project contains the core execution architecture, including:

- React + Vite frontend
- Express backend
- Authentication
- Repository abstraction
- Content library
- Mission generation
- Ideal / Minimum / Rescue missions
- Execution flow
- Progress tracking
- Check-ins
- Adaptive planning
- AI-assisted mission packaging
- Deterministic fallback
- End-to-end browser testing

The architecture is being generalized so that the mission engine is not tied to a single domain.

---

## Local Development

### Install dependencies

From the project root:

    npm install

Install frontend dependencies:

    cd client
    npm install

Install backend dependencies:

    cd ../server
    npm install

### Environment

Configure the required environment variables using:

    server/.env.example

The application can use local persistence during development when MongoDB is unavailable.

---

## Running the Application

Start the backend:

    cd server
    npm run dev

Start the frontend:

    cd client
    npm run dev

The frontend communicates with the Express backend through REST APIs.

---

## Testing

Missio includes end-to-end testing for the main execution journey.

The testing flow covers:

    Signup
       ↓
    Onboarding
       ↓
    Mission generation
       ↓
    Mission execution
       ↓
    Mission completion
       ↓
    Progress update
       ↓
    Check-in
       ↓
    Adaptive replanning
       ↓
    Next mission

The objective is to verify the complete product loop rather than testing isolated screens only.

---

## Future Extensions

The architecture allows additional capabilities to be added without changing the fundamental mission model.

Potential extensions include:

- Calendar integration
- Push notifications
- Browser extension
- Wearable integration
- Additional goal domains
- More advanced personalization
- Production MongoDB deployment
- Additional content libraries

These are extensions of the core execution system rather than separate products.

---

## Vision

Missio aims to become a system where a user can define a meaningful goal and stop worrying about repeatedly deciding what to do next.

For example:

    "I want to prepare for software engineering interviews."

Instead of presenting only a list of subjects, Missio should turn that goal into:

    Personalized Plan
          ↓
    Today's Mission
          ↓
    Execution
          ↓
    Verification
          ↓
    Progress
          ↓
    Adaptive Next Mission

The long-term goal is simple:

> Missio turns goals into actions and continuously adapts what the user should execute next.
