// EV3 Test Extension
(function(ext) {
    // Удаляем когда будет готов полный код
    console.log('EV3 Extension loading...');
    
    // Простая тестовая функция
    ext.test = function() {
        console.log('EV3 Extension работает!');
        alert('EV3 Extension работает!');
    };
    
    // Блок для мотора
    ext.motorOn = function(port, power) {
        console.log('Мотор ' + port + ' мощность: ' + power + '%');
    };
    
    // Описание блоков для Scratch
    var descriptor = {
        blocks: [
            [' ', 'Тест расширения', 'test'],
            [' ', 'Мотор %m.ports мощность %n%', 'motorOn', 'A', 50]
        ],
        menus: {
            ports: ['A', 'B', 'C', 'D']
        }
    };
    
    // Регистрация расширения
    if (typeof Scratch !== 'undefined') {
        Scratch.extensions.register(descriptor, ext);
    } else if (typeof ScratchExtensions !== 'undefined') {
        ScratchExtensions('EV3', descriptor, ext);
    }
    
    console.log('EV3 Extension загружено!');
    
})({});
