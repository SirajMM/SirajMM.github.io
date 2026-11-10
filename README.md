# sirajmm.github.io

Portfolio of Muhammad Siraj M M, Flutter developer. Live at https://sirajmm.github.io/.

Plain HTML, CSS and JavaScript with no build step. GitHub Pages serves the `master` branch root.

```
index.html      all content and SEO metadata
css/glass.css   design tokens, glass surfaces, layout, motion
js/glass.js     counter loader, bokeh background, spark cursor, flying project grid, hanging photo, project sheet, contact form
demo/           built Flutter Web app that runs inside the Live demo project sheet on request
flutter_demo/   source of that app; rebuild with the command below
fonts/          Archivo variable (SIL Open Font License)
img/            optimized WebP/JPEG screenshots, social image
```

Preview locally with `python3 -m http.server` in this folder.

To rebuild the live demo after changing `flutter_demo/lib/main.dart`:

```
cd flutter_demo
flutter build web --release --no-web-resources-cdn --pwa-strategy=none --no-source-maps
```

Then copy `build/web/main.dart.js` and `flutter_bootstrap.js` into `demo/`.

The previous Flutter Web version lives in `SirajMM/portfolio_webapp_flutter_full_code`. Its deploy workflow now runs only when triggered manually, because a run force-pushes over this repository.
