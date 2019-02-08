window['com'] = window['com'] || {};
window.com['coeps'] = window.com['coeps'] || {};
window.com.coeps['waff'] = window.com.coeps['waff'] || {};
window.com.coeps.waff['background'] = window.com.coeps.waff['background'] || function () {

    let debug = false;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.injectContentScript) {
            currentTab(id => chrome.tabs.executeScript(id, {
                file: 'content.js'
            }));
            sendResponse();
        }
        if (request.getConfig) {
            chrome.storage.sync.get('config', data => {
                sendResponse(data.config || {});
            });
        }
        if (request.getSelectEnabled) {
            chrome.storage.sync.get('config', data => {
                sendResponse(!!(data.config && data.config.selectEnabled));
            });
        }
        if (request.toggleSelectEnabled) {
            chrome.storage.sync.get('config', data => {
                const selectEnabled = !!(data.config && data.config.selectEnabled);
                chrome.storage.sync.set({
                    config: {
                        ...data.config || {},
                        selectEnabled: !selectEnabled
                    }
                }, () => sendResponse(!selectEnabled));
            });
        }
        if (request.setPopup) {
            chrome.storage.sync.get('config', data => {
                chrome.storage.sync.set({
                    config: {
                        ...data.config || {},
                        popup: request.setPopup.value
                    }
                }, () => sendResponse());
            });
        }
        if (request.getRules) {
            chrome.storage.sync.get('config', data => {
                sendResponse((data.config && data.config.rules) || []);
            });
        }
        if (request.setRules) {
            chrome.storage.sync.get('config', data => {
                chrome.storage.sync.set({
                    config: {
                        ...data.config || {},
                        rules: request.setRules.value
                    }
                }, () => sendResponse());
            });
        }
        if (request.addRule) {
            getUrl(url => {
                chrome.storage.sync.get('config', data => {
                    chrome.storage.sync.set({
                        config: {
                            ...data.config || {},
                            rules: [
                                ...(data.config && data.config.rules) || [],
                                {
                                    preset: request.addRule.value.preset,
                                    value: request.addRule.value.value,
                                    property: request.addRule.value.property,
                                    click: request.addRule.value.click,
                                    selector: request.addRule.value.selector,
                                    index: request.addRule.value.index,
                                    url: request.addRule.value.page ? url : ''
                                }
                            ]
                        }
                    }, () => sendResponse());
                });
            });
        }
        if (request.markElements) {
            chrome.storage.sync.get('config', data => {
                currentTab(id => {
                    return chrome.tabs.sendMessage(id, {
                        markElementsContent: {
                            value: {
                                selector: (data.config && data.config.popup && data.config.popup.selector) || '',
                                index: (data.config && data.config.popup && data.config.popup.index) || ''
                            }
                        }
                    });
                });
                sendResponse();
            });
        }
        if (request.fillElement) {
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
                        });
                    } else {
                        chrome.tabs.sendMessage(id, {
                            fillElementsContent: {
                                value: {
                                    rules: [popup],
                                }
                            }
                        });
                    }
                });
                sendResponse();
            });
        }
        if (request.fillElements) {
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
                sendResponse();
            });
        }
        if (request.highlightedElement) {
            const queries = createQueries(request.highlightedElement.value);
            sendResponse(queries);
        }
        if (request.highlightedElementQueryRatings) {
            const bestRating = chooseBestRating(request.highlightedElementQueryRatings.value);
            const select = request.highlightedElementQueryRatings.select;
            const send = popup => chrome.runtime.sendMessage({
                updatePopup: {
                    value: popup
                }
            }, () => sendResponse());
            chrome.storage.sync.get('config', data => {
                    const prevPopup = data.config && data.config.popup || {};
                    const popup = {
                        ...prevPopup,
                        value: bestRating.value || prevPopup.value || '',
                        property: bestRating.property || '',
                        click: bestRating.click || '',
                        selector: bestRating.selector || '',
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
        if (request.updatePopup) {
            sendResponse();
        }
        if (request.updateOptions) {
            sendResponse();
        }
        if (request.openOptionsPage) {
            chrome.runtime.openOptionsPage();
            sendResponse();
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

    function getUrl(callback) {
        currentTab((id, url) => callback(url));
    }

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

    function createQueries(selectedElement) {
        const tag = selectedElement.tag;
        const type = selectedElement.type;
        const attributeQueries = getAttributeQueries(selectedElement.attributes);

        const targetRating = 1;
        const queries = [];

        let value = undefined;
        let property = undefined;
        let click = false;

        // Value
        if (tag === 'input' && type === 'checkbox') {
            value = true;
        }

        // Property - Click
        if (tag === 'input') {
            if (type === 'checkbox') {
                property = 'checked';
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
        queries.push(createQuery(value, property, click, selectedElement.tag));

        // Selector - TAG - Attributes
        attributeQueries.forEach(attr => {
            queries.push(createQuery(value, property, click, tag + attr));
        });

        // Selector - TAG - Two Attributes
        attributeQueries.forEach(attr1 => {
            attributeQueries.forEach(attr2 => {
                if (attr1 !== attr2) {
                    queries.push(createQuery(value, property, click, tag + attr1 + attr2));
                }
            });
        });

        return {
            targetRating: targetRating,
            queries: queries
        };
    }

    function createQuery(value, property, click, selector) {
        return {
            value: value,
            property: property,
            click: click,
            selector: selector
        };
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
