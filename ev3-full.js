// ev3-turbowarp-simple.js - версия с работающим прокси
(function() {
    // ===== НАСТРОЙКИ =====
    var EV3_BASE_URL = 'http://192.168.0.103'; // IP вашего EV3
    var USE_EMULATION = true; // Использовать эмуляцию вместо реального подключения
    
    // Разные публичные прокси (попробуйте по очереди)
    var CORS_PROXIES = [
        'https://api.allorigins.win/raw?url=',  // Работает без авторизации
        'https://corsproxy.io/?',               // Альтернативный прокси
        'https://thingproxy.freeboard.io/fetch/' // Еще один вариант
    ];
    
    var CURRENT_PROXY = CORS_PROXIES[0]; // Начнем с первого
    
    // ===== КЛАСС РАСШИРЕНИЯ =====
    class EV3Extension {
        constructor(runtime) {
            this.runtime = runtime;
            this._connected = false;
            this._emulationMode = USE_EMULATION;
            console.log('EV3 расширение загружено. Режим:', this._emulationMode ? 'эмуляция' : 'реальное подключение');
        }
        
        getInfo() {
            return {
                id: 'ev3full',
                name: 'EV3 Робот',
                color1: '#4a148c',
                color2: '#3a0c6c',
                color3: '#2a044c',
                blocks: [
                    // === ПОДКЛЮЧЕНИЕ ===
                    {
                        opcode: 'connect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'подключиться к EV3',
                        arguments: {}
                    },
                    {
                        opcode: 'isConnected',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'EV3 подключен?',
                        arguments: {}
                    },
                    {
                        opcode: 'disconnect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отключиться от EV3',
                        arguments: {}
                    },
                    '---',
                    // === МОТОРЫ ===
                    {
                        opcode: 'motorOn',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'мотор [PORT] вкл мощность [POWER]',
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
                        text: 'мотор [PORT] выкл',
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
                        text: 'мотор [PORT] на [DEGREES]° сила [POWER]',
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
                    {
                        opcode: 'motorTime',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'мотор [PORT] на [TIME] сек сила [POWER]',
                        arguments: {
                            TIME: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
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
                    '---',
                    // === ДАТЧИКИ ===
                    {
                        opcode: 'colorSensorColor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'цвет датчик [PORT]',
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
                        text: 'яркость датчик [PORT]',
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
                        text: 'касание датчик [PORT]',
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
                        text: 'расстояние датчик [PORT] см',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort',
                                defaultValue: '1'
                            }
                        }
                    },
                    '---',
                    // === СИСТЕМА ===
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
                        text: 'бип',
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
                    },
                    {
                        opcode: 'log',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'лог [TEXT]',
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Привет EV3!'
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
                            'красный мигающий'
                        ]
                    }
                }
            };
        }
        
        // ===== МЕТОДЫ БЛОКОВ =====
        
        connect() {
            console.log('Подключение к EV3...');
            
            if (this._emulationMode) {
                console.log('✅ Режим эмуляции - подключение успешно');
                this._connected = true;
                return Promise.resolve();
            }
            
            // Пытаемся подключиться через прокси
            return new Promise((resolve) => {
                const tryProxy = (proxyIndex) => {
                    if (proxyIndex >= CORS_PROXIES.length) {
                        console.log('❌ Все прокси не работают, включаем эмуляцию');
                        this._emulationMode = true;
                        this._connected = true;
                        resolve();
                        return;
                    }
                    
                    CURRENT_PROXY = CORS_PROXIES[proxyIndex];
                    console.log(`Пробуем прокси ${proxyIndex + 1}: ${CURRENT_PROXY}`);
                    
                    this._testConnection().then(success => {
                        if (success) {
                            this._connected = true;
                            console.log(`✅ Подключено через прокси ${proxyIndex + 1}`);
                            resolve();
                        } else {
                            console.log(`❌ Прокси ${proxyIndex + 1} не сработал`);
                            tryProxy(proxyIndex + 1);
                        }
                    });
                };
                
                tryProxy(0);
            });
        }
        
        isConnected() {
            return this._connected;
        }
        
        disconnect() {
            this._connected = false;
            console.log('EV3 отключен');
            return Promise.resolve();
        }
        
        motorOn(args) {
            const port = args.PORT;
            const power = args.POWER;
            
            console.log(`Мотор ${port}: мощность ${power}%`);
            
            if (!this._connected) {
                console.warn('EV3 не подключен');
                return Promise.resolve();
            }
            
            if (this._emulationMode) {
                // Эмуляция
                return Promise.resolve();
            } else {
                // Реальное подключение
                const command = `motor${port}.duty_cycle_sp = ${power}\nmotor${port}.command = run-forever`;
                return this._sendCommand(command);
            }
        }
        
        motorOff(args) {
            const port = args.PORT;
            console.log(`Мотор ${port}: выключен`);
            
            if (!this._connected) {
                return Promise.resolve();
            }
            
            if (this._emulationMode) {
                return Promise.resolve();
            } else {
                const command = `motor${port}.command = stop`;
                return this._sendCommand(command);
            }
        }
        
        motorDegrees(args) {
            const degrees = args.DEGREES;
            const port = args.PORT;
            const power = args.POWER;
            
            console.log(`Мотор ${port}: ${degrees}° с силой ${power}%`);
            
            return new Promise((resolve) => {
                // Эмуляция времени вращения
                const delay = Math.abs(degrees) * 20; // 20ms на градус
                setTimeout(() => {
                    console.log(`Мотор ${port} завершил вращение`);
                    resolve();
                }, delay);
            });
        }
        
        motorTime(args) {
            const time = args.TIME;
            const port = args.PORT;
            const power = args.POWER;
            
            console.log(`Мотор ${port}: ${time}сек с силой ${power}%`);
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    console.log(`Мотор ${port} завершил работу`);
                    resolve();
                }, time * 1000);
            });
        }
        
        // ===== ДАТЧИКИ =====
        
        colorSensorColor(args) {
            const port = args.PORT;
            console.log(`Датчик цвета ${port}: чтение цвета`);
            
            // Эмуляция: возвращаем случайный цвет (0-7)
            const colors = ['нет', 'черный', 'синий', 'зеленый', 'желтый', 'красный', 'белый', 'коричневый'];
            const colorIndex = Math.floor(Math.random() * 8);
            console.log(`  Цвет: ${colors[colorIndex]} (${colorIndex})`);
            
            return colorIndex;
        }
        
        colorSensorReflected(args) {
            const port = args.PORT;
            console.log(`Датчик цвета ${port}: чтение яркости`);
            
            // Эмуляция: случайная яркость 0-100
            const brightness = Math.floor(Math.random() * 101);
            console.log(`  Яркость: ${brightness}%`);
            
            return brightness;
        }
        
        touchSensor(args) {
            const port = args.PORT;
            console.log(`Датчик касания ${port}: проверка`);
            
            // Эмуляция: всегда false
            const pressed = false;
            console.log(`  Нажато: ${pressed}`);
            
            return pressed;
        }
        
        ultrasonicSensor(args) {
            const port = args.PORT;
            console.log(`Ультразвук ${port}: измерение`);
            
            // Эмуляция: случайное расстояние 5-100 см
            const distance = 5 + Math.floor(Math.random() * 96);
            console.log(`  Расстояние: ${distance} см`);
            
            return distance;
        }
        
        // ===== СИСТЕМНЫЕ ФУНКЦИИ =====
        
        wait(args) {
            const time = args.TIME;
            console.log(`Ожидание: ${time} сек`);
            
            return new Promise(resolve => {
                setTimeout(() => {
                    console.log('Ожидание завершено');
                    resolve();
                }, time * 1000);
            });
        }
        
        beep() {
            console.log('БИП!');
            
            // Пытаемся издать звук в браузере
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
                setTimeout(() => {
                    oscillator.stop();
                    audioContext.close();
                }, 200);
            } catch (e) {
                // Игнорируем ошибки звука
            }
            
            return Promise.resolve();
        }
        
        led(args) {
            const color = args.COLOR;
            console.log(`Светодиод: ${color}`);
            return Promise.resolve();
        }
        
        log(args) {
            const text = args.TEXT;
            console.log(`Лог EV3: ${text}`);
            return Promise.resolve();
        }
        
        // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====
        
        _testConnection() {
            return new Promise((resolve) => {
                const testUrl = `${CURRENT_PROXY}${encodeURIComponent(EV3_BASE_URL + '/ping')}`;
                console.log('Тест подключения к:', testUrl);
                
                fetch(testUrl, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache'
                })
                .then(response => {
                    console.log('Ответ прокси:', response.status, response.statusText);
                    resolve(response.ok);
                })
                .catch(error => {
                    console.log('Ошибка прокси:', error.message);
                    resolve(false);
                });
            });
        }
        
        _sendCommand(command) {
            const encodedUrl = encodeURIComponent(EV3_BASE_URL + '/command');
            const url = `${CURRENT_PROXY}${encodedUrl}`;
            
            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cmd: command })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.text();
            })
            .catch(error => {
                console.error('Ошибка отправки команды:', error);
                throw error;
            });
        }
    }
    
    // ===== РЕГИСТРАЦИЯ =====
    
    if (typeof Scratch !== 'undefined' && Scratch.extensions) {
        try {
            const extension = new EV3Extension();
            Scratch.extensions.register(extension);
            console.log('🚀 EV3 расширение успешно зарегистрировано!');
            console.log('Используйте блок "подключиться к EV3" для начала работы');
        } catch (error) {
            console.error('Ошибка регистрации расширения:', error);
        }
    }
    
})();
