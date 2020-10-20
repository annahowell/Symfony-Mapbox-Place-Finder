'use strict';

export default class Info {
    constructor(title, phone, website, email, address, misc) {
        this.title = title
        this.phone = phone
        this.website = website
        this.email = email
        this.address = address
        this.misc = misc
    }

    getTitle() {
        return this.title
    }

    getAddress() {
        return this.address
    }

    getPhone() {
        return this.phone
    }

    getWebsite() {
        return this.website
    }

    getEmail() {
        return this.email
    }

    getMisc() {
        return this.misc
    }
}