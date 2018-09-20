var child_process = require('child_process')

//单元格
function Point(x, y, type = null){
    this.x = x;
    this.y = y;
    this.type = type;
}

//判断单元格是否为空
Point.prototype.isEmpty = function(){
    return this.type === null;
}

//设置单元格type
Point.prototype.setType = function(type){
    this.type = type;
}

//连连看游戏
function Game(_width, _height){
    this.width = _width + 2;
    this.height = _height + 2;
    this.matrix = new Array(this.width);
    for(var x = 0; x < this.width; x++){
        this.matrix[x] = new Array(this.height);
        for(var y = 0; y < this.height; y++){
            this.matrix[x][y] = new Point(x, y);
        }
    }
}

/**
 * 初始化矩阵
 * @param {array} typeArr 单元格类型数组，从左到右，从上到下
 */
Game.prototype.init = function(typeArr){
    if(!(typeArr instanceof Array) || typeArr.length !== (this.width - 2) * (this.height - 2)){
        throw new Error('参数非法或长度错误');
    }
    var pos = 0;
    for(var x = 1; x < this.width - 1; x++){
        for(var y = 1; y < this.height - 1; y++){
            this.matrix[x][y].setType(typeArr[pos++]);
        }
    }
}

/**
 * 获取某个坐标的类型
 * @param {integer} x x偏移量
 * @param {integer} y y偏移量
 */
Game.prototype.getPointType = function(x, y){
    return this.matrix[x][y].type;
}

/**
 * 判断两个点是否直接连通
 * @param {Point} a 第一个点 
 * @param {Point} b 第二个点
 */
Game.prototype.isTwoPointDirectLinkable = function(a, b){
    if(a.x !== b.x && a.y !== b.y){
        return false;
    }
    if(a.y === b.y){
        var _y = a.y;
        var _x_begin, _x_end;
        a.x < b.x? (_x_begin = a.x, _x_end = b.x): (_x_begin = b.x, _x_end = a.x);

        if(_x_begin + 1 === _x_end) return true;    //相邻可联通

        for(var _x = _x_begin + 1; _x < _x_end; _x++){  //不相同中间要都是null type Point
            if(this.getPointType(_x, _y) !== null){
                return false;
            }
        }
        return true;
    }
    if(a.x === b.x){
        var _x = a.x;
        var _y_begin, _y_end;
        a.y < b.y? (_y_begin = a.y, _y_end = b.y): (_y_begin = b.y, _y_end = a.y);

        if(_y_begin + 1 === _y_end) return true;

        for(var _y = _y_begin + 1; _y < _y_end; _y++){
            if(this.getPointType(_x, _y) !== null){
                return false;
            }
        }
        return true;
    }
}

/**
 * 获取矩阵内某点相邻的空type点
 * @param {Point} point 矩阵内某点
 */
Game.prototype.getPointNeighborEmpty = function(point){
    var nullTypePointsArr = new Array();
    var x = point.x;
    var y = point.y;
    for(var i = x - 1; i >= 0; i--){
        if(this.getPointType(i, y) !== null){
            break;
        }
        nullTypePointsArr.push(this.matrix[i][y]);
    }
    for(var i = x + 1; i < this.width; i++){
        if(this.getPointType(i, y) !== null){
            break;
        }
        nullTypePointsArr.push(this.matrix[i][y]);
    }
    for(var j = y - 1; j >= 0; j--){
        if(this.getPointType(x, j) !== null){
            break;
        }
        nullTypePointsArr.push(this.matrix[x][j]);
    }
    for(var j = y + 1; j < this.height; j++){
        if(this.getPointType(x, j) !== null){
            break;
        }
        nullTypePointsArr.push(this.matrix[x][j]);
    }
    return nullTypePointsArr;
}

/**
 * 判断两个点是否连通
 * @param {Point} a 第一个点
 * @param {Point} b 第二个点
 */
Game.prototype.isTwoPointLinkable = function(a, b){
    //section.1 判断是否直接连通
    if(this.isTwoPointDirectLinkable(a, b)){
        return true;
    }
    var a_neighbor = this.getPointNeighborEmpty(a);
    var b_neighbor = this.getPointNeighborEmpty(b);
    //section.2 判断是否可以通过一个拐点连通
    for(var point of a_neighbor){
        if(this.isTwoPointDirectLinkable(point, b)){
            return true;
        }
    }
    for(var point of b_neighbor){
        if(this.isTwoPointDirectLinkable(point, a)){
            return true;
        }
    }
    //section.3 判断是否可以通过两个拐点连通
    for(var point_a of a_neighbor){
        for(var point_b of b_neighbor){
            if(this.isTwoPointDirectLinkable(point_a, point_b)){
                return true;
            }
        }
    }

    return false;
}

/**
 * 获取point
 * @param {integer}} x x偏移量
 * @param {integer} y y偏移量
 */
Game.prototype.getPoint = function(x, y){
    return this.matrix[x][y];
}

/**
 * 两点连线并消除
 * @param {Point}} 第一个点 
 * @param {Point} b 第二个点
 */
Game.prototype.linkTwoPoint = function(a, b){
    if(a.type !== b.type){
        throw new Error('两个点类型不同');
    }
    if(a.type === null || b.type === null){
        console.log(a, b)
        throw new Error('空点不可连接');
    }
    if(this.isTwoPointLinkable(a, b)){
        this.matrix[a.x][a.y].setType(null);
        this.matrix[b.x][b.y].setType(null);
        return true;
    }else{
        return false;
    }
}

Game.prototype.printMatrix = function(){
    for(var row of this.matrix){
        var line = "";
        for(var point of row){
            line += (point.type || ' ') + ' ';
        }
        console.log(line);
    }
}

/**
 * 自动玩游戏
 * @param {Game} game Game实例（必须init过）
 */
function AI(game){
    this.game = game;
    var obj = {};
    for(var x = 1; x < game.width - 1; x++){
        for(var y = 1; y < game.height - 1; y++){
            var point = game.getPoint(x, y);
            !obj[point.type]? obj[point.type] = [point]: obj[point.type].push(point);
        }
    }
    this.classify = Object.keys(obj).map(function(key){
        return obj[key];
    });
}

/**
 * 开始
 */
AI.prototype.play = function(){
    var steps = new Array();
    while(this.classify.length > 0){
        for(var index in this.classify){
            var group = this.classify[index];
            for(var i = 0; i < group.length - 1; i++){
                for(var j = i + 1; j < group.length; j++){
                    if(game.linkTwoPoint(group[i], group[j])){
                        steps.push(group[i]);
                        steps.push(group[j]);
                        group.splice(i, 1);
                        group.splice(j - 1, 1);
                        game.printMatrix();
                    }
                }
            }
            if(group.length === 0){
                this.classify.splice(index, 1);
            }
        }
    }
    console.log('done');
    return steps;
}

AI.prototype.touchScreen = function(point){
    var x_start = 0,
        y_start = 500,
        x_width = 154,
        y_width = 154;
    var x = x_start + point.x * x_width - (x_width / 2);
    var y = y_start + point.y * y_width - (y_width / 2);

    child_process.exec('D:\\adb\\adb.exe shell input tap '+x+' '+y);
}

var arr = process.argv[2].split(',').map(function(e){
    return e.replace(/\s+/g, '');
});

var game = new Game(10, 7);
game.init(arr);
var ai = new AI(game);
var steps = ai.play();

var i = 0;
var handler = setInterval(function(){
    ai.touchScreen(steps[i++]);
    if(i == steps.length){
        clearInterval(handler);
    }
}, 1000);


//new Array(2,1,0,3,5,4,6,2,0,1,3,4,5,6,5,4,0,1,2,3,6,3,0,3,6,3,5,0,6,6,6,3,0,6,4,0,4,2,1,3,5,6,0,6,3,3,5,3,0,6,3,6,0,6,4,6,4,5,3,0,4,2,1,5,0,3,4,2,4,1)