'use strict';

import Api from './Api.js'
import GeoLocator from './GeoLocator.js'
import InfoFactory from './InfoFactory.js'
import InfoView from './InfoView.js'

import mapboxgl from 'mapbox-gl'
mapboxgl.accessToken = 'pk.eyJ1IjoiYW5uYWhvd2VsbCIsImEiOiJja2c3dmExZHQwYmFnMndxb3FkNW9lbHIxIn0.IGAx1J0On6rAbwXRbFgUtg'

export default class PlaceMap {
    dataBounds = null
    visibleLayers = null
    popup = null
    userLocation = null
    userOrientation = null

    constructor(mapId, filterGroupId, messageId, transportSelectorId) {
        this.map = new mapboxgl.Map({
            container: mapId,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-1.9, 50.73], // lng, lat
            zoom: 14,
            pitch: 30,
            minZoom: 4.5,
            maxZoom: 18,
            hash: true
        })

        this.filterGroup = document.getElementById(filterGroupId)
        this.messageBox = document.getElementById(messageId)
        this.transportSelector = document.getElementById(transportSelectorId)

        this.api = new Api()
        this.geoLocator = new GeoLocator()
        this.infoFactory = new InfoFactory()
        this.infoView = new InfoView()
        this.userLocationMarker = new mapboxgl.Marker({scale: 0.75})
    }

    initialise() {
        this.map.on('load', () => {
            this.populateMap()
            this.getUserConsentAndSetupAccordingly()
            this.getPlaceTypesAndCreateLayers()

            if (this.markersShouldBeVisible()) {
                this.getPlacesAndAddToMap()
            }

            this.enableHandlingUserMovingMap()
        })
    }

    populateMap() {
        this.map.addSource('places', {
            type: 'geojson',
            data: {
                'type': 'FeatureCollection',
                'features': []
            }
        })

        this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')
    }

    enableHandlingUserMovingMap() {
        this.map.on('moveend', () => {
            if (this.markersShouldBeVisible()) {
                // It appears that .contains(LngLatBounds) isn't currently implemented:
                // https://github.com/mapbox/mapbox-gl-js/issues/7512#issuecomment-476387968 so instead:
                if (this.dataBounds === null || (!this.dataBounds.contains(this.map.getBounds()._ne) || !this.dataBounds.contains(this.map.getBounds()._sw))) {
                    this.getPlacesAndAddToMap()
                }
            }

            if (this.visibleLayers !== null) {
                this.visibleLayers.forEach((item) => {
                    this.map.setLayoutProperty(
                        item,
                        'visibility',
                        this.markersShouldBeVisible() ? 'visible' : 'none'
                    )
                })
            }
        })
    }

    getUserConsentAndSetupAccordingly() {
        this.geoLocator.getUserLocation()
            .then(position => {
                this.userLocation = {
                    //lat: position.coords.latitude,
                    //lng: position.coords.longitude,
                    lat: 51.455834,
                    lng: -2.59155,
                }

                this.userLocationMarker
                    .setLngLat([this.userLocation.lng, this.userLocation.lat])
                    .addTo(this.map);

                if (this.map.getCenter().lng !== this.userLocation.lng || this.map.getCenter().lat !== this.userLocation.lat) {
                    this.map.setCenter(this.userLocation)

                    if (this.markersShouldBeVisible()) {
                        this.getPlacesAndAddToMap()
                    }
                }
            })
            .catch(error => {
                console.error(error.message)
            })
    }

    getPlaceTypesAndCreateLayers() {
        this.api.getPlaceTypes()
            .then(response => {
                this.visibleLayers = ['layer-cafe', 'layer-drinking-water', 'layer-toilet']

                response.data.forEach((typeWithIcon) => {
                    var symbol = typeWithIcon.icon
                    var type = typeWithIcon.type.replace(/_/g, ' ')
                    var layerID = 'layer-' + symbol
                    var startsVisible = this.visibleLayers.includes(layerID)

                    if (!this.map.getLayer(layerID)) {
                        this.map.addLayer({
                            'id': layerID,
                            'type': 'symbol',
                            'source': 'places',
                            'layout': {
                                'icon-image': symbol + '-15',
                                'icon-size': 1.4,
                                'icon-allow-overlap': true,
                                'visibility': startsVisible ? 'visible' : 'none'
                            },
                            'filter': ['==', 'icon', symbol]
                        })

                        this.createFilter(layerID, type, this.visibleLayers.includes(layerID))

                        this.map.on('click', layerID, (event) => {this.handlePopup(event)})
                        this.map.on('mouseenter', layerID, () => {this.map.getCanvas().style.cursor = 'pointer'})
                        this.map.on('mouseleave', layerID, () => {this.map.getCanvas().style.cursor = ''})
                    }
                })
            })
            .catch(error => {
                console.error(error.message)
            })
    }

    handlePopup(event) {
        var coordinates = event.features[0].geometry.coordinates.slice()
        var info = this.infoFactory.fromString(event.features[0].properties.tags)

        while (Math.abs(event.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += event.lngLat.lng > coordinates[0] ? 360 : -360
        }

        this.closePopup()

        this.popup = new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(this.infoView.generate(info, event.features[0].properties.name, coordinates))
            .addTo(this.map)

        document.getElementById('popup-directions-button').addEventListener(
            'click', () => this.getDirectionsAttempt(coordinates)
        )
    }

    getPlacesAndAddToMap() {
        this.getDataBounds(this.map.getBounds())

        this.api.getPlaces(this.dataBounds)
            .then((response) => {
                if (this.map.getSource('places') !== undefined) {
                    this.map.getSource('places').setData(response.data)
                }
            })
            .catch((error) => {
                console.error(error.message)
            })
    }

    handleOrientation(event) {
        var heading = event.alpha

        if (typeof event.webkitCompassHeading !== "undefined") {
            heading = event.webkitCompassHeading; //iOS non-standard
        }

        if (this.userOrientation > heading + 1 || this.userOrientation < heading - 1) {
            this.map.setBearing(heading)
            this.userOrientation = heading
        }
    }

    async getDirectionsAttempt(destination) {
        if (this.userLocation === null) {
            this.messageBox.textContent = 'Your current location is unavailable'
            this.messageBox.style.setProperty('visibility', 'visible')

            setTimeout(() => {
                this.messageBox.style.setProperty('visibility', 'hidden') }, 3000
            )

            return
        }

        if (this.orientationPermitted !== true) {
            this.geoLocator.getPermissionForOrientation()
                .then(() => {
                    this.orientationPermitted = true

                    this.closePopup()

                    window.addEventListener("deviceorientation", (e) => {this.handleOrientation(e)}, true)
                })
                .catch(error => {
                    console.error(error.message)
                })
        } else {
            this.closePopup()
        }

        this.api.getDirections(this.userLocation, destination, this.transportSelector.value, mapboxgl.accessToken)
            .then((response) => {
                var route = response.data.routes[0].geometry.coordinates
                var geojson = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: route
                    }
                }

                if (this.map.getSource('route')) {
                    this.map.getSource('route').setData(geojson)
                } else {
                    this.map.addLayer({
                        id: 'route',
                        type: 'line',
                        source: {
                            type: 'geojson',
                            data: geojson
                        },
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round',
                        },
                        paint: {
                            'line-color': '#3887be',
                            'line-width': 5,
                            'line-opacity': 0.75
                        }
                    })
                }
            })
            .catch((error) => {
                console.error(error.message)
            })
    }


    // Helper functions ------------------------------------------------------------------------------------------------
    getDataBounds(viewportBounds) {
        this.dataBounds = new mapboxgl.LngLatBounds(
            new mapboxgl.LngLat(
                viewportBounds._sw.lng - (0.2 / this.map.getZoom()),
                viewportBounds._sw.lat - (0.1 / this.map.getZoom())
            ),
            new mapboxgl.LngLat(
                viewportBounds._ne.lng + (0.2 / this.map.getZoom()),
                viewportBounds._ne.lat + (0.1 / this.map.getZoom())
            )
        )
    }

    markersShouldBeVisible() {
        this.messageBox.textContent = 'Zoom in to view selections'
        this.messageBox.style.setProperty('visibility', this.map.getZoom() >= 12 ? 'hidden' : 'visible')

        return this.map.getZoom() >= 12
    }

    createFilter(layerID, type, startsVisible) {
        let input = document.createElement('input')
        var label = document.createElement('label')

        input.type = 'checkbox'
        input.id = layerID
        input.checked = startsVisible

        label.setAttribute('for', layerID)
        label.textContent = type

        this.filterGroup.appendChild(input)
        this.filterGroup.appendChild(label)

        input.addEventListener('change', (e) => {
            this.map.setLayoutProperty(
                layerID,
                'visibility',
                e.target.checked && this.markersShouldBeVisible() ? 'visible' : 'none'
            )

            e.target.checked ? this.visibleLayers.push(layerID) : this.visibleLayers.splice(this.visibleLayers.indexOf(layerID), 1)
        })
    }

    closePopup() {
        if (this.popup !== null && this.popup.isOpen()) {
            this.popup.remove()
        }
    }
}