'use strict';

import axios from 'axios'
axios.defaults.withCredentials = false
axios.defaults.headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
}

export default class Api {
    constructor() {}

    async getPlaceTypes() {
        return await axios.get('/api/data/types')
    }

    async getPlaces(dataBounds) {
        return await axios.get('/api/data/' + dataBounds._ne.lng + '/' + dataBounds._ne.lat + '/' + dataBounds._sw.lng + '/' + dataBounds._sw.lat)
    }

    async getDirections(currentLocation, destination, transportType, accessToken) {
        let request = currentLocation.lng + ',' + currentLocation.lat + ';' + destination[0] + ',' + destination[1]

        return await axios.get('https://api.mapbox.com/directions/v5/mapbox/' + transportType + '/' + request + '?steps=true&geometries=geojson&access_token=' + accessToken)
    }
}