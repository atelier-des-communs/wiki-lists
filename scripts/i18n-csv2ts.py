#!/usr/bin/python3

import re
import sys

STRUCT_START_REG = re.compile(r".*\b(\w+)\b.*:?.*{\s*$")
KEY_VAL_REG = re.compile(r"\s*\b(\w+)\b\s*:\s*(.*)$")
END_STRUCT= re.compile(r"^\s*}\s*[;,]?$")



# Parse a "JS" like structure, and flatten it into  list of (key.subkey, val)
path = []
def flattenTS(file) :
    for line in file :

        line = line.strip()

        if line.startswith("import"):
            continue

        if line.startswith("//"):
            # Yield comment
            yield line

        # New struct level ? Add it to the path
        match = STRUCT_START_REG.match(line)
        if match :
            path.append(match.group(1))
            continue

        match = END_STRUCT.match(line)
        if match :
            path.pop()
            if len(path) == 0 :
                break
            continue

        match = KEY_VAL_REG.match(line)
        if match:
            key = match.group(1)
            val = match.group(2)
            keys = path + [key]
            val = val.rstrip(",;")
            val = val.strip('"\'')
            yield (".".join(keys[1:]), val)

res = flattenTS(sys.stdin)
for item in res :
    print(item)
