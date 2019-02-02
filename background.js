chrome.runtime.onInstalled.addListener(() => {
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.getConfig) {
        chrome.storage.sync.get('config', data => {
            sendResponse(data.config || {});
        });
    }
    if (request.setConfig) {
        chrome.storage.sync.get('config', () => {
            chrome.storage.sync.set({
                config: request.setConfig.value
            }, () => sendResponse());
        });
    }
    if (request.getSelectEnabled) {
        chrome.storage.sync.get('config', data => {
            sendResponse(!!(data.config && data.config.selectEnabled));
        });
    }
    if (request.setSelectEnabled) {
        chrome.storage.sync.get('config', data => {
            chrome.storage.sync.set({
                config: {
                    ...(data.config ? data.config : {}),
                    selectEnabled: request.setSelectEnabled.value
                }
            }, () => sendResponse());
        });
    }
    if (request.getPopup) {
        chrome.storage.sync.get('config', data => {
            sendResponse((data.config && data.config.popup) || {});
        });
    }
    if (request.setPopup) {
        chrome.storage.sync.get('config', data => {
            chrome.storage.sync.set({
                config: {
                    ...(data.config ? data.config : {}),
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
                    ...(data.config ? data.config : {}),
                    rules: request.setRules.value
                }
            }, () => sendResponse());
        });
    }
    if (request.addRule) {
        chrome.storage.sync.get('config', data => {
            chrome.storage.sync.set({
                config: {
                    ...(data.config ? data.config : {}),
                    rules: [
                        ...(data.config && data.config.rules ? data.config.rules : []),
                        {
                            value: request.addRule.value.value,
                            property: request.addRule.value.property,
                            selector: request.addRule.value.selector,
                            index: request.addRule.value.index,
                            page: request.addRule.value.page
                        }
                    ]
                }
            }, () => sendResponse());
        });
    }
    if (request.getUrl) {
        getUrl(url => sendResponse(url));
    }
    if (request.markElements) {
        currentTab(id => chrome.tabs.sendMessage(id, {markElementsTab: request.markElements}, () => {
        }));
        sendResponse();
    }
    if (request.fillElements) {
        chrome.storage.sync.get('config', data => {
            if (data.config) {
                currentTab(id => chrome.tabs.sendMessage(id, {fillElementsTab: data.config.rules}, () => {
                }));
                sendResponse();
            }
        });
    }
    if (request.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    }
    return true;
});

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
