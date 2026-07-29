# Marketplace publication checklist

Auraloom is packaged as a Spicetify Custom App. Marketplace discovery is driven by a public GitHub repository, its metadata manifest and the `spicetify-apps` GitHub topic.

## Before publishing

1. Make the GitHub repository public.
2. Add the GitHub topic `spicetify-apps`.
3. Keep `manifest.json` at the repository root. Its `name`, `description`, `preview` and `readme` fields are already filled in for Marketplace discovery.
4. Keep `assets/editor.png` in the repository so the Marketplace card has a preview.
5. Push `main` and wait for the Marketplace indexer to discover the repository.

The Marketplace entry lets people discover Auraloom, but Spicetify Custom Apps still require the normal local `spicetify apply` step after installation. This is a Spicetify platform constraint, not an Auraloom limitation.

## Repository release checklist

```sh
npm run check
npm run build:release
git status
git tag v1.1.0
git push --follow-tags
```

`dist/Auraloom/` is a ready-to-copy Custom App folder. It is intentionally ignored by Git because it is reproducible from the tracked source.
