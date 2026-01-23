(function(ext) {
    var device = null;
    var writer = null;
    var inputBuffer = '';
    var connected = false;

    // Очистка при деактивации
    ext._shutdown = function() {
        if (device) {
            device.close();
            device = null;
            connected = false;
        }
    };

    // Статус расширения
    ext._getStatus = function() {
        return {status: connected ? 2 : 1, msg: connected ? 'EV3 подключен' : 'EV3 отключен'};
    };

    // === БЛОКИ ДЛЯ SCRATCH ===

    // Блок: подключить EV3
    ext.connectEV3 = function(callback) {
        if ('serial' in navigator) {
            navigator.serial.requestPort({filters: [{usbVendorId: 0x0694}]})
                .then(function(port) {
                    device = port;
                    return device.open({baudRate: 115200});
                })
                .then(function() {
                    writer = device.writable.getWriter();
                    connected = true;
                    if (callback) callback();
                })
                .catch(function(err) {
                    console.error('Ошибка подключения:', err);
                    if (callback) callback();
                });
        } else {
            console.error('WebSerial API не поддерживается');
            if (callback) callback();
        }
    };

    // Блок: отключить EV3
    ext.disconnectEV3 = function(callback) {
        if (device) {
            writer.releaseLock();
            device.close();
            device = null;
            writer = null;
            connected = false;
        }
        if (callback) callback();
    };

    // Блок: двигатель вперед
    ext.motorForward = function(port, power, duration, callback) {
        if (!connected || !writer) {
            if (callback) callback();
            return;
        }
        
        var command = `M${port.toUpperCase()}:${power}:${duration}\n`;
        var data = new TextEncoder().encode(command);
        
        writer.write(data)
            .then(function() {
                if (callback) setTimeout(callback, duration * 1000);
            })
            .catch(function(err) {
                console.error('Ошибка отправки:', err);
                if (callback) callback();
            });
    };

    // Блок: получить данные с датчика
    ext.getSensorValue = function(port, callback) {
        if (!connected || !writer) {
            callback(0);
            return;
        }
        
        var command = `S${port.toUpperCase()}?\n`;
        var data = new TextEncoder().encode(command);
        
        writer.write(data)
            .then(function() {
                // Здесь должна быть логика чтения ответа от EV3
                // Для примера возвращаем случайное значение
                setTimeout(function() {
                    callback(Math.floor(Math.random() * 100));
                }, 100);
            })
            .catch(function(err) {
                console.error('Ошибка запроса датчика:', err);
                callback(0);
            });
    };

    // Описание блоков для Scratch
    var descriptor = {
        blocks: [
            ['w', 'Подключить EV3', 'connectEV3'],
            ['w', 'Отключить EV3', 'disconnectEV3'],
            ['w', 'Двигатель %m.ports вперед %n% мощность %n секунд', 'motorForward', 'A', 50, 1],
            ['r', 'Датчик %m.ports значение', 'getSensorValue', '1']
        ],
        menus: {
            ports: ['A', 'B', 'C', 'D', '1', '2', '3', '4']
        },
        url: 'https://vetalbelow-cmd.github.io/scratch-ev3-extension/'
    };

    // Регистрация расширения
    if (typeof window.ScratchExtensions !== 'undefined') {
        window.ScratchExtensions.register('EV3 Extension', descriptor, ext);
    } else {
        console.warn('ScratchExtensions не найден. Расширение не зарегистрировано.');
    }

    // Экспорт для тестирования
    if (typeof module !== 'undefined') {
        module.exports = ext;
    }
})({});
