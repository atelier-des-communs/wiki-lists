#!/bin/bash
rsync -av $@ --exclude-from .rsyncignore -e ssh bin node_modules dist root@vigibati:/var/www/html
