#! /bin/sh

echo "" > result.log

for file in temp/*
do
  echo "checking $file"
  echo "checking: $file" >> result.log
  node index.js $file 2>> result.log
done
echo "Done"
