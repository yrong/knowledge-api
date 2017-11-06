#!/usr/bin/env bash

if [ ! -d "config" ]; then
  cd .. && git clone https://git.coding.net/alien11/test.git
  cd knowledge-api
  ln -s ../test/config .
fi
