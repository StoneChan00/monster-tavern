import type { BaseStats, RaceId } from '../engine/types';

/**
 * D&D 5E 玩家手册种族（9 大 PHB 种族）。
 * 种族提供属性修正（加法区）与专属名字池，让到访冒险者更多样化。
 * 平衡原则：修正为平铺加值，幅度 ≈ 5%~15% 基础属性，无种族被动（保持简单）。
 */
export interface RaceDef {
  id: RaceId;
  name: string;
  /** 属性修正（加在职业基础值上，乘区之前） */
  statMods: Partial<BaseStats>;
  /** 名字池（种族风味命名） */
  namePool: string[];
  /** 到访权重 */
  weight: number;
}

export const HUMAN: RaceDef = {
  id: 'human',
  name: '人类',
  statMods: { hp: 6, atk: 1, def: 1, spd: 1 },
  namePool: ['罗兰', '艾登', '玛雅', '卡尔文', '莉娅', '托马斯'],
  weight: 22,
};

export const ELF: RaceDef = {
  id: 'elf',
  name: '精灵',
  statMods: { spd: 4, def: 1 },
  namePool: ['艾伦德', '莉雅温', '希尔文', '塔玛瑞尔', '伊苏尔达', '芬瑞斯'],
  weight: 12,
};

export const DWARF: RaceDef = {
  id: 'dwarf',
  name: '矮人',
  statMods: { hp: 16, def: 3 },
  namePool: ['索林', '达格娜', '铁须巴林', '岩锤葛姆', '布洛玛', '铜心赫尔嘉'],
  weight: 12,
};

export const HALFLING: RaceDef = {
  id: 'halfling',
  name: '半身人',
  statMods: { spd: 3, atk: 1 },
  namePool: ['皮聘', '罗索', '樱草', '邦果', '黛西', '梅里多克'],
  weight: 11,
};

export const GNOME: RaceDef = {
  id: 'gnome',
  name: '侏儒',
  statMods: { atk: 2, spd: 1 },
  namePool: ['菲兹维克', '齐格蒙', '妮莎贝儿', '帕丁诺', '沃佐克', '艾尔米什'],
  weight: 11,
};

export const HALF_ELF: RaceDef = {
  id: 'half_elf',
  name: '半精灵',
  statMods: { atk: 2, hp: 6 },
  namePool: ['亚瑟兰', '薇拉妮', '卡莱尔', '塞西莉亚', '奥兰多', '米娅拉'],
  weight: 12,
};

export const HALF_ORC: RaceDef = {
  id: 'half_orc',
  name: '半兽人',
  statMods: { atk: 3, hp: 10 },
  namePool: ['格罗什', '玛格妲', '卡尔加', '布拉卡', '雷加', '乌鲁克'],
  weight: 10,
};

export const TIEFLING: RaceDef = {
  id: 'tiefling',
  name: '提夫林',
  statMods: { atk: 3, def: 1 },
  namePool: ['墨魇', '卡莉丝塔', '瓦罗斯', '妮薇丝', '萨尔梅克', '莉莉丝安'],
  weight: 5,
};

export const DRAGONBORN: RaceDef = {
  id: 'dragonborn',
  name: '龙裔',
  statMods: { atk: 2, hp: 14 },
  namePool: ['巴哈鲁斯', '拉希安', '珊德拉', '卡尔塔克斯', '威瑞丝', '顿达金'],
  weight: 5,
};

export const RACES: Record<RaceId, RaceDef> = {
  [HUMAN.id]: HUMAN,
  [ELF.id]: ELF,
  [DWARF.id]: DWARF,
  [HALFLING.id]: HALFLING,
  [GNOME.id]: GNOME,
  [HALF_ELF.id]: HALF_ELF,
  [HALF_ORC.id]: HALF_ORC,
  [TIEFLING.id]: TIEFLING,
  [DRAGONBORN.id]: DRAGONBORN,
};

export const RACE_LIST: RaceDef[] = Object.values(RACES);
