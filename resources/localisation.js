
/**
 * Function that finds the object with id and replaces the text for it
 * @param {*} strToReplace 
 * @param {*} replaceText 
 */
function replaceValue(id, replaceText) {
    let element = document.querySelector(`#${id}`);
    if (element) {
        element.innerHTML = replaceText;
    } else {
        console.log(`Element with id ${id} not found`);
    }
}


// en, de, ru, ua
// lang: {elementId: textToReplace}
const localisation = {
    "en": {
        "bot-control-panel-header": "Bot Control Panel",
        "running-bots": "Currently running: ",
        "running-bots-bots": " bot(s)",
        "start-button": "Start",
        "restart-system-button": "Restart",
        "set-username-button": "Set Username",
        "selected-language-header": "Selected language: ",
        "en-button": "English",
        "language-selector": "English",
    },
    "de": {
        "bot-control-panel-header": "Bot Kontrollzentrum",
        "running-bots": "Aktuell laufen: ",
        "running-bots-bots": " Bot(s)",
        "start-button": "Start",
        "restart-system-button": "Neustart",
        "set-username-button": "Benutzernamen setzen",
        "selected-language-header": "Ausgewählte Sprache: ",
        "de-button": "Deutsch",
        "language-selector": "Deutsch",
    },
    "ru": {
        "bot-control-panel-header": "Панель управления ботами",
        "running-bots": "В настоящее время работает: ",
        "running-bots-bots": " бот(ов)",
        "start-button": "Начать",
        "restart-system-button": "Перезагрузить",
        "set-username-button": "Установить имя пользователя",
        "selected-language-header": "Выбранный язык:",
        "ru-button": "Русский",
        "language-selector": "Русский",
    },
    "ua": {
        "bot-control-panel-header": "Панель управління ботами",
        "running-bots": "Наразі працює: ",
        "running-bots-bots": " бот(ів)",
        "start-button": "Почати",
        "restart-system-button": "Перезавантажити",
        "set-username-button": "Встановити ім'я користувача",
        "selected-language-header": "Обрана мова:",
        "ua-button": "Українська",
        "language-selector": "Українська",
    }
}

// iterate through the localisation object and replace the text
function localise(lang = 'en') {
    for (var key in localisation[lang])
        if (localisation[lang].hasOwnProperty(key))
            replaceValue(key, localisation[lang][key]);
}


function runInInterval() {
    let lang = localStorage.getItem('selected-language') || 'en';
    localise(lang);
}
setTimeout(runInInterval, 1); // run once on page load
setInterval(runInInterval, 200);