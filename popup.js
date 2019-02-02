const fill = document.getElementById('fill');
const value = document.getElementById('value');
const property = document.getElementById('property');
const selector = document.getElementById('selector');
const index = document.getElementById('index');
const page = document.getElementById('page');
const select = document.getElementById('select');
const save = document.getElementById('save');
const options = document.getElementById('options');

chrome.runtime.sendMessage({getConfig: {}}, config => {
    colorizeSelectButton(config.selectEnabled);

    if (config.popup) {
        value.value = config.popup.value;
        property.value = config.popup.property;
        selector.value = config.popup.selector;
        index.value = config.popup.index;
        page.checked = config.popup.page;
    }
});

fill.onclick = () => {
    fill.disabled = true;
    chrome.runtime.sendMessage({getUrl: {}}, url =>
        chrome.runtime.sendMessage({getRules: {}}, rules =>
            rules.forEach(rule => {
                if (!rule.page || (rule.page && rule.page === url)) {
                    chrome.runtime.sendMessage({fillElements: {}}, () => {
                        fill.innerHTML = '&#10004;';
                        setTimeout(() => {
                            fill.innerText = 'fill';
                            fill.disabled = false;
                        }, 500);
                    });
                }
            })
        )
    );
};

value.oninput = () => {
    saveInputState();
};

property.oninput = () => {
    saveInputState();
};

selector.oninput = () => {
    saveInputState();
    chrome.runtime.sendMessage({markElements: {selector: selector.value, index: index.value}});
};

index.oninput = () => {
    saveInputState();
    chrome.runtime.sendMessage({markElements: {selector: selector.value, index: index.value}});
};

page.onchange = () => {
    saveInputState();
};

select.onclick = () => {
    chrome.runtime.sendMessage({getSelectEnabled: {}}, selectEnabled =>
        chrome.runtime.sendMessage({setSelectEnabled: {value: !selectEnabled}}, () => {
            colorizeSelectButton(!selectEnabled);
        })
    );
};

save.onclick = () => {
    save.disabled = true;
    chrome.runtime.sendMessage({getUrl: {}}, url =>
        chrome.runtime.sendMessage({
                addRule: {
                    value: {
                        value: value.value,
                        property: property.value,
                        selector: selector.value,
                        index: index.value,
                        page: page.checked ? url : '',
                    }
                }
            }, () =>
                chrome.runtime.sendMessage({update: {}}, () => {
                    save.innerHTML = '&#10004;';
                    setTimeout(() => {
                        save.innerText = 'save';
                        save.disabled = false;
                    }, 500);
                })
        )
    );
};

options.onclick = () => {
    chrome.runtime.sendMessage({openOptionsPage: {}});
};

function saveInputState() {
    chrome.runtime.sendMessage({
        setPopup: {
            value: {
                value: value.value,
                property: property.value,
                selector: selector.value,
                index: index.value,
                page: page.checked
            }
        }
    }, () => {
    })
}

function colorizeSelectButton(selectEnabled) {
    if (selectEnabled) {
        document.getElementById('select').style.backgroundColor = 'lightgreen';
    } else {
        document.getElementById('select').style.backgroundColor = null;
    }
}
