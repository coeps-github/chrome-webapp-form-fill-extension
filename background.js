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
    if (request.getAiEnabled) {
        chrome.storage.sync.get('config', data => {
            sendResponse(!!(data.config && data.config.aiEnabled));
        });
    }
    if (request.setAiEnabled) {
        chrome.storage.sync.get('config', data => {
            chrome.storage.sync.set({
                config: {
                    ...(data.config ? data.config : {}),
                    aiEnabled: request.setAiEnabled.value
                }
            }, () => sendResponse());
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
    if (request.executeScript) {
        executeScript(request.executeScript.value, (id, url, result) => sendResponse({
            id: id,
            url: url,
            result: result
        }))
    }
    if (request.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    }
    return true;
});

function getUrl(callback) {
    currentTab((id, url) => callback(url));
}

function executeScript(code, callback) {
    currentTab((id, url) => chrome.tabs.executeScript(id, {code: code}, result => {
        if (callback) {
            callback(id, url, result);
        }
    }));
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
