window['com'] = window['com'] || {};
window.com['coeps'] = window.com['coeps'] || {};
window.com.coeps['waff'] = window.com.coeps['waff'] || {};
window.com.coeps.waff['content'] = window.com.coeps.waff['content'] || function () {

    let previousElement = null;
    let previousUrl = null;

    document.onclick = event => {
        chrome.runtime.sendMessage({disableSelectEnabled: {}}, disabled => {
            if (disabled) {
                markElement(event.target);
                highlightedElement(event.target, true);
            }
        });
    };

    document.onmouseover = event => {
        if (alreadyHanldedElement(event.target)) {
            return;
        }
        chrome.runtime.sendMessage({getSelectEnabled: {}}, selectEnabled => {
            if (selectEnabled) {
                markElement(event.target);
                highlightedElement(event.target);
            }
        });
        if (!alreadyHanldedUrl(window.location.href)) {
            chrome.runtime.sendMessage({triggerAutoFill: {}});
        }
    };

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.markElementsContent) {
            markElements(request.markElementsContent.value.selector, request.markElementsContent.value.xpath, request.markElementsContent.value.index);
            sendResponse();
        }
        if (request.clickElementsContent) {
            request.clickElementsContent.value.rules.forEach(rule => {
                clickElements(rule.selector, rule.xpath, rule.index);
                sendResponse();
            });
        }
        if (request.fillElementsContent) {
            request.fillElementsContent.value.rules.forEach(rule => {
                fillElements(rule.value, rule.property, rule.selector, rule.xpath, rule.index);
                sendResponse();
            });
        }
        return true;
    });

    addStyles();

    function addStyles() {
        const css = '.mark { box-shadow: 0 0 5px 0 rgba(255,0,0,1); }';
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    function alreadyHanldedElement(element) {
        if (element === previousElement) {
            return true;
        }
        previousElement = element;
        return false;
    }

    function alreadyHanldedUrl(url) {
        if (url === previousUrl) {
            return true;
        }
        previousUrl = url;
        return false;
    }

    function markElement(element) {
        const markedElements = document.querySelectorAll('.mark');
        markedElements.forEach(element => element.classList.remove('mark'));
        element.classList.add('mark');
    }

    function markElements(selector, xpath, index) {
        const markedElements = document.querySelectorAll('.mark');
        markedElements.forEach(element => element.classList.remove('mark'));
        if (selector || xpath) {
            const elements = getElements(selector, xpath);
            elements.forEach((element, i) => {
                const indexNum = parseInt(index);
                if (isNaN(indexNum)) {
                    element.classList.add('mark');
                } else {
                    if (indexNum === i) {
                        element.classList.add('mark');
                    }
                }
            });
        }
    }

    function fillElements(value, property, selector, xpath, index) {
        if (property && (selector || xpath)) {
            const elements = getElements(selector, xpath);
            elements.forEach((element, i) => {
                const indexNum = parseInt(index);
                if (isNaN(indexNum)) {
                    element[property] = value;
                } else {
                    if (indexNum === i) {
                        element[property] = value;
                    }
                }
                element.dispatchEvent(new Event('input'));
            });
        }
    }

    function clickElements(selector, xpath, index) {
        if (selector || xpath) {
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            const elements = getElements(selector, xpath);
            elements.forEach((element, i) => {
                const indexNum = parseInt(index);
                if (isNaN(indexNum)) {
                    element.dispatchEvent(event);
                } else {
                    if (indexNum === i) {
                        element.dispatchEvent(event);
                    }
                }
            });
        }
    }

    function highlightedElement(element, select = false) {
        const tag = element.tagName.toLowerCase();
        const type = (element.type || '').toLowerCase();
        const attrs = attributes(element);
        const text = element.innerText;
        chrome.runtime.sendMessage({
            highlightedElement: {
                value: {
                    tag: tag,
                    type: type,
                    attributes: attrs,
                    text: text
                }
            }
        }, queries => {
            const queryRatings = getQueryRatings(element, queries);
            chrome.runtime.sendMessage({highlightedElementQueryRatings: {value: queryRatings, select: select}});
        });
    }

    function attributes(element) {
        if (element.hasAttributes()) {
            const attrs = element.attributes;
            const attributes = [];
            for (let i = 0; i < attrs.length; i++) {
                attributes.push({name: attrs[i].name, value: attrs[i].value});
            }
            return attributes;
        }
    }

    function getQueryRatings(element, queries) {
        const ratings = [];
        queries.queries.some(query => {
            const elements = getElements(query.selector, query.xpath);
            const rating = elements.length;
            let index = 0;
            elements.forEach((elem, i) => {
                if (elem.isSameNode(element)) {
                    index = i;
                }
            });
            ratings.push({
                rating: rating,
                index: index,
                query: query
            });
            return rating === queries.targetRating;
        });
        return ratings;
    }

    function getElements(selector, xpath) {
        const elements = [];
        if (selector) {
            const queryResults = document.querySelectorAll(selector);
            queryResults.forEach(elem => elements.push(elem));
        }
        if (xpath) {
            const xpathResults = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
            let element = xpathResults.iterateNext();
            while (element) {
                elements.push(element);
                element = xpathResults.iterateNext();
            }
        }
        return elements;
    }

    return {};

}();
