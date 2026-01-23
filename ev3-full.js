// ev3-full.js - Полная версия расширения EV3 для Blockly

// ===== ОСНОВНЫЕ НАСТРОЙКИ =====
var EV3_URL = 'http://192.168.0.103';
var EV3_TOKEN = 'ABC123';

// ===== ОПРЕДЕЛЕНИЕ БЛОКОВ =====

// 1. Блок: Подключиться к EV3
Blockly.Blocks['ev3_connect'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("подключиться к EV3");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
    this.setTooltip("Подключиться к роботу EV3");
    this.setHelpUrl("");
  }
};

// 2. Блок: Отключиться от EV3
Blockly.Blocks['ev3_disconnect'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("отключиться от EV3");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
    this.setTooltip("Отключиться от робота EV3");
    this.setHelpUrl("");
  }
};

// 3. Блок: Включить мотор
Blockly.Blocks['ev3_motor_on'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("включить мотор порт")
        .appendField(new Blockly.FieldDropdown([
          ["A", "A"],
          ["B", "B"],
          ["C", "C"],
          ["D", "D"]
        ]), "PORT")
        .appendField("мощность")
        .appendField(new Blockly.FieldNumber(50, -100, 100, 1), "POWER");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Включить мотор с заданной мощностью");
    this.setHelpUrl("");
  }
};

// 4. Блок: Выключить мотор
Blockly.Blocks['ev3_motor_off'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("выключить мотор порт")
        .appendField(new Blockly.FieldDropdown([
          ["A", "A"],
          ["B", "B"],
          ["C", "C"],
          ["D", "D"]
        ]), "PORT");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Выключить мотор");
    this.setHelpUrl("");
  }
};

// 5. Блок: Включить мотор на время
Blockly.Blocks['ev3_motor_time'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("включить мотор на")
        .appendField(new Blockly.FieldNumber(1, 0, 10, 0.1), "TIME")
        .appendField("сек порт")
        .appendField(new Blockly.FieldDropdown([
          ["A", "A"],
          ["B", "B"],
          ["C", "C"],
          ["D", "D"]
        ]), "PORT")
        .appendField("мощность")
        .appendField(new Blockly.FieldNumber(50, -100, 100, 1), "POWER")
        .appendField("ожидать")
        .appendField(new Blockly.FieldCheckbox("TRUE"), "WAIT");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(65);
    this.setTooltip("Включить мотор на заданное время");
    this.setHelpUrl("");
  }
};

// 6. Блок: Включить мотор на количество градусов
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

// 7. Блок: Значение датчика касания
Blockly.Blocks['ev3_touch_sensor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("датчик касания нажат порт")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"],
          ["4", "4"]
        ]), "PORT");
    this.setOutput(true, 'Boolean');
    this.setColour(230);
    this.setTooltip("Возвращает true если датчик касания нажат");
    this.setHelpUrl("");
  }
};

// 8. Блок: Значение датчика цвета (режим ЦВЕТ)
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
    this.setTooltip("Возвращает номер цвета (0=нет цвета, 1=черный, 2=синий, 3=зеленный, 4=желтый, 5=красный, 6=белый, 7=коричневый)");
    this.setHelpUrl("");
  }
};

// 9. Блок: Значение датчика цвета (режим ЯРКОСТЬ)
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

// 10. Блок: Значение ультразвукового датчика
Blockly.Blocks['ev3_ultrasonic_sensor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("значение ультразвукового датчика порт")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"],
          ["4", "4"]
        ]), "PORT");
    this.setOutput(true, 'Number');
    this.setColour(230);
    this.setTooltip("Возвращает расстояние в сантиметрах");
    this.setHelpUrl("");
  }
};

// 11. Блок: Значение гироскопа
Blockly.Blocks['ev3_gyro_sensor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("значение гироскопа порт")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"],
          ["4", "4"]
        ]), "PORT");
    this.setOutput(true, 'Number');
    this.setColour(230);
    this.setTooltip("Возвращает угол в градусах");
    this.setHelpUrl("");
  }
};

// 12. Блок: Ожидать
Blockly.Blocks['ev3_wait'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("ожидать")
        .appendField(new Blockly.FieldNumber(1, 0, 60, 0.1), "TIME")
        .appendField("сек");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
    this.setTooltip("Ожидать заданное время");
    this.setHelpUrl("");
  }
};

// 13. Блок: Звуковой сигнал
Blockly.Blocks['ev3_beep'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("издать звуковой сигнал");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("Издать звуковой сигнал");
    this.setHelpUrl("");
  }
};

// 14. Блок: Светодиод
Blockly.Blocks['ev3_led'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("светодиод")
        .appendField(new Blockly.FieldDropdown([
          ["выключить", "OFF"],
          ["зеленый", "GREEN"],
          ["красный", "RED"],
          ["оранжевый", "ORANGE"],
          ["зеленый мигающий", "GREEN_FLASH"],
          ["красный мигающий", "RED_FLASH"],
          ["оранжевый мигающий", "ORANGE_FLASH"],
          ["зеленый пульсирующий", "GREEN_PULSE"],
          ["красный пульсирующий", "RED_PULSE"],
          ["оранжевый пульсирующий", "ORANGE_PULSE"]
        ]), "COLOR");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
    this.setTooltip("Управление светодиодами EV3");
    this.setHelpUrl("");
  }
};

// ===== ГЕНЕРАЦИЯ КОДА =====

// 1. Подключиться к EV3
Blockly.JavaScript['ev3_connect'] = function(block) {
  return 'ev3.connect();\n';
};

// 2. Отключиться от EV3
Blockly.JavaScript['ev3_disconnect'] = function(block) {
  return 'ev3.disconnect();\n';
};

// 3. Включить мотор
Blockly.JavaScript['ev3_motor_on'] = function(block) {
  var port = block.getFieldValue('PORT');
  var power = block.getFieldValue('POWER');
  return 'ev3.motorOn("' + port + '", ' + power + ');\n';
};

// 4. Выключить мотор
Blockly.JavaScript['ev3_motor_off'] = function(block) {
  var port = block.getFieldValue('PORT');
  return 'ev3.motorOff("' + port + '");\n';
};

// 5. Включить мотор на время
Blockly.JavaScript['ev3_motor_time'] = function(block) {
  var time = block.getFieldValue('TIME');
  var port = block.getFieldValue('PORT');
  var power = block.getFieldValue('POWER');
  var wait = block.getFieldValue('WAIT') === 'TRUE';
  return 'ev3.motorTime("' + port + '", ' + time + ', ' + power + ', ' + wait + ');\n';
};

// 6. Включить мотор на градусы
Blockly.JavaScript['ev3_motor_degrees'] = function(block) {
  var degrees = block.getFieldValue('DEGREES');
  var port = block.getFieldValue('PORT');
  var power = block.getFieldValue('POWER');
  var wait = block.getFieldValue('WAIT') === 'TRUE';
  return 'ev3.motorDegrees("' + port + '", ' + degrees + ', ' + power + ', ' + wait + ');\n';
};

// 7. Датчик касания
Blockly.JavaScript['ev3_touch_sensor'] = function(block) {
  var port = block.getFieldValue('PORT');
  return ['ev3.touchSensor(' + port + ')', Blockly.JavaScript.ORDER_NONE];
};

// 8. Датчик цвета (режим ЦВЕТ)
Blockly.JavaScript['ev3_color_sensor_color'] = function(block) {
  var port = block.getFieldValue('PORT');
  return ['ev3.colorSensorColor(' + port + ')', Blockly.JavaScript.ORDER_NONE];
};

// 9. Датчик цвета (режим ЯРКОСТЬ)
Blockly.JavaScript['ev3_color_sensor_reflected'] = function(block) {
  var port = block.getFieldValue('PORT');
  return ['ev3.colorSensorReflected(' + port + ')', Blockly.JavaScript.ORDER_NONE];
};

// 10. Ультразвуковой датчик
Blockly.JavaScript['ev3_ultrasonic_sensor'] = function(block) {
  var port = block.getFieldValue('PORT');
  return ['ev3.ultrasonicSensor(' + port + ')', Blockly.JavaScript.ORDER_NONE];
};

// 11. Гироскоп
Blockly.JavaScript['ev3_gyro_sensor'] = function(block) {
  var port = block.getFieldValue('PORT');
  return ['ev3.gyroSensor(' + port + ')', Blockly.JavaScript.ORDER_NONE];
};

// 12. Ожидать
Blockly.JavaScript['ev3_wait'] = function(block) {
  var time = block.getFieldValue('TIME');
  return 'ev3.wait(' + time + ');\n';
};

// 13. Звуковой сигнал
Blockly.JavaScript['ev3_beep'] = function(block) {
  return 'ev3.beep();\n';
};

// 14. Светодиод
Blockly.JavaScript['ev3_led'] = function(block) {
  var color = block.getFieldValue('COLOR');
  return 'ev3.led("' + color + '");\n';
};

// ===== КАТЕГОРИЯ ДЛЯ ПАНЕЛИ ИНСТРУМЕНТОВ =====
Blockly.Extensions.register('ev3_category', function() {
  this.category = {
    "kind": "category",
    "name": "EV3",
    "colour": "#4a148c",
    "contents": [
      {
        "kind": "block",
        "type": "ev3_connect"
      },
      {
        "kind": "block",
        "type": "ev3_disconnect"
      },
      {
        "kind": "sep",
        "gap": "8"
      },
      {
        "kind": "label",
        "text": "Моторы"
      },
      {
        "kind": "block",
        "type": "ev3_motor_on"
      },
      {
        "kind": "block",
        "type": "ev3_motor_off"
      },
      {
        "kind": "block",
        "type": "ev3_motor_time"
      },
      {
        "kind": "block",
        "type": "ev3_motor_degrees"
      },
      {
        "kind": "sep",
        "gap": "8"
      },
      {
        "kind": "label",
        "text": "Датчики"
      },
      {
        "kind": "block",
        "type": "ev3_touch_sensor"
      },
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
        "type": "ev3_ultrasonic_sensor"
      },
      {
        "kind": "block",
        "type": "ev3_gyro_sensor"
      },
      {
        "kind": "sep",
        "gap": "8"
      },
      {
        "kind": "label",
        "text": "Сервис"
      },
      {
        "kind": "block",
        "type": "ev3_wait"
      },
      {
        "kind": "block",
        "type": "ev3_beep"
      },
      {
        "kind": "block",
        "type": "ev3_led"
      }
    ]
  };
});

// ===== БИБЛИОТЕКА EV3 (ev3.js) =====
// Этот код должен быть в отдельном файле ev3.js или добавлен здесь:

var ev3 = {
  
  // Базовая функция отправки команд
  send: function(command) {
    if (!this.connected) {
      console.error("EV3 не подключен!");
      return null;
    }
    
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", EV3_URL + "/command", false);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", "Bearer " + EV3_TOKEN);
      xhr.send(JSON.stringify({cmd: command}));
      
      if (xhr.status === 200) {
        return xhr.responseText;
      } else {
        console.error("Ошибка EV3: " + xhr.status);
        return null;
      }
    } catch (e) {
      console.error("Ошибка подключения к EV3: " + e);
      return null;
    }
  },
  
  // Подключение
  connect: function() {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", EV3_URL + "/ping", false);
      xhr.send();
      
      if (xhr.status === 200) {
        this.connected = true;
        console.log("EV3 подключен!");
        return true;
      } else {
        console.error("Не удалось подключиться к EV3");
        return false;
      }
    } catch (e) {
      console.error("Ошибка подключения: " + e);
      return false;
    }
  },
  
  // Отключение
  disconnect: function() {
    this.connected = false;
    console.log("EV3 отключен");
  },
  
  // Моторы
  motorOn: function(port, power) {
    return this.send("motor" + port + ".duty_cycle_sp = " + power + "\nmotor" + port + ".command = run-forever");
  },
  
  motorOff: function(port) {
    return this.send("motor" + port + ".command = stop");
  },
  
  motorTime: function(port, time, power, wait) {
    this.send("motor" + port + ".time_sp = " + (time * 1000));
    this.send("motor" + port + ".duty_cycle_sp = " + power);
    this.send("motor" + port + ".command = run-timed");
    
    if (wait) {
      this.wait(time);
    }
  },
  
  motorDegrees: function(port, degrees, power, wait) {
    // Устанавливаем режим градусов
    this.send("motor" + port + ".position_mode = 1");
    
    // Устанавливаем целевую позицию
    var currentPos = parseInt(this.send("motor" + port + ".position")) || 0;
    var targetPos = currentPos + parseInt(degrees);
    
    this.send("motor" + port + ".position_sp = " + targetPos);
    this.send("motor" + port + ".duty_cycle_sp = " + power);
    this.send("motor" + port + ".command = run-to-abs-pos");
    
    // Если нужно ждать завершения
    if (wait) {
      var isRunning = true;
      while (isRunning) {
        var state = this.send("motor" + port + ".state");
        isRunning = state && state.includes('running');
        this.sleep(50);
      }
    }
  },
  
  // Датчики
  touchSensor: function(port) {
    var value = this.send("sensor" + port + ".value0");
    return parseInt(value) === 1;
  },
  
  colorSensorColor: function(port) {
    // Устанавливаем режим датчика цвета (COLOR)
    this.send("sensor" + port + ".mode = 0");
    
    // Читаем значение
    var value = this.send("sensor" + port + ".value0");
    
    // Возвращаем номер цвета
    return parseInt(value) || 0;
  },
  
  colorSensorReflected: function(port) {
    // Устанавливаем режим датчика отраженного света (REFLECTED)
    this.send("sensor" + port + ".mode = 1");
    
    // Читаем значение
    var value = this.send("sensor" + port + ".value0");
    
    // Преобразуем в проценты (0-100)
    var percent = Math.min(100, Math.max(0, parseInt(value) || 0));
    return percent;
  },
  
  ultrasonicSensor: function(port) {
    // Устанавливаем режим ультразвукового датчика (DIST-CM)
    this.send("sensor" + port + ".mode = 0");
    
    // Читаем значение
    var value = this.send("sensor" + port + ".value0");
    
    // Возвращаем расстояние в см
    return parseInt(value) || 255;
  },
  
  gyroSensor: function(port) {
    // Устанавливаем режим гироскопа (ANGLE)
    this.send("sensor" + port + ".mode = 0");
    
    // Читаем значение
    var value = this.send("sensor" + port + ".value0");
    
    // Возвращаем угол
    return parseInt(value) || 0;
  },
  
  // Сервисные функции
  wait: function(time) {
    this.sleep(time * 1000);
  },
  
  sleep: function(ms) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + ms);
  },
  
  beep: function() {
    // Простой звуковой сигнал
    this.send("sound.beep");
  },
  
  led: function(color) {
    // Управление светодиодами
    var ledMap = {
      "OFF": "0",
      "GREEN": "1",
      "RED": "2",
      "ORANGE": "3",
      "GREEN_FLASH": "4",
      "RED_FLASH": "5",
      "ORANGE_FLASH": "6",
      "GREEN_PULSE": "7",
      "RED_PULSE": "8",
      "ORANGE_PULSE": "9"
    };
    
    this.send("leds.left = " + ledMap[color]);
    this.send("leds.right = " + ledMap[color]);
  },
  
  // Статус подключения
  connected: false
};

// ===== РЕГИСТРАЦИЯ РАСШИРЕНИЯ =====
console.log("EV3-Full расширение загружено!");
