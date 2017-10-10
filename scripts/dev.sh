#!/bin/bash

set -e

SOURCE=src
DIST=build
RESOURCES=assets

export NODE_ENV=development

if [ -d "$DIST" ]; then rm -Rf $DIST; fi

# RESOURCES
mkdir -p $DIST
cp -r $SOURCE/$RESOURCES $DIST/$RESOURCES

# HTML 
cp $SOURCE/web/index.html $DIST
cp $SOURCE/web/favicon.ico $DIST
cp $SOURCE/web/sitemap.xml $DIST
cp $SOURCE/web/robots.txt $DIST

webpack --config ./config/webpack.development.config.js -p --bail