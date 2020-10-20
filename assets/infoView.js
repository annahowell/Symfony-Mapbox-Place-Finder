'use strict';

export default class InfoView {
    constructor() {}

    generate(info, type, coordinates) {
        let parentDiv = document.createElement("div")

        this.generateTitle(parentDiv, info.title, type)
        this.generateMisc(parentDiv, info.misc)

        this.generatePhone(parentDiv, info.phone)
        this.generateWebsite(parentDiv, info.website)
        this.generateEmail(parentDiv, info.email)
        this.generateAddress(parentDiv, info.address)

        this.generateDirectionsButton(parentDiv)

        return parentDiv.innerHTML
    }


    generateTitle(parentDiv, title, type) {
        let container = document.createElement("div")
        container.className = 'popup-title'
        container.textContent = title !== null ? title : type.replace(/_/g, ' ')

        parentDiv.appendChild(container)
    }

    generateMisc(parentDiv, misc) {
        if (misc !== null) {
            for (let [key, val] of Object.entries(misc)) {
                let container = document.createElement("p")
                let strong = document.createElement("strong")

                strong.textContent = key.replace(/_/g, ' ')
                container.appendChild(strong)
                container.appendChild(document.createTextNode(val.replace(/_/g, ' ')))

                parentDiv.appendChild(container)
            }
        }
    }

    generatePhone(parentDiv, phone) {
        if (phone !== null) {
            let container = document.createElement("p")
            let strong = document.createElement("strong")
            let a = document.createElement('a')

            strong.textContent = 'Phone'

            a.textContent = phone
            a.title = phone
            a.href = 'tel:' + phone

            container.appendChild(strong)
            container.appendChild(a)

            parentDiv.appendChild(container)
        }
    }

    generateWebsite(parentDiv, website) {
        if (website !== null) {
            let container = document.createElement("p")
            let strong = document.createElement("strong")
            let a = document.createElement('a')

            strong.textContent = 'Website'

            a.textContent = website
            a.title = website
            a.href = website
            a.target = '_blank'

            container.appendChild(strong)
            container.appendChild(a)

            parentDiv.appendChild(container)
        }
    }

    generateEmail(parentDiv, email) {
        if (email !== null) {
            let container = document.createElement("p")
            let strong = document.createElement("strong")
            let a = document.createElement('a')

            strong.textContent = 'Email'

            a.textContent = email
            a.title = email
            a.href = 'mailto:' + email

            container.appendChild(strong)
            container.appendChild(a)

            parentDiv.appendChild(container)
        }
    }

    generateAddress(parentDiv, address) {
        if (!Object.values(address).every(v => v === null)) {
            let titleDiv = document.createElement("div")
            let bodyDiv = document.createElement("div")

            titleDiv.className = 'popup-address-title'
            titleDiv.textContent = 'Address:'

            bodyDiv.className = 'popup-address-body'

            for (let [key, val] of Object.entries(address)) {
                if (val !== null) {
                    bodyDiv.appendChild(document.createTextNode(val))

                    let termination = key === 'houseNumber' ? document.createTextNode('\u00A0') : document.createElement('br')

                    bodyDiv.appendChild(termination)
                }
            }

            parentDiv.appendChild(titleDiv)
            parentDiv.appendChild(bodyDiv)
        }
    }

    generateDirectionsButton(parentDiv) {
        let container = document.createElement("div")
        var button = document.createElement("button")

        container.className = 'popup-button-container'

        button.setAttribute("id", 'popup-directions-button');
        button.innerHTML = 'Get directions'

        container.appendChild(button)

        parentDiv.appendChild(container)
    }
}