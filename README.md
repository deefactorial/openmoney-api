# openmoney-api

The Openmoney API is a domain driven model of stewards, namespaces, currencies, accounts, and journals.
Stewards are the patrons of these namespaces, currencies, accounts and journals.

# Install locally
```sh
git clone https://github.com/deefactorial/openmoney-api
cd openmoney-api
./install.sh
```

# Run locally on port 8080
```sh
npm run start
#Control-C to quit
```

# Run in a background service
```sh
sudo npm install pm2 -g
pm2 start app.js --name "openmoney-api"
```

# Test
```sh
#ensure the server is running locally or in background then run
npm run test
```

# Local Documentation
http://localhost:8080/docs/

# Remote Documentation
https://cloud.openmoney.cc/docs/

# Uninstall
```sh
./uninstall.sh
```

# License

Copyright [2019] [Dominique Legault]

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.