// 搞笑「成语协议」错误提示词库

export interface FunnyError {
  title: string;   // 大标题
  body: string;    // 具体说明
  article: string; // 协议条款编号
}

// 输入的词不是成语时触发
export const NOT_IDIOM_ERRORS: FunnyError[] = [
  { title: '⚖ 字典警察出动', body: '经查，本词语不存在于成语字典，依法扣押扳机一次。', article: '第 §13 条' },
  { title: '📜 成语协议违反通知', body: '阁下输入之词汇查无此成语，依《汉字竞技法》第7条，移交轮盘赌处置。', article: '第 §7 条' },
  { title: '🚔 汉字稽查大队', body: '未在合法成语库中检索到该词条，嫌疑人将被强制扣扳机。', article: '第 §22 条' },
  { title: '❌ 成语认证失败', body: '您输入的内容未通过成语认证，已触发《接龙惩戒条例》！', article: '第 §5 条' },
  { title: '🔍 审核不通过', body: '该词语不符合四字成语规范，根据竞技规则，请接受轮盘制裁。', article: '第 §19 条' },
  { title: '📋 成语协议第666条', body: '不明词汇闯入竞技场，判处强制参与轮盘赌一次，童叟无欺。', article: '第 §666 条' },
  { title: '⚠ 警告：词汇存疑', body: '系统未能识别该成语，怀疑阁下在胡说八道，需扣扳机验明正身。', article: '第 §3 条' },
  { title: '🎯 成语失踪案', body: '调查人员遍寻字典未果，宣告该成语正式失踪，阁下需承担连带责任。', article: '第 §88 条' },
];

// 接龙音韵不符时触发
export const WRONG_CHAIN_ERRORS: FunnyError[] = [
  { title: '🎵 音韵警察到场', body: '首字拼音与上词末字不符！接龙规则不允许这种野路子，扣扳机！', article: '第 §11 条' },
  { title: '📻 拼音电台紧急播报', body: '侦测到音韵偏差！依《成语接龙国际公约》，违规者须接受轮盘赌审判。', article: '第 §42 条' },
  { title: '🔊 声调法庭开庭', body: '经核查，阁下所接之词首字音节与前词末字不匹配，依法惩处！', article: '第 §17 条' },
  { title: '❗ 接龙断裂事故报告', body: '成语接龙链条在此处断裂，责任方为阁下，请自行承担轮盘赌后果。', article: '第 §99 条' },
  { title: '🎤 韵脚检察院', body: '音韵不符，接龙不成立！本院依法判处轮盘赌惩罚一次，立即执行。', article: '第 §55 条' },
  { title: '📐 音律测量报告', body: '经精密声学仪器检测，首末音韵偏差超过规定阈值，依规扣扳机。', article: '第 §33 条' },
  { title: '🎶 五音不全警告', body: '您所接成语的首字与前词末字读音不符，系统已自动为您预定轮盘赌。', article: '第 §77 条' },
  { title: '⚖ 《汉字接龙公约》执行', body: '音韵接龙失败！根据汉字保护组织最新规定，违规者须扣扳机一次。', article: '第 §2 条' },
];

// 超时时触发
export const TIMEOUT_ERRORS: FunnyError[] = [
  { title: '⏰ 时限逾越通报', body: '阁下已超过20秒限时，依《成语紧急应变法》，移交轮盘赌处置。', article: '第 §1 条' },
  { title: '🕐 迟到罚款通知', body: '您的成语出现了严重延误，给对手造成精神损失，请扣扳机赔偿。', article: '第 §9 条' },
  { title: '⌛ 时间法院判决', body: '超时20秒，大脑宕机属实，依规判处轮盘赌一次，请勿上诉。', article: '第 §4 条' },
  { title: '🚨 超时紧急公告', body: '大脑响应超时！怀疑阁下在开小差，依法追究轮盘赌责任！', article: '第 §10 条' },
  { title: '💤 怠慢成语罪', body: '系统检测到您在20秒内无所作为，此乃成语竞技场最严重罪行，扣扳机！', article: '第 §6 条' },
];

export function getRandomError(type: 'not-idiom' | 'wrong-chain' | 'timeout'): FunnyError {
  const pool =
    type === 'not-idiom' ? NOT_IDIOM_ERRORS :
    type === 'wrong-chain' ? WRONG_CHAIN_ERRORS :
    TIMEOUT_ERRORS;
  return pool[Math.floor(Math.random() * pool.length)];
}
