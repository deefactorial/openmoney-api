# openmoney-api

Openmoney API

The Openmoney API is a domain driven model of stewards, namespaces, currencies, accounts, and journals.
Stewards are the patrons of these accounts, currencies, namespaces and journals.

#Install

Go to [couchbase downloads](http://www.couchbase.com/nosql-databases/downloads) and install the couchbase server

```sh

git clone https://github.com/deefactorial/openmoney-api.git
npm install


```

#Run

```sh

node .
mocha ./test/steward-test.js
https://127.0.0.1:8080/docs/

```
