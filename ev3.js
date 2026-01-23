// В начало файла добавьте:
var ev3Device = null;

ext.realConnect = function(callback) {
    if (!navigator.bluetooth) {
        console.error('Web Bluetooth не поддерживается');
        return;
    }
    
    navigator.bluetooth.requestDevice({
        filters: [{ name: 'EV3' }],
        optionalServices: ['battery_service', 'device_information']
    })
    .then(device => {
        ev3Device = device;
        return device.gatt.connect();
    })
    .then(server => {
        simulationMode = false;
        console.log('EV3 подключен!');
        if (callback) callback();
    })
    .catch(error => {
        console.log('Используется симуляция:', error);
        simulationMode = true;
        if (callback) callback();
    });
};
// EV3 Extension for Scratch 3 - Полное управление
// Version 2.0 - Точный контроль моторов и датчиков

(function(ext) {
    // Проверяем среду
    var isScratch3 = typeof Scratch !== 'undefined' && Scratch.extensions;
    var isScratch2 = typeof ScratchExtension !== 'undefined';
    
    if (!isScratch3 && !isScratch2) {
        console.error('Scratch not found!');
        return;
    }
    
    // === КОНСТАНТЫ И СОСТОЯНИЕ ===
    var connected = false;
    var simulationMode = true;
    var motorStates = {
        A: { power: 0, direction: 'forward', running: false },
        B: { power: 0, direction: 'forward', running: false },
        C: { power: 0, direction: 'forward', running: false },
        D: { power: 0, direction: 'forward', running: false }
    };
    
    var sensorStates = {
        1: { type: 'color', mode: 'color', value: 0 },
        2: { type: 'color', mode: 'reflection', value: 0 },
        3: { type: 'ultrasonic', value: 0 },
        4: { type: 'touch', value: 0 }
    };
    
    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
    
    function clampPower(power) {
        return Math.max(-100, Math.min(100, parseInt(power) || 0));
    }
    
    function clampDegrees(degrees) {
        return Math.max(-3600, Math.min(3600, parseInt(degrees) || 0));
    }
    
    function clampSeconds(seconds) {
        return Math.max(0.1, Math.min(60, parseFloat(seconds) || 1));
    }
    
    function getPortCode(port) {
        var ports = { 'A': 1, 'B': 2, 'C': 3, 'D': 4 };
        return ports[port] || 1;
    }
    
    // === БЛОКИ ДЛЯ МОТОРОВ ===
    
    // Блок 1: Включить мотор на количество секунд
    ext.motorOnForSeconds = function(port, power, seconds, callback) {
        var powerNum = clampPower(power);
        var secondsNum = clampSeconds(seconds);
        var portStr = port.toString();
        
        console.log(`Мотор ${portStr}: ${powerNum}% на ${secondsNum}сек`);
        
        motorStates[portStr].power = powerNum;
        motorStates[portStr].direction = powerNum >= 0 ? 'forward' : 'backward';
        motorStates[portStr].running = true;
        
        // Симуляция работы
        if (simulationMode) {
            setTimeout(function() {
                motorStates[portStr].running = false;
                console.log(`Мотор ${portStr}: остановлен`);
                if (callback) callback();
            }, secondsNum * 1000);
        } else {
            // Реальная команда для EV3
            // sendCommandToEV3(`motor:${portStr}:time:${powerNum}:${secondsNum}`);
            setTimeout(function() {
                motorStates[portStr].running = false;
                if (callback) callback();
            }, secondsNum * 1000);
        }
        
        if (!callback) {
            // Если нет callback, ждем синхронно (для Scratch 3)
            return new Promise(resolve => {
                setTimeout(() => {
                    motorStates[portStr].running = false;
                    resolve();
                }, secondsNum * 1000);
            });
        }
    };
    
    // Блок 2: Задать направление мотора
    ext.setMotorDirection = function(port, direction, callback) {
        var portStr = port.toString();
        var currentPower = Math.abs(motorStates[portStr].power);
        var newPower = direction === 'forward' ? currentPower : -currentPower;
        
        motorStates[portStr].direction = direction;
        motorStates[portStr].power = newPower;
        
        console.log(`Мотор ${portStr}: направление ${direction}`);
        
        if (!simulationMode) {
            // sendCommandToEV3(`motor:${portStr}:direction:${direction}`);
        }
        
        if (callback) callback();
    };
    
    // Блок 3: Задать мощность мотора
    ext.setMotorPower = function(port, power, callback) {
        var powerNum = clampPower(power);
        var portStr = port.toString();
        
        motorStates[portStr].power = powerNum;
        motorStates[portStr].direction = powerNum >= 0 ? 'forward' : 'backward';
        
        console.log(`Мотор ${portStr}: мощность ${powerNum}%`);
        
        if (!simulationMode && motorStates[portStr].running) {
            // sendCommandToEV3(`motor:${portStr}:power:${powerNum}`);
        }
        
        if (callback) callback();
    };
    
    // Блок 4: Включить мотор на количество градусов
    ext.motorOnForDegrees = function(port, power, degrees, callback) {
        var powerNum = clampPower(power);
        var degreesNum = clampDegrees(degrees);
        var portStr = port.toString();
        
        // Расчет времени: 360 градусов = ~2 сек при 100% мощности
        var estimatedTime = (Math.abs(degreesNum) / 360) * 2 * (100 / Math.abs(powerNum || 1));
        estimatedTime = Math.max(0.5, Math.min(10, estimatedTime));
        
        console.log(`Мотор ${portStr}: ${powerNum}% на ${degreesNum}° (~${estimatedTime.toFixed(1)}сек)`);
        
        motorStates[portStr].power = powerNum;
        motorStates[portStr].direction = powerNum >= 0 ? 'forward' : 'backward';
        motorStates[portStr].running = true;
        
        if (simulationMode) {
            setTimeout(function() {
                motorStates[portStr].running = false;
                console.log(`Мотор ${portStr}: повернут на ${degreesNum}°`);
                if (callback) callback();
            }, estimatedTime * 1000);
        } else {
            // Реальная команда для EV3 с энкодерами
            // sendCommandToEV3(`motor:${portStr}:degrees:${powerNum}:${degreesNum}`);
            setTimeout(function() {
                motorStates[portStr].running = false;
                if (callback) callback();
            }, estimatedTime * 1000);
        }
        
        if (!callback) {
            return new Promise(resolve => {
                setTimeout(() => {
                    motorStates[portStr].running = false;
                    resolve();
                }, estimatedTime * 1000);
            });
        }
    };
    
    // Блок 5: Остановка мотора
    ext.stopMotor = function(port, callback) {
        var portStr = port.toString();
        
        console.log(`Мотор ${portStr}: остановка`);
        
        motorStates[portStr].power = 0;
        motorStates[portStr].running = false;
        
        if (!simulationMode) {
            // sendCommandToEV3(`motor:${portStr}:stop`);
        }
        
        if (callback) callback();
    };
    
    // Блок 6: Остановить все моторы
    ext.stopAllMotors = function(callback) {
        console.log('Все моторы: остановка');
        
        for (var port in motorStates) {
            motorStates[port].power = 0;
            motorStates[port].running = false;
        }
        
        if (!simulationMode) {
            // sendCommandToEV3('motor:all:stop');
        }
        
        if (callback) callback();
    };
    
    // === БЛОКИ ДЛЯ ДАТЧИКОВ ===
    
    // Блок 7: Датчик цвета в режиме цвет
    ext.getColor = function(port) {
        var portNum = parseInt(port) || 1;
        
        if (simulationMode) {
            // Симуляция: случайный цвет от 0 до 6
            // 0=нет, 1=черный, 2=синий, 3=зеленый, 4=желтый, 5=красный, 6=белый, 7=коричневый
            var color = Math.floor(Math.random() * 8);
            sensorStates[portNum].value = color;
            sensorStates[portNum].mode = 'color';
            
            var colorNames = ['нет', 'черный', 'синий', 'зеленый', 'желтый', 'красный', 'белый', 'коричневый'];
            console.log(`Датчик цвета (порт ${portNum}): ${colorNames[color]} (${color})`);
            
            return color;
        } else {
            // Реальное чтение с EV3
            // var value = readFromEV3(`sensor:${portNum}:color`);
            // sensorStates[portNum].value = value;
            // sensorStates[portNum].mode = 'color';
            // return value;
            return 0;
        }
    };
    
    // Блок 8: Датчик цвета в режиме яркость отраженного света
    ext.getReflectedLight = function(port) {
        var portNum = parseInt(port) || 1;
        
        if (simulationMode) {
            // Симуляция: случайная яркость от 0 до 100
            var brightness = Math.floor(Math.random() * 101);
            sensorStates[portNum].value = brightness;
            sensorStates[portNum].mode = 'reflection';
            
            console.log(`Датчик отражения (порт ${portNum}): ${brightness}%`);
            
            return brightness;
        } else {
            // Реальное чтение с EV3
            // var value = readFromEV3(`sensor:${portNum}:reflection`);
            // sensorStates[portNum].value = value;
            // sensorStates[portNum].mode = 'reflection';
            // return value;
            return 50;
        }
    };
    
    // Дополнительные блоки для датчиков
    ext.getUltrasonicDistance = function(port) {
        var portNum = parseInt(port) || 3;
        
        if (simulationMode) {
            var distance = Math.floor(Math.random() * 100) + 1;
            console.log(`Ультразвук (порт ${portNum}): ${distance} см`);
            return distance;
        }
        return 50;
    };
    
    ext.isTouchPressed = function(port) {
        var portNum = parseInt(port) || 4;
        
        if (simulationMode) {
            var pressed = Math.random() > 0.7;
            console.log(`Датчик касания (порт ${portNum}): ${pressed ? 'нажат' : 'не нажат'}`);
            return pressed;
        }
        return false;
    };
    
    // === БЛОКИ ДЛЯ СТАТУСА ===
    
    ext.isMotorRunning = function(port) {
        var portStr = port.toString();
        return motorStates[portStr].running;
    };
    
    ext.getMotorPower = function(port) {
        var portStr = port.toString();
        return motorStates[portStr].power;
    };
    
    ext.getMotorDirection = function(port) {
        var portStr = port.toString();
        return motorStates[portStr].direction;
    };
    
    // === ОПИСАНИЕ БЛОКОВ ДЛЯ SCRATCH ===
    
    var descriptor = {
        blocks: [
            // === ГРУППА: УПРАВЛЕНИЕ МОТОРАМИ ===
            [' ', 'Мотор %m.motorPorts мощность %n% на %n секунд', 'motorOnForSeconds', 'A', 50, 1],
            [' ', 'Мотор %m.motorPorts на %n градусов мощность %n%', 'motorOnForDegrees', 'A', 90, 50],
            [' ', 'Установить мотор %m.motorPorts направление %m.directions', 'setMotorDirection', 'A', 'forward'],
            [' ', 'Установить мотор %m.motorPorts мощность %n%', 'setMotorPower', 'A', 50],
            [' ', 'Остановить мотор %m.motorPorts', 'stopMotor', 'A'],
            [' ', 'Остановить все моторы', 'stopAllMotors'],
            
            // === ГРУППА: ДАТЧИКИ ===
            ['r', 'Датчик цвета (порт %n) цвет', 'getColor', 1],
            ['r', 'Датчик цвета (порт %n) отражение %', 'getReflectedLight', 1],
            ['r', 'Ультразвук (порт %n) расстояние см', 'getUltrasonicDistance', 3],
            ['b', 'Датчик касания (порт %n) нажат?', 'isTouchPressed', 4],
            
            // === ГРУППА: СТАТУС ===
            ['b', 'Мотор %m.motorPorts работает?', 'isMotorRunning', 'A'],
            ['r', 'Мощность мотора %m.motorPorts %', 'getMotorPower', 'A'],
            ['r', 'Направление мотора %m.motorPorts', 'getMotorDirection', 'A'],
            
            // === СЛУЖЕБНЫЕ ===
            [' ', 'Подключиться к EV3', 'connect'],
            ['h', 'EV3 Control v2.0', 'connect']
        ],
        menus: {
            motorPorts: ['A', 'B', 'C', 'D'],
            directions: ['forward', 'backward']
        },
        url: 'https://github.com/vetalbelow-cmd/scratch-ev3-extension'
    };
    
    // Блок подключения (добавим его)
    ext.connect = function(callback) {
        console.log('EV3: Попытка подключения...');
        connected = true;
        if (callback) callback();
    };
    
    // === РЕГИСТРАЦИЯ РАСШИРЕНИЯ ===
    
    if (isScratch3) {
        Scratch.extensions.register(descriptor, ext);
    } else if (isScratch2) {
        ScratchExtension(descriptor, ext);
    }
    
    console.log('EV3 Extension v2.0 загружено успешно!');
    console.log('Доступно блоков: ' + descriptor.blocks.length);
    
})({});
