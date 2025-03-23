#!/bin/sh

root=$(realpath $0)
root=${root%/*/*}
tmp=${root}/tmp

test -d "${tmp}" && rm -rf "${tmp}"
mkdir "${tmp}"
cd "${tmp}"

wget "https://github.com/porshenlai/Piers.js/archive/refs/heads/main.zip"
unzip main.zip
test -d "${root}/docs/piers" && rm -rf ${root}/docs/piers/
test -d "${root}/docs/piers" || mkdir ${root}/docs/piers/
mv Piers.js-main/js/* ${root}/docs/piers/
rm -rf "${tmp}"
