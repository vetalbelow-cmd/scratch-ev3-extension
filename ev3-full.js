/* LEGO EV3 Extended Extension for Scratch/TurboWarp
   Based on official Scratch EV3 extension with enhanced features
   Version: 3.0.0
*/

(function(Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('EV3 extension requires unsandboxed extension');
    }

    const DEVICE_NAMES = {
        MEDIUM_MOTOR: 'lego-ev3-m-motor',
        LARGE_MOTOR: 'lego-ev3-l-motor',
        COLOR_SENSOR: 'lego-ev3-color',
        ULTRASONIC_SENSOR: 'lego-ev3-us',
        GYRO_SENSOR: 'lego-ev3-gyro',
        TOUCH_SENSOR: 'lego-ev3-touch',
        INFRARED_SENSOR: 'lego-ev3-ir'
    };

    const MOTOR_PORTS = ['A', 'B', 'C', 'D'];
    const SENSOR_PORTS = ['1', '2', '3', '4'];
    const MOTOR_MODES = ['COAST', 'BRAKE', 'HOLD'];

    class EV3Extension {
        constructor() {
            this.runtime = Scratch.vm.runtime;
            this.ws = null;
            this.wsConnected = false;
            this.wsReconnectAttempts = 0;
            this.maxReconnectAttempts = 5;
            this.pendingCommands = new Map();
            this.commandId = 0;
            
            // Кэш значений датчиков
            this.sensorCache = {
                '1': { value: 0, type: 'UNKNOWN' },
                '2': { value: 0, type: 'UNKNOWN' },
                '3': { value: 0, type: 'UNKNOWN' },
                '4': { value: 0, type: 'UNKNOWN' }
            };
            
            // Состояние моторов
            this.motorState = {
                'A': { speed: 0, position: 0, mode: 'COAST' },
                'B': { speed: 0, position: 0, mode: 'COAST' },
                'C': { speed: 0, position: 0, mode: 'COAST' },
                'D': { speed: 0, position: 0, mode: 'COAST' }
            };
            
            this.setupWebSocket();
        }

        setupWebSocket() {
            const wsUrl = 'ws://localhost:8765';
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('EV3 WebSocket connected');
                this.wsConnected = true;
                this.wsReconnectAttempts = 0;
                this.startSensorPolling();
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Обработка ответов на команды
                    if (data.id && this.pendingCommands.has(data.id)) {
                        const { resolve, reject } = this.pendingCommands.get(data.id);
                        this.pendingCommands.delete(data.id);
                        
                        if (data.success) {
                            resolve(data);
                        } else {
                            reject(data.error);
                        }
                    }
                    
                    // Обработка обновлений датчиков
                    if (data.type === 'sensor_update') {
                        for (const [port, value] of Object.entries(data.data)) {
                            if (this.sensorCache[port]) {
                                this.sensorCache[port].value = value;
                            }
                        }
                    }
                    
                    // Обработка обновлений моторов
                    if (data.type === 'motor_update') {
                        for (const [port, state] of Object.entries(data.data)) {
                            if (this.motorState[port]) {
                                Object.assign(this.motorState[port], state);
                            }
                        }
                    }
                    
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('EV3 WebSocket error:', error);
            };
            
            this.ws.onclose = () => {
                console.log('EV3 WebSocket disconnected');
                this.wsConnected = false;
                this.stopSensorPolling();
                
                // Попытка переподключения
                if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
                    this.wsReconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.wsReconnectAttempts), 10000);
                    setTimeout(() => this.setupWebSocket(), delay);
                }
            };
        }
        
        startSensorPolling() {
            if (this.sensorPollInterval) {
                clearInterval(this.sensorPollInterval);
            }
            
            this.sensorPollInterval = setInterval(() => {
                if (this.wsConnected) {
                    this.ws.send(JSON.stringify({
                        type: 'get_sensors'
                    }));
                }
            }, 100); // 10 раз в секунду
        }
        
        stopSensorPolling() {
            if (this.sensorPollInterval) {
                clearInterval(this.sensorPollInterval);
                this.sensorPollInterval = null;
            }
        }
        
        async sendCommand(command, params = {}) {
            if (!this.wsConnected) {
                throw new Error('EV3 не подключен. Запустите ev3-bridge.py на компьютере/EV3');
            }
            
            const id = ++this.commandId;
            const message = {
                id: id,
                type: 'command',
                command: command,
                params: params,
                timestamp: Date.now()
            };
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.pendingCommands.delete(id);
                    reject(new Error('Таймаут выполнения команды'));
                }, 5000);
                
                this.pendingCommands.set(id, { resolve, reject, timeout });
                this.ws.send(JSON.stringify(message));
            });
        }

        getInfo() {
            return {
                id: 'ev3extended',
                name: 'LEGO EV3 Extended',
                color1: '#FF6600',
                color2: '#CC5500',
                color3: '#AA4400',
                
                blocks: [
                    // === БЛОКИ ПОДКЛЮЧЕНИЯ ===
                    {
                        opcode: 'connect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'подключиться к EV3 [IP]',
                        arguments: {
                            IP: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'localhost:8765'
                            }
                        }
                    },
                    {
                        opcode: 'disconnect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'отключиться от EV3'
                    },
                    {
                        opcode: 'isConnected',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'EV3 подключен?'
                    },
                    
                    '---',
                    
                    // === БАЗОВЫЕ БЛОКИ ДЛЯ МОТОРОВ ===
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
                        text: 'мотор [PORT] [DIRECTION] [POWER]% на [DURATION] сек',
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
                            DURATION: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 1
                            }
                        }
                    },
                    {
                        opcode: 'motorOff',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'выключить мотор [PORT] [MODE]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPorts'
                            },
                            MODE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorModes'
                            }
                        }
                    },
                    {
                        opcode: 'stopAllMotors',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'остановить все моторы'
                    },
                    
                    '---',
                    
                    // === РАСШИРЕННЫЕ БЛОКИ МОТОРОВ ===
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
                        text: 'танк: левый [LEFT]% правый [RIGHT]% на [DURATION] сек',
                        arguments: {
                            LEFT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            },
                            RIGHT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            },
                            DURATION: {
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
                    
                    // === БЛОКИ ДАТЧИКОВ ===
                    {
                        opcode: 'getSensorValue',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик [SENSOR] значение',
                        arguments: {
                            SENSOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getTouchSensor',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'датчик [SENSOR] нажат?',
                        arguments: {
                            SENSOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getColorSensor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик [SENSOR] цвет',
                        arguments: {
                            SENSOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getDistance',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик [SENSOR] расстояние см',
                        arguments: {
                            SENSOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getAngle',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'гироскоп [SENSOR] угол градусов',
                        arguments: {
                            SENSOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    {
                        opcode: 'getReflectedLight',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'датчик [SENSOR] отраженный свет %',
                        arguments: {
                            SENSOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPorts'
                            }
                        }
                    },
                    
                    '---',
                    
                    // === ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ===
                    {
                        opcode: 'playTone',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'играть тон [FREQUENCY] Гц [DURATION] сек',
                        arguments: {
                            FREQUENCY: {
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
                        opcode: 'setLED',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'светодиоды [COLOR] [PATTERN]',
                        arguments: {
                            COLOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'ledColors'
                            },
                            PATTERN: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'ledPatterns'
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
                        opcode: 'getBatteryLevel',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'уровень батареи %'
                    },
                    {
                        opcode: 'waitUntilSensor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'ждать пока датчик [SENSOR] [OPERATOR] [VALUE]',
                        arguments: {
                            SENSOR: {
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
                    }
                ],
                
                menus: {
                    motorPorts: MOTOR_PORTS,
                    sensorPorts: SENSOR_PORTS,
                    directions: ['вперед', 'назад'],
                    motorModes: MOTOR_MODES,
                    ledColors: ['красный', 'зеленый', 'оранжевый', 'выкл'],
                    ledPatterns: ['горит', 'мигает', 'пульсирует'],
                    operators: ['>', '<', '=', '≠']
                }
            };
        }

        // === МЕТОДЫ БЛОКОВ ===
        
        async connect(args) {
            if (this.wsConnected && this.ws) {
                this.ws.close();
            }
            
            const ip = args.IP || 'localhost:8765';
            const wsUrl = `ws://${ip}`;
            
            return new Promise((resolve, reject) => {
                const ws = new WebSocket(wsUrl);
                let connected = false;
                
                const timeout = setTimeout(() => {
                    if (!connected) {
                        ws.close();
                        reject(new Error('Таймаут подключения'));
                    }
                }, 5000);
                
                ws.onopen = () => {
                    connected = true;
                    clearTimeout(timeout);
                    this.ws = ws;
                    this.wsConnected = true;
                    this.setupWebSocketListeners();
                    resolve();
                };
                
                ws.onerror = (error) => {
                    clearTimeout(timeout);
                    reject(new Error(`Ошибка подключения: ${error}`));
                };
            });
        }
        
        disconnect() {
            if (this.ws) {
                this.ws.close();
                this.ws = null;
                this.wsConnected = false;
            }
            this.stopSensorPolling();
        }
        
        isConnected() {
            return this.wsConnected;
        }
        
        async motorOn(args) {
            const direction = args.DIRECTION === 'вперед' ? 1 : -1;
            const power = Math.min(100, Math.max(0, args.POWER));
            const speed = direction * power;
            
            await this.sendCommand('motor_on', {
                port: args.PORT,
                speed: speed
            });
            
            this.motorState[args.PORT].speed = speed;
        }
        
        async motorOnFor(args) {
            const direction = args.DIRECTION === 'вперед' ? 1 : -1;
            const power = Math.min(100, Math.max(0, args.POWER));
            const speed = direction * power;
            
            await this.sendCommand('motor_on_for', {
                port: args.PORT,
                speed: speed,
                duration: args.DURATION
            });
        }
        
        async motorOff(args) {
            await this.sendCommand('motor_off', {
                port: args.PORT,
                mode: args.MODE
            });
            
            this.motorState[args.PORT].speed = 0;
            this.motorState[args.PORT].mode = args.MODE;
        }
        
        async stopAllMotors() {
            await this.sendCommand('stop_all_motors');
            
            for (const port of MOTOR_PORTS) {
                this.motorState[port].speed = 0;
                this.motorState[port].mode = 'COAST';
            }
        }
        
        async motorSetSpeed(args) {
            const speed = Math.min(100, Math.max(0, args.SPEED));
            await this.sendCommand('motor_set_speed', {
                port: args.PORT,
                speed: speed
            });
            
            this.motorState[args.PORT].speed = speed;
        }
        
        async motorGoToPosition(args) {
            await this.sendCommand('motor_go_to_position', {
                port: args.PORT,
                position: args.POSITION
            });
        }
        
        async motorResetPosition(args) {
            await this.sendCommand('motor_reset_position', {
                port: args.PORT
            });
            
            this.motorState[args.PORT].position = 0;
        }
        
        getMotorPosition(args) {
            return this.motorState[args.PORT]?.position || 0;
        }
        
        getMotorSpeed(args) {
            return Math.abs(this.motorState[args.PORT]?.speed || 0);
        }
        
        async tankMove(args) {
            await this.sendCommand('tank_move', {
                left: args.LEFT,
                right: args.RIGHT
            });
        }
        
        async tankMoveFor(args) {
            await this.sendCommand('tank_move_for', {
                left: args.LEFT,
                right: args.RIGHT,
                duration: args.DURATION
            });
        }
        
        async tankStop() {
            await this.sendCommand('tank_stop');
        }
        
        getSensorValue(args) {
            return this.sensorCache[args.SENSOR]?.value || 0;
        }
        
        getTouchSensor(args) {
            const value = this.sensorCache[args.SENSOR]?.value || 0;
            return value > 0.5;
        }
        
        getColorSensor(args) {
            // Возвращаем номер цвета (0-7)
            const value = this.sensorCache[args.SENSOR]?.value || 0;
            return Math.floor(value);
        }
        
        getDistance(args) {
            return this.sensorCache[args.SENSOR]?.value || 0;
        }
        
        getAngle(args) {
            return this.sensorCache[args.SENSOR]?.value || 0;
        }
        
        getReflectedLight(args) {
            return Math.min(100, Math.max(0, this.sensorCache[args.SENSOR]?.value || 0));
        }
        
        async playTone(args) {
            await this.sendCommand('play_tone', {
                frequency: args.FREQUENCY,
                duration: args.DURATION
            });
        }
        
        async setLED(args) {
            await this.sendCommand('set_led', {
                color: args.COLOR,
                pattern: args.PATTERN
            });
        }
        
        async sayText(args) {
            await this.sendCommand('say_text', {
                text: args.TEXT
            });
        }
        
        async getBatteryLevel() {
            try {
                const response = await this.sendCommand('get_battery');
                return response.level || 100;
            } catch {
                return 100;
            }
        }
        
        async waitUntilSensor(args) {
            return new Promise((resolve) => {
                const checkSensor = () => {
                    const value = this.sensorCache[args.SENSOR]?.value || 0;
                    const target = args.VALUE;
                    
                    let conditionMet = false;
                    switch (args.OPERATOR) {
                        case '>': conditionMet = value > target; break;
                        case '<': conditionMet = value < target; break;
                        case '=': conditionMet = Math.abs(value - target) < 1; break;
                        case '≠': conditionMet = Math.abs(value - target) >= 1; break;
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
        
        setupWebSocketListeners() {
            if (!this.ws) return;
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'sensor_update') {
                        for (const [port, sensorData] of Object.entries(data.data)) {
                            if (this.sensorCache[port]) {
                                Object.assign(this.sensorCache[port], sensorData);
                            }
                        }
                    }
                    
                    if (data.type === 'motor_update') {
                        for (const [port, motorData] of Object.entries(data.data)) {
                            if (this.motorState[port]) {
                                Object.assign(this.motorState[port], motorData);
                            }
                        }
                    }
                    
                    if (data.id && this.pendingCommands.has(data.id)) {
                        const pending = this.pendingCommands.get(data.id);
                        clearTimeout(pending.timeout);
                        
                        if (data.success) {
                            pending.resolve(data);
                        } else {
                            pending.reject(new Error(data.error));
                        }
                        
                        this.pendingCommands.delete(data.id);
                    }
                    
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };
        }
    }
    
    // Регистрация расширения
    Scratch.extensions.register(new EV3Extension());
})(Scratch);
