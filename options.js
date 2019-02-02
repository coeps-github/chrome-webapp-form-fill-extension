const config = document.getElementById('config');
const add = document.getElementById('add');
const save = document.getElementById('save');
const clear = document.getElementById('clear');

let currentIndex = 0;

add.onclick = () => {
    add.disabled = true;
    config.innerHTML = config.innerHTML + createConfigEntry({
        value: document.getElementById('addvalue').value,
        property: document.getElementById('addproperty').value,
        selector: document.getElementById('addselector').value,
        index: document.getElementById('addindex').value,
        page: document.getElementById('addpage').value
    }, currentIndex);
    currentIndex++;
    connectDeleteListener();
    add.innerHTML = '&#10004;';
    setTimeout(() => {
        add.innerText = 'add';
        add.disabled = false;
    }, 500);
};

save.onclick = () => {
    save.disabled = true;
    const value = document.querySelectorAll('[id^=value]');
    const property = document.querySelectorAll('[id^=property]');
    const selector = document.querySelectorAll('[id^=selector]');
    const index = document.querySelectorAll('[id^=index]');
    const page = document.querySelectorAll('[id^=page]');
    const data = {
        setRules: {
            value: []
        }
    };
    for (let i = 0; i < value.length; i++) {
        data.setRules.value.push({
            value: value[i].value,
            property: property[i].value,
            selector: selector[i].value,
            index: index[i].value,
            page: page[i].value,
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
    chrome.runtime.sendMessage({setConfig: {value: null}}, () => {
        config.innerHTML = null;
        clear.innerHTML = '&#10004;';
        setTimeout(() => {
            clear.innerText = 'clear';
            clear.disabled = false;
        }, 500);
    });
};

chrome.runtime.onMessage.addListener(request => {
    if (request.update) {
        createConfigEntries();
    }
    return true;
});

createConfigEntries();

function createConfigEntries() {
    chrome.runtime.sendMessage({getRules: {}}, rules => {
        config.innerHTML = null;
        rules.forEach(rule => {
            config.innerHTML = config.innerHTML + createConfigEntry(rule, currentIndex);
            currentIndex++;
        });
        connectDeleteListener();
    });
}

function connectDeleteListener() {
    document.querySelectorAll('[id^=delete]')
        .forEach(del =>
            del.onclick = () =>
                config.removeChild(document.getElementById(del.parentElement.parentElement.id))
        );
}

function createConfigEntry(rule, index) {
    return '<div id="entry' + index + '" class="flex-center">' +
        '    <div class="space-bottom-bigger">' +
        '        <label class="space-right">' +
        '            <input id="value' + index + '" class="input" type="text" placeholder="Value e.g. Test" value="' + rule.value + '">' +
        '        </label>' +
        '        <label class="space-right">' +
        '            <input id="property' + index + '" class="input input--short" type="text" placeholder="Property e.g. value" value="' + rule.property + '">' +
        '        </label>' +
        '        <label class="space-right">' +
        '            <input id="selector' + index + '" class="input" type="text" placeholder="Selector e.g. input[type=text]" value="' + rule.selector + '">' +
        '        </label>' +
        '        <label class="space-right">' +
        '            <input id="index' + index + '" class="input input--shorter" type="text" placeholder="Index e.g. 3" value="' + rule.index + '">' +
        '        </label>' +
        '        <label class="space-right">' +
        '            <input id="page' + index + '" class="input input--long" type="text" placeholder="Page URL (leave empty to apply everywhere)" value="' + rule.page + '">' +
        '        </label>' +
        '        <button id="delete' + index + '" class="button">delete</button>' +
        '    </div>' +
        '</div>';
}
