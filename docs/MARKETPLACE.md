# Marketplace publication checklist

Auraloom is packaged as a Spicetify Custom App. Marketplace discovery is driven by a public GitHub repository, its metadata manifest and the spicetify-apps GitHub topic.

## Before publishing

1. Make the GitHub repository public.
2. Add the GitHub topic spicetify-apps.
3. Keep manifest.json at the repository root. Its name, description, preview and readme fields are filled in for Marketplace discovery.
4. Keep assets/editor.png in the repository so the Marketplace card has a preview.
5. Push main and wait for the Marketplace indexer to discover the repository.

The Marketplace entry lets people discover Auraloom, but Spicetify Custom Apps still require the normal local spicetify apply step after installation.

## Release checklist

Run npm run check, then npm run build:release, tag v1.1.0 and push the tag.

dist/hudbacastum/ is a ready-to-copy Custom App folder.
