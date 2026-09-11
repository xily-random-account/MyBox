#!/bin/bash
set -e

# Compile player/index.ts into build/player/index.js and dependencies
npx tsc -p scripts/tsconfig_player.json

# Bundle build/player/index.js and dependencies into bundle/player/mybox_player.js
npx rollup build/player/index.js \
	--file bundle/player/mybox_player.js \
	--format iife \
	--output.name mybox \
	--context exports \
	--sourcemap \
	--plugin rollup-plugin-sourcemaps \
	--plugin @rollup/plugin-node-resolve

# Minify bundle/player/mybox_player.js into bundle/player/mybox_player.min.js
npx terser \
	bundle/player/mybox_player.js \
	--source-map "content='bundle/player/mybox_player.js.map',url=mybox_player.min.js.map" \
	-o bundle/player/mybox_player.min.js \
	--compress \
	--mangle \
	--mangle-props regex="/^_.+/;"

# Copy the bundled and minified code into the website folder
cp -r bundle/. website/
