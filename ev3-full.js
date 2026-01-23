// ev3-real-connection.js - Реальное подключение через WebSocket
(function(Scratch) {
    'use strict';
    
    class EV3RealExtension {
        constructor() {
            this.ws = null;
            this.connected = false;
            this.messageId = 0;
            this.callbacks = {};
        }
        
        getInfo() {
            return {
                id: 'ev3real',
                name: 'EV3 Real',
                color1: '#4a148c',
                blocks: [
                    {
                        opcode: 'connectWebSocket',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'connect EV3 websocket [IP]',
                        arguments: {
                            IP: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '192.168.0.103'
                            }
                        }
                    },
                    {
                        opcode: 'isConnected',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'EV3 connected?',
                        arguments: {}
                    },
                    {
                        opcode: 'disconnect',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'disconnect EV3',
                        arguments: {}
                    },
                    '---',
                    {
                        opcode: 'motorOn',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'motor [PORT] power [POWER]',
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
                        text: 'motor [PORT] off',
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
                        text: 'motor [PORT] degrees [DEG] power [POWER]',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'motorPort',
                                defaultValue: 'A'
                            },
                            DEG: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 90
                            },
                            POWER: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 50
                            }
                        }
                    },
                    '---',
                    {
                        opcode: 'colorSensorColor',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'color sensor color [PORT]',
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
                        text: 'color sensor brightness [PORT]',
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
                        text: 'touch sensor [PORT] pressed',
                        arguments: {
                            PORT: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'sensorPort',
                                defaultValue: '1'
                            }
                        }
                    },
                    '---',
                    {
                        opcode: 'beep',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'beep',
                        arguments: {}
                    },
                    {
                        opcode: 'led',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'LED [COLOR]',
                        arguments: {
                            COLOR: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'ledColor',
                                defaultValue: 'green'
                            }
                        }
                    }
                ],
                menus: {
                    motorPort: ['A', 'B', 'C', 'D'],
                    sensorPort: ['1', '2', '3', '4'],
                    ledColor: ['off', 'green', 'red', 'orange', 'green flash', 'red flash', 'orange flash']
                }
            };
        }
        
        // Подключение через WebSocket
        connectWebSocket(args) {
            const ip = args.IP;
            const url = `ws://${ip}:8080`;
            
            console.log(`Connecting to EV3 WebSocket: ${url}`);
            
            return new Promise((resolve) => {
                if (this.ws) {
                    this.ws.close();
                }
                
                this.ws = new WebSocket(url);
                
                this.ws.onopen = () => {
                    console.log('WebSocket connected to EV3');
                    this.connected = true;
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('EV3 response:', data);
                        
                        if (data.id && this.callbacks[data.id]) {
                            this.callbacks[data.id](data);
                            delete this.callbacks[data.id];
                        }
                    } catch (e) {
                        console.error('Failed to parse EV3 message:', e);
                    }
                };
                
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    alert(`Cannot connect to EV3 at ${ip}\nCheck:\n1. EV3 is on\n2. IP is correct\n3. EV3 WebSocket server is running`);
                    resolve();
                };
                
                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.connected = false;
                };
                
                // Таймаут подключения
                setTimeout(() => {
                    if (!this.connected) {
                        alert(`Timeout connecting to ${ip}`);
                        resolve();
                    }
                }, 5000);
            });
        }
        
        isConnected() {
            return this.connected;
        }
        
        disconnect() {
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            this.connected = false;
            console.log('EV3 disconnected');
            return Promise.resolve();
        }
        
        // Отправка команды EV3
        sendCommand(command, waitForResponse = false) {
            if (!this.connected || !this.ws) {
                console.warn('EV3 not connected');
                return Promise.reject('EV3 not connected');
            }
            
            return new Promise((resolve, reject) => {
                const msgId = ++this.messageId;
                const message = {
                    id: msgId,
                    command: command
                };
                
                if (waitForResponse) {
                    this.callbacks[msgId] = (response) => {
                        resolve(response.result);
                    };
                    
                    setTimeout(() => {
                        if (this.callbacks[msgId]) {
                            delete this.callbacks[msgId];
                            reject('Timeout waiting for EV3 response');
                        }
                    }, 3000);
                }
                
                this.ws.send(JSON.stringify(message));
                
                if (!waitForResponse) {
                    resolve();
                }
            });
        }
        
        // Моторы
        motorOn(args) {
            if (!this.connected) {
                console.log('Emulation: motor', args.PORT, 'on at', args.POWER, '%');
                return Promise.resolve();
            }
            
            const port = args.PORT;
            const power = Math.max(-100, Math.min(100, args.POWER));
            const command = `motor.${port}.power = ${power}`;
            
            console.log(`EV3: Motor ${port} on at ${power}%`);
            return this.sendCommand(command);
        }
        
        motorOff(args) {
            if (!this.connected) {
                console.log('Emulation: motor', args.PORT, 'off');
                return Promise.resolve();
            }
            
            const port = args.PORT;
            const command = `motor.${port}.stop`;
            
            console.log(`EV3: Motor ${port} off`);
            return this.sendCommand(command);
        }
        
        motorDegrees(args) {
            const port = args.PORT;
            const degrees = args.DEG;
            const power = Math.max(0, Math.min(100, args.POWER));
            
            console.log(`EV3: Motor ${port} ${degrees}° at ${power}%`);
            
            if (!this.connected) {
                // Эмуляция
                return new Promise(resolve => {
                    setTimeout(() => {
                        console.log(`Emulation: Motor ${port} rotation complete`);
                        resolve();
                    }, Math.abs(degrees) * 20);
                });
            }
            
            // Реальная команда EV3 (примерный формат)
            const command = `motor.${port}.run_to_rel_pos position_sp=${degrees} speed_sp=${power}`;
            return this.sendCommand(command, true);
        }
        
        // Датчики
        colorSensorColor(args) {
            const port = args.PORT;
            
            if (!this.connected) {
                // Эмуляция
                const color = Math.floor(Math.random() * 8);
                console.log(`Emulation: Color sensor ${port} = ${color}`);
                return color;
            }
            
            const command = `sensor.${port}.color`;
            return this.sendCommand(command, true)
                .then(value => parseInt(value) || 0)
                .catch(() => 0);
        }
        
        colorSensorReflected(args) {
            const port = args.PORT;
            
            if (!this.connected) {
                // Эмуляция
                const brightness = Math.floor(Math.random() * 101);
                console.log(`Emulation: Brightness sensor ${port} = ${brightness}%`);
                return brightness;
            }
            
            const command = `sensor.${port}.reflected`;
            return this.sendCommand(command, true)
                .then(value => {
                    const num = parseInt(value) || 0;
                    return Math.min(100, Math.max(0, num));
                })
                .catch(() => 0);
        }
        
        touchSensor(args) {
            const port = args.PORT;
            
            if (!this.connected) {
                // Эмуляция
                console.log(`Emulation: Touch sensor ${port} = false`);
                return false;
            }
            
            const command = `sensor.${port}.touched`;
            return this.sendCommand(command, true)
                .then(value => value === 'true' || value === '1')
                .catch(() => false);
        }
        
        // Система
        beep() {
            console.log('EV3: Beep');
            
            if (!this.connected) {
                // Эмуляция звука в браузере
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
                    }, 300);
                } catch (e) {
                    // Игнорируем
                }
                return Promise.resolve();
            }
            
            return this.sendCommand('sound.beep');
        }
        
        led(args) {
            const color = args.COLOR;
            console.log(`EV3: LED ${color}`);
            
            if (!this.connected) {
                return Promise.resolve();
            }
            
            const ledMap = {
                'off': '0',
                'green': '1',
                'red': '2',
                'orange': '3',
                'green flash': '4',
                'red flash': '5',
                'orange flash': '6'
            };
            
            const code = ledMap[color] || '0';
            return this.sendCommand(`led.left = ${code}\nled.right = ${code}`);
        }
    }
    
    // Регистрация
    try {
        const extension = new EV3RealExtension();
        Scratch.extensions.register(extension);
        console.log('EV3 Real extension registered');
    } catch (error) {
        console.error('Error registering EV3 extension:', error);
    }
    
})(Scratch);
