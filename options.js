window['com'] = window['com'] || {};
window.com['coeps'] = window.com['coeps'] || {};
window.com.coeps['waff'] = window.com.coeps['waff'] || {};
window.com.coeps.waff['options'] = window.com.coeps.waff['options'] || function () {

    const form = document.getElementById('form');
    const config = document.getElementById('config');
    const addForm = document.getElementById('addForm');
    const addPreset = document.getElementById('addpreset');
    const addValue = document.getElementById('addvalue');
    const addProperty = document.getElementById('addproperty');
    const addClick = document.getElementById('addclick');
    const addSelector = document.getElementById('addselector');
    const addXpath = document.getElementById('addxpath');
    const addIndex = document.getElementById('addindex');
    const addUrl = document.getElementById('addurl');
    const add = document.getElementById('add');
    const save = document.getElementById('save');
    const clear = document.getElementById('clear');
    const reset = document.getElementById('reset');
    const exp = document.getElementById('export');
    const imp = document.getElementById('import');
    const importResult = document.getElementById('import-result');

    let currentIndex = 0;

    addClick.onchange = () => {
        disableAddValueAndPropertyField(addValue, addProperty, addClick.checked);
    };

    addSelector.oninput = () => {
        setSelectorAndXpathFieldRequired(addSelector, addXpath);
    };

    addXpath.oninput = () => {
        setSelectorAndXpathFieldRequired(addSelector, addXpath);
    };

    add.onclick = () => {
        if (!addForm.checkValidity()) {
            return;
        }
        add.disabled = true;
        config.innerHTML = createConfigEntry({
            preset: addPreset.value,
            value: addValue.value,
            property: addProperty.value,
            click: addClick.checked,
            selector: addSelector.value,
            xpath: addXpath.value,
            index: addIndex.value,
            url: addUrl.value
        }, currentIndex) + config.innerHTML;
        currentIndex++;
        initializeAddFields();
        connectActionListeners();
        add.innerHTML = '&#10004;';
        setTimeout(() => {
            add.innerText = 'add';
            add.disabled = false;
        }, 500);
    };

    save.onclick = () => {
        if (!form.checkValidity()) {
            return;
        }
        save.disabled = true;
        const preset = document.querySelectorAll('[id^=preset]');
        const value = document.querySelectorAll('[id^=value]');
        const property = document.querySelectorAll('[id^=property]');
        const click = document.querySelectorAll('[id^=click]');
        const selector = document.querySelectorAll('[id^=selector]');
        const xpath = document.querySelectorAll('[id^=xpath]');
        const index = document.querySelectorAll('[id^=index]');
        const url = document.querySelectorAll('[id^=url]');
        const data = {
            setRules: {
                value: []
            }
        };
        for (let i = 0; i < value.length; i++) {
            data.setRules.value.push({
                preset: preset[i].value,
                value: value[i].value,
                property: property[i].value,
                click: click[i].checked,
                selector: selector[i].value,
                xpath: xpath[i].value,
                index: index[i].value,
                url: url[i].value,
            });
        }
        chrome.runtime.sendMessage(data, () => {
            save.innerHTML = '&#10004;';
            setTimeout(() => {
                save.innerText = 'save';
                save.disabled = false;
            }, 500);
        });
    };

    clear.onclick = () => {
        clear.disabled = true;
        config.innerHTML = null;
        clear.innerHTML = '&#10004;';
        setTimeout(() => {
            clear.innerText = 'clear';
            clear.disabled = false;
        }, 500);
    };

    reset.onclick = () => {
        reset.disabled = true;
        initializeAddFields();
        createConfigEntries();
        reset.innerHTML = '&#10004;';
        setTimeout(() => {
            reset.innerText = 'reset';
            reset.disabled = false;
        }, 500);
    };

    exp.onclick = event => {
        exp.style.background = '#505050';
        event.preventDefault();
        chrome.runtime.sendMessage({getRules: {}}, rules => {
            const href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules));
            exp.setAttribute('href', href);
            exp.innerHTML = '&#10004;';
            setTimeout(() => {
                exp.innerText = 'export';
                exp.style.background = null;
                exp.onclick = null;
                exp.click();
            }, 500);
        });
    };

    imp.onchange = event => {
        const files = event.target.files;
        const reader = new FileReader();
        const errorHandler = () => importResult.innerHTML = '&#10006;';
        reader.onload = () => {
            try {
                const text = reader.result;
                const rules = JSON.parse(text);
                chrome.runtime.sendMessage({
                    setRules: {
                        value: rules
                    }
                }, () => {
                    initializeAddFields();
                    createConfigEntries();
                    importResult.innerHTML = '&#10004;';
                });
            } catch {
                errorHandler();
            }
        };
        reader.onabort = errorHandler;
        reader.onerror = errorHandler;
        if (files.length > 0) {
            reader.readAsText(files[0]);
        }
    };

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.updateOptions) {
            initializeAddFields();
            createConfigEntries();
            sendResponse();
        }
        return true;
    });

    initializeAddFields();
    createConfigEntries();

    function initializeAddFields() {
        resetAddFields();
        disableAddValueAndPropertyField(addValue, addProperty, addClick.checked);
        setSelectorAndXpathFieldRequired(addSelector, addXpath);
    }

    function resetAddFields() {
        addPreset.value = '';
        addValue.value = '';
        addProperty.value = '';
        addClick.checked = false;
        addSelector.value = '';
        addXpath.value = '';
        addIndex.value = '';
        addUrl.value = '';
    }

    function createConfigEntries() {
        chrome.runtime.sendMessage({getRules: {}}, rules => {
            config.innerHTML = null;
            rules.forEach(rule => {
                config.innerHTML = config.innerHTML + createConfigEntry(rule, currentIndex);
                currentIndex++;
            });
            connectActionListeners();
        });
    }

    function connectActionListeners() {
        document.querySelectorAll('[id^=click]')
            .forEach(click =>
                click.onchange = () => {
                    const id = click.id.replace('click', '');
                    const value = document.getElementById('value' + id);
                    const property = document.getElementById('property' + id);
                    disableAddValueAndPropertyField(value, property, click.checked);
                }
            );
        document.querySelectorAll('[id^=delete]')
            .forEach(del =>
                del.onclick = () =>
                    config.removeChild(document.getElementById(del.parentElement.parentElement.id))
            );
        document.querySelectorAll('[id^=up]')
            .forEach(up =>
                up.onclick = () => {
                    const me = document.getElementById(up.parentElement.parentElement.parentElement.id);
                    const myIndex = getElementIndex(me);
                    moveChildToIndex(config, me, myIndex - 1);
                }
            );
        document.querySelectorAll('[id^=down]')
            .forEach(down =>
                down.onclick = () => {
                    const me = document.getElementById(down.parentElement.parentElement.parentElement.id);
                    const myIndex = getElementIndex(me);
                    moveChildToIndex(config, me, myIndex + 1);
                }
            );
        document.querySelectorAll('[id^=selector]')
            .forEach(selector =>
                selector.oninput = () => {
                    const id = selector.id.replace('selector', '');
                    const xpath = document.getElementById('xpath' + id);
                    setSelectorAndXpathFieldRequired(selector, xpath);
                }
            );
        document.querySelectorAll('[id^=xpath]')
            .forEach(xpath =>
                xpath.oninput = () => {
                    const id = xpath.id.replace('xpath', '');
                    const selector = document.getElementById('selector' + id);
                    setSelectorAndXpathFieldRequired(selector, xpath);
                }
            );
    }

    function createConfigEntry(rule, index) {
        return '<div id="entry' + index + '" class="flex flex--center">' +
            '    <div class="inline-flex flex--center flex--wrap space-bottom-bigger">' +
            '        <label class="space-right">' +
            '            <input id="preset' + index + '" class="input" type="text" placeholder="Preset name (empty is default)" value="' + rule.preset + '" autocomplete="preset">' +
            '        </label>' +
            '        <label class="space-right">' +
            '            <input id="value' + index + '" class="input" type="text" placeholder="Value e.g. Hello" value="' + rule.value + '"  ' + (rule.click ? 'disabled' : '') + ' autocomplete="value">' +
            '        </label>' +
            '        <label class="space-right">' +
            '            <input id="property' + index + '" class="input input--short" type="text" placeholder="Property e.g. value" value="' + rule.property + '" ' + (rule.click ? 'disabled' : '') + ' autocomplete="property" required>' +
            '        </label>' +
            '        <input id="click' + index + '" class="checkbox" type="checkbox" ' + (rule.click ? 'checked' : '') + '>' +
            '        <label for="click' + index + '" class="checkbox-label space-right">dispatch click event</label>' +
            '        <label class="space-right">' +
            '            <input id="selector' + index + '" class="input" type="text" placeholder="Selector e.g. input[type=text]" value="' + rule.selector + '" autocomplete="selector" ' + (!rule.xpath ? 'required' : '') + '>' +
            '        </label>' +
            '        <label class="space-right">' +
            '            <input id="xpath' + index + '" class="input" type="text" placeholder="XPath e.g. //div[contains(.,\'Hello\')]" value="' + rule.xpath + '" autocomplete="xpath" ' + (!rule.selector ? 'required' : '') + '>' +
            '        </label>' +
            '        <label class="space-right">' +
            '            <input id="index' + index + '" class="input input--shorter" type="text" placeholder="Index e.g. 3" value="' + rule.index + '" autocomplete="index">' +
            '        </label>' +
            '        <label class="space-right">' +
            '            <input id="url' + index + '" class="input input--long" type="text" placeholder="Page URL (leave empty to apply everywhere)" value="' + rule.url + '" autocomplete="url">' +
            '        </label>' +
            '        <button id="delete' + index + '" type="button" class="button space-right">delete</button>' +
            '        <div class="inline-flex flex--column">' +
            '            <button id="up' + index + '" type="button" class="button button--small space-bottom-ultra-small">&#9651;</button>' +
            '            <button id="down' + index + '" type="button" class="button button--small">&#9661;</button>' +
            '        </div>' +
            '    </div>' +
            '</div>';
    }

    function disableAddValueAndPropertyField(value, property, disabled) {
        value.disabled = disabled;
        property.disabled = disabled;
    }

    function setSelectorAndXpathFieldRequired(selector, xpath) {
        selector.required = !xpath.value;
        xpath.required = !selector.value;
    }

    function getElementIndex(element) {
        let index = 0;
        while ((element = element.previousElementSibling)) {
            index++;
        }
        return index;
    }

    function moveChildToIndex(parent, child, index) {
        parent.removeChild(child);
        if (index < 0) {
            parent.appendChild(child);
        }
        if (index > parent.children.length) {
            index = 0;
        }
        parent.insertBefore(child, parent.children[index]);
    }

}();
