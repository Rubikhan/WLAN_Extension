let translationCache = {};

// localStorage translationCache exists?
const storedTranslationCache = localStorage.getItem('translationCache');
if (storedTranslationCache) {
  translationCache = JSON.parse(storedTranslationCache);
}

include('/reload/reload.js');
let autoTranslate = false;

//line em up
fetch('/config-lines')
    .then(response => response.json())
    .then(config => {
        const NO_OF_LINES = config.NO_OF_LINES || 18;
        const translationContainer = document.getElementById("translation-container");

        for (let i = 1; i <= NO_OF_LINES; i++) {
            const lineContainer = document.createElement('div');
            lineContainer.className = 'line-container';

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'buttons';

            const lineElement = document.createElement('p');
            lineElement.id = `line${i}`;
            lineElement.onclick = () => copyToClipboard(lineElement, lineContainer);

            const translationElement = document.createElement('p');
            translationElement.id = `translation${i}`;
            translationElement.onclick = () => copyToClipboard(translationElement, lineContainer);

            const buttonFoo = document.createElement('button');
            buttonFoo.textContent = 'Copy のだ';
            buttonFoo.onclick = copyToClipboardFoo;

            const buttonBar = document.createElement('button');
            buttonBar.textContent = 'Copy なのだ';
            buttonBar.onclick = copyToClipboardBar;

            const gptButton = document.createElement('button');
            gptButton.textContent = 'GEEPEE Translate (1 line)';
            gptButton.onclick = () => translateCurrentLine(i, 'geepeetee4');

            const claudeButton = document.createElement('button');
            claudeButton.textContent = 'CLAWDY Translate (1 line)';
            claudeButton.onclick = () => translateCurrentLine(i, 'clawdy');

            buttonContainer.appendChild(buttonFoo);
            buttonContainer.appendChild(buttonBar);
            buttonContainer.appendChild(gptButton);
            buttonContainer.appendChild(claudeButton);

            lineContainer.appendChild(buttonContainer);
            lineContainer.appendChild(lineElement);
            lineContainer.appendChild(translationElement);

            translationContainer.appendChild(lineContainer);

            loadDoc(`line${i}`, i);
        }
    })
    .catch(error => console.error('Error loading config:', error));

async function translateText(text, numLines, apiDesig) {
    const response = await fetch(`/translate?text=${encodeURIComponent(text)}&numLines=${numLines}&apiDesig=${apiDesig}`);
    const data = await response.json();
    return data;
}

function applyTranslationToLine(lineElement, translationElement) {
    const lineText = lineElement.innerText;
    const cachedTranslation = translationCache[lineText];

    if (cachedTranslation) {
        translationElement.innerText = cachedTranslation.translation;
    } else {
        translationElement.innerText = ''; // clear previous translation if not in cache
    }
}

function translateCurrentLine(numLines, apiDesig) {
    const lineElement = document.getElementById(`line${numLines}`);
    const currentLine = lineElement.innerText;
    const translationElement = document.getElementById(`translation${numLines}`);
	
    // check if the cached translation exists and is from the same API
    let cachedTranslation = translationCache[currentLine];
    if (cachedTranslation && cachedTranslation.source === apiDesig) {
        translationElement.innerText = cachedTranslation.translation;
    } else {
        // get a new translation
        translateText(currentLine, numLines, apiDesig)
            .then(translation => {
                translationElement.innerText = translation;
                // update the cache with new translation and source
                translationCache[currentLine] = { translation: translation, source: apiDesig };
                localStorage.setItem('translationCache', JSON.stringify(translationCache));
            })
            .catch(error => {
                console.error('Translation error:', error);
            });
    }
}

function toggleAutoTranslate() {
    autoTranslate = !autoTranslate;
    if (autoTranslate) {
        startAutoTranslate();
    }
}

function startAutoTranslate() {
    if (autoTranslate) {
        translateCurrentLine(1);
        setTimeout(startAutoTranslate, 5000);
    }
}

function include(file) {
    var script = document.createElement('script');
    script.src = file;
    script.type = 'text/javascript';
    script.defer = true;
    document.getElementsByTagName('head').item(0).appendChild(script);
}

function loadDoc(filename, lineNumber) {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        const lineElement = document.getElementById(`line${lineNumber}`);
        const translationElement = document.getElementById(`translation${lineNumber}`);
        lineElement.innerText = this.responseText;
        applyTranslationToLine(lineElement, translationElement);
    }
    xhttp.open("GET", "text/" + filename);
    xhttp.send();
}

window.addEventListener('beforeunload', () => {
    localStorage.setItem('translationCache', JSON.stringify(translationCache));
});

function getPunctuationAndStrip(text) {
    const japanesePunctuationRegex = /([。、？！・・・…]+)$/;
    const match = text.match(japanesePunctuationRegex);
    const punctuation = match ? match[1] : '';
    const newText = text.replace(japanesePunctuationRegex, '');
    return { newText, punctuation };
}

function copyToClipboardFoo() {
    const el = document.createElement("textarea");
    const originalText = event.target.parentNode.querySelector('p').innerHTML;
    const { newText, punctuation } = getPunctuationAndStrip(originalText);
    el.value = newText + "のだ" + punctuation;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
}

function copyToClipboardBar() {
    const el = document.createElement("textarea");
    const originalText = event.target.parentNode.querySelector('p').innerHTML;
    const { newText, punctuation } = getPunctuationAndStrip(originalText);
    el.value = newText + "なのだ" + punctuation;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
}

function copyToClipboard(element, container) {
    const el = document.createElement("textarea");
    el.value = element.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);

    //visual feedback
    container.classList.add('copied');
    setTimeout(() => container.classList.remove('copied'), 2000);
}
