## Wiki lists

**Wiki lists** is a wep app for collaborative edition of structured data. 

The goal is to provide non-tech people a simple mean for creating, editing and viewing databases.

## Setup instructions

    > npm install  
    
    > npm run build
    
    > npm run server

This launches the server on [http://localhost:8000](http://localhost:8000)

Go to this URL and create your first collection.

## Env variables 

The following environnement variable can be set on command line or via a **.env** file

* **SECRET** : **mandatory** secret salt key (any text) used for encryption
* **PORT** port of the server, 8000 by default
* **DB_HOST** host of mongo, localhost by default
* **DB_PORT** port of mongo, 27017 by default 
* **DB_NAME** name of the DB, 'wikilist' by default
* **BASE_URL** Full base url of the service (for emails) : **https://host/**
* **SMTP_HOST** SMTP HOST
* **SMTP_PORT** SMTP port
* **SMTP_LOGIN** SMTP login
* **SMTP_PASS** SMTP password
* **SMTP_FROM** Email in 'from'
* **SMTP_SECURE** Use TLS : false by default
* **SMTP_REJECT_UNAUTHORIZED** ignore errors on certficate check (may help with self-signed or some email provider certificates)


## Deploy on prod

For deployment on prod you may use a node process manager like [pm2](https://pm2.keymetrics.io/)
    > pm2 start bin/server
    
And then, use your prefered HTTP server as reverse proxy.
  
  

