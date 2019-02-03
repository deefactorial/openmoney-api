#!/bin/bash
#uninstallation bash script
sudo docker container stop db
sudo docker container rm db
#
#command to find out if server is still running
netstat -ltnp | grep -w ':8080'
#
#command to kill processID
#kill PID