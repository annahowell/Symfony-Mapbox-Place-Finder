'use strict';

class Address {
    constructor(houseName, houseNumber, street, place, city, county, postcode) {
        this.houseName = houseName
        this.houseNumber = houseNumber
        this.street = street
        this.place = place
        this.city = city
        this.county = county
        this.postcode = postcode
    }

    getHouseName() {
        return this.houseName
    }

    getHouseNumber() {
        return this.houseNumber
    }

    getStreet() {
        return this.street
    }

    getPlace() {
        return this.place
    }

    getCity() {
        return this.city
    }

    getCounty() {
        return this.county
    }

    getPostcode() {
        return this.postcode
    }
}

export default Address;
