window['com'] = window['com'] || {};
window.com['coeps'] = window.com['coeps'] || {};
window.com.coeps['waff'] = window.com.coeps['waff'] || {};
window.com.coeps.waff['background'] = window.com.coeps.waff['background'] || function () {

    let debug = false;

    chrome.tabs.onUpdated.addListener(() => {
        injectContentScript();
        triggerAutoFill();
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.injectContentScript) {
            injectContentScript(sendResponse);
        }
        if (request.triggerAutoFill) {
            triggerAutoFill(sendResponse);
        }
        if (request.getConfig) {
            getConfig(sendResponse);
        }
        if (request.getSelectEnabled) {
            getSelectEnabled(sendResponse);
        }
        if (request.disableSelectEnabled) {
            disableSelectEnabled(sendResponse);
        }
        if (request.toggleSelectEnabled) {
            toggleSelectEnabled(sendResponse);
        }
        if (request.setPopup) {
            setPopup(request.setPopup.value, sendResponse);
        }
        if (request.getRules) {
            getRules(sendResponse);
        }
        if (request.setRules) {
            setRules(request.setRules.value, sendResponse);
        }
        if (request.addRule) {
            addRule(request.addRule.value, sendResponse);
        }
        if (request.markElements) {
            markElements(sendResponse);
        }
        if (request.fillElement) {
            fillElement(sendResponse);
        }
        if (request.fillElements) {
            fillElements(sendResponse);
        }
        if (request.highlightedElement) {
            sendResponse(createQueries(request.highlightedElement.value));
        }
        if (request.highlightedElementQueryRatings) {
            highlightedElementQueryRatings(request.highlightedElementQueryRatings.value, request.highlightedElementQueryRatings.select, sendResponse);
        }
        if (request.updatePopup) {
            sendResponse();
        }
        if (request.updateOptions) {
            sendResponse();
        }
        if (request.openOptionsPage) {
            openOptionsPage(sendResponse);
        }
        if (request.markElementsContent) {
            sendResponse();
        }
        if (request.clickElementsContent) {
            sendResponse();
        }
        if (request.fillElementsContent) {
            sendResponse();
        }
        return true;
    });

    chrome.management.getSelf(info => debug = info.installType === 'development');

    function currentTab(action) {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                const id = tabs[0].id;
                const url = tabs[0].url;
                action(id, url);
            } else {
                action(0, '');
            }
        });
    }

    function getUrl(callback) {
        currentTab((id, url) => callback(url));
    }

    function injectContentScript(callback) {
        currentTab(id => chrome.tabs.executeScript(id, {
            file: 'content.js'
        }));
        if (callback) {
            callback();
        }
    }

    function triggerAutoFill(callback) {
        chrome.storage.sync.get('config', data => {
            if (!!(data.config && data.config.popup && data.config.popup.auto)) {
                fillElements(callback);
            } else {
                if (callback) {
                    callback();
                }
            }
        });
    }

    function getConfig(callback) {
        chrome.storage.sync.get('config', data => {
            callback(data.config || {});
        });
    }

    function getSelectEnabled(callback) {
        chrome.storage.sync.get('config', data => {
            callback(!!(data.config && data.config.selectEnabled));
        });
    }

    function disableSelectEnabled(callback) {
        chrome.storage.sync.get('config', data => {
            const selectEnabled = !!(data.config && data.config.selectEnabled);
            if (selectEnabled) {
                chrome.storage.sync.set({
                    config: {
                        ...data.config || {},
                        selectEnabled: false
                    }
                }, () => callback(true));
            } else {
                callback(false);
            }
        });
    }

    function toggleSelectEnabled(callback) {
        chrome.storage.sync.get('config', data => {
            const selectEnabled = !!(data.config && data.config.selectEnabled);
            chrome.storage.sync.set({
                config: {
                    ...data.config || {},
                    selectEnabled: !selectEnabled
                }
            }, () => callback(!selectEnabled));
        });
    }

    function setPopup(value, callback) {
        chrome.storage.sync.get('config', data => {
            chrome.storage.sync.set({
                config: {
                    ...data.config || {},
                    popup: value
                }
            }, callback);
        });
    }

    function getRules(callback) {
        chrome.storage.sync.get('config', data => {
            callback((data.config && data.config.rules) || []);
        });
    }

    function setRules(value, callback) {
        chrome.storage.sync.get('config', data => {
            chrome.storage.sync.set({
                config: {
                    ...data.config || {},
                    rules: value
                }
            }, callback);
        });
    }

    function addRule(value, callback) {
        getUrl(url => {
            chrome.storage.sync.get('config', data => {
                chrome.storage.sync.set({
                    config: {
                        ...data.config || {},
                        rules: [
                            ...(data.config && data.config.rules) || [],
                            {
                                preset: value.preset,
                                value: value.value,
                                property: value.property,
                                click: value.click,
                                selector: value.selector,
                                xpath: value.xpath,
                                index: value.index,
                                url: value.page ? url : ''
                            }
                        ]
                    }
                }, () => callback());
            });
        });
    }

    function markElements(callback) {
        chrome.storage.sync.get('config', data => {
            currentTab(id => {
                chrome.tabs.sendMessage(id, {
                    markElementsContent: {
                        value: {
                            selector: (data.config && data.config.popup && data.config.popup.selector) || '',
                            xpath: (data.config && data.config.popup && data.config.popup.xpath) || '',
                            index: (data.config && data.config.popup && data.config.popup.index) || ''
                        }
                    }
                }, callback);
            });
        });
    }

    function fillElement(callback) {
        chrome.storage.sync.get('config', data => {
            currentTab(id => {
                const popup = data.config && data.config.popup || {};
                if (popup.click) {
                    chrome.tabs.sendMessage(id, {
                        clickElementsContent: {
                            value: {
                                rules: [popup],
                            }
                        }
                    }, callback);
                } else {
                    chrome.tabs.sendMessage(id, {
                        fillElementsContent: {
                            value: {
                                rules: [popup],
                            }
                        }
                    }, callback);
                }
            });
        });
    }

    function fillElements(callback) {
        chrome.storage.sync.get('config', data => {
            currentTab((id, url) => {
                const popup = data.config && data.config.popup || {};
                const rules = data.config && data.config.rules || [];
                const clickRules = rules.filter(rule => rule.preset === popup.preset && (!rule.url || rule.url === url) && rule.click);
                const fillRules = rules.filter(rule => rule.preset === popup.preset && (!rule.url || rule.url === url) && !rule.click);
                if (clickRules.length > 0) {
                    chrome.tabs.sendMessage(id, {
                        clickElementsContent: {
                            value: {
                                rules: clickRules,
                            }
                        }
                    });
                }
                if (fillRules.length > 0) {
                    chrome.tabs.sendMessage(id, {
                        fillElementsContent: {
                            value: {
                                rules: fillRules,
                            }
                        }
                    });
                }
            });
            if (callback) {
                callback();
            }
        });
    }

    function createQueries(selectedElement) {
        const tag = selectedElement.tag;
        const type = selectedElement.type;
        const attributeQueries = getAttributeQueries(selectedElement.attributes);
        const text  = selectedElement.text;

        const targetRating = 1;
        const queries = [];

        let value = undefined;
        let property = undefined;
        let click = false;
        let selector = undefined;
        let xpath = undefined;

        // Value
        if (tag === 'input' && type === 'checkbox') {
            value = true;
        }

        // Property - Click
        if (tag === 'input') {
            if (type === 'checkbox') {
                property = 'checked';
            } else if (type === 'submit' || type === 'button' || type === 'reset') {
                click = true;
            } else {
                property = 'value';
            }
        } else if (tag === 'textarea') {
            property = 'value';
        } else if (tag === 'select') {
            property = 'value';
        } else {
            click = true;
        }

        // Selector - TAG
        queries.push(createQuery(value, property, click, selectedElement.tag, xpath));

        // Selector - TAG - Attributes
        attributeQueries.forEach(attr => {
            queries.push(createQuery(value, property, click, tag + attr, xpath));
        });

        // Selector - TAG - Two Attributes
        attributeQueries.forEach(attr1 => {
            attributeQueries.forEach(attr2 => {
                if (attr1 !== attr2) {
                    queries.push(createQuery(value, property, click, tag + attr1 + attr2, xpath));
                }
            });
        });

        // Selector - XPath
        queries.push(createQuery(value, property, click, selector, '//' + tag + '[contains(.,\'' + text + '\')]'));

        return {
            targetRating: targetRating,
            queries: queries
        };
    }

    function createQuery(value, property, click, selector, xpath) {
        return {
            value: value,
            property: property,
            click: click,
            selector: selector,
            xpath: xpath
        };
    }

    function highlightedElementQueryRatings(value, select, callback) {
        const bestRating = chooseBestRating(value);
        const send = popup => chrome.runtime.sendMessage({
            updatePopup: {
                value: popup
            }
        }, callback);
        chrome.storage.sync.get('config', data => {
                const prevPopup = data.config && data.config.popup || {};
                const popup = {
                    ...prevPopup,
                    value: bestRating.value || prevPopup.value || '',
                    property: bestRating.property || '',
                    click: bestRating.click || '',
                    selector: bestRating.selector || '',
                    xpath: bestRating.xpath || '',
                    index: bestRating.index || ''
                };
                if (select) {
                    chrome.storage.sync.set({
                        config: {
                            ...data.config || {},
                            popup: popup
                        }
                    }, () => send(popup));
                } else {
                    send(popup);
                }
            }
        );
    }

    function openOptionsPage(callback) {
        chrome.runtime.openOptionsPage();
        callback();
    }

    function chooseBestRating(queryRatings) {
        let targetRating = 0;
        let bestRating = null;
        while (bestRating === null && targetRating < 100) {
            targetRating++;
            queryRatings.some(queryRating => {
                if (queryRating.rating === targetRating) {
                    bestRating = {
                        value: queryRating.query.value,
                        property: queryRating.query.property,
                        click: queryRating.query.click,
                        selector: queryRating.query.selector,
                        xpath: queryRating.query.xpath,
                        index: queryRating.index
                    };
                    return true;
                }
                return false;
            });
        }
        if (!bestRating) {
            bestRating = {};
            log('BestRating above: ' + targetRating + ', giving up.');
        } else {
            log('BestRating: ' + JSON.stringify(bestRating));
        }
        return bestRating;
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

    function log(message) {
        if (debug) {
            console.log(message);
        }
    }

    return {};

}();
