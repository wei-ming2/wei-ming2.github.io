# Foo Wei Ming — personal site

A buildless personal portfolio using HTML, CSS, and JavaScript. Edit the files in
`dist/` directly; no package installation or build step is needed.

## Project structure

```text
personal-site/
├── README.md
├── .gitignore
└── dist/
    ├── index.html
    ├── style.css
    ├── app.js
    └── images/
        └── icon.svg
```

`dist/` contains the complete website. `README.md` documents it. `.gitignore`
keeps local tooling and deployment files out of your GitHub repository.

## Images

Add photos, screenshots, and other image assets to `dist/images/`. Keep image
references relative so the site also works when hosted below a repository path:

```html
<img src="images/profile.jpg" alt="Foo Wei Ming" />
```

The favicon already uses `images/icon.svg`. CSS image references can use the same
`images/filename` path because `style.css` is also inside `dist/`.

## Preview locally

From the project root:

```sh
python3 -m http.server 4173 --directory dist
```

Open `http://localhost:4173`. For hosting, use `dist/` as the publish directory.

## Files to push

Include `dist/`, `README.md`, and `.gitignore`. The ignore rules keep all other
root files and folders local. There is no need to push `node_modules`, build
configuration, or Sites deployment metadata.

The local `.site-workspace/` folder retains the existing hosted site's separate
checkout and deployment configuration. It is ignored by the GitHub-facing
project. The root `dist/` folder is the source to edit; the local hosting copy is
synchronized for Sites publication with:

```sh
node .site-workspace/sync-source.mjs
```

## Content

Profile, education, experience, AlphaReGen, leadership, skills, and contact details
are populated from the supplied résumé. All four original sample projects and
three articles are retained and labeled as placeholders wherever the résumé did
not provide replacements.

The site includes interactive project previews, project filtering, reading
panels, a print-friendly résumé, and email copy. Fonts load from Google Fonts
with local fallbacks.
