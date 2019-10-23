#!/bin/bash
rsync -av $@ -e ssh bin node_modules dist root@vigibati:/var/www/html
