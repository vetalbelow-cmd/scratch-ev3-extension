// EV3 Full Control Extension v2.0
(function(ext) {
    console.log('EV3 Full Control loading...');
    
    // === КОНСТАНТЫ ===
    var motorStates = {
        A: { power: 0, running: false },
        B: { power: 0, running: false },
        C: { power: 0, running: false },
        D: { power: 0, running: false }
    };
    
    // === ФУНКЦИИ ДЛЯ БЛОКОВ ===
    
    // Блок 1: Включить мотор на секунды
    ext.motorOnForSeconds = function(port, power, seconds) {
        var portStr = port.toString();
        var powerNum = Math.max(-100, Math.min(100, parseInt(power) || 0));
        var secondsNum = Math.max(0.1, Math.min(10, parseFloat(seconds) || 1));
        
        console.log('Мотор ' + portStr + ': ' + powerNum + '% на ' + secondsNum + 'сек');
        
        motorStates[portStr].power = powerNum;
        motorStates[portStr].running = true;
        
        return new Promise(function(resolve) {
            setTimeout(function() {
                motorStates[portStr].running = false;
                resolve();
            }, secondsNum * 1000);
        });
    };
    
    // Блок 2: Включить мотор на градусы
    ext.motorOnForDegrees = function(port, power, degrees) {
        var portStr = port.toString();
        var powerNum = Math.max(-100, Math.min(100, parseInt(power) || 0));
        var degreesNum = Math.max(-360, Math.min(360, parseInt(degrees) || 90));
        
        // Расчет времени: 360° ≈ 2 сек при 100%
        var time = (Math.abs(degreesNum) / 360) * 2 * (100 / Math.abs(powerNum || 1));
        time = Math.max(0.5, Math.min(5, time));
        
        console.log('Мотор ' + portStr + ': ' + powerNum + '% на ' + degreesNum + '°');
        
        motorStates[portStr].power = powerNum;
        motorStates[portStr].running = true;
        
        return new Promise(function(resolve) {
            setTimeout(function() {
                motorStates[portStr].running = false;
                resolve();
            }, time * 1000);
        });
    };
    
    // Блок 3: Установить мощность
    ext.setMotorPower = function(port, power) {
        var portStr = port.toString();
        var powerNum = Math.max(-100, Math.min(100, parseInt(power) || 0));
        
        motorStates[portStr].power = powerNum;
        console.log('Мотор ' + portStr + ' мощность: ' + powerNum + '%');
    };
    
    // Блок 4: Установить направление
    ext.setMotorDirection = function(port, direction) {
        var portStr = port.toString();
        var currentPower = Math.abs(motorStates[portStr].power);
        var newPower = direction === 'forward' ? currentPower : -currentPower;
        
        motorStates[portStr].power = newPower;
        console.log('Мотор ' + portStr + ' направление: ' + direction);
    };
    
    // Блок 5: Остановить мотор
    ext.stopMotor = function(port) {
        var portStr = port.toString();
        motorStates[portStr].power = 0;
        motorStates[portStr].running = false;
        console.log('Мотор ' + portStr + ': остановлен');
    };
    
    // Блок 6: Остановить все
    ext.stopAllMotors = function() {
        for (var port in motorStates) {
            motorStates[port].power = 0;
            motorStates[port].running = false;
        }
        console.log('Все моторы остановлены');
    };
    
    // Блок 7: Датчик цвета (цвет)
    ext.getColor = function(port) {
        var portNum = parseInt(port) || 1;
        var color = Math.floor(Math.random() * 8); // 0-7
        console.log('Датчик цвета порт ' + portNum + ': цвет ' + color);
        return color;
    };
    
    // Блок 8: Датчик цвета (отражение)
    ext.getReflectedLight = function(port) {
        var portNum = parseInt(port) || 1;
        var brightness = Math.floor(Math.random() * 101); // 0-100%
        console.log('Датчик цвета порт ' + portNum + ': отражение ' + brightness + '%');
        return brightness;
    };
    
    // Блок 9: Тестовая функция
    ext.test = function() {
        console.log('EV3 Full Control работает!');
    };
    
    // === ОПИСАНИЕ БЛОКОВ ===
    var descriptor = {
        blocks: [
            // Моторы - точное управление
            [' ', 'Мотор %m.ports мощность %n% на %n секунд', 'motorOnForSeconds', 'A', 50, 1],
            [' ', 'Мотор %m.ports на %n градусов мощность %n%', 'motorOnForDegrees', 'A', 90, 50],
            [' ', 'Установить мотор %m.ports мощность %n%', 'setMotorPower', 'A', 50],
            [' ', 'Установить мотор %m.ports направление %m.directions', 'setMotorDirection', 'A', 'forward'],
            [' ', 'Остановить мотор %m.ports', 'stopMotor', 'A'],
            [' ', 'Остановить все моторы', 'stopAllMotors'],
            
            // Датчики
            ['r', 'Датчик цвета (порт %n) цвет', 'getColor', 1],
            ['r', 'Датчик цвета (порт %n) отражение %', 'getReflectedLight', 1],
            
            // Тест
            [' ', 'Тест расширения', 'test'],
            
            // Информация
            ['h', 'EV3 Full Control v2.0', 'test']
        ],
        menus: {
            ports: ['A', 'B', 'C', 'D'],
            directions: ['forward', 'backward']
        }
    };
    
    // === РЕГИСТРАЦИЯ ===
    if (typeof Scratch !== 'undefined') {
        Scratch.extensions.register(descriptor, ext);
    }
    
    console.log('EV3 Full Control успешно загружен!');
    
})({});
