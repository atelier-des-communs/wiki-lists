## Wiki list 

**Daadle** is a wep app for collaborative edition of structured data. 

The goal is to provide non-tech people a simple mean for creating, editing and viewing databases.

## Setup instructions

    > npm install  
    
    > npm run build
    
    > npm run server

This launches the server on [http://localhost:8000](http://localhost:8000)

Go to this URL and create your first collection.

## Variables 

The following env vars can be set on command line or via a **.env** file

* **PORT** port of the server, 8000 by default
* **DB_HOST** host of mongo, localhost by default
* **DB_PORT** port of mongo, 27017 by default 
* **DB_NAME** name of the DB, 'daddle' by default

