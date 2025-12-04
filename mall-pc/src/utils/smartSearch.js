/**
 * AI智能搜索工具
 * 基于localStorage实现的智能搜索,支持同义词、规格提取、模糊匹配
 */

// 同义词词典
const synonymDict = {
  '电脑': ['计算机', 'PC', '主机', 'Computer'],
  '手机': ['移动电话', '智能机', 'phone', '移动电话'],
  '笔记本': ['笔记本电脑', '便携电脑', 'Laptop', 'notebook'],
  '不锈钢': ['304', '316', '不锈钢材', 'stainless'],
  '管': ['管子', '管材', '钢管', 'pipe', 'tube'],
  '板': ['板材', '钢板', 'plate', 'sheet'],
  '螺栓': ['螺丝', 'bolt', '螺钉'],
  '电缆': ['线缆', '电线', 'cable', 'wire'],
  // 显示器相关
  '显示器': ['屏幕', 'monitor', '显示屏', 'display'],
  '2K': ['2560×1440', 'QHD', '2k分辨率'],
  '4K': ['3840×2160', 'UHD', '4k分辨率', '超高清'],
  '高刷': ['高刷新率', '144Hz', '165Hz', '电竞屏'],
  '带鱼屏': ['超宽屏', '21:9', '曲面屏']
};

// 组合词匹配 - 需要同时包含两个词才匹配
const combinedKeywords = {
  '办公显示器': ['商用显示器', '企业显示器', 'office monitor', '办公屏'],
  '游戏显示器': ['电竞显示器', 'gaming monitor', '游戏屏', '电竞屏'],
  '设计显示器': ['专业设计', '设计屏', 'design monitor']
};

// 单位换算表
const unitConversion = {
  '公分': (value) => value * 10, // 转为mm
  '厘米': (value) => value * 10,
  'cm': (value) => value * 10,
  '米': (value) => value * 1000,
  'm': (value) => value * 1000,
  '英寸': (value) => value * 25.4,
  'inch': (value) => value * 25.4
};

/**
 * 智能搜索主函数
 * @param {string} keyword - 用户输入的关键词
 * @param {Array} products - 商品列表
 * @returns {Array} 排序后的搜索结果
 */
export function smartSearch(keyword, products) {
  if (!keyword || !products || products.length === 0) {
    return products || [];
  }

  // 1. 扩展同义词
  const expandedKeywords = expandSynonyms(keyword);

  // 2. 提取规格参数
  const specs = extractSpecs(keyword);

  // 3. 搜索匹配
  const results = products
    .map(product => {
      const score = calculateMatchScore(product, expandedKeywords, specs);
      return {
        ...product,
        matchScore: score,
        matchReasons: [] // 可以添加匹配原因说明
      };
    })
    .filter(item => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  console.log(`智能搜索: "${keyword}" 找到 ${results.length} 个结果`);

  return results;
}

/**
 * 扩展同义词
 */
function expandSynonyms(keyword) {
  const words = new Set([keyword.toLowerCase()]);
  const keywordLower = keyword.toLowerCase();

  // 1. 优先检查组合关键词(如"办公显示器"、"游戏显示器")
  // 这样可以避免"办公"这样的泛词匹配到文具等其他品类
  let matchedCombined = false;
  Object.entries(combinedKeywords).forEach(([key, synonyms]) => {
    const keyLower = key.toLowerCase();
    // 检查是否包含完整的组合关键词
    if (keywordLower.includes(keyLower)) {
      matchedCombined = true;
      words.add(keyLower);
      synonyms.forEach(syn => words.add(syn.toLowerCase()));
      // 也添加组合词的各个部分,以支持部分匹配
      keyLower.split(/[\s]+/).forEach(part => words.add(part));
    }
  });

  // 如果已经匹配到组合关键词,不再进行泛化的同义词扩展
  // 这样"办公显示器"只会匹配显示器相关的同义词,不会匹配到文具
  if (matchedCombined) {
    // 仍然需要对"显示器"、"2K"、"4K"等专有名词进行同义词扩展
    Object.entries(synonymDict).forEach(([key, synonyms]) => {
      if (keywordLower.includes(key.toLowerCase())) {
        synonyms.forEach(syn => words.add(syn.toLowerCase()));
        words.add(key.toLowerCase());
      }
    });
    return Array.from(words);
  }

  // 2. 如果没有匹配组合关键词,进行常规同义词扩展
  const tokens = keywordLower.split(/[\s,，、]+/);

  tokens.forEach(token => {
    words.add(token);

    // 查找同义词
    Object.entries(synonymDict).forEach(([key, synonyms]) => {
      if (token.includes(key.toLowerCase()) || key.toLowerCase().includes(token)) {
        synonyms.forEach(syn => words.add(syn.toLowerCase()));
        words.add(key.toLowerCase());
      }

      // 反向查找
      synonyms.forEach(syn => {
        if (token.includes(syn.toLowerCase())) {
          words.add(key.toLowerCase());
          synonyms.forEach(s => words.add(s.toLowerCase()));
        }
      });
    });
  });

  return Array.from(words);
}

/**
 * 提取规格参数
 */
function extractSpecs(keyword) {
  const specs = {};

  // 提取数字+单位的模式
  const patterns = [
    // 直径: Φ50, 直径50mm, 50毫米等
    { regex: /[Φφ直径外径内径]?\s*(\d+\.?\d*)\s*(公分|厘米|毫米|mm|cm)?/gi, type: 'diameter' },
    // 厚度: 2mm, 厚度2毫米等
    { regex: /厚度?壁厚?\s*(\d+\.?\d*)\s*(毫米|mm)?/gi, type: 'thickness' },
    // 长度: 1米, 长度1000mm等
    { regex: /长度?\s*(\d+\.?\d*)\s*(米|毫米|mm|m)?/gi, type: 'length' },
    // 显示器尺寸: 27英寸, 27寸, 27"
    { regex: /(\d+\.?\d*)\s*(英寸|寸|"|inch)/gi, type: 'screenSize' },
    // 刷新率: 144Hz, 144赫兹
    { regex: /(\d+)\s*(hz|赫兹|刷新率)/gi, type: 'refreshRate' },
    // 分辨率: 2560×1440, 1920*1080
    { regex: /(\d+)\s*[×x*]\s*(\d+)/gi, type: 'resolution' }
  ];

  patterns.forEach(({ regex, type }) => {
    const matches = [...keyword.matchAll(regex)];
    if (matches.length > 0) {
      const match = matches[0];

      if (type === 'resolution') {
        // 分辨率特殊处理
        specs[type] = `${match[1]}×${match[2]}`;
      } else if (type === 'screenSize' || type === 'refreshRate') {
        // 显示器尺寸和刷新率直接使用数字
        specs[type] = parseFloat(match[1]);
      } else {
        const value = parseFloat(match[1]);
        const unit = match[2] || 'mm';
        // 单位换算,统一为mm
        const converter = unitConversion[unit];
        specs[type] = converter ? converter(value) : value;
      }
    }
  });

  return specs;
}

/**
 * 计算匹配分数
 */
function calculateMatchScore(product, keywords, specs) {
  let score = 0;
  const productName = (product.name || '').toLowerCase();
  const productDesc = (product.description || '').toLowerCase();
  const productSpecs = product.specs || {};

  // 1. 关键词匹配 (最高50分)
  keywords.forEach(keyword => {
    if (productName.includes(keyword)) {
      score += 15; // 商品名匹配
    }
    if (productDesc.includes(keyword)) {
      score += 5; // 描述匹配
    }

    // 品牌匹配
    if (product.brand && product.brand.toLowerCase().includes(keyword)) {
      score += 10;
    }
  });

  // 2. 规格精确匹配 (最高30分)
  // 钢材管材规格
  if (specs.diameter && productSpecs.diameter) {
    const diff = Math.abs(specs.diameter - productSpecs.diameter);
    const tolerance = specs.diameter * 0.1; // 10%误差
    if (diff === 0) {
      score += 30; // 完全匹配
    } else if (diff <= tolerance) {
      score += 20; // 在误差范围内
    }
  }

  if (specs.thickness && productSpecs.thickness) {
    const diff = Math.abs(specs.thickness - productSpecs.thickness);
    if (diff === 0) score += 20;
    else if (diff <= 1) score += 10;
  }

  // 显示器规格
  if (specs.screenSize && productSpecs.size) {
    const diff = Math.abs(specs.screenSize - productSpecs.size);
    if (diff === 0) {
      score += 30; // 尺寸完全匹配
    } else if (diff <= 1) {
      score += 20; // 尺寸接近(±1英寸)
    }
  }

  if (specs.refreshRate && productSpecs.refreshRate) {
    if (specs.refreshRate === productSpecs.refreshRate) {
      score += 25; // 刷新率完全匹配
    } else if (Math.abs(specs.refreshRate - productSpecs.refreshRate) <= 20) {
      score += 15; // 刷新率接近
    }
  }

  if (specs.resolution && productSpecs.resolution) {
    if (productSpecs.resolution.includes(specs.resolution)) {
      score += 25; // 分辨率匹配
    }
  }

  // 场景匹配(显示器) - 根据场景关键词匹配specs.scene
  if (productSpecs.scene) {
    const sceneLower = productSpecs.scene.toLowerCase();
    keywords.forEach(keyword => {
      // 游戏/电竞显示器匹配
      if ((keyword.includes('游戏') || keyword.includes('电竞') || keyword.includes('gaming')) &&
          sceneLower === '游戏') {
        score += 20; // 场景匹配加分
        // 游戏显示器通常需要高刷新率,如果有144Hz+则额外加分
        if (productSpecs.refreshRate >= 144) {
          score += 15;
        }
      }
      // 办公显示器匹配
      if ((keyword.includes('办公') || keyword.includes('商用') || keyword.includes('企业') || keyword.includes('office')) &&
          sceneLower === '办公') {
        score += 20;
      }
      // 设计显示器匹配
      if ((keyword.includes('设计') || keyword.includes('专业') || keyword.includes('design')) &&
          sceneLower === '设计') {
        score += 20;
        // 设计显示器通常需要高分辨率
        if (productSpecs.resolution && (productSpecs.resolution.includes('2560') || productSpecs.resolution.includes('3840'))) {
          score += 10;
        }
      }
    });
  }

  // 3. 分类匹配 (最高10分)
  if (product.categoryName) {
    keywords.forEach(keyword => {
      if (product.categoryName.toLowerCase().includes(keyword)) {
        score += 10;
      }
    });
  }

  // 4. 热度加权 (最高10分)
  if (product.sales) {
    score += Math.min(product.sales / 100, 10);
  }

  return Math.round(score);
}

/**
 * 生成搜索建议
 */
export function generateSearchSuggestions(keyword) {
  if (!keyword || keyword.length < 2) {
    return [];
  }

  // 热门搜索词库
  const hotSearches = [
    '27英寸显示器',
    '2K 144Hz显示器',
    '4K显示器',
    '带鱼屏显示器',
    '华为手机',
    '小米笔记本',
    '戴尔电脑',
    '不锈钢管 Φ50mm',
    '304不锈钢板 2mm',
    '电脑办公桌'
  ];

  // 从localStorage读取历史搜索
  const searchHistory = JSON.parse(localStorage.getItem('search_history') || '[]');

  // 合并热门和历史
  const allSuggestions = [...new Set([...searchHistory, ...hotSearches])];

  // 过滤匹配的建议
  const matched = allSuggestions.filter(item =>
    item.toLowerCase().includes(keyword.toLowerCase())
  );

  return matched.slice(0, 8);
}

/**
 * 保存搜索历史
 */
export function saveSearchHistory(keyword) {
  if (!keyword || keyword.trim().length === 0) return;

  const history = JSON.parse(localStorage.getItem('search_history') || '[]');

  // 去重,最近的放前面
  const newHistory = [keyword, ...history.filter(item => item !== keyword)];

  // 只保留最近20条
  const trimmedHistory = newHistory.slice(0, 20);

  localStorage.setItem('search_history', JSON.stringify(trimmedHistory));
}

/**
 * 清除搜索历史
 */
export function clearSearchHistory() {
  localStorage.removeItem('search_history');
}

/**
 * 获取搜索洞察(显示给用户的提示信息)
 */
export function getSearchInsights(keyword, results) {
  const insights = [];

  // 同义词提示
  Object.entries(synonymDict).forEach(([key, synonyms]) => {
    if (keyword.toLowerCase().includes(key.toLowerCase())) {
      insights.push(`🔍 已自动包含 "${synonyms.slice(0, 2).join('、')}" 等相关结果`);
    }
  });

  // 规格识别提示
  const specs = extractSpecs(keyword);
  if (specs.diameter) {
    insights.push(`📏 识别到直径: ${specs.diameter}mm`);
  }
  if (specs.thickness) {
    insights.push(`📏 识别到厚度: ${specs.thickness}mm`);
  }

  // 结果数量提示
  if (results.length === 0) {
    insights.push('💡 试试使用更通用的关键词');
  } else if (results.length > 100) {
    insights.push('💡 建议使用更精确的关键词缩小范围');
  }

  return insights;
}
