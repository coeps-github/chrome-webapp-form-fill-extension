document.onclick = event => {
    chrome.runtime.sendMessage({getAiEnabled: {}}, aiEnabled => {
        if (aiEnabled) {
            let value = '0';
            let property = '1';
            let selector = '2';
            let index = '3';
            let page = true;
            chrome.runtime.sendMessage({setAiEnabled: {value: false}}, () =>
                chrome.runtime.sendMessage({
                    setPopup: {
                        value: {
                            value: value,
                            property: property,
                            selector: selector,
                            index: index,
                            page: page
                        }
                    }
                }, () => {})
            );
        }
    });
};

document.onmouseover = event => {
    chrome.runtime.sendMessage({getAiEnabled: {}}, aiEnabled => {
        if (aiEnabled) {
            markElement(event.target);
        }
    });
};

function markElement(target) {
    const markedElements = document.querySelectorAll('.mark');
    markedElements.forEach(element => element.classList.remove('mark'));
    target.classList.add('mark');
}
