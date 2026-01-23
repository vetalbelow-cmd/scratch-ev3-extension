/* LEGO EV3 Local Extension for TurboWarp/Scratch
   Version: 4.1.0 - Поддержка sandboxed mode
   Работает в: TurboWarp, Scratch
*/

(function(Scratch) {
    'use strict';

    class EV3LocalExtension {
        constructor() {
            this.device = null;
            this.writer = null;
            this.connected = false;
            this.serialSupported = 'serial' in navigator;
            
            // Проверяем режим работы
            this.isSandboxed = !Scratch.extensions.unsandboxed;
            
            // Для sandboxed mode используем postMessage
            if (this.isSandboxed) {
                console.log('EV3 Extension: Running in sandboxed mode');
                this.setupSandboxedCommunication();
            }
        }
        
        setupSandboxedCommunication() {
            // Слушаем сообщения от главного окна
            window.addEventListener('message', (event) => {
                // Проверяем происхождение
                if (event.origin !== window.location.origin) return;
                
                const data = event.data;
                if (data && data.type === 'ev3_command') {
                    this.handleSandboxedCommand(data);
                }
            });
        }
        
        async handleSandboxedCommand(data) {
            try {
                let result;
                
                switch (data.command) {
                    case 'connect':
                        result = await this.connectDevice();
                        break;
                    case 'disconnect':
                        result = await this.disconnectDevice();
                        break;
                    case 'motor_on':
                        result = await this.sendMotorCommand(data.port, 'ON', data.speed);
                        break;
                    case 'motor_off':
                        result = await this.sendMotorCommand(data.port, 'OFF', 0);
                        break;
                    case 'play_tone':
                        result = await this.sendCommand(`TONE:${data.freq}:${data.duration}`);
                        break;
                }
                
                // Отправляем результат обратно
                window.parent.postMessage({
                    type: 'ev3_response',
                    id: data.id,
                    success: true,
                    result: result
                }, '*');
                
            } catch (error) {
                window.parent.postMessage({
                    type: 'ev3_response',
                    id: data.id,
                    success: false,
                    error: error.message
                }, '*');
            }
        }
        
        async connectDevice() {
            if (!this.serialSupported) {
                throw new Error('WebSerial API не поддерживается в вашем браузере');
            }
            
            try {
                const port = await navigator.serial.requestPort({
                    filters: [
                        { usbVendorId: 0x0694 },  // LEGO
                        { usbVendorId: 0x0E6F }   // LEGO Education
                    ]
                });
                
                await port.open({ baudRate: 115200 });
                this.device = port;
                this.writer = port.writable.getWriter();
                this.connected = true;
                
                // Начинаем чтение данных
                this.startReading();
                
                return { connected: true, message: 'EV3 подключен' };
                
            } catch (error) {
                throw new Error(`Ошибка подключения: ${error.message}`);
            }
        }
        
        async disconnectDevice() {
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            
            if (this.device) {
                await this.device.close();
                this.device = null;
            }
            
            this.connected = false;
            return { connected: false, message: 'EV3 отключен' };
        }
        
        async sendCommand(command) {
            if (!this.connected || !this.writer) {
                throw new Error('EV3 не подключен');
            }
            
            const encoder = new TextEncoder();
            await this.writer.write(encoder.encode(command + '\n'));
            return { sent: true, command: command };
        }
        
        async sendMotorCommand(port, action, speed) {
            const command = `MOTOR:${port}:${action}:${speed}`;
            return await this.sendCommand(command);
        }
        
        startReading() {
            if (!this.device || !this.device.readable) return;
            
            const reader = this.device.readable.getReader();
            
            const readLoop = async () => {
                try {
                    while (this.connected) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        
                        if (value) {
                            this.processIncomingData(value);
                        }
                    }
                } catch (error) {
                    console.error('Read error:', error);
                } finally {
                    reader.releaseLock();
                }
            };
            
            readLoop();
        }
        
        processIncomingData(data) {
            // Обработка входящих данных (можно расширить)
            console.log('Received from EV3:', new TextDecoder().decode(data));
        }
        
        // ========== БЛОКИ ДЛЯ SCRATCH/TURBOWARP ==========
        
        getInfo() {
            const blocks = [
                // === БЛОКИ ПОДКЛЮЧЕНИЯ ===
                {
                    opcode: 'connect',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'подключить EV3 через USB',
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
                    opcode: 'isSupported',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: 'WebSerial поддерживается?'
                },
                
                '---',
                
                // === БЛОКИ МОТОРОВ ===
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
                // === БЛОКИ ДЛЯ ДАТЧИКА ЦВЕТА И МОТОРА НА ГРАДУСЫ ===

// 1. Блок: Значение датчика цвета (режим "Цвет")
Blockly.Blocks['ev3_color_sensor_color'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("значение датчика цвета в режиме ЦВЕТ порт")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"],
          ["4", "4"]
        ]), "PORT");
    this.setOutput(true, 'Number');
    this.setColour(230);
    this.setTooltip("Возвращает номер цвета (0=нет цвета, 1=черный, 2=синий, 3=зеленый, 4=желтый, 5=красный, 6=белый, 7=коричневый)");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['ev3_color_sensor_color'] = function(block) {
  var port = block.getFieldValue('PORT');
  var code = `ev3.colorSensorColor(${port})`;
  return [code, Blockly.JavaScript.ORDER_NONE];
};

// 2. Блок: Значение датчика цвета (режим "Яркость отраженного света")
Blockly.Blocks['ev3_color_sensor_reflected'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("значение датчика цвета в режиме ЯРКОСТЬ порт")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"],
          ["4", "4"]
        ]), "PORT");
    this.setOutput(true, 'Number');
    this.setColour(230);
    this.setTooltip("Возвращает яркость отраженного света от 0 (темно) до 100 (ярко)");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['ev3_color_sensor_reflected'] = function(block) {
  var port = block.getFieldValue('PORT');
  var code = `ev3.colorSensorReflected(${port})`;
  return [code, Blockly.JavaScript.ORDER_NONE];
};

// 3. Блок: Включить мотор на количество градусов
Blockly.Blocks['ev3_motor_degrees'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("включить мотор на")
        .appendField(new Blockly.FieldNumber(90, 0, 1000, 1), "DEGREES")
        .appendField("градусов порт")
        .appendField(new Blockly.FieldDropdown([
          ["A", "A"],
          ["B", "B"],
          ["C", "C"],
          ["D", "D"]
        ]), "PORT")
        .appendField("мощность")
        .appendField(new Blockly.FieldNumber(50, 0, 100, 1), "POWER");
    this.appendDummyInput()
        .appendField("ожидать завершения")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "WAIT");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Вращает мотор на заданное количество градусов с указанной мощностью");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['ev3_motor_degrees'] = function(block) {
  var degrees = block.getFieldValue('DEGREES');
  var port = block.getFieldValue('PORT');
  var power = block.getFieldValue('POWER');
  var wait = block.getFieldValue('WAIT') === 'TRUE';
  
  var code = `ev3.motorDegrees('${port}', ${degrees}, ${power}, ${wait});\n`;
  return code;
};

// === ОБНОВЛЕННЫЙ КОД ДЛЯ ev3.js (реализация функций) ===

// Добавьте эти функции в объект ev3 в вашем файле ev3.js:

/*
// Режимы датчика цвета
const COLOR_MODES = {
  COLOR: 0,
  REFLECTED: 1
};

// Функция для получения значения датчика цвета в режиме "Цвет"
ev3.colorSensorColor = function(port) {
  // Устанавливаем режим датчика цвета
  ev3.send(`sensor${port}.mode = ${COLOR_MODES.COLOR}`);
  
  // Читаем значение
  let value = ev3.send(`sensor${port}.value0`);
  
  // Возвращаем номер цвета
  return parseInt(value) || 0;
};

// Функция для получения значения датчика цвета в режиме "Яркость отраженного света"
ev3.colorSensorReflected = function(port) {
  // Устанавливаем режим датчика отраженного света
  ev3.send(`sensor${port}.mode = ${COLOR_MODES.REFLECTED}`);
  
  // Читаем значение
  let value = ev3.send(`sensor${port}.value0`);
  
  // Преобразуем в проценты (0-100)
  let percent = Math.min(100, Math.max(0, parseInt(value) || 0));
  return percent;
};

// Функция для включения мотора на заданное количество градусов
ev3.motorDegrees = function(port, degrees, power, wait = true) {
  // Устанавливаем режим градусов
  ev3.send(`motor${port}.position_mode = 1`); // абсолютная позиция
  
  // Устанавливаем целевую позицию
  let currentPos = parseInt(ev3.send(`motor${port}.position`)) || 0;
  let targetPos = currentPos + parseInt(degrees);
  
  ev3.send(`motor${port}.position_sp = ${targetPos}`);
  
  // Устанавливаем мощность
  ev3.send(`motor${port}.duty_cycle_sp = ${power}`);
  
  // Запускаем мотор
  ev3.send(`motor${port}.command = run-to-abs-pos`);
  
  // Если нужно ждать завершения
  if (wait) {
    let isRunning = true;
    while (isRunning) {
      let state = ev3.send(`motor${port}.state`);
      isRunning = state.includes('running');
      // Небольшая задержка для проверки
      ev3.sleep(50);
    }
  }
};
*/

// === КАТЕГОРИЯ ДЛЯ ПАНЕЛИ БЛОКОВ ===
// Добавьте эти блоки в вашу категорию EV3:

/*
{
  "kind": "block",
  "type": "ev3_color_sensor_color"
},
{
  "kind": "block",
  "type": "ev3_color_sensor_reflected"
},
{
  "kind": "block",
  "type": "ev3_motor_degrees"
}
*/
                // === БЛОКИ ДАТЧИКОВ (симуляция) ===
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
                
                '---',
                
                // === СИСТЕМНЫЕ БЛОКИ ===
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
                    opcode: 'beep',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'пикнуть'
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
                    opcode: 'getBattery',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'уровень батареи %'
                }
            ];
            
            // Для sandboxed mode добавляем предупреждение
            if (this.isSandboxed) {
                blocks.unshift({
                    opcode: 'showWarning',
                    blockType: Scratch.BlockType.COMMAND,
                    text: '⚠️ Включите Unsandboxed Mode',
                    disableMonitor: true
                });
            }
            
            return {
                id: 'ev3localsandbox',
                name: this.isSandboxed ? 'EV3 (Sandboxed)' : 'EV3 Local',
                color1: this.isSandboxed ? '#FFA500' : '#00A8FF',
                color2: this.isSandboxed ? '#FF8C00' : '#0097E6',
                color3: this.isSandboxed ? '#FF7F50' : '#0088CC',
                
                blocks: blocks,
                
                menus: {
                    motorPorts: ['A', 'B', 'C', 'D'],
                    sensorPorts: ['1', '2', '3', '4'],
                    directions: ['вперед', 'назад'],
                    ledColors: ['красный', 'зеленый', 'оранжевый', 'выкл']
                }
            };
        }
        
        // ========== МЕТОДЫ БЛОКОВ ==========
        
        async showWarning() {
            if (this.isSandboxed) {
                alert('⚠️ Для работы с реальным EV3 нужно:\n\n' +
                      '1. Открыть https://turbowarp.org/editor\n' +
                      '2. Нажать "Настройки" (шестеренка)\n' +
                      '3. Включить "Unsandboxed extensions"\n' +
                      '4. Перезагрузить страницу\n\n' +
                      'Или используйте блоки в симуляционном режиме.');
            }
        }
        
        async connect() {
            if (this.isSandboxed) {
                await this.showWarning();
                return;
            }
            
            try {
                await this.connectDevice();
                return true;
            } catch (error) {
                throw new Error(error.message);
            }
        }
        
        async disconnect() {
            if (this.isSandboxed) return;
            
            try {
                await this.disconnectDevice();
                return true;
            } catch (error) {
                throw new Error(error.message);
            }
        }
        
        isConnected() {
            return this.connected;
        }
        
        isSupported() {
            return this.serialSupported;
        }
        
        async motorOn(args) {
            if (this.isSandboxed) {
                await this.showWarning();
                return;
            }
            
            if (!this.connected) {
                throw new Error('Сначала подключите EV3');
            }
            
            const direction = args.DIRECTION === 'вперед' ? 1 : -1;
            const speed = direction * Math.min(100, Math.max(0, args.POWER));
            
            await this.sendMotorCommand(args.PORT, 'ON', speed);
        }
        
        async motorOnFor(args) {
            if (this.isSandboxed) {
                // Симуляция для sandboxed mode
                await this.wait({ TIME: args.TIME });
                return;
            }
            
            await this.motorOn(args);
            await this.wait({ TIME: args.TIME });
            await this.sendMotorCommand(args.PORT, 'OFF', 0);
        }
        
        async motorOff(args) {
            if (this.isSandboxed) return;
            
            await this.sendMotorCommand(args.PORT, 'OFF', 0);
        }
        
        async stopAllMotors() {
            if (this.isSandboxed) return;
            
            for (const port of ['A', 'B', 'C', 'D']) {
                await this.sendMotorCommand(port, 'OFF', 0);
            }
        }
        
        // Симуляция датчиков для sandboxed mode
        getSensor(args) {
            // Генерируем случайные значения для симуляции
            const base = args.PORT.charCodeAt(0) * 10;
            const random = Math.floor(Math.random() * 100);
            return (base + random) % 100;
        }
        
        getTouchSensor(args) {
            // 30% шанс что "нажато"
            return Math.random() < 0.3;
        }
        
        getDistance(args) {
            // Симуляция расстояния 0-100 см
            return Math.floor(Math.random() * 100);
        }
        
        async playTone(args) {
            if (this.isSandboxed) {
                // Симуляция звука через Web Audio API
                this.playSimulatedTone(args.FREQ, args.DURATION);
                return;
            }
            
            if (!this.connected) {
                throw new Error('Сначала подключите EV3');
            }
            
            await this.sendCommand(`TONE:${args.FREQ}:${args.DURATION * 1000}`);
        }
        
        playSimulatedTone(frequency, duration) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration);
            } catch (error) {
                console.log('Симуляция тона:', frequency, 'Гц', duration, 'сек');
            }
        }
        
        async beep() {
            await this.playTone({ FREQ: 440, DURATION: 0.2 });
        }
        
        async setLED(args) {
            if (this.isSandboxed) {
                console.log('Светодиоды:', args.COLOR);
                return;
            }
            
            if (!this.connected) {
                throw new Error('Сначала подключите EV3');
            }
            
            const colorMap = {
                'красный': 'RED',
                'зеленый': 'GREEN', 
                'оранжевый': 'ORANGE',
                'выкл': 'OFF'
            };
            
            const color = colorMap[args.COLOR] || 'OFF';
            await this.sendCommand(`LED:${color}`);
        }
        
        wait(args) {
            return new Promise(resolve => {
                setTimeout(resolve, args.TIME * 1000);
            });
        }
        
        getBattery() {
            // Симуляция уровня батареи
            return this.connected ? 85 : 0;
        }
    }
    
    // Регистрация расширения
    try {
        Scratch.extensions.register(new EV3LocalExtension());
    } catch (error) {
        console.error('Failed to register EV3 extension:', error);
        
        // Альтернативная регистрация для sandboxed mode
        if (window.ScratchExtensions) {
            const ext = new EV3LocalExtension();
            window.ScratchExtensions.register('EV3 Local', ext.getInfo(), ext);
        }
    }
    
})(Scratch);
