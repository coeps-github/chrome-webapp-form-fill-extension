window['com'] = window['com'] || {};
window.com['coeps'] = window.com['coeps'] || {};
window.com.coeps['waff'] = window.com.coeps['waff'] || {};
window.com.coeps.waff['popup'] = window.com.coeps.waff['popup'] || function() {

    const form = document.getElementById('form');
    const preset = document.getElementById('preset');
    const fill = document.getElementById('fill');
    const value = document.getElementById('value');
    const property = document.getElementById('property');
    const click = document.getElementById('click');
    const selector = document.getElementById('selector');
    const xpath = document.getElementById('xpath');
    const index = document.getElementById('index');
    const page = document.getElementById('page');
    const select = document.getElementById('select');
    const test = document.getElementById('test');
    const save = document.getElementById('save');
    const options = document.getElementById('options');

    fill.onclick = () => {
        fill.disabled = true;
        chrome.runtime.sendMessage({fillElements: {}}, () => {
            fill.innerHTML = '&#10004;';
            setTimeout(() => {
                fill.innerText = 'fill';
                fill.disabled = false;
            }, 500);
        });
    };

    preset.onchange = () => {
        saveInputState();
    };

    value.oninput = () => {
        saveInputState();
    };

    property.oninput = () => {
        saveInputState();
    };

    click.onchange = () => {
        disableValueAndPropertyField(click.checked);
        saveInputState();
    };

    selector.oninput = () => {
        if (selector.value) {
            setNotRequired(xpath);
        } else {
            setRequired(xpath);
        }
        saveInputState(() => chrome.runtime.sendMessage({markElements: {}}));
    };

    xpath.oninput = () => {
        if (xpath.value) {
            setNotRequired(selector);
        } else {
            setRequired(selector);
        }
        saveInputState(() => chrome.runtime.sendMessage({markElements: {}}));
    };

    index.oninput = () => {
        saveInputState(() => chrome.runtime.sendMessage({markElements: {}}));
    };

    page.onchange = () => {
        saveInputState();
    };

    select.onclick = () => {
        chrome.runtime.sendMessage({toggleSelectEnabled: {}}, selectEnabled => {
                colorizeSelectButton(selectEnabled);
                if (!selectEnabled) {
                    chrome.runtime.sendMessage({getConfig: {}}, config => updateUI(config));
                    chrome.runtime.sendMessage({markElements: {}});
                }
            }
        );
    };

    test.onclick = () => {
        test.disabled = true;
        chrome.runtime.sendMessage({markElements: {}}, () => {
            chrome.runtime.sendMessage({fillElement: {}}, () => {
                test.innerHTML = '&#10004;';
                setTimeout(() => {
                    test.innerText = 'fill';
                    test.disabled = false;
                }, 500);
            });
        });
    };

    save.onclick = () => {
        if (!form.checkValidity()) {
            return;
        }
        save.disabled = true;
        chrome.runtime.sendMessage({
                addRule: {
                    value: {
                        preset: preset.value,
                        value: value.value,
                        property: property.value,
                        click: click.checked,
                        selector: selector.value,
                        xpath: xpath.value,
                        index: index.value,
                        page: page.checked
                    }
                }
            }, () =>
                chrome.runtime.sendMessage({updateOptions: {}}, () => {
                    save.innerHTML = '&#10004;';
                    setTimeout(() => {
                        save.innerText = 'save';
                        save.disabled = false;
                    }, 500);
                })
        );
    };

    options.onclick = () => {
        chrome.runtime.sendMessage({openOptionsPage: {}});
    };

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.updatePopup) {
            value.value = request.updatePopup.value.value;
            property.value = request.updatePopup.value.property;
            click.checked = request.updatePopup.value.click;
            selector.value = request.updatePopup.value.selector;
            xpath.value = request.updatePopup.value.xpath;
            index.value = request.updatePopup.value.index;
            page.checked = true;
            disableValueAndPropertyField(click.checked);
            sendResponse();
        }
        return true;
    });

    chrome.runtime.sendMessage({injectContentScript: {}});
    chrome.runtime.sendMessage({getConfig: {}}, config => updateUI(config));

    function saveInputState(callback) {
        chrome.runtime.sendMessage({
            setPopup: {
                value: {
                    preset: preset.value,
                    value: value.value,
                    property: property.value,
                    click: click.checked,
                    selector: selector.value,
                    xpath: xpath.value,
                    index: index.value,
                    page: page.checked
                }
            }
        }, () => {
            if (callback) {
                callback();
            }
        })
    }

    function updateUI(config) {
        let addedPresets = {};
        colorizeSelectButton(config.selectEnabled);
        if (config.rules) {
            addedPresets = createPresetOptions(config.rules);
        }
        if (config.popup) {
            preset.value = addedPresets[config.popup.preset] ? config.popup.preset : '';
            value.value = config.popup.value;
            property.value = config.popup.property;
            click.checked = config.popup.click;
            selector.value = config.popup.selector;
            xpath.value = config.popup.xpath;
            index.value = config.popup.index;
            page.checked = config.popup.page;
            disableValueAndPropertyField(click.checked);
        }
    }

    function createPresetOptions(rules) {
        const addedPresets = {'': true};
        preset.innerHTML = null;
        preset.innerHTML = preset.innerHTML + '<option class="select-item" value="">default preset</option>';
        rules.forEach(rule => {
            const presetName = rule.preset || '';
            if (!addedPresets[presetName]) {
                addedPresets[presetName] = true;
                preset.innerHTML = preset.innerHTML + '<option class="select-item" value="' + presetName + '">' + presetName + '</option>';
            }
        });
        return addedPresets;
    }

    function disableValueAndPropertyField(clickEnabled) {
        if (clickEnabled) {
            value.disabled = true;
            property.disabled = true;
        } else {
            value.disabled = false;
            property.disabled = false;
        }
    }

    function colorizeSelectButton(selectEnabled) {
        if (selectEnabled) {
            select.style.backgroundColor = 'lightgreen';
        } else {
            select.style.backgroundColor = null;
        }
    }

    function setRequired(element) {
        element.required = true;
    }

    function setNotRequired(element) {
        element.required = false;
    }

    return {
    };

}();
