import { BulletSlot, Idiom } from './types';

// ── 服务端成语词库（精简版，用于 AI 接龙和初始成语）──
// 前端有完整词库（260+），服务端只需能生成起始成语即可
export const SERVER_IDIOMS: Idiom[] = [
  { text: '爱屋及乌', first: 'ai', last: 'wu' },
  { text: '安居乐业', first: 'an', last: 'ye' },
  { text: '暗度陈仓', first: 'an', last: 'cang' },
  { text: '百折不挠', first: 'bai', last: 'nao' },
  { text: '班门弄斧', first: 'ban', last: 'fu' },
  { text: '半途而废', first: 'ban', last: 'fei' },
  { text: '冰清玉洁', first: 'bing', last: 'jie' },
  { text: '不耻下问', first: 'bu', last: 'wen' },
  { text: '才华横溢', first: 'cai', last: 'yi' },
  { text: '草木皆兵', first: 'cao', last: 'bing' },
  { text: '沉默寡言', first: 'chen', last: 'yan' },
  { text: '出奇制胜', first: 'chu', last: 'sheng' },
  { text: '大公无私', first: 'da', last: 'si' },
  { text: '大器晚成', first: 'da', last: 'cheng' },
  { text: '当机立断', first: 'dang', last: 'duan' },
  { text: '得天独厚', first: 'de', last: 'hou' },
  { text: '东山再起', first: 'dong', last: 'qi' },
  { text: '独占鳌头', first: 'du', last: 'tou' },
  { text: '发愤图强', first: 'fa', last: 'qiang' },
  { text: '风调雨顺', first: 'feng', last: 'shun' },
  { text: '高瞻远瞩', first: 'gao', last: 'zhu' },
  { text: '光明正大', first: 'guang', last: 'da' },
  { text: '海纳百川', first: 'hai', last: 'chuan' },
  { text: '汗马功劳', first: 'han', last: 'lao' },
  { text: '好高骛远', first: 'hao', last: 'yuan' },
  { text: '虎背熊腰', first: 'hu', last: 'yao' },
  { text: '画龙点睛', first: 'hua', last: 'jing' },
  { text: '坚持不懈', first: 'jian', last: 'xie' },
  { text: '精益求精', first: 'jing', last: 'jing' },
  { text: '举一反三', first: 'ju', last: 'san' },
  { text: '开诚布公', first: 'kai', last: 'gong' },
  { text: '克己奉公', first: 'ke', last: 'gong' },
  { text: '理直气壮', first: 'li', last: 'zhuang' },
  { text: '马到成功', first: 'ma', last: 'gong' },
  { text: '明哲保身', first: 'ming', last: 'shen' },
  { text: '南辕北辙', first: 'nan', last: 'zhe' },
  { text: '牛刀小试', first: 'niu', last: 'shi' },
  { text: '披荆斩棘', first: 'pi', last: 'ji' },
  { text: '奇珍异宝', first: 'qi', last: 'bao' },
  { text: '勤能补拙', first: 'qin', last: 'zhuo' },
  { text: '任重道远', first: 'ren', last: 'yuan' },
  { text: '舍己为人', first: 'she', last: 'ren' },
  { text: '水滴石穿', first: 'shui', last: 'chuan' },
  { text: '铁杵成针', first: 'tie', last: 'zhen' },
  { text: '团结一致', first: 'tuan', last: 'zhi' },
  { text: '万众一心', first: 'wan', last: 'xin' },
  { text: '胸有成竹', first: 'xiong', last: 'zhu' },
  { text: '一帆风顺', first: 'yi', last: 'shun' },
  { text: '众志成城', first: 'zhong', last: 'cheng' },
  { text: '自强不息', first: 'zi', last: 'xi' },
];

const IDIOM_MAP = new Map<string, Idiom[]>();
for (const idiom of SERVER_IDIOMS) {
  const arr = IDIOM_MAP.get(idiom.first) ?? [];
  arr.push(idiom);
  IDIOM_MAP.set(idiom.first, arr);
}

/**
 * 随机获取一条起始成语
 */
export function getRandomStartIdiom(): Idiom {
  return SERVER_IDIOMS[Math.floor(Math.random() * SERVER_IDIOMS.length)];
}

/**
 * 获取可以接在 idiom 后面的候选成语
 */
export function getChainCandidates(idiom: Idiom, excludeTexts: string[] = []): Idiom[] {
  const candidates = IDIOM_MAP.get(idiom.last) ?? [];
  return candidates.filter(c => !excludeTexts.includes(c.text));
}

// ── 弹仓逻辑 ──

export function freshBulletSlots(): BulletSlot[] {
  return Array.from({ length: 6 }, (_, i) => ({
    chamber: i,
    hasBullet: i === 1 || i === 4,
    fired: false,
  }));
}

/**
 * 随机开枪一次，返回更新后的弹仓、是否中弹、弹仓编号
 */
export function fireOnce(slots: BulletSlot[]): {
  nextSlots: BulletSlot[];
  hit: boolean;
  chamberId: number;
} {
  const available = slots.filter(s => !s.fired);
  if (available.length === 0) {
    // 全开完了，重置弹仓
    const reset = freshBulletSlots();
    const idx = Math.floor(Math.random() * reset.length);
    reset[idx].fired = true;
    return { nextSlots: reset, hit: reset[idx].hasBullet, chamberId: reset[idx].chamber };
  }
  const picked = available[Math.floor(Math.random() * available.length)];
  const next = slots.map(s =>
    s.chamber === picked.chamber ? { ...s, fired: true } : s
  );
  return { nextSlots: next, hit: picked.hasBullet, chamberId: picked.chamber };
}

/**
 * 简单的服务端成语验证（基于本地词库）
 * 如果词库找不到则返回 true（允许通过，由前端 AI API 做最终验证）
 */
export function validateIdiomLocal(text: string, prevIdiom: Idiom): {
  valid: boolean;
  idiomData?: Idiom;
  errorType?: 'not-idiom' | 'wrong-chain';
} {
  // 在本地词库查找
  for (const idiom of SERVER_IDIOMS) {
    if (idiom.text === text) {
      // 检查接龙是否合法（首字拼音等于上词末字拼音）
      if (idiom.first === prevIdiom.last) {
        return { valid: true, idiomData: idiom };
      } else {
        return { valid: false, errorType: 'wrong-chain' };
      }
    }
  }
  // 词库找不到：不判断为非成语，返回 valid=true 带 unknown 标记
  // 让前端做二次验证或宽容通过
  return { valid: true, idiomData: { text, first: '', last: '' } };
}
