#!/bin/bash
set -e

# Compile editor/index.ts into build/editor/index.js and dependencies
npx tsc -p scripts/tsconfig_editor.json

# Bundle build/editor/index.js and dependencies into bundle/mybox_editor.js
npx rollup build/editor/index.js \
	--file bundle/mybox_editor.js \
	--format iife \
	--output.name mybox \
	--context exports \
	--sourcemap \
	--plugin rollup-plugin-sourcemaps \
	--plugin @rollup/plugin-node-resolve

# Minify bundle/mybox_editor.js into bundle/mybox_editor.min.js
npx terser \
	bundle/mybox_editor.js \
	--source-map "content='bundle/mybox_editor.js.map',url=mybox_editor.min.js.map" \
	-o bundle/mybox_editor.min.js \
	--compress \
	--mangle \
	--mangle-props regex="/^_.+/;"

# Copy the bundled and minified code into the website folder
cp -r bundle/. website/

# Combine the html and js into a single file for the offline version
sed \
	-e '/INSERT_MYBOX_SOURCE_HERE/{r website/mybox_editor.min.js' -e 'd' -e '}' \
	website/mybox_offline_template.html \
	> website/mybox_offline.html
