/* function stripJapanesePunctuation(text) {
    const japanesePunctuationRegex = /[。、？！・・・]/g;
    if (text.length <= 5) {
        return text.replace(japanesePunctuationRegex, '');
    } else {
        const lastFiveChars = text.slice(-5).replace(japanesePunctuationRegex, '');
        return text.slice(0, -5) + lastFiveChars;
    }
}

function copyToClipboardFoo() {
    const el = document.createElement("textarea");
    const originalText = event.target.parentNode.querySelector('p').innerHTML;
    el.value = stripJapanesePunctuation(originalText) + "のだ";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
}

function copyToClipboardBar() {
    const el = document.createElement("textarea");
    const originalText = event.target.parentNode.querySelector('p').innerHTML;
    el.value = stripJapanesePunctuation(originalText) + "なのだ";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
}
*/

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


function copyToClipboard() {
	const el = document.createElement("textarea");
	el.value = event.target.innerHTML;
	document.body.appendChild(el);
	el.select();
	document.execCommand("copy");
	document.body.removeChild(el);
}

/*
function copyToClipboardFoo() {
	const el = document.createElement("textarea");
	el.value = event.target.parentNode.querySelector('p').innerHTML + "のだ";
	document.body.appendChild(el);
	el.select();
	document.execCommand("copy");
	document.body.removeChild(el);
}

function copyToClipboardBar() {
	const el = document.createElement("textarea");
	el.value = event.target.parentNode.querySelector('p').innerHTML + "なのだ";
	document.body.appendChild(el);
	el.select();
	document.execCommand("copy");
	document.body.removeChild(el);
} */