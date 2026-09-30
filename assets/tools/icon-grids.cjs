/* 手绘像素图标网格库（16×16，调色板字符见 gen-icons.cjs PAL）
 * 命名 = 游戏实体 id（recipe_* / mat_* / map_N / <achievement_id> / ui_*）
 * 家族模板：elite_core_N（宝石×6 配色）/ mat_sigil_*（徽记盾×6 纹章）/ map_N（洞窟拱门×6 主题）
 */
// 网格行 = 16 字符字符串（'\.' 透明）

/* ── 饮品 ── */

const goblet = [
  '................',
  '.....oooooo.....',
  '....oYYYYYYo....',
  '...oYwGGGGYo....',
  '...oYwGGGGYo....',
  '...oYYGGGGYo....',
  '....oYGGGYo.....',
  '.....oYGYo......',
  '......oYo.......',
  '....ooMmMoo.....',
  '...oGGGGGGGo....',
  '...oGgGGGgGo....',
  '....oGGGGGo.....',
  '.....ooooo......',
  '................',
  '................',
];

const soda_cup = [
  '................',
  '..........rr....',
  '.........oro....',
  '....ooooo.oro...',
  '...oFFFFFooro...',
  '..oFCCFFCCoRo...',
  '..oFCCFFCCoo....',
  '..oFCCCFFCCo....',
  '..oFCCCCFFCo....',
  '..oFCFFCCCCo....',
  '..oFCCCCCCCo....',
  '...oFFFFFFFo....',
  '....ooooooo.....',
  '................',
  '................',
  '................',
];

const milk_mug = [
  '................',
  '.....ww...ww....',
  '......w...w.....',
  '................',
  '....oooooo......',
  '...oFFFFFFo.oo..',
  '..oFwFFFFFo.oFo.',
  '..oFFFFFFFo.oFo.',
  '..oFFFFFFFooFo..',
  '..oFFYYYFFo.oFo.',
  '..oFYYYYYFo.oo..',
  '..oFYYYYYFo.....',
  '...oFFFFFo......',
  '....ooooo.......',
  '................',
  '................',
];

const sparkle_drink = [
  '................',
  '.....w..........',
  '....owo....w....',
  '....ooooooo.....',
  '...oCwCCCCCo....',
  '..oCCBCCCBCo....',
  '..oCBCCCBCCo....',
  '..oCCCBCCCCo.w..',
  '..oCBCCCCBBoowo.',
  '..oCCCCCBCCo.o..',
  '..oCBCCBCCCo....',
  '...oCCCCCCCo....',
  '....ooooooo.....',
  '................',
  '................',
  '................',
];

const crystal_dish = [
  '................',
  '................',
  '.......oo.......',
  '......oBBo......',
  '.....oBwBBo.....',
  '....oBwBBBBo....',
  '...oBwBBBBBBo...',
  '..oBBBBBBBBBBo..',
  '...oBnBBBBnBo...',
  '....oBnBBnBo....',
  '.....oBnnBo.....',
  '...oooooooooo...',
  '..oHHHHHHHHHHo..',
  '...oooooooooo...',
  '................',
  '................',
];

/* ── 魔物食材 ── */

const mat_gel = [
  '................',
  '................',
  '.....oooooo.....',
  '...ooLlllloo....',
  '..oLwLllllllo...',
  '..oLwLlllllllo..',
  '.oLwLllllllllo..',
  '.oLLlllLlllllo..',
  '.oLllllLlllklo..',
  '.oLllllllllkko..',
  '.oLllklllllkko..',
  '..oLlkklllkko...',
  '...ollkkkkko....',
  '.....oooooo.....',
  '................',
  '................',
];

const bat_wing = [
  '................',
  '..oo........oo..',
  '.ovvo......ovvo.',
  '.ovVvo....ovVvo.',
  '.ovVvvo..ovVvvo.',
  '..ovVvoooovVvo..',
  '..ovVvvvvvvVvo..',
  '...ovVvvvvVvo...',
  '...ovvvVvvvvo...',
  '....ovvVvVvo....',
  '....ovvuuvo.....',
  '.....ovuuo......',
  '......ouo.......',
  '.......o........',
  '................',
  '................',
];

const rock_salt = [
  '................',
  '................',
  '....oHo...oo....',
  '...oHwHo.oHHo...',
  '..ooHHHHooHwHo..',
  '.oHwHHHHHHHHHo..',
  '.oHHHhbHHHHHho..',
  '.oHHhhhHHHhhho..',
  '.ohbhhhhhhhho...',
  '..ohhhhhhhho....',
  '...ohhhhho......',
  '....ooooo.......',
  '................',
  '................',
  '................',
  '................',
];

const crab_claw = [
  '................',
  '................',
  '....oo....oo....',
  '...oRRo..oRRo...',
  '..oRwRrooRrRo...',
  '..oRwRrrrrRro...',
  '..oRRrrrrrrRo...',
  '...oRrrrrrRo....',
  '...oRrrrrRo.....',
  '....oRrrRo......',
  '....oRrRo.......',
  '.....oRo........',
  '.....oo.........',
  '................',
  '................',
  '................',
];

const lizard_tail = [
  '................',
  '...........oo...',
  '..........ollo..',
  '.........oLlLlo.',
  '........oLlllLo.',
  '.......oLlllLo..',
  '......oLlllLo...',
  '.....oLlllkLo...',
  '....oLlllkko....',
  '...oLlllkko.....',
  '..oLlllkko......',
  '..oLlllko.......',
  '.oLlllLo........',
  '.oLkLLo.........',
  '..ooo...........',
  '................',
];

const jelly_tentacle = [
  '................',
  '......ooooo.....',
  '.....oCCCCCo....',
  '....oCCwCCCCo...',
  '....oCCCCCco....',
  '....oCCCccco....',
  '.....oCccco.....',
  '.....oCcco......',
  '....oCcco.......',
  '....oCco........',
  '...oCco.........',
  '...oCo..........',
  '..oCo...........',
  '..oo............',
  '................',
  '................',
];

const troll_steak = [
  '................',
  '................',
  '...oooooooo.....',
  '..oRRRRRRRRo....',
  '.oRwRRrRRRRRo...',
  '.oRwRrrrrrRRo...',
  '.oRRrrrrrrrRo...',
  '.oRrrwwrrrrro...',
  '.oRrrwwrrrrro...',
  '.oRrrrrrrrrRo...',
  '.oRRrrrrrrRo....',
  '..oRRRRRRRo.....',
  '...ooooooo......',
  '................',
  '................',
  '................',
];

const wraith_essence = [
  '................',
  '......oooo......',
  '.....oHHHHo.....',
  '....oHwwHHo.....',
  '....oHwHHHo.....',
  '....oHHHHHo.....',
  '....oHssHHo.....',
  '....oHHHHHo.....',
  '...oHHHHHHo.....',
  '...oHHHHHo......',
  '....oHHHo.......',
  '....oHoHo.......',
  '.....o.o........',
  '................',
  '................',
  '................',
];

const abyss_tentacle = [
  '................',
  '.......ooo......',
  '......oVVVo.....',
  '.....oVwVVVo....',
  '.....oVVVvvo....',
  '....oVVvvvo.....',
  '....oVvvvo......',
  '...oVvvvo.......',
  '...oVvvo........',
  '..oVvvo.........',
  '..oVvo..........',
  '.oVvo...........',
  '.oVo............',
  '.oo.............',
  '................',
  '................',
];

const crystal_jelly = [
  '................',
  '................',
  '.....oooooo.....',
  '....oBwBBBBo....',
  '...oBwBBBBBBo...',
  '...oBBBBBBBBo...',
  '..oBBBBBBBBBBo..',
  '..oBBnBBBBnBBo..',
  '..oBBBnBBBnBBo..',
  '..oBBBBnnBBBBo..',
  '..oBnBBBBBBnBo..',
  '...oBnBBBBnBo...',
  '....oBnnnnBo....',
  '.....oooooo.....',
  '................',
  '................',
];

const void_essence = [
  '................',
  '......oo........',
  '.....oVvo.......',
  '....oVvVvo......',
  '....oVvVvvo.....',
  '...oVvVvvvo.....',
  '...oVvVvvuvo....',
  '...oVvvVuvvo....',
  '..oVvvVVuuvvo...',
  '..oVvvVVuuvo....',
  '..ovvvVuuuvo....',
  '...ovvuuuvo.....',
  '....ovuuvo......',
  '.....ovvo.......',
  '......oo........',
  '................',
];

/* ── 建材 ── */

const carapace = [
  '................',
  '................',
  '.....oooooo.....',
  '...ooTttttToo...',
  '..oTTtTTTTtTTo..',
  '..oTtTTTTTTtTo..',
  '.oTtTTmmmmTTtTo.',
  '.oTTTmMMmMMTTTo.',
  '.oTTTmMmmMmTTTo.',
  '.oTtTmmmmmmTtTo.',
  '..oTtTmmmmTtTo..',
  '..oTttTTTTttTo..',
  '...ooTttttToo...',
  '.....oooooo.....',
  '................',
  '................',
];

const mithril = [
  '................',
  '................',
  '....oo...oo.....',
  '...oBBo.oHHo....',
  '..oBwBBoHHHHo...',
  '..oBBBBHHwHHo...',
  '.oBbBBBHHHHHo...',
  '.oBbbBBbHhHHo...',
  '.obbBbbbbbhho...',
  '.obbBbbbbbhho...',
  '..obbbbbbbho....',
  '...obbbbbbo.....',
  '....oooooo......',
  '................',
  '................',
  '................',
];

const core = [
  '................',
  '......oooo......',
  '....oovvoo......',
  '...oVvvvvVo.....',
  '..oVvvuuvvVo....',
  '..oVvuuuuuVo....',
  '.oVvuusssuvVo...',
  '.oVvusssuvVo....',
  '.oVvussuuvVo....',
  '.oVvuusssuvVo...',
  '..oVvuuuuuVo....',
  '..oVvvuuvvVo....',
  '...oVvvvvVo.....',
  '....oooooo......',
  '................',
  '................',
];

/* ── 精英魔核（宝石模板 ×6 配色：1=亮 2=中 3=暗）── */

const GEM_TEMPLATE = [
  '................',
  '................',
  '.....oooo.......',
  '....o1111o......',
  '...o1w1112o.....',
  '..o1w111222o....',
  '..o11122222o....',
  '.o1112222222o...',
  '.o1122222333o...',
  '.o1222223333o...',
  '.o1222233333o...',
  '..o22233333o....',
  '..o22333333o....',
  '...o233333o.....',
  '....o3333o......',
  '.....oooo.......',
];

function gemGrid(bright, mid, dark) {
  return GEM_TEMPLATE.map((r) => r.replaceAll('1', bright).replaceAll('2', mid).replaceAll('3', dark));
}

/* ── 职业徽记（盾形 + 纹章）── */

function sigilGrid(emblemRows, accent) {
  // 盾形基底（12 宽），中间 4 行镶纹章；accent 为盾面主色
  const A = accent;
  const base = [
    '................',
    '..oooooooooo....',
    '.o' + A + A + A + A + A + A + A + A + A + A + 'o...',
    '.o' + A + A + A + A + A + A + A + A + A + A + 'o...',
    '.o' + A + A + A + A + A + A + A + A + A + A + 'o...',
    '.o' + A + A + A + A + A + A + A + A + A + A + 'o...',
    '.o' + A + A + A + A + A + A + A + A + A + A + 'o...',
    '.o' + A + A + A + A + A + A + A + A + A + A + 'o...',
    '.o' + A + A + A + A + A + A + A + A + A + A + 'o...',
    '..o' + A + A + A + A + A + A + A + A + 'o....',
    '...o' + A + A + A + A + A + A + 'o.....',
    '....o' + A + A + A + A + 'o......',
    '.....o' + A + A + 'o.......',
    '......oo........',
    '................',
    '................',
  ];
  // 纹章居中（第 4-11 行 × 第 4-12 列区域）
  const grid = base.map((r) => r.split(''));
  emblemRows.forEach((row, i) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch !== ' ') grid[4 + i][3 + x] = ch;
    }
  });
  return grid.map((r) => r.join(''));
}

/* 纹章 8×7（' '=透底；只允许 PAL 已定义字符） */
const EMBLEMS = {
  warrior: ['  oo    ', '  oHo   ', '  oHo   ', 'oooooo  ', '  oMo   ', '  oMo   ', ' oooo   '],
  mage: ['   o    ', '  oBo   ', ' oBwBo  ', 'oBBwBBo ', ' oBBBo  ', '  oBo   ', '   o    '],
  rogue: ['      o ', '     oHo', '    oHo ', 'oooMo   ', '   oo   ', '  oo    ', ' o      '],
  priest: ['   oo   ', '   oo   ', 'ooHHoo  ', 'ooHHoo  ', '   oo   ', '   oo   ', '        '],
  ranger: ['      o ', '   ooo ', '  ooHoo ', ' oHoo   ', 'oo      ', '        ', '        '],
  bard: ['  ooo   ', '  owo   ', '  oo    ', '  oo    ', '  oo    ', '  oooo  ', '     ooo'],
};

/* ── 地图（洞窟拱门模板 ×6 主题：M=墙体 N=亮纹 D=内框 I=主题色 G=地面）── */

const MAP_TEMPLATE = [
  '................',
  '....ooooooo.....',
  '...oMMMMMMMo....',
  '..oMNMMMMNMMo...',
  '..oMMNMMMNMMo...',
  '.oMMMoooooMMMo..',
  '.oMMoDDDDDoMMo..',
  '.oMNoDIIIDoMMo..',
  '.oMMoDIIIDoMWo..',
  '.oMMoDDDDDoMMo..',
  '.oMMMMMMMMMMMo..',
  '..oMMMMMMMMMo...',
  '..oGGGGGGGGGo...',
  '...oooooooooo...',
  '................',
  '................',
];

function mapGrid(theme) {
  return MAP_TEMPLATE.map((r) =>
    r
      .replaceAll('M', theme.wall)
      .replaceAll('N', theme.wallLight)
      .replaceAll('D', theme.frame)
      .replaceAll('I', theme.inner)
      .replaceAll('G', theme.ground),
  );
}

/* ── 成就 / UI ── */

const beer_mug = [
  '................',
  '...oooooo.......',
  '..owwwwwwo......',
  '.owwFwFFwwo.....',
  '.owFFooFFwo.oo..',
  '.oFFFooFFFo.oYo.',
  '.oYYYYYYYYooYYo.',
  '.oYGGGGGYYoYo...',
  '.oYGGGGGYYoYo...',
  '.oYGGGGGYYoYo...',
  '.oYGGGGGYYooYo..',
  '.oYGGGGGYYo.oo..',
  '.oYGGGGGYYo.....',
  '..oooooooo......',
  '................',
  '................',
];

const party_banner = [
  '................',
  '..oooooooooo....',
  '.oRRoFFFFoRRo...',
  '.oRRoFFFFoRRo...',
  '.oRoFFFFFoRRo...',
  '.oRoFwFFwFRo....',
  '..oFFFFFFFo.....',
  '..oFFoooFFo.....',
  '..oFoFoFoFo.....',
  '..oFoooooo......',
  '...oFoFoFo......',
  '...oFFFFFFo.....',
  '....oooooo......',
  '................',
  '................',
  '................',
];

const crossed_swords = [
  '................',
  '.o..........o...',
  '.oho......oho...',
  '..oho....oho....',
  '...oho..oho.....',
  '....ohooho......',
  '.....ohho.......',
  '....oHooHo......',
  '...oHhoohHo.....',
  '..oHho..oHHo....',
  '.oHho....oHHo...',
  '.oo........oo...',
  '................',
  '................',
  '................',
  '................',
];

const pickaxe = [
  '................',
  '....oooooo......',
  '...oHHHHHHo.....',
  '..oHhMhhMhHo....',
  '..ohMMMMMMho....',
  '...oMoMMoMo.....',
  '....oMMMMo......',
  '.....oMMo.......',
  '.....oMMo.......',
  '.....oMMo.......',
  '.....oMMo.......',
  '.....oMMo.......',
  '.....oMMo.......',
  '.....oooo.......',
  '................',
  '................',
];

const flame = [
  '................',
  '.......oo.......',
  '......oRo.......',
  '......oRRo......',
  '.....oRRRo......',
  '....oRRRRo......',
  '....oRRRRRo.....',
  '...oRRwRRRRo....',
  '...oRwwRRRRo....',
  '..oRRwRRRRRo....',
  '..oRRRRRRRRe....',
  '..oRRRRRReRo....',
  '...oRRRReRo.....',
  '....oooooo......',
  '................',
  '................',
];

const void_star = [
  '................',
  '.......o........',
  '.......o........',
  '......oVo.......',
  '......oVo.......',
  '.o....oVo....o..',
  '.oVo..oVo..oVo..',
  '..oVo.oVo.oVo...',
  '...oVooVooVo....',
  '....oVVVVVo.....',
  '...oVouvuoVo....',
  '..oVouuuuoVo....',
  '.oVo.oooo.oVo...',
  '.o..........o...',
  '................',
  '................',
];

const dagger = [
  '................',
  '..........oo....',
  '.........oHho...',
  '........oHwho...',
  '.......oHwho....',
  '......oHwho.....',
  '.....oHwho......',
  '....oHwho.......',
  '...ooWho........',
  '..oGooGo........',
  '.oGGooGGo.......',
  '.ooGo.oGo.......',
  '..oo..oo........',
  '................',
  '................',
  '................',
];

const skull = [
  '................',
  '....oooooo......',
  '...oHHHHHHo.....',
  '..oHHwHHHHHo....',
  '..oHHHHHHHHo....',
  '.oHooHHHooHHo...',
  '.oHosHHHsoHHo...',
  '.oHooHHHooHHo...',
  '..oHHHHHHHHo....',
  '...oHooooHo.....',
  '...oHoHHoHo.....',
  '....oooooo......',
  '................',
  '................',
  '................',
  '................',
];

const skull_crown = [
  '................',
  '..o..o..o..o....',
  '.oYo.oYo.oYo....',
  '.oYYooYYooYYo...',
  '.oYYYYYYYYYYo...',
  '.oYHHHHHHHHYo...',
  '.oHooHHHooHHo...',
  '.oHosHHHsoHHo...',
  '.oHooHHHooHHo...',
  '..oHHHHHHHHo....',
  '...oHooooHo.....',
  '...oHoHHoHo.....',
  '....oooooo......',
  '................',
  '................',
  '................',
];

const dragon_head = [
  '................',
  '....oo..........',
  '...oLLo..oo.....',
  '..oLlLLooLLo....',
  '.oLlLLlLLLLLo...',
  '.oLLlLlLLlLLo...',
  '.oLoLLlLLLlLo...',
  '.oLLooLLlLLLo...',
  '.oLLlLLLLLLo....',
  '..oLLLLLLLoRo...',
  '...oLLLloRRoRo..',
  '....oLLoRRRRo...',
  '.....ooooRRo....',
  '.........oo.....',
  '................',
  '................',
];

const plate_fork = [
  '................',
  '................',
  '...oooooooo.....',
  '..oHHHHHHHHo....',
  '.oHHwHHHHHHHo...',
  '.oHwHHHHHHHHo...',
  '.oHHHHHHHHHHo...',
  '.oHHHHHHHHHHo...',
  '.oHHHHHHHHHHo...',
  '..oHHHHHHHHo....',
  '...oooooooo.....',
  '...oHooooHo.....',
  '....oooooo......',
  '................',
  '................',
  '................',
];

const cooking_pot = [
  '................',
  '....w..w..w.....',
  '................',
  '..oooooooooo....',
  '..oMMMMMMMMo....',
  '.ooMMMMMMMMoo...',
  '.oMmTTTTTTmMo...',
  '.oMTtTTTTtTMo...',
  '.oMTTTTTTTTMo...',
  '.oMTTTtTTTTMo...',
  '.oMTTTTTtTMo....',
  '..oMTTTTTMo.....',
  '...ooooooo......',
  '................',
  '................',
  '................',
];

const coin_pile = [
  '................',
  '................',
  '.....ooooo......',
  '....oYYYYYo.....',
  '...oYYwGGYYo....',
  '...oYYGGYYo.....',
  '....oYYYYo......',
  '.....oooo.......',
  '..oooooooooo....',
  '.oYYoYYYYoYYo...',
  'ooYYoYwGYoYYoo..',
  'oYYo.oYYo.oYYo..',
  'ooo..oooo..ooo..',
  '................',
  '................',
  '................',
];

const sparkle_star = [
  '................',
  '.......o........',
  '......oYo.......',
  '......oYo.......',
  '.....oYYYo......',
  'ooooooYwYoooooo.',
  'oYYYowwwwwoYYYo.',
  'ooooooYwYoooooo.',
  '.....oYYYo......',
  '......oYo.......',
  '......oYo.......',
  '.......o........',
  '................',
  '................',
  '................',
  '................',
];

const globe = [
  '................',
  '.....oooooo.....',
  '...ooBbBbBboo...',
  '..oBbLbBbBbBBo..',
  '.oBbBbLbBbLbBBo.',
  '.oBbLbBbBbBbBo..',
  '.oBbBbLbBbBbBo..',
  '.oBbBbBbLbBbBo..',
  '.oBbBbBbBbLbBo..',
  '..oBbLbBbBbBo...',
  '...ooBbBbBoo....',
  '.....oooooo.....',
  '................',
  '................',
  '................',
  '................',
];

const book_open = [
  '................',
  '................',
  '..ooo....ooo....',
  '.oFFFo..oFFFo...',
  'oFwFFo..oFFwFo..',
  'oFFFFooooFFFFo..',
  'oFFwFFFFFFwFFo..',
  'oFFFFFwwFFFFFo..',
  'oFFwFFFFFFwFFo..',
  'oFFFFFwwFFFFFo..',
  'oFFwFFFFFFwFFo..',
  '.oFFFooooFFFo...',
  '..oooooooooo....',
  '................',
  '................',
  '................',
];

const book_stack = [
  '................',
  '................',
  '...oooooooo.....',
  '..oLLLLLLLLLo...',
  '..olkllllkllo...',
  '..oooooooooo....',
  '.oVVVVVVVVVVVo..',
  '.oVuvVvvVuvVVo..',
  '.oooooooooooo...',
  'oRRRRRRRRRRRRRo.',
  'oRrRRRrrRRRrRRo.',
  'oooooooooooooo..',
  '................',
  '................',
  '................',
  '................',
];

/* ── 设施 / UI ── */

const lounge_table = [
  '................',
  '................',
  '................',
  '...oooooooo.....',
  '..oWWWWWWWWo....',
  '.oWwWWWWWWWWo...',
  '.oWWWWWWWWWWo...',
  '..oooooooooo....',
  '...oMo..oMo.....',
  '...oMo..oMo.....',
  '...oMo..oMo.....',
  '...oMo..oMo.....',
  '..oMMoo..MMo....',
  '..oooo..oooo....',
  '................',
  '................',
];

const dorm_bed = [
  '................',
  '................',
  '..ooooooooooo...',
  '..oMMMMMMMMMo...',
  '.oFwFFoMMMMMo...',
  '.oFFFFoRRRRRo...',
  '.oFFwFoRrRrRo...',
  '.oFFFFoRRRRRo...',
  '.oFoFFoRrRrRo...',
  '.oFFFFoRRRRRo...',
  '..ooooooooooo...',
  '..oMo.....oMo...',
  '..oMo.....oMo...',
  '..ooo.....ooo...',
  '................',
  '................',
];

const counter = [
  '................',
  '................',
  '..oooooooooooo..',
  '..oWWWWWWWWWWo..',
  '.oWwWWWWWWWWWwo.',
  '.oWWWWWWWWWWWWo.',
  '..oooooooooooo..',
  '..oMMMMMMMMMMo..',
  '..oMmMTTTTmMMo..',
  '..oMMTTtTTTMMo..',
  '..oMMTTTTTTMMo..',
  '..oMMMMMMMMMMo..',
  '..oMMMMMMMMMMo..',
  '..oooooooooooo..',
  '................',
  '................',
];

const coin = [
  '................',
  '.....oooooo.....',
  '....oYYYYYYo....',
  '...oYwGGGGYYo...',
  '..oYwGGGGGGYYo..',
  '..oYGGGggGGGYo..',
  '.oYGGGggggGGGYo.',
  '.oYGGGggggGGGYo.',
  '.oYGGGggGGGGYo..',
  '..oYGGGGGGGYo...',
  '..oYYGGGGYYo....',
  '...oYYYYYYo.....',
  '....oooooo......',
  '................',
  '................',
  '................',
];

const reputation = [
  '................',
  '.......oo.......',
  '......oYYo......',
  '......oYYo......',
  '.....oYYYYo.....',
  'oooooYYwYYooooo.',
  'oYYYowwwwwoYYYo.',
  'oooooYYwYYooooo.',
  '.....oYYYYo.....',
  '....oYYYYYYo....',
  '...oYYoYYoYYo...',
  '...oo..oo..oo...',
  '................',
  '................',
  '................',
  '................',
];

/* ── 种族徽章（9 大 PHB 种族）── */

const race_human = [
  '................',
  '.....oooooo.....',
  '....oHHHHHHo....',
  '...oHhHHHHhHo...',
  '...oHHwHHwHHo...',
  '...oHHHHHHHHo...',
  '...oHhHHHHhHo...',
  '...oHHHHHHHHo...',
  '...oHhHHHHhHo...',
  '...oHHHnnHHHo...',
  '...oHHHHHHHHo...',
  '....oHHHHHHo....',
  '.....oooooo.....',
  '................',
  '................',
  '................',
];

const race_elf = [
  '................',
  '.......oo.......',
  '......oLlo......',
  '.....oLlLlo.....',
  '....oLllLllo....',
  '...oLlllLlLlo...',
  '...oLlllLLlllo..',
  '...oLlllLLLllo..',
  '...oLlllLLLLlo..',
  '....oLllLLLlo...',
  '....oLlllLlo....',
  '.....oLlLlo.....',
  '......ollo......',
  '.......oo.......',
  '................',
  '................',
];

const race_dwarf = [
  '................',
  '................',
  '..oooooooooo....',
  '..oHHHHHHHHo....',
  '..oHhHHHHhHo....',
  '..oHHHHHHHHo....',
  '..oHhHHHHhHo....',
  '..oHHHHHHHHo....',
  '...oooooooo.....',
  '.....oMMo.......',
  '.....oMMo.......',
  '.....oMMo.......',
  '.....oMMo.......',
  '.....oMMo.......',
  '....oMMMMo......',
  '....oooooo......',
];

const race_halfling = [
  '................',
  '.....oooooo.....',
  '...ooLllllLoo...',
  '..oLllGllGllLo..',
  '..oLllllllllLo..',
  '.oLlllGllGlllLo.',
  '.oLlllllllllLLo.',
  '.oLllllllllllLo.',
  '.oLlllYYlllllLo.',
  '.oLllllYlllllLo.',
  '.oLllllllllllLo.',
  '..oLllllllllLo..',
  '...ooLllllLoo...',
  '.....oooooo.....',
  '................',
  '................',
];

const race_gnome = [
  '................',
  '.......oo.......',
  '......orro......',
  '.....orrRro.....',
  '....orrRRRro....',
  '...orrRRRRRro...',
  '..orrRRwRRRrro..',
  '..orRRRRRRRRro..',
  '..oRRRRRRRRRRo..',
  '..oFFoRRRRoFFo..',
  '...oooRRRRooo...',
  '......oRRo......',
  '......oFFo......',
  '......oooo......',
  '................',
  '................',
];

const race_half_elf = [
  '................',
  '.....oooooo.....',
  '...ooLLFFLLoo...',
  '..oLllFFFFllLo..',
  '..oLlllFFlllLo..',
  '.oLllllFFllllLo.',
  '.oLlllFFFFFFlLo.',
  '.oLlllFFFFFFlLo.',
  '.oLlllFFFFFFlLo.',
  '..oLlllFFlllLo..',
  '..oLlllFFlllLo..',
  '...ooLLFFLLoo...',
  '.....oooooo.....',
  '................',
  '................',
  '................',
];

const race_half_orc = [
  '................',
  '....oo....oo....',
  '...owwo..owwo...',
  '...oFwwo.owwo...',
  '...oFFwwoowwo...',
  '...oFFwwoowwo...',
  '...oFFFwoowwo...',
  '...oFFFwoowFo...',
  '....oFFwoowFo...',
  '.....oFwoowFo...',
  '.....oFwoowFo...',
  '......owwowo....',
  '.......oooo.....',
  '................',
  '................',
  '................',
];

const race_tiefling = [
  '................',
  '..oo........oo..',
  '.ovvo......ovvo.',
  '.ovVvo....ovVvo.',
  '.ovVvvo..ovVvo..',
  '..ovVvvoovVvo...',
  '...ovVvvvVvo....',
  '...oVvvvvvVo....',
  '...oVvvVvvVo....',
  '...oVvvVvvVo....',
  '...oVvvvvvVo....',
  '....oVvvvVo.....',
  '.....oVVVo......',
  '......ooo.......',
  '................',
  '................',
];

const race_dragonborn = [
  '................',
  '.....oooooo.....',
  '....oTTTTTTo....',
  '...oTtTTTTtTo...',
  '...oTTYYTTTTo...',
  '...oTtYtYtTTo...',
  '...oTTYYYTTTo...',
  '...oTtTTTTtTo...',
  '...oTTYYTTTTo...',
  '...oTtYtYtTTo...',
  '....oTTTTTTo....',
  '.....oTtTTo.....',
  '......oooo......',
  '................',
  '................',
  '................',
];



const CORE_THEMES = [
  ['L', 'l', 'k'], // 1 苔藓古树心
  ['B', 'b', 'n'], // 2 秘银星髓
  ['H', 'F', 'h'], // 3 骸骨圣灰
  ['R', 'r', 'e'], // 4 熔火之核
  ['C', 'c', 'q'], // 5 晶簇之心
  ['V', 'v', 'u'], // 6 虚空结晶
];

const SIGIL_ACCENTS = { warrior: 'r', mage: 'v', rogue: 'h', priest: 'Y', ranger: 'l', bard: 'T' };

const MAP_THEMES = [
  { wall: 'm', wallLight: 'T', frame: 'k', inner: 'l', ground: 'l' }, // 1 苔藓洞窟：棕岩+苔绿
  { wall: 'h', wallLight: 'H', frame: 'n', inner: 'b', ground: 'h' }, // 2 秘银矿道：石灰+蓝矿
  { wall: 'x', wallLight: 'h', frame: 'u', inner: 'v', ground: 'x' }, // 3 骸骨墓穴：暗灰+幽紫
  { wall: 'm', wallLight: 'T', frame: 'e', inner: 'r', ground: 'e' }, // 4 熔岩裂隙：焦岩+熔红
  { wall: 'h', wallLight: 'H', frame: 'q', inner: 'c', ground: 'c' }, // 5 水晶回廊：石灰+晶青
  { wall: 'u', wallLight: 'v', frame: 'u', inner: 'V', ground: 'v' }, // 6 虚空终焉：幽紫+虚空
];

const ICONS = {
  /* 饮品菜谱 */
  recipe_mush_wine: goblet,
  recipe_gel_soda: soda_cup,
  recipe_honey_milk: milk_mug,
  recipe_crystal_soda: sparkle_drink,
  recipe_crystal_salad: crystal_dish,
  /* 食材 */
  mat_gel,
  mat_bat_wing: bat_wing,
  mat_rock_salt: rock_salt,
  mat_crab_claw: crab_claw,
  mat_lizard_tail: lizard_tail,
  mat_jelly_tentacle: jelly_tentacle,
  mat_troll_steak: troll_steak,
  mat_wraith_essence: wraith_essence,
  mat_abyss_tentacle: abyss_tentacle,
  mat_crystal_jelly: crystal_jelly,
  mat_void_essence: void_essence,
  /* 建材 */
  mat_carapace: carapace,
  mat_mithril: mithril,
  mat_core: core,
  /* 精英魔核 */
  ...Object.fromEntries(CORE_THEMES.map((t, i) => [`mat_elite_core_${i + 1}`, gemGrid(...t)])),
  /* 职业徽记 */
  ...Object.fromEntries(
    Object.entries(EMBLEMS).map(([cls, rows]) => [`mat_sigil_${cls}`, sigilGrid(rows, SIGIL_ACCENTS[cls])]),
  ),
  /* 地图 */
  ...Object.fromEntries(MAP_THEMES.map((t, i) => [`map_${i + 1}`, mapGrid(t)])),
  /* 成就 */
  ach_open_for_business: beer_mug,
  ach_first_squad: party_banner,
  ach_full_party: crossed_swords,
  ach_map_2: pickaxe,
  ach_map_4: flame,
  ach_map_6: void_star,
  ach_slayer_50: dagger,
  ach_slayer_100: skull,
  ach_slayer_1000: skull_crown,
  ach_boss_slayer: dragon_head,
  ach_gourmet: plate_fork,
  ach_feast_50: cooking_pot,
  ach_gold_10k: coin_pile,
  ach_legendary_pact: sparkle_star,
  ach_nine_races: globe,
  ach_codex_half: book_open,
  ach_codex_full: book_stack,
  /* 种族徽章 */
  race_human,
  race_elf,
  race_dwarf,
  race_halfling,
  race_gnome,
  race_half_elf,
  race_half_orc,
  race_tiefling,
  race_dragonborn,
  /* 设施 / UI（ui_ 前缀 → public/sprites/ui/）*/
  ui_facility_lounge: lounge_table,
  ui_facility_kitchen: cooking_pot,
  ui_facility_dorm: dorm_bed,
  ui_tab_dungeon: crossed_swords,
  ui_tab_kitchen: cooking_pot,
  ui_tab_tavern: beer_mug,
  ui_tab_dorm: dorm_bed,
  ui_tab_codex: book_open,
  ui_room_front: counter,
  ui_coin: coin,
  ui_reputation: reputation,
};

/* oga 食物包策划映射：实体 id → 源文件名（描边加深 + 外扩后拷入 items/）*/
const CURATED = {
  recipe_gel_soup: 'soup_pea.png',
  recipe_bat_wings: 'chicken_drumstick_cooked.png',
  recipe_carapace_chips: 'french_fries.png',
  recipe_mushroom_soup: 'soup_mushroom.png',
  recipe_crab_claws: 'crab_legs.png',
  recipe_beast_roast: 'steak_grilled.png',
  recipe_pudding: 'flan.png',
  recipe_gummy: 'jello.png',
  recipe_elixir: 'ham.png',
  recipe_wraith_souffle: 'cupcake_vanilla.png',
  recipe_void_stew: 'soup_beet.png',
  recipe_flayer_bisque: 'soup_miso.png',
  recipe_dragon_feast: 'pizza_pepperoni_whole.png',
  recipe_void_banquet: 'fruitcake.png',
  recipe_lizard_skewer: 'dango.png',
  recipe_jelly_salad: 'lettuce.png',
  recipe_wraith_ice: 'icecream_vanilla.png',
  recipe_abyss_skewer: 'octopus.png',
  recipe_dragon_candy: 'lollipop.png',
  mat_mushroom_cap: 'mushroom.png',
  mat_flower_honey: 'honey_pot.png',
  mat_wolf_meat: 'steak_raw.png',
};

module.exports = { ICONS, CURATED };
