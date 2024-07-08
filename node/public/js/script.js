let translationCache = {};

// Load translationCache from localStorage if available
const storedTranslationCache = localStorage.getItem('translationCache');
if (storedTranslationCache) {
  translationCache = JSON.parse(storedTranslationCache);
}

include('/reload/reload.js');
NO_OF_LINES = 18;
let autoTranslate = false;

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
        translationElement.innerText = ''; // Clear previous translation if not in cache
    }
}

function translateCurrentLine(numLines, apiDesig) {
    const lineElement = document.getElementById(`line${numLines}`);
    const currentLine = lineElement.innerText;
    const translationElement = document.getElementById(`translation${numLines}`);
	
    // Check if the cached translation exists and is from the same API
    let cachedTranslation = translationCache[currentLine];
    if (cachedTranslation && cachedTranslation.source === apiDesig) {
        translationElement.innerText = cachedTranslation.translation;
    } else {
        // Fetch a new translation
        translateText(currentLine, numLines, apiDesig)
            .then(translation => {
                translationElement.innerText = translation;
                // Update the cache with new translation and source
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

for (var i = 1; i <= 18; i++) {
    loadDoc("line" + i.toString(), i);
}

window.addEventListener('beforeunload', () => {
  localStorage.setItem('translationCache', JSON.stringify(translationCache));
});