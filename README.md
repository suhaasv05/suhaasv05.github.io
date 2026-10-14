# Personal Portfolio Website

This is a static portfolio site for Suhaas Vellanki built with plain HTML, CSS, and JavaScript. It is designed to be lightweight and easy to host for free on GitHub Pages.

## Files

- `index.html` – page structure and content
- `styles.css` – theme, layout, animation, and responsive styling
- `script.js` – JSON rendering, theme toggle, scroll progress, reveal animation, and modal behavior
- `data/resume.json` – editable resume and portfolio content

## Edit content

1. Open `data/resume.json` and update the profile, experience, projects, education, skills, field notes, or contact values there.
2. Replace placeholder values such as `[PLACEHOLDER]` with real links, dates, or details when available.
3. Keep the JSON structure intact so `script.js` can render each section correctly.
4. If you want to rename the site or change the mountain labels, adjust the section IDs and the altitude marker navigation in `index.html` and `script.js` together.
5. Update the resume link in `data/resume.json` when the final PDF is ready.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository settings, open the Pages section.
3. Select the branch you want to publish, usually `main`.
4. Choose the root folder (or `/` for a static site) and save.
5. GitHub Pages will generate a live URL for the site.

## Notes

- The project does not require a build step or framework.
- The theme automatically follows the system preference and can be toggled manually.
- The page is optimized for static hosting and should work well on GitHub Pages without additional configuration.
