// ev3-turbowarp-cors.js - версия с CORS прокси
(function() {
    // ===== ОСНОВНЫЕ НАСТРОЙКИ =====
    var EV3_BASE_URL = 'http://192.168.0.103'; // IP вашего EV3
    var EV3_TOKEN = 'ABC123';
    
    // Используем CORS прокси для обхода ограничений браузера
    var USE_CORS_PROXY = true; // Включите эту опцию
    var CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/'; // Публичный прокси
    
    // ===== КЛАСС РАСШИРЕНИЯ =====
    class EV3Extension {
        constructor(runtime) {
            this.runtime = runtime;
            this._connected = false;
            console.log('EV3 расширение инициализировано');
        }
        
        getInfo() {
            return {
                id: 'ev3full',
                name: 'EV3',
                color1: '#4a148c',
                color2: '#3a0c6c',
                color3: '#2a044c',
                blocks: [
                    {
                        opcode: 'connect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'подключиться к EV3',
                        arguments: {}
                    },
                    {
                        opcode: 'disconnect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отключиться от EV3',
                        arguments: {}
                    },
                    // Разделитель
                    '---',
                    {
                        opcode: 'motorOn',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'включить мотор порт [PORT] мощность [POWER]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPort',
                                defaultValue: 'A'
                            },
                            POWER: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    {
                        opcode: 'motorOff',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'выключить мотор порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPort',
                                defaultValue: 'A'
                            }
                        }
                    },
                    {
                        opcode: 'motorDegrees',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'включить мотор на [DEGREES]° порт [PORT] мощность [POWER]',
                        arguments: {
                            DEGREES: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 90
                            },
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPort',
                                defaultValue: 'A'
                            },
                            POWER: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    // Разделитель
                    '---',
                    {
                        opcode: 'colorSensorColor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик цвета (цвет) порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort',
                                defaultValue: '1'
                            }
                        }
                    },
                    {
                        opcode: 'colorSensorReflected',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик цвета (яркость) порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort',
                                defaultValue: '1'
                            }
                        }
                    },
                    {
                        opcode: 'touchSensor',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'датчик касания порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort',
                                defaultValue: '1'
                            }
                        }
                    },
                    {
                        opcode: 'ultrasonicSensor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'ультразвук (см) порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort',
                                defaultValue: '1'
                            }
                        }
                    },
                    // Разделитель
                    '---',
                    {
                        opcode: 'wait',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'ждать [TIME] сек',
                        arguments: {
                            TIME: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            }
                        }
                    },
                    {
                        opcode: 'beep',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'сигнал',
                        arguments: {}
                    },
                    {
                        opcode: 'led',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'светодиод [COLOR]',
                        arguments: {
                            COLOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'ledColor',
                                defaultValue: 'зеленый'
                            }
                        }
                    }
                ],
                menus: {
                    motorPort: {
                        acceptReporters: true,
                        items: ['A', 'B', 'C', 'D']
                    },
                    sensorPort: {
                        acceptReporters: true,
                        items: ['1', '2', '3', '4']
                    },
                    ledColor: {
                        acceptReporters: true,
                        items: [
                            'выключить',
                            'зеленый',
                            'красный',
                            'оранжевый',
                            'зеленый мигающий',
                            'красный мигающий',
                            'оранжевый мигающий'
                        ]
                    }
                }
            };
        }
        
        // ===== МЕТОДЫ БЛОКОВ =====
        
        connect() {
            console.log('Попытка подключения к EV3...');
            return new Promise((resolve) => {
                this._sendRequest('ping', null, 'GET').then(response => {
                    console.log('EV3 подключен! Ответ:', response);
                    this._connected = true;
                    resolve();
                }).catch(error => {
                    console.error('Ошибка подключения:', error);
                    this._connected = false;
                    // Все равно разрешаем для тестирования
                    this._connected = true;
                    console.log('Режим эмуляции (без реального подключения)');
                    resolve();
                });
            });
        }
        
        disconnect() {
            this._connected = false;
            console.log('EV3 отключен');
        }
        
        motorOn(args) {
            if (!this._connected) {
                console.warn('EV3 не подключен - эмуляция');
                return Promise.resolve();
            }
            
            const port = args.PORT;
            const power = Math.max(-100, Math.min(100, args.POWER));
            const command = `motor${port}.duty_cycle_sp = ${power}\nmotor${port}.command = run-forever`;
            
            console.log(`Мотор ${port} включен на ${power}%`);
            return this._sendCommand(command);
        }
        
        motorOff(args) {
            if (!this._connected) {
                console.warn('EV3 не подключен - эмуляция');
                return Promise.resolve();
            }
            
            const port = args.PORT;
            const command = `motor${port}.command = stop`;
            
            console.log(`Мотор ${port} выключен`);
            return this._sendCommand(command);
        }
        
        motorDegrees(args) {
            if (!this._connected) {
                console.warn('EV3 не подключен - эмуляция');
                return Promise.resolve();
            }
            
            const degrees = args.DEGREES;
            const port = args.PORT;
            const power = Math.max(0, Math.min(100, args.POWER));
            
            console.log(`Мотор ${port} на ${degrees}° с мощностью ${power}%`);
            
            return new Promise((resolve) => {
                // Упрощенная реализация для теста
                setTimeout(() => {
                    console.log(`Мотор ${port} завершил вращение`);
                    resolve();
                }, Math.abs(degrees) * 10); // Примерная задержка
            });
        }
        
        // ===== ДАТЧИКИ (ЭМУЛЯЦИЯ) =====
        
        colorSensorColor(args) {
            console.log('Датчик цвета (режим цвет) - эмуляция');
            // Эмуляция: случайный цвет 0-7
            return Math.floor(Math.random() * 8);
        }
        
        colorSensorReflected(args) {
            console.log('Датчик цвета (режим яркость) - эмуляция');
            // Эмуляция: случайная яркость 0-100
            return Math.floor(Math.random() * 101);
        }
        
        touchSensor(args) {
            console.log('Датчик касания - эмуляция (false)');
            return false; // Эмуляция: не нажато
        }
        
        ultrasonicSensor(args) {
            console.log('Ультразвуковой датчик - эмуляция');
            // Эмуляция: случайное расстояние 5-50 см
            return 5 + Math.floor(Math.random() * 46);
        }
        
        // ===== СЕРВИСНЫЕ ФУНКЦИИ =====
        
        wait(args) {
            const time = args.TIME;
            console.log(`Ожидание ${time} секунд`);
            return new Promise(resolve => {
                setTimeout(resolve, time * 1000);
            });
        }
        
        beep() {
            console.log('Звуковой сигнал');
            // Эмуляция звука в браузере
            if (typeof Audio !== 'undefined') {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    gainNode.gain.value = 0.1;
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 200);
                } catch (e) {
                    console.log('Бип!');
                }
            }
            return Promise.resolve();
        }
        
        led(args) {
            const color = args.COLOR;
            console.log(`Светодиод: ${color}`);
            return Promise.resolve();
        }
        
        // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
        
        _sendRequest(endpoint, data, method = 'POST') {
            return new Promise((resolve, reject) => {
                if (!USE_CORS_PROXY) {
                    // Прямой запрос (будет CORS ошибка)
                    const url = endpoint === 'ping' 
                        ? `${EV3_BASE_URL}/ping`
                        : `${EV3_BASE_URL}/command`;
                    
                    const xhr = new XMLHttpRequest();
                    xhr.open(method, url, true);
                    
                    if (endpoint !== 'ping') {
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.setRequestHeader('Authorization', `Bearer ${EV3_TOKEN}`);
                    }
                    
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            resolve(xhr.responseText);
                        } else {
                            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                        }
                    };
                    
                    xhr.onerror = function() {
                        reject(new Error('Network error'));
                    };
                    
                    xhr.send(data ? JSON.stringify({ cmd: data }) : null);
                } else {
                    // Через CORS прокси
                    const targetUrl = endpoint === 'ping'
                        ? `${EV3_BASE_URL}/ping`
                        : `${EV3_BASE_URL}/command`;
                    
                    const proxyUrl = `${CORS_PROXY_URL}${targetUrl}`;
                    const xhr = new XMLHttpRequest();
                    
                    xhr.open(method, proxyUrl, true);
                    
                    if (endpoint !== 'ping') {
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        xhr.setRequestHeader('Authorization', `Bearer ${EV3_TOKEN}`);
                        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    }
                    
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            resolve(xhr.responseText);
                        } else {
                            reject(new Error(`Proxy error: ${xhr.status}`));
                        }
                    };
                    
                    xhr.onerror = function() {
                        reject(new Error('Proxy network error'));
                    };
                    
                    xhr.send(data ? JSON.stringify({ cmd: data }) : null);
                }
            });
        }
        
        _sendCommand(command) {
            return this._sendRequest('command', command);
        }
    }
    
    // ===== РЕГИСТРАЦИЯ РАСШИРЕНИЯ =====
    
    if (typeof Scratch !== 'undefined' && Scratch.extensions) {
        // Для Scratch 3.0 и TurboWarp
        try {
            Scratch.extensions.register(new EV3Extension());
            console.log('✅ EV3 расширение успешно зарегистрировано в Scratch/TurboWarp');
        } catch (error) {
            console.error('❌ Ошибка регистрации расширения:', error);
        }
    } else if (typeof window !== 'undefined') {
        // Для отладки в консоли
        window.EV3Extension = EV3Extension;
        console.log('ℹ️ EV3 расширение загружено (ручная регистрация)');
    }
    
})();
