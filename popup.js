const fill = document.getElementById('fill');
const value = document.getElementById('value');
const property = document.getElementById('property');
const selector = document.getElementById('selector');
const index = document.getElementById('index');
const page = document.getElementById('page');
const ai = document.getElementById('ai');
const save = document.getElementById('save');
const options = document.getElementById('options');

chrome.runtime.sendMessage({getConfig: {}}, config => {
    colorizeAiButton(config.aiEnabled);

    if (config.popup) {
        property.value = config.popup.property;
        selector.value = config.popup.selector;
        index.value = config.popup.index;
    }
});

fill.onclick = () => {
    fill.disabled = true;
    chrome.runtime.sendMessage({getUrl: {}}, url =>
        chrome.runtime.sendMessage({getRules: {}}, rules =>
            rules.forEach(rule => {
                if (!rule.page || (rule.page && rule.page === url)) {
                    chrome.runtime.sendMessage({executeScript: {value: fillElements(rule.value, rule.property, rule.selector, rule.index)}}, () => {
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

selector.oninput = (event) => {
    if (event.target.value) {
        chrome.runtime.sendMessage({executeScript: {value: markElements(event.target.value, index.value)}});
    }
};

index.oninput = (event) => {
    if (event.target.value) {
        chrome.runtime.sendMessage({executeScript: {value: markElements(selector.value, event.target.value)}});
    }
};

ai.onclick = () => {
    chrome.runtime.sendMessage({getAiEnabled: {}}, aiEnabled =>
        chrome.runtime.sendMessage({setAiEnabled: {value: !aiEnabled}}, () => {
            colorizeAiButton(!aiEnabled);
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

function colorizeAiButton(aiEnabled) {
    if (aiEnabled) {
        document.getElementById('ai').style.backgroundColor = 'lightgreen';
    } else {
        document.getElementById('ai').style.backgroundColor = null;
    }
}

function markElements(selector, index) {
    return '{' +
        'const markedElements = document.querySelectorAll(\'.mark\');' +
        'markedElements.forEach(element => element.classList.remove(\'mark\'));' +
        'const elements = document.querySelectorAll(\'' + selector + '\');' +
        'elements.forEach((element, i) => {' +
        (
            index ?
                'if (i === ' + index + ') {' +
                'element.classList.add(\'mark\');' +
                '}' :
                'element.classList.add(\'mark\');'
        ) +
        '});' +
        '}';
}

function fillElements(value, property, selector, index) {
    let val = value !== 'true' && value !== 'false' && isNaN(value) ? '\'' + value + '\'' : value;
    return '{' +
        'const elements = document.querySelectorAll(\'' + selector + '\');' +
        'elements.forEach((element, i) => {' +
        (
            index ?
                'if (i === ' + index + ') {' +
                'element.' + property + ' = ' + val + ';' +
                '}' :
                'element.' + property + ' = ' + val + ';'
        ) +
        'element.dispatchEvent(new Event(\'input\'));' +
        '});' +
        '}';
}
