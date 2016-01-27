# openmoney-api

The Openmoney API is a domain driven model of stewards, namespaces, currencies, accounts, and journals.
Stewards are the patrons of these namespaces, currencies, accounts and journals.

#Install

Go to [couchbase downloads](http://www.couchbase.com/nosql-databases/downloads) and install the couchbase server

Setup buckets with the names `oauth2server`, `openmoney_global`, `openmoney_stewards` create a primary index using GSI on the buckets.

```sh

git clone https://github.com/deefactorial/openmoney-api.git
cd openmoney-api
npm install

```

#Run

```sh

node .

```

#Test

```sh

mocha

```

#Documentation

http://127.0.0.1:8080/docs/
