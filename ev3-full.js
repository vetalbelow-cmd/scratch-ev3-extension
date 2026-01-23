// EV3 Extension - COMPATIBLE WITH SCRATCH 3
(function(ext) {
    console.log('EV3 Extension loading...');
    
    // === ПРОСТЫЕ ФУНКЦИИ (старый формат) ===
    
    // Функции должны принимать параметры напрямую, не через args
    ext.test = function() {
        console.log('EV3 тест работает!');
    };
    
    ext.motorOnForSeconds = function(port, power, seconds) {
        console.log('Мотор ' + port + ': ' + power + '% на ' + seconds + 'сек');
    };
    
    ext.motorOnForDegrees = function(port, degrees, power) {
        console.log('Мотор ' + port + ': ' + power + '% на ' + degrees + '°');
    };
    
    ext.setMotorPower = function(port, power) {
        console.log('Мотор ' + port + ' мощность: ' + power + '%');
    };
    
    ext.getColor = function(port) {
        console.log('Датчик цвета порт ' + port);
        return Math.floor(Math.random() * 8); // 0-7
    };
    
    ext.getReflectedLight = function(port) {
        console.log('Датчик отражения порт ' + port);
        return Math.floor(Math.random() * 101); // 0-100
    };
    
    ext.stopMotor = function(port) {
        console.log('Мотор ' + port + ': остановлен');
    };
    
    ext.stopAllMotors = function() {
        console.log('Все моторы остановлены');
    };
    
    ext.setMotorDirection = function(port, direction) {
        console.log('Мотор ' + port + ' направление: ' + direction);
    };
    
    // === ОПИСАНИЕ БЛОКОВ (СТАРЫЙ ФОРМАТ Scratch 2) ===
    // Turbowarp лучше работает со старым форматом
    
    var descriptor = {
        blocks: [
            // Команды
            [' ', 'Тест расширения', 'test'],
            [' ', 'Мотор %m.ports мощность %n% на %n секунд', 'motorOnForSeconds', 'A', 50, 1],
            [' ', 'Мотор %m.ports на %n градусов мощность %n%', 'motorOnForDegrees', 'A', 90, 50],
            [' ', 'Установить мотор %m.ports мощность %n%', 'setMotorPower', 'A', 50],
            [' ', 'Установить мотор %m.ports направление %m.directions', 'setMotorDirection', 'A', 'forward'],
            [' ', 'Остановить мотор %m.ports', 'stopMotor', 'A'],
            [' ', 'Остановить все моторы', 'stopAllMotors'],
            
            // Датчики (репортеры)
            ['r', 'Датчик цвета (порт %n) цвет', 'getColor', 1],
            ['r', 'Датчик цвета (порт %n) отражение %', 'getReflectedLight', 1],
            
            // Хата-блок (информация)
            ['h', 'EV3 Control v1.0', 'test']
        ],
        menus: {
            ports: ['A', 'B', 'C', 'D'],
            directions: ['forward', 'backward']
        },
        url: 'https://github.com/vetalbelow-cmd/scratch-ev3-extension'
    };
    
    // === РЕГИСТРАЦИЯ (универсальная) ===
    
    // Для Scratch 2.x
    if (typeof window.ScratchExtensions !== 'undefined') {
        window.ScratchExtensions('EV3', descriptor, ext);
    }
    // Для Scratch 3.x
    else if (typeof Scratch !== 'undefined' && Scratch.extensions) {
        // Конвертируем старый формат в новый для Scratch 3
        var newDescriptor = {
            id: 'ev3',
            name: 'EV3 Control',
            color1: '#FF6A00',
            color2: '#FF4500',
            blocks: []
        };
        
        // Конвертация блоков
        descriptor.blocks.forEach(function(block) {
            if (block[1] === 'Тест расширения') {
                newDescriptor.blocks.push({
                    opcode: 'test',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Тест расширения'
                });
            }
            // Можно добавить конвертацию других блоков
        });
        
        Scratch.extensions.register(newDescriptor, ext);
    }
    
    console.log('EV3 Extension успешно загружен!');
    
})({});
    

