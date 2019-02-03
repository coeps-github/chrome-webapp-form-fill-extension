let value = '';
let property = '';
let selector = '';
let index = '';

document.onclick = () => {
    chrome.runtime.sendMessage({getSelectEnabled: {}}, selectEnabled => {
        if (selectEnabled) {
            chrome.runtime.sendMessage({setSelectEnabled: {value: false}}, () => {
                setPopupValue(value, property, selector, index);
            });
        }
    });
};

document.onmouseover = event => {
    chrome.runtime.sendMessage({getConfig: {}}, config => {
        if (config.selectEnabled) {
            markElement(event.target);
            selectPossibleValues(event.target, config.popup.value);
        }
    });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.markElementsTab) {
        markElements(request.markElementsTab.value.selector, request.markElementsTab.value.index);
        sendResponse();
    }
    if (request.fillElementsTab) {
        request.fillElementsTab.value.rules.forEach(rule => {
            if (!rule.url || request.fillElementsTab.value.url === rule.url) {
                fillElements(rule.value, rule.property, rule.selector, rule.index);
            }
        });
        sendResponse();
    }
    return true;
});

function markElement(element) {
    const markedElements = document.querySelectorAll('.mark');
    markedElements.forEach(element => element.classList.remove('mark'));
    element.classList.add('mark');
}

function markElements(selector, index) {
    const markedElements = document.querySelectorAll('.mark');
    markedElements.forEach(element => element.classList.remove('mark'));
    if (selector) {
        const elements = document.querySelectorAll(selector);
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

function fillElements(value, property, selector, index) {
    if (property && selector) {
        const elements = document.querySelectorAll(selector);
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

function selectPossibleValues(element, popupValue) {
    const tag = element.tagName.toLowerCase();
    const type = (element.type || '').toLowerCase();
    const attrs = attributes(element);
    const attrQueries = getAttributeQueries(attrs);

    let bestQueryAmountSoFar = 999999;
    let bestSelectorSoFar = '';

    value = '';
    property = '';
    selector = '';
    index = '';

    // Value
    if (tag === 'input' && type === 'checkbox') {
        value = true;
    } else {
        value = popupValue;
    }

    // Property
    if (tag === 'input') {
        if (type === 'checkbox') {
            property = 'checked';
        } else {
            property = 'value';
        }
    }

    // Selector - TAG
    const qAmount = getQueryAmount(tag);
    if (qAmount === 1) {
        selector = tag;
        bestQueryAmountSoFar = qAmount;
        bestSelectorSoFar = tag;
        updatePopupValue(value, property, selector, index);
    } else if (bestQueryAmountSoFar > qAmount) {
        bestQueryAmountSoFar = qAmount;
        bestSelectorSoFar = tag;
    }

    logStage('selector - tag', bestQueryAmountSoFar, bestSelectorSoFar);

    if (bestQueryAmountSoFar === 1) {
        return;
    }

    // Selector - TAG - Attributes
    attrQueries.some(attr => {
        const query = tag + attr;
        const queryAmount = getQueryAmount(query);
        if (queryAmount === 1) {
            selector = query;
            bestQueryAmountSoFar = queryAmount;
            bestSelectorSoFar = query;
            updatePopupValue(value, property, selector, index);
            return true;
        } else if (bestQueryAmountSoFar > queryAmount) {
            bestQueryAmountSoFar = queryAmount;
            bestSelectorSoFar = query;
        }
        return false;
    });

    logStage('selector - tag - attributes', bestQueryAmountSoFar, bestSelectorSoFar);

    if (bestQueryAmountSoFar === 1) {
        return;
    }

    // Selector - TAG - Two Attributes
    attrQueries.some(attr1 => {
        let leaveEarly = false;
        attrQueries.some(attr2 => {
            if (attr1 !== attr2) {
                const query = tag + attr1 + attr2;
                const queryAmount = getQueryAmount(query);
                if (queryAmount === 1) {
                    selector = query;
                    bestQueryAmountSoFar = queryAmount;
                    bestSelectorSoFar = query;
                    updatePopupValue(value, property, selector, index);
                    leaveEarly = true;
                    return true;
                } else if (bestQueryAmountSoFar > queryAmount) {
                    bestQueryAmountSoFar = queryAmount;
                    bestSelectorSoFar = query;
                }
                return false;
            }
        });
        return leaveEarly;
    });

    logStage('selector - tag - two attributes', bestQueryAmountSoFar, bestSelectorSoFar);

    if (bestQueryAmountSoFar === 1) {
        return;
    }

    // Selector - Best so far - Index
    selector = bestSelectorSoFar;
    document.querySelectorAll(bestSelectorSoFar).forEach((elem, i) => {
        if (elem.isSameNode(element)) {
            index = i;
        }
    });
    updatePopupValue(value, property, selector, index);

    logStage('selector - best so far - index', bestQueryAmountSoFar, bestSelectorSoFar, index);
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

function getAttributeQueries(attrs) {
    const attributeQueries = [];
    attrs.forEach(attr => {
        if (attr.name === 'class') {
            const classes = getClassValues(attr.value);
            classes.some(clazz => {
                attributeQueries.push('[' + attr.name + '*=\'' + clazz + '\']');
            });
        } else {
            if (attr.value) {
                attributeQueries.push('[' + attr.name + '=\'' + attr.value + '\']');
            } else {
                attributeQueries.push('[' + attr.name + ']');
            }
        }
    });
    return attributeQueries;
}

function getClassValues(value) {
    const classes = value.split(' ');
    const markIndex = classes.indexOf('mark');
    if (markIndex > -1) {
        classes.splice(markIndex, 1);
    }
    return classes;
}

function getQueryAmount(query) {
    return document.querySelectorAll(query).length;
}

function updatePopupValue(value, property, selector, index) {
    chrome.runtime.sendMessage({
        update: {
            value: 'popup',
            popup: {
                value: value,
                property: property,
                selector: selector,
                index: index,
                page: true
            }
        }
    });
}

function setPopupValue(value, property, selector, index) {
    chrome.runtime.sendMessage({
        setPopup: {
            value: {
                value: value,
                property: property,
                selector: selector,
                index: index,
                page: true
            }
        }
    });
}

function logStage(name, bestQueryAmountSoFar, bestSelectorSoFar, index) {
    console.log(name + ' amount: ' + bestQueryAmountSoFar + ' selector: ' + bestSelectorSoFar + (index ? ' index: ' + index : ''));
}
