# Symfony Mapbox Place Finder 
Displays a map with amenities from the United Kingdom [Open Street Map](https://en.wikipedia.org/wiki/OpenStreetMap) (OSM) dataset. Allows users to use a map to find local parking/banks etc, view their details and get directions from their current position.

## Table of Contents
  * [Stack](#stack)
  * [Installation](#installation)
  * [Viewing The Map](#viewing-the-map)
  * [Screenshots](#screenshots)


## Stack
- PostGIS
- Symfony 5.1 API
- Webpack + Mapbox-gl frontend


## Installation
##### Run the following from the root of the project folder:  

Build and daemonize the PostGIS server:  
`docker-compose build && docker-compose up -d`

Install PHP packages:  
`composer install`

Get the correct database string for your setup:  
`symfony var:export DATABASE_URL`

Modify DATABASE_URL= in .env to reflect your database config (with the output of the previous command):    
`vim .env`

Install JS packages:  
`yarn install`

Construct the database:  
`symfony console doctrine:migrations:migrate`

Download UK OSM data, filter it, and import it to PostGIS, this will take some time:  
`symfony console app:import:osm` 

Install self-signed cert (required for location data and making API requests to mapbox directions)  
`symfony server:ca:install`

Daemonize the symfony API   
`symfony server:start -d`

Daemonize the JS frontend  
`symfony run -d yarn encore dev --watch`

## Viewing the map

Open https://localhost:8000 in your browser


## Screenshots


![Mov](https://github.com/annahowell/Symfony-Mapbox-Place-Finder/blob/master/screenshots/mov.webp)

![Still](https://github.com/annahowell/Symfony-Mapbox-Place-Finder/blob/master/screenshots/still.jpg)
