#!/bin/sh
ls
npm run build
npm install
npm run test:cover
