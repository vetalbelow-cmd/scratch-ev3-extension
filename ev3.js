(function(ext) {
    // Очищаем предыдущую версию
    if (window.EV3_EXT) window.EV3_EXT = null;
    
    // Состояние
    var device = null;
    var connected = false;
    
    // Функции для блоков
    ext.motorOn = function(port, power, callback) {
        console.log(`Motor ${port} at ${power}%`);
        if (callback) callback();
    };
    
    ext.beep = function(callback) {
        console.log("BEEP!");
        if (callback) callback();
    };
    
    ext.getDistance = function() {
        // Симуляция датчика расстояния
        return Math.floor(Math.random() * 100);
    };
    
    ext.isPressed = function() {
        // Симуляция датчика касания
        return Math.random() > 0.7;
    };
    
    // Описание блоков
    var descriptor = {
        blocks: [
            [' ', 'Включить мотор %m.ports на %n%', 'motorOn', 'A', 50],
            [' ', 'Пикнуть', 'beep'],
            ['r', 'Расстояние (см)', 'getDistance'],
            ['b', 'Кнопка нажата?', 'isPressed']
        ],
        menus: {
            ports: ['A', 'B', 'C', 'D']
        },
        url: 'https://github.com/ваш-логин/scratch-ev3-extension'
    };
    
    // Регистрация
    ScratchExtensions.register('EV3 Control', descriptor, ext);
    
    // Сохраняем ссылку для отладки
    window.EV3_EXT = ext;
    
})({});
