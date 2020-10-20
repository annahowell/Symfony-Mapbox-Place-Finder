'use strict';

import Info from './Info.js'
import Address from './Address.js'

export default class InfoFactory {
    nameKeys = ['name', 'name:en', 'loc_name', 'official_name']

    phoneKeys = ['phone', 'contact:phone']
    websiteKeys = ['website', 'web_site', 'contact:website']
    emailKeys = ['email', 'contact:email']

    houseNameKeys = ['housename', 'house_name', 'addr:housename', 'addr:house_name']
    houseNumberKeys = ['housenumber', 'house_number', 'addr:housenumber', 'addr:house_number']
    streetKeys = ['street', 'addr:street']
    placeKeys = ['place', 'addr:place']
    cityKeys = ['city', 'addr:city']
    countyKeys = ['county', 'addr:county']
    postcodeKeys = ['postcode', 'post_code', 'postalcode', 'postal_code', 'addr:postcode', 'addr:post_code', 'addr:postalcode', 'addr:postal_code']

    combinedKeys = [
        ...this.nameKeys,
        ...this.houseNameKeys,
        ...this.houseNumberKeys,
        ...this.streetKeys,
        ...this.placeKeys,
        ...this.cityKeys,
        ...this.countyKeys,
        ...this.postcodeKeys,
        ...this.phoneKeys,
        ...this.websiteKeys,
        ...this.emailKeys
    ]

    constructor() {}

    fromString(tags) {
        let tagObj = JSON.parse(tags)

        return this.constructAll(tagObj)
    }

    constructAll(tagObj) {
        let title = this.getValueOrNullByFirstCorrectKey(tagObj, this.nameKeys)
        let phone = this.getValueOrNullByFirstCorrectKey(tagObj, this.phoneKeys)
        let website = this.getValueOrNullByFirstCorrectKey(tagObj, this.websiteKeys)
        let email = this.getValueOrNullByFirstCorrectKey(tagObj, this.emailKeys)

        return new Info(title, phone, website, email, this.constructAddress(tagObj), this.constructMisc(tagObj))
    }

    constructAddress(tagObj) {
        let houseName = this.getValueOrNullByFirstCorrectKey(tagObj, this.houseNameKeys)
        let houseNumber = this.getValueOrNullByFirstCorrectKey(tagObj, this.houseNumberKeys)
        let street = this.getValueOrNullByFirstCorrectKey(tagObj, this.streetKeys)
        let place = this.getValueOrNullByFirstCorrectKey(tagObj, this.placeKeys)
        let city = this.getValueOrNullByFirstCorrectKey(tagObj, this.cityKeys)
        let county = this.getValueOrNullByFirstCorrectKey(tagObj, this.countyKeys)
        let postcode = this.getValueOrNullByFirstCorrectKey(tagObj, this.postcodeKeys)

        return new Address(houseName, houseNumber, street, place, city, county, postcode)
    }

    constructMisc(tagObj) {
        var result = []
        let allKeysNotNameAddressOrLinks = Object.keys(tagObj).filter(val => !this.combinedKeys.includes(val))

        if (allKeysNotNameAddressOrLinks !== undefined) {
            for (let key of allKeysNotNameAddressOrLinks) {
                result[key] = tagObj[key]
            }
        }

        return Object.keys(result).length !== 0 ? result : null
    }

    getValueOrNullByFirstCorrectKey(tagObj, keyList) {
        let tmp = Object.keys(tagObj).filter(val => keyList.includes(val))[0]

        return tmp !== undefined ? tagObj[tmp] : null
    }
}