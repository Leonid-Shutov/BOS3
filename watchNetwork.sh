#!/bin/sh

start() {
        rm logs.txt
        forever start -l $PWD/logs.txt index.js
}

stop() {
        forever stop index.js
        networksetup -setairportpower en0 on
}

case "$1" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  *)
    echo "Usage: $0 {start|stop}"
esac
