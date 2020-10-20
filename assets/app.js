import './styles/app.css'
import 'mapbox-gl/dist/mapbox-gl.css'

import PlaceMap from './PlaceMap.js'
var placeMap = new PlaceMap('map', 'filter-group', 'message', 'transport')
placeMap.initialise()
