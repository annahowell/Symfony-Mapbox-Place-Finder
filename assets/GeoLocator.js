'use strict';

export default class GeoLocator {
    constructor() {}

    getUserLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    (error) => {
                        console.error('Error getting position: ' + error.message)

                        reject(error.message)
                    })
            } else {
                console.warn('User agent does not support location data')

                reject('User agent does not support location data')
            }
        })
    }

    getPermissionForOrientation() {
        return new Promise((resolve, reject) => {
            if (typeof(DeviceOrientationEvent.requestPermission) === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            resolve()
                        } else {
                            reject('User did not give permission for orientation')
                        }
                    })
                    .catch(error => {
                        console.error(error.message)

                        reject(error.message)
                    })
            } else {
                console.info('User agent does not require permission for orientation')
                resolve()
            }
        })
    }

    getPermissionForDeviceMotion() {
        return new Promise((resolve, reject) => {
            if (typeof(DeviceMotionEvent.requestPermission) === 'function') {
                DeviceMotionEvent.requestPermission()
                    .then(permissionState => {
                        if (permissionState === 'granted') {
                            resolve()
                        } else {
                            reject('User did not give permission for motion')
                        }
                    })
                    .catch(error => {
                        console.error(error.message)

                        reject(error.message)
                    })
            } else {
                console.info('User agent does not require permission for motion')
                resolve()
            }
        })
    }

    updateHeading(e) {
        var heading = e.alpha

        if (typeof e.webkitCompassHeading !== "undefined") {
            heading = e.webkitCompassHeading; //iOS non-standard
        }
        map.setBearing(heading)

    }
}