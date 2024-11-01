#!/bin/bash

tmpDir="/tmp/wpdev.gettext.cache"
sourceDir="$(dirname $0)"
targetLocales="de_DE"
filelistFile="$tmpDir/files.txt"

[ -d $tmpDir ] && rm -rf $tmpDir
mkdir -p $tmpDir

for loc in $targetLocales; do
    find $sourceDir -type f -iname "*.php" > $filelistFile
    cp $sourceDir/tixys-$loc.po $tmpDir/messages.po
    echo -n '' > $tmpDir/new.po

    xgettext --from-code=utf-8 --keyword=__ --keyword=_e --keyword="_n:1,2" --keyword="_x:2c,1" --language=PHP -j -o $tmpDir/new.po -f $filelistFile
    msgmerge -F -N --no-wrap -o $tmpDir/messages.po $tmpDir/messages.po $tmpDir/new.po 2>/dev/null

    cp $tmpDir/messages.po $sourceDir/tixys-$loc.po
    msgfmt --statistics -vco $sourceDir/tixys-$loc.mo $sourceDir/tixys-$loc.po
done

rm -r $tmpDir
