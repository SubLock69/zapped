class Interval {
    //Accepts a callback and a time in ms to reoccur
    //Doesn't use setInterval for various reasons
    constructor(cb, ms, ...args) {
        this.cb = cb;
        this.time = ms;
        this.worker = null;
        this.args = args;
        this.started = false;
    }
    start() {
        if(!this.started) {
            this.worker = new Worker(`./js/interval.js?ms=${this.time}&cb=${this.cb.name}(${this.args.toString()})`);
            this.started = true;

            this.worker.onmessage = function(e) {eval(e.data)};
        }
    }
    stop() {
        this.worker.terminate();
        this.started = false;
    }
}
//Factory for creating drawing objects with hitboxes
class Component {
    constructor(x = 0, y = 0, w = 0, h = 0, type = "poly", datapoints = []) {
        this.type = type; //Supported types: text, rect, sq, tri, circ, poly, and path
        this.width = w; this.height = h;
        this.vx = 0; this.vy = 0; this.x = x; this.y = y;

        switch(this.type) {
            case "poly":
                this.shape = new Shape(datapoints);
            break;
            case "text":
                this.text = datapoints;
            break;
        }
    }
    draw(ctx, stroke = "#000", fill = "#000") {
        switch(this.type) {
            case "text":
                ctx.font = this.width + " " + this.height;
                ctx.fillStyle = fill;
                ctx.strokeStyle = stroke;
                ctx.fillText(this.text, this.x, this.y);
                
            break;
        }
    }
}

//Defines drawing parameters for a component
//Points are relative to the origin
//Doesn't draw the shape just outlines where the stroke would go
class Shape {
    constructor(points = []) {
        this.points = points;
    }
    outline(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for(let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
    }
}
var app = {
    fps: (1000/60), //1000ms divided by desired frames per second yields the time per frame required to achieve said fps
    get: function(loc, name) {
        let res;
        switch(loc) {
            case "shop":
                app.data.shop.forEach(item => {
                    if(item.name === name)
                        res = item;
                });
            break;
            case "upgrade":
                app.data.upgrades.forEach(item => {
                    if(item.name === name)
                        res = item;
                });
            break;
            case "theme":
                app.data.themes.forEach(theme => {
                    if(theme.theme === name)
                        res = item;
                });
            break;
        }
        return res;
    },
    settings: {
        autosave: true,
        saveInterval: 3*60*1000,
        clearSave: () => {localStorage.clear();window.location.reload();}
    },
    stats: {
        totalEnergy: Number(0), //Total energy player has
        energyPerSecond: Number(0.1*10**(-24)), //Amount of energy made every second
        energyPerClick: Number(0.5*10**(-24)),
        earningRate: Number(1000)
    },
    units: function*() {
        let oomPrefixes = ['y','z','a','f','p','n','&#956;','m','','k','M','G','T','P','E','Z','Y'];
        let oomMods = [10**(-24),10**(-21),10**(-18),10**(-15),10**(-12),10**(-9),10**(-6),10**(-3),10**1,10**3,10**6,10**9,10**12,10**15,10**18,10**21,10**24];
        let index = 0, current = oomPrefixes[index];
        while(index < oomPrefixes.length) {
            let back = yield {val: current, mod: oomMods[index]};
            if(back) {
                //Move index back as well as
                if(index == 0)
                    index=0
                else
                    --index;
                
                // --app.stats.oom;
            } else {
                // ++app.stats.oom;
                ++index;
            }
            current = oomPrefixes[index];
        }
    }, //Iterator for units
    getUnitMod: function(unit) {
        switch(unit) {
            case 'y':
                return (10**(-24))
            case 'z':
                return (10**(-21))
            case 'a':
                return (10**(-18))
            case 'f':
                return (10**(-15))
            case 'p':
                return (10**(-12))
            case 'n':
                return (10**(-9))
            case '&#956;':
                return (10**(-6))
            case 'm':
                return (10**(-3))
            case '':
                return (10**(0))
            case 'k':
                return (10**(3))
            case 'M':
                return (10**(6))
            case 'G':
                return (10**(9))
            case 'T':
                return (10**(12))
            case 'P':
                return (10**(15))
            case 'E':
                return (10**(18))
            case 'Z':
                return (10**(21))
            case 'Y':
                return (10**(24))
        }
    },
    WIDTH:null,
    HEIGHT:null,
    init: true,
    start: function() {
        //Grab game containers
        let game = $("#game","elem")[0];
        
        //Set variables based on screen size
        this.WIDTH = game.offsetWidth-12;
        this.HEIGHT = game.offsetHeight - $("#gameNav","elem")[0].offsetHeight - 16;
        $("#view").attr('width',this.WIDTH).attr('height',this.HEIGHT);
        $(".modal").css('width',`${this.WIDTH-10}px`).css('height',`${this.HEIGHT-10}px`);
        //Load stats if there are any saved
        load();
        //Start the game interval counters
        this.play();

        //Fix modal positions
        if(this.init) {
            $('.modal').css('top',`${view.offsetTop+16}px`).css('left',`${view.offsetLeft-4.5}px`);

            //Bind game nav buttons
            $('#shop').on('click',function(){showShop()});
            $('#upgrade').on('click',function(){showUpgrades()});
            $('#theme').on('click',function(){showThemes()});
            $("#settings").on('click',function(){showSettings()});
            //Assign click event handler for the only clickable canvas element
            $("#view").on('click',function(e){app.smallBolt(e)},function(e){app.bigBolt(e,1.01);});
            //Append datasets to respective modals
            createList("shop");
            createList("upgrade");
            createList("theme");
            //Run settings binders
            bindSettings();

            this.view = $("#view","elem")[0];
            this.ctx = this.view.getContext('2d');

            this.init = false;
        } else {
            $('.modal').css('top',`${view.offsetTop-5}px`).css('left',`${view.offsetLeft-5}px`);
        }

        //Fix game if page resizes
        window.onresize = () => {
            app.start();
        }
    },
    clear: function() {this.ctx.clearRect(0,0,this.WIDTH,this.HEIGHT);},
    pause: function() {
        this.frame.stop();
        this.eps.stop();
        this.autosave.stop();
    },
    play: function() {
        this.frame.start();
        this.eps.start();
        this.autosave.start();
    },
    bigBolt: function(e, scale=1, noInc = false) {
        if(e != null) {
            e.preventDefault();
        }
        this.ctx.scale(scale, scale);
        this.ctx.lineWidth = "5";
        this.ctx.strokeStyle = app.theme.color;
        this.ctx.fillStyle = app.theme.bg;
        let boltPts = [
            {
                x: this.WIDTH/1.7,
                y:this.HEIGHT/10
            },
            {
                x: this.WIDTH/4,
                y: this.HEIGHT/2
            },
            {
                x: this.WIDTH/2,
                y: this.HEIGHT/2.5
            },
            {
                x: this.WIDTH/3,
                y: this.HEIGHT/1.25
            },
            {
                x: this.WIDTH/1.4,
                y: this.HEIGHT/3.5
            },{
                x: this.WIDTH/2.2,
                y: this.HEIGHT/2.6
            },
            {
                x: this.WIDTH/1.7,
                y: this.HEIGHT/10
            }
        ];
        let bolt = new Component(0,0,this.WIDTH,this.HEIGHT,"poly",boltPts);
        bolt.shape.outline(this.ctx);
        this.ctx.stroke();
        this.ctx.fill();

        if(!noInc)
            changeScore(this.stats.energyPerClick);
    },
    smallBolt: function(e) {
        this.bigBolt(e, 0.99);
    }
};
//Assign app data
app.data = {
    shop: [
        {displayName: "Auto-Zapper",
            name: "autozapper",
            desc: "Auto zaps every second",
            cost: 1,
            unit: 'z',
            qty: 0,
            max: 20,
            epsMul: 1,
            epcMul: 1,
            costMul: 1.25,
            epsAdder: 1,
            epcAdder: 0,
            costAdder: 0,
            done: false,
            update: () => {}
        }
    ],
    upgrades: [
        {displayName: "Better Zaps",
            name: "betterzaps",
            desc: "Increases baseline zap (click) by 100%",
            cost: 7.5,
            unit: 'y',
            qty: 0,
            max: 100,
            epsMul: 1,
            epcMul: 1,
            costMul: 1.1,
            epsAdder: 0,
            epcAdder: 1,
            costAdder: 0,
            done: false,
            update: () => {
                let az = app.get('shop','autozapper');
                console.log(az);
                if(az.qty > 0) {
                    //Use quantity of autozappers to recalculate
                    app.stats.energyPerSecond += (app.stats.energyPerClick * az.qty);
                    //Set new adder for autozapper for future buys
                    az.epsAdder = (app.stats.energyPerClick*2)/app.currentEPCUnit.value.mod;
                }
            }
        }
    ],
    themes: [
        {theme: "main",
            bg: "#004d8e",
            color: "#00d4e8"
        },
        {theme: "heatwave",
            bg: "#a73500",
            color: "#fa5500"
        }
    ]
}
//Link up frame interval info to app
app.frame = new Interval(updateGame, app.fps)
app.eps = new Interval(changeScore, app.stats.earningRate, app.stats.energyPerSecond)
//Units
app.totalUnit = app.units();
app.EPSUnit = app.units();
app.EPCUnit = app.units();
app.currentTotalUnit = app.totalUnit.next();
app.currentEPSUnit = app.EPSUnit.next();
app.currentEPCUnit = app.EPCUnit.next();
//Autosave
app.autosave = new Interval(save, app.settings.saveInterval);
//Theme save
app.theme = app.data.themes[0];

//External from app object for event listeners
function updateGame() {
    with (app) {
        clear();
        bigBolt(null, 1, true);
        updateScore();
        //Check for win stat (999 YJ)
    }
}
function changeScore(num, inc = true) {
    if(inc)
        app.stats.totalEnergy += num;
    else
        app.stats.totalEnergy -= num;

    // console.log(app.stats.totalEnergy);
}
function updateScore() {
    let [te, eps, cer] = ["#totalEnergy", "#earningRate", "#clickRate"];
    // console.log(app.stats.totalEnergy/app.currentTotalUnit.value.mod)

    if(app.stats.totalEnergy/app.currentTotalUnit.value.mod >= 1000) {
        app.currentTotalUnit = app.totalUnit.next();
    }
    if(app.stats.totalEnergy/app.currentTotalUnit.value.mod < 1) {
        app.currentTotalUnit = app.totalUnit.next(true);
    }
    if(app.stats.energyPerSecond/app.currentEPSUnit.value.mod >= 1000) {
        app.currentEPSUnit = app.EPSUnit.next();
    }
    if(app.stats.energyPerSecond/app.currentEPSUnit.value.mod < 1) {
        app.currentEPSUnit = app.EPSUnit.next(true);
    }

    $(te).text(`Zaps: ${(app.stats.totalEnergy/app.currentTotalUnit.value.mod).toFixed(1)} ${app.currentTotalUnit.value.val}J`);
    $(eps).text(`E/s: ${(app.stats.energyPerSecond/app.currentEPSUnit.value.mod).toFixed(1)} ${app.currentEPSUnit.value.val}J`);
    $(cer).text(`E/click: ${(app.stats.energyPerClick/app.currentEPCUnit.value.mod*2).toFixed(1)} ${app.currentEPCUnit.value.val}J`);

    //update eps dynamically for now
    if(app.eps.args != app.stats.energyPerSecond) {
        app.eps.stop();
        app.eps.args = app.stats.energyPerSecond;
        app.eps.start();
    }
    if(app.autosave.time != app.settings.saveInterval) {
        app.autosave.stop();
        app.autosave.time = app.settings.saveInterval;
        app.autosave.start();
    }
}
function save() {
    //Save to local storage for semi-persistent game storage
    //Make copy of stats and save there
    let stats = $.obj.keyVal(app.stats); //Copy of
    stats[0].forEach((key, index) => {
        localStorage.setItem(key,stats[1][index]);
    });
    //Save copy of aquired items and upgrades and current theme
    let items = [...app.data.shop, ...app.data.upgrades];
    items.forEach(item => {
        localStorage.setItem(item.name,JSON.stringify({qty: item.qty, cost: item.cost, unit: item.unit}));
    });
    localStorage.setItem("theme",app.theme.theme);
    $('#save').text('Saved');
    if(app.settings.saveInterval > 10)
        setTimeout(() => {$('#save').text('Save')},1000);
}
function load() {
    if(localStorage.length > 0) {
        let stats = $.obj.keyVal(app.stats); //Copy of
        stats[0].forEach(key => {
            app.stats[key] = Number(localStorage.getItem(key));
        });
        let items = [...app.data.shop, ...app.data.upgrades];
        items.forEach(item => {
            item.qty = JSON.parse(localStorage.getItem(item.name)).qty;
            item.cost = JSON.parse(localStorage.getItem(item.name)).cost;
            item.unit = JSON.parse(localStorage.getItem(item.name)).unit;
        });
        select(localStorage.getItem("theme"));
    }
}
function bindSettings() {
    $("#as").on('click',function(){
        if(app.settings.autosave) {
            app.settings.autosave = false;
            app.autosave.stop();
        } else {
            app.settings.autosave = true;
            app.autosave.start();
        }
        setAutosave();
    });
    $("#si").on('contextmenu',function(e){
        e.preventDefault();
        app.settings.saveInterval += 60000;
        $("#si").text(`Autosave Interval: ${(app.settings.saveInterval/60000).toFixed(0)} min`);
    }).on('click',function(e){
        e.preventDefault();
        app.settings.saveInterval -= 60000;
        if(app.settings.saveInterval <= 0)
            app.settings.saveInterval = 10;
        
        $("#si").text(`Autosave Interval: ${(app.settings.saveInterval/60000).toFixed(0)} min`);
    });
    setAutosave();
}
function setAutosave() {
    if(app.settings.autosave)
        $('#as').css('background','green');
    else
        $("#as").css('background','darkred');
}