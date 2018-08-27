#!/bin/bash
TO="contact@raphael-jolivet.name"
DB_NAME=codata
OUT_FOLDER=/tmp

mongodump -db $DB_NAME -o $OUT_FOLDER
cd $OUT_FOLDER/$DB_NAME
tar cvzf $OUT_FOLDER/$DB_NAME.tar.gz *

