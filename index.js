// ======== IMPORT & BOT INIT ========

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
client.once("ready", () => {
console.log(`Bot online: ${client.user.tag}`)
})

// ======== EMBED SYSTEM ========

function gameEmbed(title, description, color = "#2b2d31"){

return new EmbedBuilder()
.setTitle(title)
.setDescription(description)
.setColor(color)
.setTimestamp()

}

const prefix = "!";


// ======== CHANNEL CONFIG ========

const FISH_CHANNEL = "1479330773248249907";
const TAIXIU_CHANNEL = "1479443413290975272";
const RPG_CHANNEL = "1479329833707110431";

// ======== DEV ROLE CONFIG ========

const DEV_ROLE = "1479648187328368670"; // thay id role dev của bạn

function isDev(member){
return member.roles.cache.has(DEV_ROLE);
}

// ======== TAIXIU GLOBAL SYSTEM ========

let taixiuEnabled = true

let taiPool = 0
let xiuPool = 0

let taiPlayers = {}
let xiuPlayers = {}

let taixiuForced = null

let taixiuMessage = null

const betCooldown = {}

// ======== TAIXIU BOARD EMBED ========

function taixiuEmbed(){

return new EmbedBuilder()
.setTitle("🎲 TÀI XỈU SERVER")
.setDescription(`

**TÀI**              ⏳ ĐANG CƯỢC              **XỈU**

💰 **${taiPool} VND**           🎲           💰 **${xiuPool} VND**

━━━━━━━━━━━━━━━━

/tai <tiền>

/xiu <tiền>

⏳ Kết quả sau 60s
`)
.setColor("#f39c12")

}

// ======== UPDATE BOARD ========

async function updateTaixiuBoard(){

if(!taixiuMessage) return

await taixiuMessage.edit({embeds:[taixiuEmbed()]})

}




// ===== USER DATABASE =====

const users = {}

function getUser(id){

if(!users[id]){

users[id] = {
level:1,
exp:0,

hp:100,
atk:10,
def:5,

vnd:0,
gold:0,

fish:[],

class:null,

inventory:[],
weapon:null,
skill:null,

bounty:false,
bountyEnd:0
}

}

return users[id]

}

// ======== FISHING COOLDOWN ========

const fishingCooldown = {};


// ======== FISH LIST ========

const fishList = [

{ name:"Cá rô", rarity:"common", value:40 },
{ name:"Cá trê", rarity:"common", value:50 },
{ name:"Dép lào thủng lỗ", rarity:"common", value:10 },
{ name:"Quần sịp dính pịa", rarity:"common", value:5 },
{ name:"Bịch rác mạ vàng", rarity:"common", value:45 },
{ name:"Sắt vụn", rarity:"common", value:35 },
{ name:"Cá lau kính", rarity:"common", value:20 },

{ name:"Cá chép", rarity:"uncommon", value:90 },
{ name:"Cá lóc", rarity:"uncommon", value:100 },
{ name:"Nhựa tái chế", rarity:"uncommon", value:85 },
{ name:"Quần què", rarity:"uncommon", value:65 },
{ name:"Điện thoại hỏng", rarity:"uncommon", value:50 },
{ name:"Xu bạc", rarity:"uncommon", value:70 },
{ name:"Xu đồng", rarity:"uncommon", value:50 },

{ name:"Cá ngừ", rarity:"rare", value:200 },
{ name:"Cá kiếm", rarity:"rare", value:250 },
{ name:"Bịch rác Premium", rarity:"rare", value:190 },
{ name:"Xương cá", rarity:"rare", value:100 },
{ name:"Cá hề", rarity:"rare", value:240 },

{ name:"Cá mập", rarity:"epic", value:500 },
{ name:"Cá voi sát thủ", rarity:"epic", value:650 },
{ name:"Rương kho báu", rarity:"epic", value:800 },

{ name:"Thủy long", rarity:"mythic", value:3 },
{ name:"Leviathan", rarity:"mythic", value:5 },
{ name:"Kraken", rarity:"mythic", value:3 },
{ name:"Cá voi xanh", rarity:"mythic", value:1 },
{ name:"Rùa Thần Kim Quy", rarity:"mythic", value:5 }

];



// ======== FISH RARITY RATE ========

const rarityRate = {
common:40,
uncommon:30,
rare:15,
epic:13,
mythic:2
};


// ======== ROLL FISH RARITY ========

function rollRarity(){

const rand = Math.random()*100;

if(rand < rarityRate.common) return "common";

if(rand < rarityRate.common + rarityRate.uncommon)
return "uncommon";

if(rand < rarityRate.common + rarityRate.uncommon + rarityRate.rare)
return "rare";

if(rand < rarityRate.common + rarityRate.uncommon + rarityRate.rare + rarityRate.epic)
return "epic";

return "mythic";

}


// ======== SLASH COMMAND HANDLER ========

client.on("interactionCreate", async interaction => {

if(!interaction.isChatInputCommand()) return;

const user = getUser(interaction.user.id);

// ======== /TAI ========

if(interaction.commandName === "tai"){

if(interaction.channel.id !== TAIXIU_CHANNEL)
return interaction.reply({content:"Sai kênh",ephemeral:true})

if(!taixiuEnabled)
return interaction.reply("Game đang tắt")

const bet = interaction.options.getInteger("money")

if(!bet || bet <=0)
return interaction.reply("Cược không hợp lệ")

if(bet > user.vnd)
return interaction.reply("Không đủ tiền")

// anti spam
if(betCooldown[interaction.user.id] &&
Date.now() - betCooldown[interaction.user.id] < 3000)
return interaction.reply({content:"⏳ Đợi 3s trước khi cược tiếp - Spam Con Cặc",ephemeral:true})

betCooldown[interaction.user.id] = Date.now()

user.vnd -= bet

taiPool += bet

taiPlayers[interaction.user.id] =
(taiPlayers[interaction.user.id] || 0) + bet

await updateTaixiuBoard()

interaction.reply({content:`🎲 Bạn cược **${bet} VND vào TÀI**`,ephemeral:true})

}


// ======== /XIU ========

if(interaction.commandName === "xiu"){

if(interaction.channel.id !== TAIXIU_CHANNEL)
return interaction.reply({content:"Sai kênh",ephemeral:true})

if(!taixiuEnabled)
return interaction.reply("Game đang tắt")

const bet = interaction.options.getInteger("money")

if(!bet || bet<=0)
return interaction.reply("Cược không hợp lệ")

if(bet > user.vnd)
return interaction.reply("Không đủ tiền")

if(betCooldown[interaction.user.id] &&
Date.now() - betCooldown[interaction.user.id] < 3000)
return interaction.reply({content:"⏳ Đợi 3s trước khi cược tiếp - Spam Con Cặc",ephemeral:true})

betCooldown[interaction.user.id] = Date.now()

user.vnd -= bet

xiuPool += bet

xiuPlayers[interaction.user.id] =
(xiuPlayers[interaction.user.id] || 0) + bet

await updateTaixiuBoard()

interaction.reply({content:`🎲 Bạn cược **${bet} VND vào XỈU**`,ephemeral:true})

}



// ======== /FISH COMMAND ========

if(interaction.commandName === "fish"){

if(interaction.channel.id !== FISH_CHANNEL)
return interaction.reply({content:"Sai kênh câu cá",ephemeral:true});

if(fishingCooldown[interaction.user.id] &&
Date.now()-fishingCooldown[interaction.user.id] < 60000)
return interaction.reply({content:"🎣 Bạn phải đợi 1 phút",ephemeral:true});

fishingCooldown[interaction.user.id] = Date.now();

const rarity = rollRarity();

const pool = fishList.filter(f => f.rarity === rarity);

const fish = pool[Math.floor(Math.random()*pool.length)];

user.fish.push(fish);

user.exp += 15;

checkLevelUp(user);

const embed = gameEmbed(
"🎣 Câu cá thành công",
`Bạn câu được **${fish.name}**

⭐ Rarity: ${fish.rarity}

✨ +15 EXP`,
"#3ba55c"
)

interaction.reply({embeds:[embed]})

}



// ======== /SELLFISH COMMAND ========

if(interaction.commandName === "sellfish"){

if(interaction.channel.id !== FISH_CHANNEL)
return interaction.reply({content:"Sai kênh",ephemeral:true});

if(user.fish.length === 0)
return interaction.reply("🐟 Bạn không có cá");

let vnd = 0;
let gold = 0;

user.fish.forEach(f=>{

if(f.rarity === "mythic"){
gold += f.value;
}else{
vnd += f.value;
}

});

user.vnd += vnd;
user.gold += gold;

const totalFish = user.fish.length;

user.fish = [];

const embed = gameEmbed(
"🐟 Đã bán cá",
`Bạn bán **${totalFish}** con cá

💵 +${vnd} VND
🪙 +${gold} GOLD`,
"#f1c40f"
)

interaction.reply({embeds:[embed]})

}


//  ================/class system/=========
const classes = {

swordsman:{
name:"⚔️ Kiếm Sĩ",
hp:120,
atk:22,
def:10
},

archer:{
name:"🏹 Cung Thủ",
hp:90,
atk:25,
def:7
},

mage:{
name:"🪄 Pháp Sư",
hp:80,
atk:35,
def:3
},

tank:{
name:"🛡️ Đỡ Đòn",
hp:150,
atk:15,
def:20
},

assassin:{
name:"🗡️ Sát Thủ",
hp:55,
atk:30,
def:6
},

support:{
name:"💊 Hỗ Trợ",
hp:100,
atk:12,
def:12
}

}

// ======== LEVEL SYSTEM ========

// EXP cần để lên level
function getRequiredExp(level){

if(level < 10) return level * 250;

if(level < 25) return level * 300;

if(level < 35) return level * 400;

if(level < 50) return level * 500;

return level * 2000;

}



// ======== LEVEL SCALE ========

const levelScale = {

swordsman:{hp:15,atk:4,def:2},

archer:{hp:10,atk:4,def:2},

mage:{hp:8,atk:6,def:1},

tank:{hp:20,atk:2,def:5},

assassin:{hp:9,atk:5,def:1},

support:{hp:12,atk:2,def:3}

};

// ======== SKILL DATABASE ========

const skills = {

swordsman:[
{ name:"Chém Ngang", dmg:25 },
{ name:"Chém Đôi", dmg:35 },
{ name:"Cuồng Nộ", dmg:40 },
{ name:"Xuyên Giáp", dmg:30 },
{ name:"Tử Kiếm", dmg:50 }
],

archer:[
{ name:"Bắn Nhanh", dmg:20 },
{ name:"Bắn Xuyên", dmg:30 },
{ name:"Mưa Tên", dmg:35 },
{ name:"Ngắm Bắn", dmg:25 },
{ name:"Tên Thần", dmg:45 }
],

mage:[
{ name:"Fireball", dmg:30 },
{ name:"Băng Tiễn", dmg:25 },
{ name:"Sét Đánh", dmg:35 },
{ name:"Bão Lửa", dmg:40 },
{ name:"Thiên Hỏa", dmg:50 }
],

tank:[
{ name:"Đập Khiên", dmg:15 },
{ name:"Chấn Động", dmg:20 },
{ name:"Đè Nát", dmg:25 },
{ name:"Phản Đòn", dmg:30 },
{ name:"Thiết Sơn", dmg:35 }
],

assassin:[
{ name:"Đâm Lén", dmg:35 },
{ name:"Bóng Đêm", dmg:30 },
{ name:"Chém Nhanh", dmg:28 },
{ name:"Tàng Hình", dmg:25 },
{ name:"Ám Sát", dmg:55 }
],

support:[
{ name:"Hồi Máu", heal:40 },
{ name:"Buff Sức", buff:10 },
{ name:"Thanh Tẩy", heal:25 },
{ name:"Ánh Sáng", dmg:20 },
{ name:"Thiên Ân", heal:60 }
]

};



// ======== LEVEL UP CHECK ========

function checkLevelUp(user){

while(user.exp >= getRequiredExp(user.level) && user.level < 100){

 user.exp -= getRequiredExp(user.level)
 user.level++

 if(user.class){

  const scale = levelScale[user.class]

  user.hp += scale.hp
  user.atk += scale.atk
  user.def += scale.def

 }

}

}

// ======== GLOBAL BOSS DATA ========

let miniBoss = null
let worldBoss = null


// ======== SPAWN MINIBOSS ========

function spawnMiniBoss(){

if(miniBoss) return

miniBoss = {
hp:500,
maxHp:500,
dmg:20,
players:[]
}

console.log("MiniBoss Spawn")

}


// ======== SPAWN WORLD BOSS ========

function spawnWorldBoss(){

if(worldBoss) return

worldBoss = {
hp:5000,
maxHp:3000,
dmg:40,
players:[],
phase:1
}

console.log("WorldBoss Spawn")

}


// ======== BOSS SPAWN TIMER ========

setInterval(spawnMiniBoss,1800000);
setInterval(spawnWorldBoss,10800000);


// ======== MESSAGE COMMAND HANDLER ========

client.on("messageCreate", async msg=>{

if(msg.author.bot) return;
if(!msg.content.startsWith(prefix)) return;

const args = msg.content.slice(prefix.length).split(" ");
const cmd = args.shift().toLowerCase();

if(miniBoss && !miniBoss.players.includes(msg.author.id)){
miniBoss.players.push(msg.author.id)
}

//==============/class skill system/=========
if(cmd==="skill"){

const index = parseInt(args[0]) - 1

const user = getUser(msg.author.id)

if(!user.class)
return msg.reply("Bạn chưa chọn class")

const list = skills[user.class]

if(!list[index])
return msg.reply("Skill không tồn tại")

user.skill = index

msg.reply(`Bạn đã trang bị skill **${list[index].name}**`)

}

if(cmd==="skills"){

if(!user.class)
return msg.reply("Bạn chưa chọn class")

const list = skills[user.class]

let text="📜 Skill của class:\n\n"

list.forEach((s,i)=>{
text += `${i+1}. ${s.name}\n`
})

msg.reply(text)

}

// ======== DEV FORCE ========

if(cmd==="force"){

if(!isDev(msg.member)) return

const side=args[0]

if(side!=="tai" && side!=="xiu")
return msg.reply("force tai/xiu")

taixiuForced = side

msg.reply("Đã chỉnh cầu")

}


// ======== CLASS COMMAND ========

if(cmd==="class"){

const c=args[0];

if(!classes[c]) return msg.reply("Class không tồn tại");

user.class=c;

msg.reply("Đã chọn class "+c);

}



// ======== MINIBOSS BATTLE ========

if(cmd==="miniboss"){

if(!miniBoss) return msg.reply("Chưa spawn");

miniBoss.players.push(msg.author.id);

let scale = miniBoss.players.length

let dmg = 20 + Math.floor(Math.random()*10) + scale

const user = getUser(msg.author.id)

let skillText = ""

if(user.skill !== null && user.class){

const skill = skills[user.class][user.skill]

dmg += skill.dmg

skillText = `\n✨ Skill: ${skill.name}`

}

miniBoss.hp -= dmg;

if(miniBoss.hp <= 0){

miniBoss.players.forEach(p=>{

const u = getUser(p);

u.vnd += 200;
u.exp += 50;

});

miniBoss = null;

msg.reply("MiniBoss đã bị tiêu diệt");

}else{

msg.reply(`Bạn gây ${dmg} dmg${skillText}

❤️ Boss còn **${miniBoss.hp} HP**`);

}

}
// ===== SKILL SYSTEM =====
const user = getUser(msg.author.id)

if(user.skill !== null){

const skill = skills[user.class][user.skill]

dmg += skill.power

}

miniBoss.hp-=dmg;

if(miniBoss.hp<=0){

miniBoss.players.forEach(p=>{

const u=getUser(p);

u.vnd+=200;
u.exp+=50;

});

miniBoss=null;

msg.reply("MiniBoss đã bị tiêu diệt");

}else{

msg.reply(`Bạn gây ${dmg} dmg`);

}

}


// ======== WORLD BOSS BATTLE ========

if(cmd==="wboss"){

if(!worldBoss) return msg.reply("Chưa spawn");

if(!worldBoss.players.includes(msg.author.id))
worldBoss.players.push(msg.author.id)

let scale = worldBoss.players.length

let dmg = 20 + Math.floor(Math.random()*10) + scale

const user = getUser(msg.author.id)

let skillText = ""

if(user.skill !== null && user.class){

const skill = skills[user.class][user.skill]

dmg += skill.dmg

skillText = `\n✨ Skill: ${skill.name}`

}

if(worldBoss.phase===2) dmg = Math.floor(dmg*1.5)

worldBoss.hp -= dmg;

if(worldBoss.hp < 1500 && worldBoss.phase===1){

worldBoss.phase = 2;

if(Math.random()<0.1){

msg.channel.send("💥 Boss tự bạo tiêu diệt tất cả");

worldBoss=null;

return;

}

msg.channel.send("⚠️ Boss vào Phase 2");

}

if(worldBoss.hp <= 0){

let players=[...new Set(worldBoss.players)];

if(players.length===4 && Math.random()<0.25){

const traitor=players[Math.floor(Math.random()*players.length)];

const u=getUser(traitor);

u.gold+=1000;

msg.channel.send(`<@${traitor}> đã phản bội và cướp hết thưởng!`);

}else{

players.forEach(p=>{

const u=getUser(p);

u.gold+=250;

});

}

worldBoss=null;

msg.channel.send("🌍 WorldBoss bị tiêu diệt");

}else{

msg.reply(`Bạn gây ${dmg} dmg${skillText}

❤️ Boss còn **${worldBoss.hp} HP**`)

}

}
// ===== SKILL SYSTEM =====
const user = getUser(msg.author.id)

if(user.skill !== null){

const skill = skills[user.class][user.skill]

dmg += skill.power

}

if(worldBoss.phase===2) dmg = Math.floor(dmg*1.5)

worldBoss.hp-=dmg;

if(worldBoss.hp<1500 && worldBoss.phase===1){

worldBoss.phase=2;

if(Math.random()<0.1){

msg.channel.send("💥 Boss tự bạo tiêu diệt tất cả");

worldBoss=null;

return;

}

msg.channel.send("⚠️ Boss vào Phase 2");

}

if(worldBoss.hp<=0){

let players=[...new Set(worldBoss.players)];

if(players.length===4 && Math.random()<0.25){

const traitor=players[Math.floor(Math.random()*players.length)];

const u=getUser(traitor);

u.gold+=1000;

msg.channel.send(`<@${traitor}> đã phản bội và cướp hết thưởng!`);

}else{

players.forEach(p=>{

const u=getUser(p);

u.gold+=250;

});

}

worldBoss=null;

msg.channel.send("🌍 WorldBoss bị tiêu diệt");

}else{

msg.reply(`Bạn gây ${dmg} dmg${skillText}

❤️ Boss còn **${worldBoss.hp} HP**`)

}

}

}

// ======== SHOP SYSTEM ========

if(cmd==="shop"){

let text = "🛒 **SHOP VŨ KHÍ**\n\n"

let i=1

for(const id in weapons){

const w = weapons[id]

text += `${i}. ${w.name} - ${w.price} ${w.currency}\n`

i++

}

msg.reply(text)

}

// ===========/Mua Do/============

// ======== WEAPON DATABASE ========

const weapons = {

// ===== SWORDSMAN =====

sword1:{
name:"Kiếm Gỗ",
class:"swordsman",
atk:5,
price:200,
currency:"vnd"
},

sword2:{
name:"Kiếm Sắt",
class:"swordsman",
atk:10,
price:500,
currency:"vnd"
},

sword3:{
name:"Kiếm Bạc",
class:"swordsman",
atk:18,
price:1200,
currency:"vnd"
},

sword4:{
name:"Kiếm Rồng",
class:"swordsman",
atk:30,
price:10,
currency:"gold"
},

sword5:{
name:"Thần Kiếm",
class:"swordsman",
atk:60,
hp:100
price:25,
currency:"gold"
},

// ===== ARCHER =====

bow1:{
name:"Cung Gỗ",
class:"archer",
atk:5,
price:200,
currency:"vnd"
},

bow2:{
name:"Cung Săn",
class:"archer",
atk:10,
price:500,
currency:"vnd"
},

bow3:{
name:"Cung Chiến",
class:"archer",
atk:18,
price:1200,
currency:"vnd"
},

bow4:{
name:"Cung Phượng Hoàng",
class:"archer",
atk:30,
hp: 50
price:10,
currency:"gold"
},

bow5:{
name:"Nỏ Thần Dominik",
class:"archer",
atk:60,
price:25,
currency:"gold"
},

// ===== MAGE =====

staff1:{
name:"Trượng Gỗ",
class:"mage",
atk:6,
price:250,
currency:"vnd"
},

staff2:{
name:"Trượng Pháp",
class:"mage",
atk:12,
price:600,
currency:"vnd"
},

staff3:{
name:"Trượng Nguyên Tố",
class:"mage",
atk:20,
price:1500,
currency:"vnd"
},

staff4:{
name:"Trượng Hư Vô",
class:"mage",
atk:32,
hp: 55
price:12,
currency:"gold"
},

staff5:{
name:"Thần Trượng",
class:"mage",
atk:50,
hp:80
price:30,
currency:"gold"
},

// ===== TANK =====

shield1:{
name:"Khiên Gỗ",
class:"tank",
atk:4,
price:200,
currency:"vnd"
},

shield2:{
name:"Khiên Sắt",
class:"tank",
atk:8,
price:500,
currency:"vnd"
},

shield3:{
name:"Giáp Liệt Sĩ",
class:"tank",
atk:10
def:50,
price:12000,
currency:"vnd"
},

shield4:{
name:"Tim Băng",
class:"tank",
atk:25
def:55
hp:70,
price:10,
currency:"gold"
},

shield5:{
name:"Giáp Nguyệt Thần",
class:"tank",
atk:25
def:70
hp:100,
price:25,
currency:"gold"
},

// ===== ASSASSIN =====

dagger1:{
name:"Dao Hung Tàn",
class:"assassin",
atk:7,
price:250,
currency:"vnd"
},

dagger2:{
name:"Song Dao",
class:"assassin",
atk:14,
price:600,
currency:"vnd"
},

dagger3:{
name:"Dao Bóng Đêm",
class:"assassin",
atk:22,
price:1500,
currency:"vnd"
},

dagger4:{
name:"Dao Độc",
class:"assassin",
atk:35,
price:12,
currency:"gold"
},

dagger5:{
name:"Nanh Rồng",
class:"assassin",
atk:80
hp:25,
price:30,
currency:"gold"
},

// ===== SUPPORT =====

wand1:{
name:"Gậy Phép",
class:"support",
atk:5,
price:200,
currency:"vnd"
},

wand2:{
name:"Gậy Thánh",
class:"support",
atk:10,
price:500,
currency:"vnd"
},

wand3:{
name:"Gậy Ánh Sáng",
class:"support",
atk:18,
price:1200,
currency:"vnd"
},

wand4:{
name:"Gậy Thiên Sứ",
class:"support",
atk:28
hp:120,
price:10,
currency:"gold"
},

wand5:{
name:"Thánh Trượng",
class:"support",
atk:40
hp:90,
price:25,
currency:"gold"
}

}

if(cmd==="buy"){

const item = args[0]

const w = weapons[item]

if(!w) return msg.reply("Item không tồn tại")

const user = getUser(msg.author.id)

if(w.currency==="vnd"){

if(user.vnd < w.price)
return msg.reply("Không đủ VND")

user.vnd -= w.price

}else{

if(user.gold < w.price)
return msg.reply("Không đủ GOLD")

user.gold -= w.price

}

user.inventory.push(item)

msg.reply(`Bạn đã mua ${w.name}`)

}

// ================/equip/=============

if(cmd==="equip"){

const item = args[0]

const user = getUser(msg.author.id)

if(!user.inventory.includes(item))
return msg.reply("Bạn không có item này")

user.weapon = item

msg.reply(`Đã trang bị ${weapons[item].name}`)

}


const index = parseInt(args[0]) - 1

const user = getUser(msg.author.id)

if(!user.class)
return msg.reply("Bạn chưa chọn class")

const list = skills[user.class]

if(!list[index])
return msg.reply("Skill không tồn tại")

user.skill = list[index]

msg.reply(`Bạn đã trang bị skill **${list[index].name}**`)

}


// =========/profile system/==========
if(cmd==="profile"){

const user = getUser(msg.author.id)

const embed = gameEmbed(
"👤 Hồ sơ người chơi",
`Level: ${user.level}
EXP: ${user.exp}

HP: ${user.hp}
ATK: ${user.atk}
DEF: ${user.def}

💵 VND: ${user.vnd}
🪙 GOLD: ${user.gold}

Class: ${user.class || "Chưa chọn"}`
)

msg.reply({embeds:[embed]})

}

// ======== TAIXIU ROUND SYSTEM ========

async function taixiuRound(){

while(true){

if(!taixiuEnabled){
await new Promise(r=>setTimeout(r,5000))
continue
}

const channel = client.channels.cache.get(TAIXIU_CHANNEL)

taixiuMessage = await channel.send({embeds:[taixiuEmbed()]})

// đợi cược
await new Promise(r=>setTimeout(r,60000))

let msg = await channel.send("🎲 Đang quay xúc xắc...")

const animation = ["🎲 ⚪⚪⚪","🎲 ⚄⚁⚃","🎲 ⚅⚂⚄","🎲 ⚃⚃⚁"]

for(const frame of animation){

await new Promise(r=>setTimeout(r,1000))

await msg.edit(frame)

}

let dice =
(Math.floor(Math.random()*6)+1)+
(Math.floor(Math.random()*6)+1)+
(Math.floor(Math.random()*6)+1)

let result = dice >= 11 ? "tai" : "xiu"

if(taixiuForced){
result = taixiuForced
taixiuForced = null
}

let winners = result === "tai" ? taiPlayers : xiuPlayers

Object.keys(winners).forEach(id=>{

let u = getUser(id)

let bet = winners[id]

let win = Math.floor(bet * 1.9)

u.vnd += win

})

await msg.edit(`🎲 **${dice} → ${result.toUpperCase()}**`)

taiPool = 0
xiuPool = 0
taiPlayers = {}
xiuPlayers = {}

}

}

taixiuRound()

// ======== BOT LOGIN ========

client.login(process.env.DISCORD_TOKEN);

const express = require("express")
const app = express()

app.get("/", (req,res)=>{
res.send("Bot is running")
})


app.listen(3000,()=>console.log("Server running"))
