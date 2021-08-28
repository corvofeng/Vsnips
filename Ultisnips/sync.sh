#!/bin/bash

# Copy from: https://github.com/honza/vim-snippets

DB_AWS_ZONE=(
	'all'
    'python'
    'lua'
    'javascript'
    'c'
    'cpp'
    'lua'
    'tex'
)
ULTISNIPS_URL=https://raw.githubusercontent.com/honza/vim-snippets/master/UltiSnips
 
for zone in "${DB_AWS_ZONE[@]}"
do
    wget -nv $ULTISNIPS_URL/$zone.snippets -O $zone.snippets 
done