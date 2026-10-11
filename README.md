# React Web Portal

Responsive React + Vite portal with grouped navigation, per-group icons/colors, menu search, remembered last selected page, and an in-app administration screen.

## Requirements
- Node.js 20 or newer (LTS recommended)
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the URL printed by Vite, usually http://localhost:5173.

## Features
- Remembers the last selected embedded website in browser local storage.
- Search filters menu items by title, description, URL, and group name.
- Use the **Διαχείριση** button to change the app title/subtitle/footer, add or remove groups, change group icon/color, and add/edit/remove websites.
- Settings are stored in local storage in the current browser/device. They are not shared with other users or browsers. Shared, centrally managed settings require a backend/database.
- Group icons use names from `lucide-react`; the admin screen offers a curated list of supported icons and colors.

## Publish on Netlify
1. Unzip the project and put the project folder in a Git repository (GitHub, GitLab, or Bitbucket).
2. Sign in to [Netlify](https://app.netlify.com/) and choose **Add new site → Import an existing project**.
3. Connect the repository and select the branch to deploy.
4. Netlify reads `netlify.toml`; build command is `npm run build`, publish directory is `dist`, and Node.js is set to 20.
5. Click **Deploy site**. After deployment, Netlify provides a public HTTPS URL. You can open it from computers and phones with Internet access.
6. Optional: in **Site configuration → Domain management**, customize the generated `*.netlify.app` domain or connect your own domain.

You can also test the production build locally:
```bash
npm run build
npm run preview
```

## Important notes
- Settings saved in the admin screen are local to each browser. Netlify static hosting does not provide a shared database or server-side settings by itself.
- Some websites block iframe embedding using `X-Frame-Options` or `Content-Security-Policy`. Use **Άνοιγμα σε νέα καρτέλα** for those sites; the app cannot bypass their policy.
- `appData.json` provides the initial/default configuration. Use **Επαναφορά αρχικών** in the administration screen to return to it.
