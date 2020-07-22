# Helios-Tipbot

# Requirements
Helios tipbot 1.0+ requires the following:
* A unix environment (Linux or WSL)
* PostgreSQL v10
* A Redis Server/Database
* NodeJS 10.18.1

# Installing basic dependencies
```
sudo apt update
sudo apt-get install postgresql-10
sudo apt install git
sudo apt install g++
sudo apt install build-essential
sudo apt install curl
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
```
Reopen the terminal
```
nvm install 10.18.1
```

Check your node version
```
node -v 
```

# Installing the redis server
```
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install redis-server
sudo systemctl enable redis-server.service
```

Verify the connection
```
$ redis-cli

127.0.0.1:6379> ping
PONG
127.0.0.1:6379>
```

# Configuring Postgres Database

```
su - postgres
psql
ALTER USE postgres createdb
CREATE DATABASE db_helios_tipbot;
```

Check database with \list command and exit with \q and press ENTER

# Clone repo

Go to home directory
```
cd home/ 
git clone https://github.com/codeBrice/helios-tipbot.git
cd helios-tipbot
npm install --save
npm install pm2 -g
```

# Configuring Enviroments
.env.databases.json
```
cd home/
cd helios-tipbot/
nano .env.databases.json
```

Basic configuration
```
{
    "username": "postgres",
    "password": "set_password",
    "database": "db_helios_tipbot",
    "host": "localhost",
    "dialect": "postgres",
    "operatorsAliases": 0,
    "seederStorage": "sequelize",
    "logging": 0
}
```

.env
```
cd home/
cd helios-tipbot/
nano .env
```

```
TOKENBOT = your discord token
ENCRYPT_KEYSTORE = encrypt keystore
REDISPASS = 
ALIASCOMMAND = ALIASCOMMAND FOR BOT (. , ! $ etc)
MINTIP = min amount tip
MAXTIP = max amount tip
GAS = 21000
RAIN_MIN_ACTIVE_COUNT = rain min active 
RAIN_MSG_REQUIREMENT = min count message to user active
MIN_RAIN = min amount rain
MAX_RAIN = max amount rain
```

# Execute migrations

```
npx sequelize-cli db:migrate
```

# Execute the bot

```
pm2 start index.js
```

Installing these requirements is dependent on your operating system, you should be able to find out how to install them quickly with a simple google search.
