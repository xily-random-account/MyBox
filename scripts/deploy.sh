#!/bin/bash

npm run build

gcloud app deploy --project mybox-synth website/app.yaml
