/* LEGO EV3 Local Extension for TurboWarp/Scratch
   Version: 4.0.0 - WebSerial API (без сервера)
   Поддерживает: Chrome 89+, Edge 89+, Opera 76+
*/

(function(Scratch) {
    'use strict';

    class EV3LocalExtension {
        constructor() {
            this.device = null;
            this.reader = null;
            this.writer = null;
            this.connected = false;
            this.reading = false;
            this.sensorValues = {
                '1': 0,
                '2': 0,
                '3': 0,
                '4': 0
            };
            this.motorStates = {
                'A': { speed: 0, position: 0, mode: 'coast' },
                'B': { speed: 0, position: 0, mode: 'coast' },
                'C': { speed: 0, position: 0, mode: 'coast' },
                'D': { speed: 0, position: 0, mode: 'coast' }
            };
            
            // Проверяем поддержку WebSerial
            this.serialSupported = 'serial' in navigator;
            
            // Автоматически пытаемся подключиться к сохраненному устройству
            this.autoConnect();
        }
        
        async autoConnect() {
            const ports = await navigator.serial.getPorts();
            if (ports.length > 0) {
                try {
                    await this.connectToPort(ports[0]);
                } catch (error) {
                    console.warn('Auto-connect failed:', error);
                }
            }
        }
        
        async connectToPort(port) {
            try {
                await port.open({ baudRate: 115200 });
                this.device = port;
                
                // Настраиваем чтение
                this.setupReader();
                
                // Настраиваем запись
                this.writer = port.writable.getWriter();
                
                this.connected = true;
                console.log('EV3 подключен через WebSerial');
                
                // Отправляем тестовую команду
                await this.sendCommand('TEST');
                
                return true;
            } catch (error) {
                console.error('Connection error:', error);
                throw error;
            }
        }
        
        setupReader() {
            if (!this.device || !this.device.readable) return;
            
            this.reading = true;
            this.reader = this.device.readable.getReader();
            
            const readLoop = async () => {
                while (this.reading && this.reader) {
                    try {
                        const { value, done } = await this.reader.read();
                        if (done) {
                            this.reader.releaseLock();
                            break;
                        }
                        
                        if (value) {
                            this.processIncomingData(value);
                        }
                    } catch (error) {
                        console.error('Read error:', error);
                        break;
                    }
                }
            };
            
            readLoop();
        }
        
        processIncomingData(data) {
            try {
                // Преобразуем Uint8Array в строку
                const text = new TextDecoder().decode(data);
                const lines = text.trim().split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('SENSOR:')) {
                        // Пример: "SENSOR:1:45" - датчик 1 значение 45
                        const parts = line.split(':');
                        if (parts.length >= 3) {
                            const port = parts[1];
                            const value = parseInt(parts[2]);
                            if (port in this.sensorValues) {
                                this.sensorValues[port] = value;
                            }
                        }
                    } else if (line.startsWith('MOTOR:')) {
                        // Пример: "MOTOR:A:SPEED:30" - мотор A скорость 30%
                        const parts = line.split(':');
                        if (parts.length >= 4) {
                            const port = parts[1];
                            const param = parts[2];
                            const value = parseInt(parts[3]);
                            
                            if (port in this.motorStates) {
                                if (param === 'SPEED') {
                                    this.motorStates[port].speed = value;
                                } else if (param === 'POS') {
                                    this.motorStates[port].position = value;
                                }
                            }
                        }
                    } else if (line.startsWith('BATT:')) {
                        // Уровень батареи
                        this.batteryLevel = parseInt(line.split(':')[1]) || 100;
                    }
                }
            } catch (error) {
                console.error('Data processing error:', error);
            }
        }
        
        async sendCommand(command) {
            if (!this.connected || !this.writer) {
                throw new Error('EV3 не подключен');
            }
            
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(command + '\n');
                await this.writer.write(data);
                return true;
            } catch (error) {
                console.error('Send command error:', error);
                this.connected = false;
                throw error;
            }
        }
        
        async sendMotorCommand(port, command, value = 0) {
            const cmd = `MOTOR:${port}:${command}:${value}`;
            return await this.sendCommand(cmd);
        }
        
        async sendSensorCommand(port, command) {
            const cmd = `SENSOR:${port}:${command}`;
            return await this.sendCommand(cmd);
        }
        
        getInfo() {
            return {
                id: 'ev3local',
                name: 'LEGO EV3 Local',
                color1: '#00A8FF',
                color2: '#0097E6',
                color3: '#0088CC',
                
                blocks: [
                    // === ПОДКЛЮЧЕНИЕ ===
                    {
                        opcode: 'connect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'подключить EV3 через USB/Bluetooth',
                        disableMonitor: true
                    },
                    {
                        opcode: 'disconnect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отключить EV3'
                    },
                    {
                        opcode: 'isConnected',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'EV3 подключен?'
                    },
                    {
                        opcode: 'isSerialSupported',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'WebSerial поддерживается?'
                    },
                    
                    '---',
                    
                    // === БАЗОВОЕ УПРАВЛЕНИЕ МОТОРАМИ ===
                    {
                        opcode: 'motorOn',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'мотор [PORT] [DIRECTION] [POWER]%',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            },
                            DIRECTION: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'directions'
                            },
                            POWER: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    {
                        opcode: 'motorOnFor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'мотор [PORT] [DIRECTION] [POWER]% на [TIME] сек',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            },
                            DIRECTION: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'directions'
                            },
                            POWER: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            },
                            TIME: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            }
                        }
                    },
                    {
                        opcode: 'motorOff',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'выключить мотор [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'stopAllMotors',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'остановить все моторы'
                    },
                    
                    '---',
                    
                    // === РАСШИРЕННОЕ УПРАВЛЕНИЕ МОТОРАМИ ===
                    {
                        opcode: 'motorSetSpeed',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить скорость мотора [PORT] [SPEED]%',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            },
                            SPEED: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    {
                        opcode: 'motorGoToPosition',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'мотор [PORT] в позицию [POSITION] градусов',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            },
                            POSITION: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 90
                            }
                        }
                    },
                    {
                        opcode: 'motorResetPosition',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'сбросить позицию мотора [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getMotorPosition',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'позиция мотора [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getMotorSpeed',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'скорость мотора [PORT]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            }
                        }
                    },
                    
                    '---',
                    
                    // === ТАНКОВОЕ УПРАВЛЕНИЕ ===
                    {
                        opcode: 'tankMove',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'танк: левый [LEFT]% правый [RIGHT]%',
                        arguments: {
                            LEFT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            },
                            RIGHT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    {
                        opcode: 'tankMoveFor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'танк: левый [LEFT]% правый [RIGHT]% на [TIME] сек',
                        arguments: {
                            LEFT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            },
                            RIGHT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            },
                            TIME: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 2
                            }
                        }
                    },
                    {
                        opcode: 'tankStop',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'танк: остановить'
                    },
                    
                    '---',
                    
                    // === ДАТЧИКИ ===
                    {
                        opcode: 'getSensor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик [PORT] значение',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getTouchSensor',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'датчик [PORT] нажат?',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getDistance',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик [PORT] расстояние см',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getColor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик [PORT] цвет',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getAngle',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'гироскоп [PORT] угол градусов',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getReflectedLight',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик [PORT] отраженный свет %',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'waitUntilSensor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'ждать пока датчик [PORT] [OPERATOR] [VALUE]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            },
                            OPERATOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'operators'
                            },
                            VALUE: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    
                    '---',
                    
                    // === СИСТЕМНЫЕ ФУНКЦИИ ===
                    {
                        opcode: 'playTone',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'играть тон [FREQ] Гц [DURATION] сек',
                        arguments: {
                            FREQ: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 440
                            },
                            DURATION: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 0.5
                            }
                        }
                    },
                    {
                        opcode: 'playNote',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'играть ноту [NOTE] [DURATION]',
                        arguments: {
                            NOTE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'notes'
                            },
                            DURATION: {
                                type: Scratch.ArgumentType.NUMBER,
                                menu: 'durations'
                            }
                        }
                    },
                    {
                        opcode: 'setLED',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'светодиоды [COLOR]',
                        arguments: {
                            COLOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'ledColors'
                            }
                        }
                    },
                    {
                        opcode: 'sayText',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'сказать [TEXT]',
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Привет от EV3'
                            }
                        }
                    },
                    {
                        opcode: 'getBattery',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'уровень батареи %'
                    },
                    {
                        opcode: 'beep',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'пикнуть'
                    },
                    
                    '---',
                    
                    // === УТИЛИТЫ ===
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
                        opcode: 'randomMotor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'случайный мотор [MIN]% [MAX]%'
                    },
                    {
                        opcode: 'calibrateSensor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'калибровать датчик [PORT]'
                    }
                ],
                
                menus: {
                    motorPorts: ['A', 'B', 'C', 'D'],
                    sensorPorts: ['1', '2', '3', '4'],
                    directions: ['вперед', 'назад'],
                    ledColors: ['красный', 'зеленый', 'оранжевый', 'выкл', 'мигает красный', 'мигает зеленый'],
                    notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
                    durations: ['целая', 'половинная', 'четвертная', 'восьмая'],
                    operators: ['>', '<', '=', '≠', '≥', '≤']
                }
            };
        }
        
        // === МЕТОДЫ БЛОКОВ ===
        
        async connect() {
            if (!this.serialSupported) {
                throw new Error('WebSerial API не поддерживается в вашем браузере. Используйте Chrome 89+, Edge 89+ или Opera 76+');
            }
            
            try {
                // Запрашиваем порт у пользователя
                const port = await navigator.serial.requestPort({
                    filters: [
                        { usbVendorId: 0x0694 },  // LEGO
                        { usbVendorId: 0x0E6F }   // LEGO Education
                    ]
                });
                
                await this.connectToPort(port);
                return true;
            } catch (error) {
                if (error.name === 'NotFoundError') {
                    throw new Error('EV3 не найден. Подключите EV3 через USB и убедитесь что он включен.');
                } else if (error.name === 'SecurityError') {
                    throw new Error('Нет разрешения на доступ к последовательному порту. Проверьте настройки браузера.');
                } else {
                    throw new Error(`Ошибка подключения: ${error.message}`);
                }
            }
        }
        
        disconnect() {
            if (this.reading && this.reader) {
                this.reading = false;
                this.reader.cancel();
                this.reader = null;
            }
            
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            
            if (this.device) {
                this.device.close();
                this.device = null;
            }
            
            this.connected = false;
            console.log('EV3 отключен');
        }
        
        isConnected() {
            return this.connected;
        }
        
        isSerialSupported() {
            return this.serialSupported;
        }
        
        async motorOn(args) {
            if (!this.connected) return;
            
            const direction = args.DIRECTION === 'вперед' ? 1 : -1;
            const power = Math.min(100, Math.max(0, args.POWER));
            const speed = direction * power;
            
            await this.sendMotorCommand(args.PORT, 'ON', speed);
            this.motorStates[args.PORT].speed = speed;
        }
        
        async motorOnFor(args) {
            if (!this.connected) return;
            
            await this.motorOn(args);
            
            // Ждем указанное время
            await new Promise(resolve => {
                setTimeout(async () => {
                    await this.sendMotorCommand(args.PORT, 'OFF');
                    this.motorStates[args.PORT].speed = 0;
                    resolve();
                }, args.TIME * 1000);
            });
        }
        
        async motorOff(args) {
            if (!this.connected) return;
            
            await this.sendMotorCommand(args.PORT, 'OFF');
            this.motorStates[args.PORT].speed = 0;
        }
        
        async stopAllMotors() {
            if (!this.connected) return;
            
            for (const port of ['A', 'B', 'C', 'D']) {
                await this.sendMotorCommand(port, 'OFF');
                this.motorStates[port].speed = 0;
            }
        }
        
        async motorSetSpeed(args) {
            if (!this.connected) return;
            
            const speed = Math.min(100, Math.max(0, args.SPEED));
            await this.sendMotorCommand(args.PORT, 'SPEED', speed);
            this.motorStates[args.PORT].speed = speed;
        }
        
        async motorGoToPosition(args) {
            if (!this.connected) return;
            
            await this.sendMotorCommand(args.PORT, 'GOTO', args.POSITION);
        }
        
        async motorResetPosition(args) {
            if (!this.connected) return;
            
            await this.sendMotorCommand(args.PORT, 'RESET');
            this.motorStates[args.PORT].position = 0;
        }
        
        getMotorPosition(args) {
            return this.motorStates[args.PORT]?.position || 0;
        }
        
        getMotorSpeed(args) {
            return Math.abs(this.motorStates[args.PORT]?.speed || 0);
        }
        
        async tankMove(args) {
            if (!this.connected) return;
            
            const left = Math.min(100, Math.max(-100, args.LEFT));
            const right = Math.min(100, Math.max(-100, args.RIGHT));
            
            await this.sendMotorCommand('A', 'TANK_LEFT', left);
            await this.sendMotorCommand('B', 'TANK_RIGHT', right);
        }
        
        async tankMoveFor(args) {
            if (!this.connected) return;
            
            await this.tankMove(args);
            
            await new Promise(resolve => {
                setTimeout(async () => {
                    await this.sendMotorCommand('A', 'OFF');
                    await this.sendMotorCommand('B', 'OFF');
                    resolve();
                }, args.TIME * 1000);
            });
        }
        
        async tankStop() {
            if (!this.connected) return;
            
            await this.sendMotorCommand('A', 'OFF');
            await this.sendMotorCommand('B', 'OFF');
            this.motorStates['A'].speed = 0;
            this.motorStates['B'].speed = 0;
        }
        
        getSensor(args) {
            return this.sensorValues[args.PORT] || 0;
        }
        
        getTouchSensor(args) {
            const value = this.sensorValues[args.PORT] || 0;
            return value > 50; // Датчик касания возвращает 0 или 100
        }
        
        getDistance(args) {
            const value = this.sensorValues[args.PORT] || 0;
            return Math.min(255, value); // Ультразвуковой датчик 0-255 см
        }
        
        getColor(args) {
            const value = this.sensorValues[args.PORT] || 0;
            return value % 8; // Цвета 0-7
        }
        
        getAngle(args) {
            return this.sensorValues[args.PORT] || 0;
        }
        
        getReflectedLight(args) {
            const value = this.sensorValues[args.PORT] || 0;
            return Math.min(100, Math.max(0, value));
        }
        
        async waitUntilSensor(args) {
            return new Promise((resolve) => {
                const checkSensor = () => {
                    const value = this.sensorValues[args.PORT] || 0;
                    const target = args.VALUE;
                    
                    let conditionMet = false;
                    switch (args.OPERATOR) {
                        case '>': conditionMet = value > target; break;
                        case '<': conditionMet = value < target; break;
                        case '=': conditionMet = Math.abs(value - target) < 2; break;
                        case '≠': conditionMet = Math.abs(value - target) >= 2; break;
                        case '≥': conditionMet = value >= target; break;
                        case '≤': conditionMet = value <= target; break;
                    }
                    
                    if (conditionMet) {
                        resolve();
                    } else {
                        setTimeout(checkSensor, 50);
                    }
                };
                
                checkSensor();
            });
        }
        
        async playTone(args) {
            if (!this.connected) return;
            
            await this.sendCommand(`TONE:${args.FREQ}:${args.DURATION * 1000}`);
        }
        
        async playNote(args) {
            if (!this.connected) return;
            
            const noteFreqs = {
                'C4': 261.63, 'D4': 293.66, 'E4': 329.63,
                'F4': 349.23, 'G4': 392.00, 'A4': 440.00,
                'B4': 493.88, 'C5': 523.25
            };
            
            const durationMap = {
                'целая': 1000,
                'половинная': 500,
                'четвертная': 250,
                'восьмая': 125
            };
            
            const freq = noteFreqs[args.NOTE] || 440;
            const duration = durationMap[args.DURATION] || 250;
            
            await this.sendCommand(`TONE:${freq}:${duration}`);
        }
        
        async setLED(args) {
            if (!this.connected) return;
            
            const colorMap = {
                'красный': 'RED',
                'зеленый': 'GREEN',
                'оранжевый': 'ORANGE',
                'выкл': 'OFF',
                'мигает красный': 'BLINK_RED',
                'мигает зеленый': 'BLINK_GREEN'
            };
            
            const color = colorMap[args.COLOR] || 'OFF';
            await this.sendCommand(`LED:${color}`);
        }
        
        async sayText(args) {
            if (!this.connected) return;
            
            await this.sendCommand(`SAY:${args.TEXT}`);
        }
        
        getBattery() {
            return this.batteryLevel || 100;
        }
        
        async beep() {
            if (!this.connected) return;
            
            await this.playTone({ FREQ: 440, DURATION: 0.2 });
        }
        
        wait(args) {
            return new Promise(resolve => {
                setTimeout(resolve, args.TIME * 1000);
            });
        }
        
        async randomMotor() {
            if (!this.connected) return;
            
            const ports = ['A', 'B', 'C', 'D'];
            const randomPort = ports[Math.floor(Math.random() * ports.length)];
            const randomSpeed = Math.floor(Math.random() * 101);
            
            await this.sendMotorCommand(randomPort, 'ON', randomSpeed);
            
            // Выключаем через 1 секунду
            setTimeout(async () => {
                await this.sendMotorCommand(randomPort, 'OFF');
            }, 1000);
        }
        
        async calibrateSensor(args) {
            if (!this.connected) return;
            
            await this.sendCommand(`CALIBRATE:${args.PORT}`);
        }
    }
    
    // Регистрация расширения
    if (Scratch.extensions.unsandboxed) {
        Scratch.extensions.register(new EV3LocalExtension());
    } else {
        console.warn('EV3 Local Extension requires unsandboxed mode in TurboWarp');
    }
})(Scratch);
  
