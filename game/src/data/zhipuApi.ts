// 智谱 GLM-4.7 API 成语验证
// 职责：① 判断是否是成语  ② 返回首字/末字拼音 + 汉字
// 接龙规则：输入成语首字 与 上一成语末字，同字 OR 同音（拼音相同）均合法

const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const ZHIPU_API_KEY = '9a12795be07841c1a347fd3e63c7e06d.RpzMSBp0BDymefhh';
const MODEL = 'glm-4';

export interface ValidateResult {
  isIdiom: boolean;       // 是否是合法中文成语
  firstChar: string;      // 首字汉字
  firstPinyin: string;    // 首字拼音（不含声调，如 "ma"）
  lastChar: string;       // 末字汉字
  lastPinyin: string;     // 末字拼音（不含声调）
  text: string;           // 原始输入
}

// 简单缓存，避免重复请求相同成语
const cache = new Map<string, ValidateResult>();

export async function validateIdiomWithAI(text: string): Promise<ValidateResult> {
  const trimmed = text.trim();

  // 命中缓存
  if (cache.has(trimmed)) {
    return cache.get(trimmed)!;
  }

  // 基础格式检测：必须是 2-8 个汉字
  if (!trimmed || !/^[\u4e00-\u9fa5]{2,8}$/.test(trimmed)) {
    return { isIdiom: false, firstChar: '', firstPinyin: '', lastChar: '', lastPinyin: '', text: trimmed };
  }

  const firstCh = trimmed[0];
  const lastCh  = trimmed[trimmed.length - 1];

  const prompt = `你是成语词典，判断"${trimmed}"是否是中文成语，给出首字"${firstCh}"和末字"${lastCh}"的拼音（不含声调）。

只输出JSON，格式如下，不要有其他文字：
{"isIdiom":true,"firstPinyin":"shui","lastPinyin":"liu"}

要求：
- isIdiom：是中文成语（含四字及少数三字/五字成语）为true，否则false
- firstPinyin / lastPinyin：汉语拼音全小写不含声调
- 多音字取该成语中的实际读音`;

  try {
    const resp = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 60,
        stream: false,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`API ${resp.status}: ${errText.slice(0, 120)}`);
    }

    const data = await resp.json();
    const content: string = data.choices?.[0]?.message?.content ?? '';

    // 提取 JSON（容错：允许 markdown 代码块包裹）
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error(`no json in: ${content.slice(0, 80)}`);

    const parsed = JSON.parse(jsonMatch[0]) as {
      isIdiom: boolean;
      firstPinyin: string;
      lastPinyin: string;
    };

    const result: ValidateResult = {
      isIdiom:     Boolean(parsed.isIdiom),
      firstChar:   firstCh,
      firstPinyin: (parsed.firstPinyin ?? '').toLowerCase().trim(),
      lastChar:    lastCh,
      lastPinyin:  (parsed.lastPinyin  ?? '').toLowerCase().trim(),
      text:        trimmed,
    };

    cache.set(trimmed, result);
    return result;

  } catch (err) {
    console.warn('[ZhipuAPI] 验证失败，降级到本地词库', err);
    throw err;
  }
}

/**
 * 检查接龙是否有效
 * 规则：输入成语的首字 与 上一成语的末字，满足以下任一条件即通过：
 *   1. 同字  — 两个汉字完全相同
 *   2. 同音  — 拼音（不含声调）完全相同
 */
export function isValidChainAI(
  inputFirst: { char: string; pinyin: string },
  prevLast:   { char: string; pinyin: string },
): boolean {
  // 同字
  if (inputFirst.char && prevLast.char && inputFirst.char === prevLast.char) return true;
  // 同音
  if (inputFirst.pinyin && prevLast.pinyin &&
      inputFirst.pinyin.toLowerCase() === prevLast.pinyin.toLowerCase()) return true;
  return false;
}
