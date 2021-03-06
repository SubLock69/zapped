//Handle displaying the modals
function showShop() {
    $("#themeModal").css('display','none');
    $("#upgradeModal").css('display','none');
    $("#settingsModal").css('display','none');
    $("#shopModal").css('display','block');
    setTimeout(() => {
        $("#shopModal").css('opacity','1');
    },10);
}
function hideShop() {
    $("#shopModal").css('opacity','0');
    setTimeout(() => {
        $("#shopModal").css('display','none');
    },300);
}
function showUpgrades() {
    $("#themeModal").css('display','none');
    $("#shopModal").css('display','none');
    $("#settingsModal").css('display','none');
    $("#upgradeModal").css('display','block');
    setTimeout(() => {
        $("#upgradeModal").css('opacity','1');
    },10);
}
function hideUpgrades() {
    $("#upgradeModal").css('opacity','0');
    setTimeout(() => {
        $("#upgradeModal").css('display','none');
    },300);
}
function showThemes() {
    $("#shopModal").css('display','none');
    $("#upgradeModal").css('display','none');
    $("#settingsModal").css('display','none');
    $("#themeModal").css('display','block');
    setTimeout(() => {
        $("#themeModal").css('opacity','1');
    },10);
}
function hideThemes() {
    $("#themeModal").css('opacity','0');
    setTimeout(() => {
        $("#themeModal").css('display','none');
    },300);
}
function showSettings() {
    $("#shopModal").css('display','none');
    $("#upgradeModal").css('display','none');
    $("#themeModal").css('display','none');
    $("#settingsModal").css('display','block');
    setTimeout(() => {
        $("#settingsModal").css('opacity','1');
    },10);
}
function hideSettings() {
    $("#settingsModal").css('opacity','0');
    setTimeout(() => {
        $("#settingsModal").css('display','none');
    },300);
}

//Handle Item Content Creation
function createList(container) {
    let makeData = (item) => {
        return `<section>
            <h1>${item.displayName}</h1>
            <p>${item.desc}</p>
            <span id="${item.name}Qty">Quantity: ${item.qty}</span><br>
            <span id="${item.name}Cost">Cost: ${item.cost.toFixed(1)}${item.unit}J</span><br>
            <a href='javascript:buy("${item.name}");' class="buyBtn" id="${item.name}Buy">Buy</a>
        </section>`;
    };
    if(container != undefined) {
        switch(container) {
            case "shop":
                app.data.shop.forEach(item => {
                    $("#shopModal","elem")[0].innerHTML += makeData(item);
                    //Handle buy button hover changes here (css wont stay dynamic)
                    setTimeout(() => {
                        $(`#${item.name}Buy`).on('hover',()=>{
                            $(`#${item.name}Buy`).css('background',app.theme.color).css('color',app.theme.bg)
                        },()=>{
                            $(`#${item.name}Buy`).css('background',app.theme.bg).css('color',app.theme.color);
                        })
                    }, 10);
                });
            break;
            case "upgrade":
                app.data.upgrades.forEach(item => {
                    $("#upgradeModal","elem")[0].innerHTML += makeData(item);
                    //Handle buy button hover changes here (css wont stay dynamic)
                    setTimeout(() => {
                        $(`#${item.name}Buy`).on('hover',()=>{
                            $(`#${item.name}Buy`).css('background',app.theme.color).css('color',app.theme.bg)
                        },()=>{
                            $(`#${item.name}Buy`).css('background',app.theme.bg).css('color',app.theme.color);
                        })
                    }, 10);
                });
            break;
            case "theme":
                app.data.themes.forEach(theme => {
                    let data = `<section>
                            <h1>${theme.theme}</h1>
                            <div class="swatch" style="background:${theme.bg}"></div>
                            <div class="swatch" style="background:${theme.color}"></div>
                            <a href="javascript:select('${theme.theme}');" class="buyBtn" id="${theme.theme}Select">Select</a>
                        </section>`;
                    $("#themeModal","elem")[0].innerHTML += data;
                    setTimeout(() => {
                        $(`#${theme.theme}Select`).on('hover',()=>{
                            $(`#${theme.theme}Select`).css('background',app.theme.color).css('color',app.theme.bg)
                        },()=>{
                            $(`#${theme.theme}Select`).css('background',app.theme.bg).css('color',app.theme.color);
                        })
                    }, 10);
                });
            break;
        }
    }
}
function buy(itemname) {
    let shopgrade = [...app.data.shop, ...app.data.upgrades];
    let item = shopgrade.find(items => items.name === itemname);
    let itemQty = `#${itemname}Qty`, itemCost = `#${itemname}Cost`;
    //Check if player can buy the item
    if(app.stats.totalEnergy >= (item.cost*app.getUnitMod(item.unit))) {
        //Handle max quantity
        if((++item.qty) >= item.max) {
            $(itemQty).text("Quantity: MAX");
            $(itemCost).text("Cost: 0");
            app.data.shop.filter(items => items.name === itemname).forEach(elem => elem.done = true);
            $(`#${item.name}Buy`).text("").css("opacity",'0');
        } else {
            $(itemQty).text(`Quantity: ${item.qty}`);
            //Update item stats and global stats
            app.stats.totalEnergy -= (item.cost*app.getUnitMod(item.unit));
            item.cost = (item.cost*item.costMul)+item.costAdder;
            if(item.cost >= 1000) {
                item.unit = app.totalUnit.next().value.val; //Increase iterator to get next oom
                app.totalUnit.next(true); //Reset oom back to original
            }
            app.stats.energyPerSecond = (app.stats.energyPerSecond*item.epsMul)+(item.epsAdder*app.currentEPSUnit.value.mod);
            app.stats.energyPerClick = (app.stats.energyPerClick*item.epcMul)+(item.epcAdder*app.currentEPCUnit.value.mod);
            $(itemCost).text(`Cost: ${item.cost.toFixed(1)}${item.unit}J`);
            //Run item update function to clean up any item links
            item.update();
        }
    } else {
        $(`#${item.name}Buy`).text("NOPE").css('background','darkred').css('color','red');
        setTimeout(()=>{$(`#${item.name}Buy`).text("Buy").css('background',app.theme.bg).css('color',app.theme.color)}, 1000);
    }
}
function select(theme) {
    theme = app.data.themes.find(t => t.theme === theme);
    document.body.setAttribute('class',`${theme.theme}Theme`);
    app.theme = theme;
    $(`#${theme.theme}Select`).text('Selected');
    setTimeout(()=>{$(`#${theme.theme}Select`).text('Select')},5000);
}