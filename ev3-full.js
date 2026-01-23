// ev3-full.js - Расширение EV3 для TurboWarp
// TurboWarp совместимая версия

(function() {
    // ===== ОСНОВНЫЕ НАСТРОЙКИ =====
    var EV3_URL = 'http://192.168.0.103'; // IP вашего EV3
    var EV3_TOKEN = 'ABC123'; // Токен авторизации
    
    // ===== ОПРЕДЕЛЕНИЕ БЛОКОВ =====
    
    // Регистрируемся в глобальной области видимости Scratch
    if (typeof Scratch === 'undefined') {
        console.warn('Scratch API не найден, создаем эмуляцию');
        window.Scratch = {
            extensions: {
                register: function(name, descriptor) {
                    console.log('Расширение зарегистрировано:', name);
                }
            },
            blocks: {}
        };
    }
    
    // Регистрируем расширение в TurboWarp
    class EV3Extension {
        constructor(runtime) {
            this.runtime = runtime;
            this._peripheralId = null;
            this._connected = false;
        }
        
        getInfo() {
            return {
                id: 'ev3full',
                name: 'EV3 Полный',
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
                    {
                        opcode: 'motorOn',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'включить мотор порт [PORT] мощность [POWER]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPort'
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
                                menu: 'motorPort'
                            }
                        }
                    },
                    {
                        opcode: 'motorTime',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'включить мотор на [TIME] сек порт [PORT] мощность [POWER]',
                        arguments: {
                            TIME: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            },
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPort'
                            },
                            POWER: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    {
                        opcode: 'motorDegrees',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'включить мотор на [DEGREES] градусов порт [PORT] мощность [POWER]',
                        arguments: {
                            DEGREES: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 90
                            },
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPort'
                            },
                            POWER: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    {
                        opcode: 'touchSensor',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'датчик касания нажат порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort'
                            }
                        }
                    },
                    {
                        opcode: 'colorSensorColor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'значение датчика цвета в режиме ЦВЕТ порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort'
                            }
                        }
                    },
                    {
                        opcode: 'colorSensorReflected',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'значение датчика цвета в режиме ЯРКОСТЬ порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort'
                            }
                        }
                    },
                    {
                        opcode: 'ultrasonicSensor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'значение ультразвукового датчика порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort'
                            }
                        }
                    },
                    {
                        opcode: 'gyroSensor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'значение гироскопа порт [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort'
                            }
                        }
                    },
                    {
                        opcode: 'wait',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'ожидать [TIME] сек',
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
                        text: 'издать звуковой сигнал',
                        arguments: {}
                    },
                    {
                        opcode: 'led',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'светодиод [COLOR]',
                        arguments: {
                            COLOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'ledColor'
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
                            'оранжевый мигающий',
                            'зеленый пульсирующий',
                            'красный пульсирующий',
                            'оранжевый пульсирующий'
                        ]
                    }
                }
            };
        }
        
        // ===== МЕТОДЫ БЛОКОВ =====
        
        connect() {
            return new Promise((resolve) => {
                this._sendRequest('ping').then(response => {
                    this._connected = true;
                    console.log('EV3 подключен!');
                    resolve();
                }).catch(error => {
                    console.error('Ошибка подключения:', error);
                    this._connected = false;
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
                console.warn('EV3 не подключен');
                return;
            }
            const port = args.PORT;
            const power = args.POWER;
            return this._sendCommand(`motor${port}.duty_cycle_sp = ${power}\nmotor${port}.command = run-forever`);
        }
        
        motorOff(args) {
            if (!this._connected) {
                console.warn('EV3 не подключен');
                return;
            }
            const port = args.PORT;
            return this._sendCommand(`motor${port}.command = stop`);
        }
        
        motorTime(args) {
            if (!this._connected) {
                console.warn('EV3 не подключен');
                return;
            }
            const time = args.TIME;
            const port = args.PORT;
            const power = args.POWER;
            
            return Promise.all([
                this._sendCommand(`motor${port}.time_sp = ${time * 1000}`),
                this._sendCommand(`motor${port}.duty_cycle_sp = ${power}`),
                this._sendCommand(`motor${port}.command = run-timed`)
            ]);
        }
        
        motorDegrees(args) {
            if (!this._connected) {
                console.warn('EV3 не подключен');
                return Promise.resolve();
            }
            
            const degrees = args.DEGREES;
            const port = args.PORT;
            const power = args.POWER;
            
            return new Promise((resolve) => {
                // Устанавливаем режим абсолютной позиции
                this._sendCommand(`motor${port}.position_mode = 1`).then(() => {
                    // Получаем текущую позицию
                    return this._sendCommand(`motor${port}.position`);
                }).then(currentPos => {
                    const current = parseInt(currentPos) || 0;
                    const target = current + parseInt(degrees);
                    
                    // Устанавливаем целевую позицию
                    return Promise.all([
                        this._sendCommand(`motor${port}.position_sp = ${target}`),
                        this._sendCommand(`motor${port}.duty_cycle_sp = ${power}`),
                        this._sendCommand(`motor${port}.command = run-to-abs-pos`)
                    ]);
                }).then(() => {
                    // Ожидаем завершения
                    return this._waitForMotorStop(port);
                }).then(() => {
                    resolve();
                }).catch(error => {
                    console.error('Ошибка motorDegrees:', error);
                    resolve();
                });
            });
        }
        
        touchSensor(args) {
            if (!this._connected) return false;
            const port = args.PORT;
            return this._sendCommand(`sensor${port}.value0`).then(value => {
                return parseInt(value) === 1;
            }).catch(() => false);
        }
        
        colorSensorColor(args) {
            if (!this._connected) return 0;
            const port = args.PORT;
            return this._sendCommand(`sensor${port}.mode = 0`).then(() => {
                return this._sendCommand(`sensor${port}.value0`);
            }).then(value => {
                return parseInt(value) || 0;
            }).catch(() => 0);
        }
        
        colorSensorReflected(args) {
            if (!this._connected) return 0;
            const port = args.PORT;
            return this._sendCommand(`sensor${port}.mode = 1`).then(() => {
                return this._sendCommand(`sensor${port}.value0`);
            }).then(value => {
                const num = parseInt(value) || 0;
                return Math.min(100, Math.max(0, num));
            }).catch(() => 0);
        }
        
        ultrasonicSensor(args) {
            if (!this._connected) return 255;
            const port = args.PORT;
            return this._sendCommand(`sensor${port}.mode = 0`).then(() => {
                return this._sendCommand(`sensor${port}.value0`);
            }).then(value => {
                return parseInt(value) || 255;
            }).catch(() => 255);
        }
        
        gyroSensor(args) {
            if (!this._connected) return 0;
            const port = args.PORT;
            return this._sendCommand(`sensor${port}.mode = 0`).then(() => {
                return this._sendCommand(`sensor${port}.value0`);
            }).then(value => {
                return parseInt(value) || 0;
            }).catch(() => 0);
        }
        
        wait(args) {
            const time = args.TIME;
            return new Promise(resolve => {
                setTimeout(resolve, time * 1000);
            });
        }
        
        beep() {
            if (!this._connected) return;
            return this._sendCommand('sound.beep');
        }
        
        led(args) {
            if (!this._connected) return;
            const color = args.COLOR;
            const ledMap = {
                'выключить': '0',
                'зеленый': '1',
                'красный': '2',
                'оранжевый': '3',
                'зеленый мигающий': '4',
                'красный мигающий': '5',
                'оранжевый мигающий': '6',
                'зеленый пульсирующий': '7',
                'красный пульсирующий': '8',
                'оранжевый пульсирующий': '9'
            };
            
            const code = ledMap[color] || '0';
            return Promise.all([
                this._sendCommand(`leds.left = ${code}`),
                this._sendCommand(`leds.right = ${code}`)
            ]);
        }
        
        // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
        
        _sendRequest(endpoint, data) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                const url = endpoint === 'ping' 
                    ? `${EV3_URL}/ping`
                    : `${EV3_URL}/command`;
                
                xhr.open(endpoint === 'ping' ? 'GET' : 'POST', url, true);
                
                if (endpoint !== 'ping') {
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.setRequestHeader('Authorization', `Bearer ${EV3_TOKEN}`);
                }
                
                xhr.onload = function() {
                    if (xhr.status === 200) {
                        resolve(xhr.responseText);
                    } else {
                        reject(new Error(`HTTP ${xhr.status}`));
                    }
                };
                
                xhr.onerror = function() {
                    reject(new Error('Network error'));
                };
                
                if (endpoint === 'ping') {
                    xhr.send();
                } else {
                    xhr.send(JSON.stringify({ cmd: data }));
                }
            });
        }
        
        _sendCommand(command) {
            return this._sendRequest('command', command);
        }
        
        _waitForMotorStop(port) {
            return new Promise((resolve) => {
                const check = () => {
                    this._sendCommand(`motor${port}.state`).then(state => {
                        if (state && state.includes('running')) {
                            setTimeout(check, 50);
                        } else {
                            resolve();
                        }
                    }).catch(() => {
                        resolve();
                    });
                };
                check();
            });
        }
    }
    
    // Регистрируем расширение в TurboWarp/Scratch
    if (typeof Scratch !== 'undefined' && Scratch.extensions) {
        Scratch.extensions.register(new EV3Extension());
        console.log('Расширение EV3-Full зарегистрировано в Scratch/TurboWarp');
    } else {
        // Альтернативная регистрация для других сред
        console.log('EV3-Full расширение загружено, но Scratch API не найден');
    }
    
})();
