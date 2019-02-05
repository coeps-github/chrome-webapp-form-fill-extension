const form = document.getElementById('form');
const preset = document.getElementById('preset');
const fill = document.getElementById('fill');
const value = document.getElementById('value');
const property = document.getElementById('property');
const click = document.getElementById('click');
const selector = document.getElementById('selector');
const index = document.getElementById('index');
const page = document.getElementById('page');
const select = document.getElementById('select');
const save = document.getElementById('save');
const options = document.getElementById('options');

fill.onclick = () => {
    fill.disabled = true;
    chrome.runtime.sendMessage({
        fillElements: {
            value: {
                preset: preset.value
            }
        }
    }, () => {
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
    saveInputState(() => chrome.runtime.sendMessage({markElements: {}}));
};

index.oninput = () => {
    saveInputState(() => chrome.runtime.sendMessage({markElements: {}}));
};

page.onchange = () => {
    saveInputState();
};

select.onclick = () => {
    chrome.runtime.sendMessage({getSelectEnabled: {}}, selectEnabled =>
        chrome.runtime.sendMessage({setSelectEnabled: {value: !selectEnabled}}, () => {
            colorizeSelectButton(!selectEnabled);
            chrome.runtime.sendMessage({markElements: {}});
        })
    );
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
                    index: index.value,
                    page: page.checked
                }
            }
        }, () =>
            chrome.runtime.sendMessage({update: {value: 'options'}}, () => {
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
    if (request.update && request.update.value === 'popup') {
        preset.value = request.update.popup.preset;
        value.value = request.update.popup.value;
        property.value = request.update.popup.property;
        click.checked = request.update.popup.click;
        selector.value = request.update.popup.selector;
        index.value = request.update.popup.index;
        page.checked = request.update.popup.page;
        disableValueAndPropertyField(click.checked);
        sendResponse();
    }
    return true;
});

chrome.runtime.sendMessage({getConfig: {}}, config => {
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
        index.value = config.popup.index;
        page.checked = config.popup.page;
        disableValueAndPropertyField(click.checked);
    }
});

function saveInputState(callback) {
    chrome.runtime.sendMessage({
        setPopup: {
            value: {
                preset: preset.value,
                value: value.value,
                property: property.value,
                click: click.checked,
                selector: selector.value,
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
