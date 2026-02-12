/**
 * Project registry — add new projects here.
 *
 * Each entry should have:
 *   title       - project name
 *   description - short summary (1-2 sentences)
 *   screenshot  - path to a screenshot image (or null for placeholder)
 *   url         - relative link to the project's index.html
 *   tags        - array of short tech/topic labels
 */
const projects = [
  {
    title: "Todo App",
    description:
      "A clean task manager with add, complete, and delete functionality. Persists tasks in localStorage.",
    screenshot: "assets/screenshots/todo-app.png",
    url: "projects/todo-app/index.html",
    tags: ["HTML", "CSS", "JavaScript"],
  },
  {
    title: "AI Fitness & Nutrition Planner",
    description:
      "A Streamlit app that generates personalised weekly workout plans, meal plans, and shopping lists using OpenAI GPT-4o-mini.",
    screenshot: "assets/screenshots/ai-fitness-planner.png",
    url: "https://ai-fitness-planner-pfbqe9yprypbcao6oemcip.streamlit.app/",
    tags: ["Python", "Streamlit", "OpenAI"],
  },
];
