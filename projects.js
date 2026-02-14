/**
 * Project registry — add new projects here.
 *
 * Each entry should have:
 *   title       - project name
 *   description - short summary (1-2 sentences)
 *   screenshot  - path to a screenshot image (or null for placeholder)
 *   url         - relative link to the project's index.html
 *   tags        - array of short tech/topic labels
 *   level       - "Beginner" | "Intermediate" | "Advanced"
 *   highlights  - array of skill/concept callouts shown on the card
 *   github      - URL to the source code on GitHub (or null)
 */
const projects = [
  {
    title: "Todo App",
    description:
      "A clean task manager with add, complete, and delete functionality. Persists tasks in localStorage.",
    screenshot: "assets/screenshots/todo-app.png",
    url: "projects/todo-app/index.html",
    tags: ["HTML", "CSS", "JavaScript"],
    level: "Beginner",
    highlights: ["DOM manipulation", "localStorage persistence", "ARIA accessibility"],
    github: "https://github.com/mylesmellor/portfolio/tree/main/projects/todo-app",
  },
  {
    title: "OpenAI Chatbot Demo",
    description:
      "A streaming chatbot built with FastAPI and the OpenAI Responses API. Supports assistant, strict, and FAQ modes with session memory.",
    screenshot: "assets/screenshots/openai-chatbot.png",
    url: "https://openai-chatbot-demo-9mvg.onrender.com",
    tags: ["Python", "FastAPI", "OpenAI"],
    level: "Intermediate",
    highlights: ["REST API design", "Streaming responses", "Session management", "Cloud deployment"],
    github: "https://github.com/mylesmellor/portfolio/tree/main/projects/openai%20-%20chatbot%20-%20demo",
  },
  {
    title: "AI Fitness & Nutrition Planner",
    description:
      "A Streamlit app that generates personalised weekly workout plans, meal plans, and shopping lists using OpenAI GPT-4o-mini.",
    screenshot: "assets/screenshots/ai-fitness-planner.png",
    url: "https://ai-fitness-planner-pfbqe9yprypbcao6oemcip.streamlit.app/",
    tags: ["Python", "Streamlit", "OpenAI"],
    level: "Intermediate",
    highlights: ["Prompt engineering", "Structured AI output", "Data validation", "CSV data storage"],
    github: "https://github.com/mylesmellor/portfolio/tree/main/projects/ai%20fitness%20planner",
  },
  {
    title: "Pomodoro Timer",
    description:
      "A focused productivity timer with work/break modes, circular progress ring, audio notifications, and session tracking.",
    screenshot: "assets/screenshots/pomodoro-timer.png",
    url: "projects/pomodoro-timer/index.html",
    tags: ["HTML", "CSS", "JavaScript"],
    level: "Beginner",
    highlights: ["SVG animation", "Web Audio API", "State management", "Keyboard shortcuts"],
    github: "https://github.com/mylesmellor/portfolio/tree/main/projects/pomodoro-timer",
  },
];
