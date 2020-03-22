#!/bin/bash
#installation bash script
#
#${1} is couchbase database admin username
#${2} is couchbase database admin password
#${3} is couchbase database ip (local private ip ie 192.168.0.15)
#${4} is couchbase database loopback IP
#${5} is openmoney API admin username
#${6} is openmoney API admin password
#${7} is openmoney API admin email
#${8} is openmoney API root namespace
#${9} is openmoney API root currency
#
#example execution:
#./install.sh admin password 127.0.0.1 127.0.0.1 admin password admin@openmoney.network cc cc
#or
#./install.sh
#
#Setting script variables.
COUCHBASE_ADMIN_USERNAME=${1:-admin}
COUCHBASE_ADMIN_PASSWORD=${2:-password}
COUCHBASE_IP=${3:-$(hostname -I | awk 'NR==1{print $1}')}
COUCHBASE_LO=${4:-127.0.0.1}
ADMIN_USERNAME=${5:-admin}
ADMIN_PASSWORD=${6:-password}
ADMIN_EMAIL=${7:-admin@openmoney.network}
ROOT_SPACE=${8:-cc}
ROOT_CURRENCY=${9:-cc}
#
#set the environment variables for the node scripts
cat <<- EOF > ./.env
COUCHBASE_ADMIN_USERNAME=$COUCHBASE_ADMIN_USERNAME
COUCHBASE_ADMIN_PASSWORD=$COUCHBASE_ADMIN_PASSWORD
COUCHBASE_IP=$COUCHBASE_IP
COUCHBASE_LO=$COUCHBASE_LO
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_EMAIL=$ADMIN_EMAIL
ROOT_SPACE=$ROOT_SPACE
ROOT_CURRENCY=$ROOT_CURRENCY
EOF
#output the status of script variables so you know what your values are
cat .env
#
#install dependency applications
sudo apt-get update
sudo apt-get install -y npm net-tools apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce
curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -
sudo apt-get install -y nodejs
sudo npm install -g n
sudo n 8.11.3
#
#pull the couchbase database docker container
sudo docker pull couchbase:community-4.5.0
#
#run the docker container
sudo docker run -dit --restart unless-stopped -d --name db -p 8091-8094:8091-8094 -p 11210:11210 couchbase:community-4.5.0
#
#Wait for it
sleep 20s
#
#setup the couchbase server installation and buckets
curl -f -w '\n%{http_code}\n' -X POST http://localhost:8091/nodes/self/controller/settings -H 'Content-Type: application/x-www-form-urlencoded' -d 'path=%2Fopt%2Fcouchbase%2Fvar%2Flib%2Fcouchbase%2Fdata&index_path=%2Fopt%2Fcouchbase%2Fvar%2Flib%2Fcouchbase%2Fdata'
curl -f -w '\n%{http_code}\n' -X POST http://localhost:8091/pools/default -H 'Content-Type: application/x-www-form-urlencoded' -d memoryQuota=2048
curl -f -w '\n%{http_code}\n' -X POST http://localhost:8091/settings/stats -H 'Content-Type: application/x-www-form-urlencoded' -d sendStats=false
curl -f -w '\n%{http_code}\n' -X POST http://localhost:8091/settings/web -H 'Content-Type: application/x-www-form-urlencoded' -d "password=${COUCHBASE_ADMIN_PASSWORD}&username=${COUCHBASE_ADMIN_USERNAME}&port=SAME"
curl -c /tmp/cookie -w '\n%{http_code}\n' -f -X POST http://localhost:8091/uilogin -H 'Content-Type: application/x-www-form-urlencoded' -d "user=${COUCHBASE_ADMIN_USERNAME}&password=${COUCHBASE_ADMIN_PASSWORD}"
curl -b /tmp/cookie -w '\n%{http_code}\n' 'http://localhost:8091/pools/default/buckets' -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:74.0) Gecko/20100101 Firefox/74.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: en-CA,en-US;q=0.7,en;q=0.3' --compressed -H 'invalid-auth-response: on' -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' -H 'ns-server-ui: yes' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Origin: http://localhost:8091' -H 'Connection: keep-alive' -H 'Referer: http://localhost:8091/ui/index.html' --data 'authType=sasl&autoCompactionDefined=false&bucketType=membase&evictionPolicy=fullEviction&flushEnabled=0&name=default&ramQuotaMB=512&replicaIndex=0&replicaNumber=0&saslPassword=&threadsNumber=3'
curl -b /tmp/cookie -w '\n%{http_code}\n' 'http://localhost:8091/pools/default/buckets' -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:74.0) Gecko/20100101 Firefox/74.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: en-CA,en-US;q=0.7,en;q=0.3' --compressed -H 'invalid-auth-response: on' -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' -H 'ns-server-ui: yes' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Origin: http://localhost:8091' -H 'Connection: keep-alive' -H 'Referer: http://localhost:8091/ui/index.html' --data 'authType=sasl&autoCompactionDefined=false&bucketType=membase&evictionPolicy=fullEviction&flushEnabled=0&name=oauth2Server&ramQuotaMB=512&replicaIndex=0&replicaNumber=0&saslPassword=&threadsNumber=3'
curl -b /tmp/cookie -w '\n%{http_code}\n' 'http://localhost:8091/pools/default/buckets' -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:74.0) Gecko/20100101 Firefox/74.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: en-CA,en-US;q=0.7,en;q=0.3' --compressed -H 'invalid-auth-response: on' -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' -H 'ns-server-ui: yes' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Origin: http://localhost:8091' -H 'Connection: keep-alive' -H 'Referer: http://localhost:8091/ui/index.html' --data 'authType=sasl&autoCompactionDefined=false&bucketType=membase&evictionPolicy=fullEviction&flushEnabled=0&name=openmoney_global&ramQuotaMB=512&replicaIndex=0&replicaNumber=0&saslPassword=&threadsNumber=3'
curl -b /tmp/cookie -w '\n%{http_code}\n' 'http://localhost:8091/pools/default/buckets' -H 'User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:74.0) Gecko/20100101 Firefox/74.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: en-CA,en-US;q=0.7,en;q=0.3' --compressed -H 'invalid-auth-response: on' -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' -H 'ns-server-ui: yes' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' -H 'Origin: http://localhost:8091' -H 'Connection: keep-alive' -H 'Referer: http://localhost:8091/ui/index.html' --data 'authType=sasl&autoCompactionDefined=false&bucketType=membase&evictionPolicy=fullEviction&flushEnabled=0&name=openmoney_stewards&ramQuotaMB=512&replicaIndex=0&replicaNumber=0&saslPassword=&threadsNumber=3'
#
#wait for it
sleep 30s
#
#verify installation was correct
sudo docker run couchbase:community-4.5.0 /bin/sh -c "cd /opt/couchbase/bin; couchbase-cli bucket-list -c ${COUCHBASE_IP} -u ${COUCHBASE_ADMIN_USERNAME} -p ${COUCHBASE_ADMIN_PASSWORD} -d"
#
#install dependencies
npm install
#
#install seed data into couchbase server buckets
npm run install:db
#
#start the server and run in the foreground
npm run start &
#
#wait for it
sleep 7s
#
#run the tests and make sure they pass
npm run test
#
#kill the server
kill -STOP %1
#bring to foreground it it's not dead yet.
fg