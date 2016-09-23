# openmoney-api

The Openmoney API is a domain driven model of stewards, namespaces, currencies, accounts, and journals.
Stewards are the patrons of these namespaces, currencies, accounts and journals.

#Install

- Go to [couchbase downloads](http://www.couchbase.com/nosql-databases/downloads) and install the latest couchbase community server.
or install using the command line:
```sh
wget http://packages.couchbase.com/releases/3.1.3/couchbase-server-community_3.1.3-ubuntu12.04_amd64.deb
sudo dpkg -i couchbase-server-community_3.1.3-ubuntu12.04_amd64.deb
```
goto: http://localhost:8091 and follow installation instructions. remember to keep free memory for new buckets.
- Change Administrator and password in export commands below for your couchbase server administrator credentials.
```sh
git clone https://github.com/deefactorial/openmoney-api.git
cd openmoney-api
export COUCHBASE_ADMIN_USERNAME=Administrator
export COUCHBASE_ADMIN_PASSWORD=password
npm install
```

#Run

```sh

npm start
#Control-C to quit
sudo npm install pm2 -g
pm2 start app.js --name "openmoney-api"
```

#Test

```sh

mocha

```

#Documentation

https://cloud.openmoney.cc/docs/
