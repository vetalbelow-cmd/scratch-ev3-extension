// EV3 Simple Working Extension
(function(ext) {
    // Убираем сложные промисы и асинхронность
    console.log('EV3 Extension loading...');
    
    // === ПРОСТЫЕ ФУНКЦИИ ===
    
    // 1. Тестовая функция
    ext.test = function() {
        console.log('EV3 тест работает!');
        // В Scratch 3 нельзя использовать alert
    };
    
    // 2. Мотор на секунды (упрощенная)
    ext.motorOnForSeconds = function(args) {
        var port = args.PORT;
        var power = args.POWER;
        var seconds = args.SECONDS;
        console.log('Мотор ' + port + ': ' + power + '% на ' + seconds + 'сек');
        // Ничего не возвращаем - Scratch 3 ждет undefined
    };
    
    // 3. Мотор на градусы
    ext.motorOnForDegrees = function(args) {
        var port = args.PORT;
        var power = args.POWER;
        var degrees = args.DEGREES;
        console.log('Мотор ' + port + ': ' + power + '% на ' + degrees + '°');
    };
    
    // 4. Установить мощность
    ext.setMotorPower = function(args) {
        var port = args.PORT;
        var power = args.POWER;
        console.log('Мотор ' + port + ' мощность: ' + power + '%');
    };
    
    // 5. Датчик цвета
    ext.getColor = function(args) {
        var port = args.PORT;
        console.log('Датчик цвета порт ' + port);
        // Возвращаем случайное число 0-7
        return Math.floor(Math.random() * 8);
    };
    
    // 6. Датчик отражения
    ext.getReflectedLight = function(args) {
        var port = args.PORT;
        console.log('Датчик отражения порт ' + port);
        // Возвращаем случайное число 0-100
        return Math.floor(Math.random() * 101);
    };
    
    // === ОПИСАНИЕ БЛОКОВ ДЛЯ SCRATCH 3 ===
    
    var descriptor = {
        id: 'ev3',
        name: 'EV3 Control',
        color1: '#FF6A00',
        color2: '#FF4500',
        blocks: [
            {
                opcode: 'test',
                blockType: 'command',
                text: 'Тест расширения'
            },
            {
                opcode: 'motorOnForSeconds',
                blockType: 'command',
                text: 'Мотор [PORT] мощность [POWER]% на [SECONDS] сек',
                arguments: {
                    PORT: {
                        type: 'string',
                        menu: 'ports',
                        defaultValue: 'A'
                    },
                    POWER: {
                        type: 'number',
                        defaultValue: 50
                    },
                    SECONDS: {
                        type: 'number',
                        defaultValue: 1
                    }
                }
            },
            {
                opcode: 'motorOnForDegrees',
                blockType: 'command',
                text: 'Мотор [PORT] на [DEGREES]° мощность [POWER]%',
                arguments: {
                    PORT: {
                        type: 'string',
                        menu: 'ports',
                        defaultValue: 'A'
                    },
                    DEGREES: {
                        type: 'number',
                        defaultValue: 90
                    },
                    POWER: {
                        type: 'number',
                        defaultValue: 50
                    }
                }
            },
            {
                opcode: 'setMotorPower',
                blockType: 'command',
                text: 'Установить мотор [PORT] мощность [POWER]%',
                arguments: {
                    PORT: {
                        type: 'string',
                        menu: 'ports',
                        defaultValue: 'A'
                    },
                    POWER: {
                        type: 'number',
                        defaultValue: 50
                    }
                }
            },
            {
                opcode: 'getColor',
                blockType: 'reporter',
                text: 'Датчик цвета порт [PORT]',
                arguments: {
                    PORT: {
                        type: 'number',
                        defaultValue: 1
                    }
                }
            },
            {
                opcode: 'getReflectedLight',
                blockType: 'reporter',
                text: 'Датчик отражения порт [PORT] %',
                arguments: {
                    PORT: {
                        type: 'number',
                        defaultValue: 1
                    }
                }
            }
        ],
        menus: {
            ports: ['A', 'B', 'C', 'D']
        }
    };
    
    // === РЕГИСТРАЦИЯ ===
    
    // Для Scratch 3
    if (typeof Scratch !== 'undefined' && Scratch.extensions) {
        Scratch.extensions.register(descriptor, ext);
    }
    
    console.log('EV3 Extension успешно загружен!');
    
})({});
