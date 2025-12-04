/**
 * 丰富的B2B商品Mock数据
 * 模拟京东企业购的真实商品数据
 * 覆盖多个品类,用于充分展示AI智能搜索功能
 */

// 品牌数据
export const brands = [
  // 电脑办公
  { id: 1, name: '联想', keywords: ['lenovo', 'Lenovo', '联想电脑', 'ThinkPad'] },
  { id: 2, name: '戴尔', keywords: ['Dell', 'dell', '戴尔电脑'] },
  { id: 3, name: '惠普', keywords: ['HP', 'hp', '惠普电脑'] },
  { id: 4, name: '华硕', keywords: ['ASUS', 'asus', '华硕电脑'] },
  { id: 5, name: '宏碁', keywords: ['Acer', 'acer', '宏碁电脑'] },

  // 手机数码
  { id: 6, name: '华为', keywords: ['Huawei', 'huawei', '华为手机', 'HUAWEI'] },
  { id: 7, name: '小米', keywords: ['Xiaomi', 'xiaomi', 'MI', '小米手机'] },
  { id: 8, name: 'Apple', keywords: ['苹果', 'iPhone', 'iPad', 'MacBook'] },
  { id: 9, name: '三星', keywords: ['Samsung', 'samsung', '三星手机'] },
  { id: 10, name: 'OPPO', keywords: ['oppo', 'OPPO手机'] },

  // 办公设备
  { id: 11, name: '得力', keywords: ['Deli', 'deli', '得力文具'] },
  { id: 12, name: '晨光', keywords: ['M&G', '晨光文具'] },
  { id: 13, name: '齐心', keywords: ['Comix', 'comix', '齐心办公'] },

  // 工业品牌
  { id: 14, name: '3M', keywords: ['3m', '3M公司'] },
  { id: 15, name: '史丹利', keywords: ['Stanley', 'stanley', '史丹利工具'] },
  { id: 16, name: '博世', keywords: ['Bosch', 'bosch', '博世工具'] },
  { id: 17, name: '世达', keywords: ['SATA', 'sata', '世达工具'] },

  // 钢材品牌
  { id: 18, name: '宝钢', keywords: ['Baosteel', '宝钢集团'] },
  { id: 19, name: '鞍钢', keywords: ['Ansteel', '鞍钢集团'] },
  { id: 20, name: '首钢', keywords: ['Shougang', '首钢集团'] }
]

// 商品分类
export const categories = [
  { id: 1, name: '电脑整机', parentName: '电脑办公' },
  { id: 2, name: '电脑配件', parentName: '电脑办公' },
  { id: 3, name: '办公设备', parentName: '电脑办公' },
  { id: 4, name: '手机通讯', parentName: '手机数码' },
  { id: 5, name: '办公文具', parentName: '办公用品' },
  { id: 6, name: '五金工具', parentName: '工业品' },
  { id: 7, name: '钢材管材', parentName: '工业品' },
  { id: 8, name: '劳保用品', parentName: '工业品' }
]

// 生成丰富的商品数据
export function generateRichMockProducts() {
  const products = []

  // 1. 电脑整机 (100个)
  const computerBrands = brands.slice(0, 5)
  const computerSpecs = [
    { cpu: 'i5-13500', memory: '8GB', storage: '512GB SSD', price: 4299 },
    { cpu: 'i5-13500', memory: '16GB', storage: '512GB SSD', price: 4799 },
    { cpu: 'i7-13700', memory: '16GB', storage: '1TB SSD', price: 6299 },
    { cpu: 'i7-13700', memory: '32GB', storage: '1TB SSD', price: 7299 },
    { cpu: 'i9-13900', memory: '32GB', storage: '2TB SSD', price: 9999 }
  ]

  computerBrands.forEach((brand, bi) => {
    computerSpecs.forEach((spec, si) => {
      const id = 10000 + bi * 20 + si
      products.push({
        id,
        name: `${brand.name} 商用台式电脑主机 ${spec.cpu} ${spec.memory} ${spec.storage}`,
        subTitle: '企业批量采购 3年质保 上门服务',
        price: Math.round(spec.price * (0.95 + Math.random() * 0.1)),
        originalPrice: spec.price + 500,
        pic: `https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&h=400&fit=crop`,
        sale: Math.floor(Math.random() * 5000) + 500,
        stock: Math.floor(Math.random() * 200) + 50,
        commentCount: Math.floor(Math.random() * 2000) + 200,
        brandId: brand.id,
        brandName: brand.name,
        productCategoryId: 1,
        categoryName: '电脑整机',
        keywords: `${brand.keywords.join(' ')} 电脑 计算机 PC 主机 台式机 ${spec.cpu} ${spec.memory} ${spec.storage}`,
        specs: { cpu: spec.cpu, memory: spec.memory, storage: spec.storage },
        newStatus: Math.random() > 0.8 ? 1 : 0,
        recommendStatus: Math.random() > 0.6 ? 1 : 0,
        createTime: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      })

      // 笔记本
      products.push({
        id: id + 10000,
        name: `${brand.name} 商用笔记本电脑 ${spec.cpu} ${spec.memory} ${spec.storage} 14英寸`,
        subTitle: '轻薄便携 长续航 企业采购优选',
        price: Math.round(spec.price * 1.1 * (0.95 + Math.random() * 0.1)),
        originalPrice: Math.round(spec.price * 1.1) + 800,
        pic: `https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop`,
        sale: Math.floor(Math.random() * 8000) + 1000,
        stock: Math.floor(Math.random() * 300) + 100,
        commentCount: Math.floor(Math.random() * 3000) + 500,
        brandId: brand.id,
        brandName: brand.name,
        productCategoryId: 1,
        categoryName: '电脑整机',
        keywords: `${brand.keywords.join(' ')} 笔记本 笔记本电脑 laptop notebook ${spec.cpu} ${spec.memory} ${spec.storage}`,
        specs: { cpu: spec.cpu, memory: spec.memory, storage: spec.storage, screen: '14英寸' },
        newStatus: Math.random() > 0.8 ? 1 : 0,
        recommendStatus: Math.random() > 0.6 ? 1 : 0,
        createTime: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      })
    })
  })

  // 2. 手机通讯 (80个)
  const phoneBrands = brands.slice(5, 10)
  const phoneSpecs = [
    { memory: '8GB', storage: '128GB', price: 2499 },
    { memory: '8GB', storage: '256GB', price: 2799 },
    { memory: '12GB', storage: '256GB', price: 3299 },
    { memory: '12GB', storage: '512GB', price: 3799 },
    { memory: '16GB', storage: '512GB', price: 4499 }
  ]

  phoneBrands.forEach((brand, bi) => {
    phoneSpecs.forEach((spec, si) => {
      const id = 30000 + bi * 16 + si
      products.push({
        id,
        name: `${brand.name} 5G手机 ${spec.memory}+${spec.storage} 企业定制版`,
        subTitle: '5G全网通 双卡双待 超长续航',
        price: Math.round(spec.price * (0.92 + Math.random() * 0.08)),
        originalPrice: spec.price + 300,
        pic: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop`,
        sale: Math.floor(Math.random() * 15000) + 2000,
        stock: Math.floor(Math.random() * 500) + 100,
        commentCount: Math.floor(Math.random() * 5000) + 1000,
        brandId: brand.id,
        brandName: brand.name,
        productCategoryId: 4,
        categoryName: '手机通讯',
        keywords: `${brand.keywords.join(' ')} 手机 智能手机 phone mobile 5G ${spec.memory} ${spec.storage}`,
        specs: { memory: spec.memory, storage: spec.storage, network: '5G' },
        newStatus: Math.random() > 0.7 ? 1 : 0,
        recommendStatus: Math.random() > 0.5 ? 1 : 0,
        createTime: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      })
    })
  })

  // 3. 办公文具 (100个)
  const stationeryBrands = brands.slice(10, 13)
  const stationeryItems = [
    { name: '中性笔', unit: '支', price: 1.5, minOrder: 100 },
    { name: '笔记本', unit: '本', price: 8, minOrder: 50 },
    { name: '文件夹', unit: '个', price: 3.5, minOrder: 50 },
    { name: '订书机', unit: '个', price: 15, minOrder: 20 },
    { name: '胶水', unit: '瓶', price: 3, minOrder: 100 },
    { name: '便签纸', unit: '本', price: 5, minOrder: 100 },
    { name: '马克笔', unit: '支', price: 2.5, minOrder: 50 },
    { name: '文件袋', unit: '个', price: 2, minOrder: 100 }
  ]

  stationeryBrands.forEach((brand, bi) => {
    stationeryItems.forEach((item, ii) => {
      const id = 50000 + bi * 100 + ii * 10
      for (let i = 0; i < 3; i++) {
        products.push({
          id: id + i,
          name: `${brand.name} ${item.name} 办公文具 ${item.minOrder}${item.unit}/盒起批`,
          subTitle: `企业采购专享 批量优惠 ${item.minOrder}${item.unit}起订`,
          price: item.price * item.minOrder * (0.9 + i * 0.1),
          originalPrice: item.price * item.minOrder * 1.2,
          pic: `https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=400&fit=crop`,
          sale: Math.floor(Math.random() * 10000) + 1000,
          stock: Math.floor(Math.random() * 1000) + 500,
          commentCount: Math.floor(Math.random() * 3000) + 500,
          brandId: brand.id,
          brandName: brand.name,
          productCategoryId: 5,
          categoryName: '办公文具',
          keywords: `${brand.keywords.join(' ')} ${item.name} 文具 办公用品 批发`,
          specs: { unit: item.unit, minOrder: item.minOrder },
          newStatus: Math.random() > 0.9 ? 1 : 0,
          recommendStatus: Math.random() > 0.7 ? 1 : 0,
          createTime: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
        })
      }
    })
  })

  // 4. 五金工具 (80个)
  const toolBrands = brands.slice(13, 17)
  const toolItems = [
    { name: '扳手套装', specs: '8-24mm', price: 68 },
    { name: '螺丝刀套装', specs: '30件套', price: 45 },
    { name: '电钻', specs: '500W', power: '500W', price: 199 },
    { name: '角磨机', specs: '800W 125mm', power: '800W', diameter: '125mm', price: 158 },
    { name: '电锤', specs: '1200W', power: '1200W', price: 388 },
    { name: '切割机', specs: '2000W 355mm', power: '2000W', diameter: '355mm', price: 456 },
    { name: '卷尺', specs: '5米', length: '5m', price: 12 },
    { name: '水平尺', specs: '60cm', length: '60cm', price: 25 }
  ]

  toolBrands.forEach((brand, bi) => {
    toolItems.forEach((item, ii) => {
      const id = 60000 + bi * 100 + ii * 10
      for (let i = 0; i < 2; i++) {
        const specs = item.specs || ''
        products.push({
          id: id + i,
          name: `${brand.name} ${item.name} ${specs} 工业级`,
          subTitle: '企业采购 质保2年 批量优惠',
          price: Math.round(item.price * (1 + i * 0.15) * (0.95 + Math.random() * 0.1)),
          originalPrice: Math.round(item.price * (1 + i * 0.15) * 1.3),
          pic: `https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&h=400&fit=crop`,
          sale: Math.floor(Math.random() * 3000) + 300,
          stock: Math.floor(Math.random() * 500) + 100,
          commentCount: Math.floor(Math.random() * 1000) + 200,
          brandId: brand.id,
          brandName: brand.name,
          productCategoryId: 6,
          categoryName: '五金工具',
          keywords: `${brand.keywords.join(' ')} ${item.name} 工具 五金 ${specs}`,
          specs: {
            power: item.power,
            diameter: item.diameter,
            length: item.length
          },
          newStatus: Math.random() > 0.85 ? 1 : 0,
          recommendStatus: Math.random() > 0.6 ? 1 : 0,
          createTime: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000).toISOString()
        })
      }
    })
  })

  // 5. 钢材管材 (120个) - 重点展示规格搜索
  const steelBrands = brands.slice(17, 20)
  const steelTypes = [
    { type: '不锈钢管', material: '304不锈钢' },
    { type: '不锈钢管', material: '316不锈钢' },
    { type: '无缝钢管', material: 'Q235' },
    { type: '镀锌钢管', material: 'Q235镀锌' }
  ]

  // 各种直径和壁厚规格
  const pipeDiameters = [20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 160, 200] // mm
  const pipeThickness = [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0] // mm

  steelBrands.forEach((brand, bi) => {
    steelTypes.forEach((steel, si) => {
      // 每种钢材选择部分规格组合
      for (let di = 0; di < 6; di++) {
        const diameter = pipeDiameters[di + si * 2]
        const thickness = pipeThickness[di % pipeThickness.length]
        const length = 6 // 米

        // 计算价格 (基于重量)
        const weight = ((diameter - thickness) * thickness * 0.02466 * length).toFixed(2) // kg/根
        const pricePerKg = steel.material.includes('304') ? 18 :
                          steel.material.includes('316') ? 25 :
                          steel.material.includes('镀锌') ? 6 : 5
        const price = Math.round(weight * pricePerKg)

        const id = 70000 + bi * 500 + si * 100 + di * 10

        products.push({
          id,
          name: `${brand.name} ${steel.type} ${steel.material} Φ${diameter}mm×${thickness}mm×${length}m`,
          subTitle: `国标材质 ${weight}kg/根 可定制长度`,
          price: price,
          originalPrice: Math.round(price * 1.25),
          pic: `https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&h=400&fit=crop`,
          sale: Math.floor(Math.random() * 5000) + 500,
          stock: Math.floor(Math.random() * 10000) + 1000,
          commentCount: Math.floor(Math.random() * 1000) + 100,
          brandId: brand.id,
          brandName: brand.name,
          productCategoryId: 7,
          categoryName: '钢材管材',
          keywords: `${brand.keywords.join(' ')} ${steel.type} ${steel.material} 钢管 管材 pipe tube Φ${diameter} ${diameter}mm ${thickness}mm ${length}米`,
          specs: {
            material: steel.material,
            diameter: diameter,
            diameterUnit: 'mm',
            thickness: thickness,
            thicknessUnit: 'mm',
            length: length,
            lengthUnit: 'm',
            weight: weight,
            weightUnit: 'kg'
          },
          newStatus: Math.random() > 0.9 ? 1 : 0,
          recommendStatus: Math.random() > 0.7 ? 1 : 0,
          createTime: new Date(Date.now() - Math.random() * 150 * 24 * 60 * 60 * 1000).toISOString()
        })

        // 添加一些常用的规格变体(长度不同)
        if (di < 3) {
          const length2 = 4 // 4米规格
          const weight2 = ((diameter - thickness) * thickness * 0.02466 * length2).toFixed(2)
          const price2 = Math.round(weight2 * pricePerKg)

          products.push({
            id: id + 50000,
            name: `${brand.name} ${steel.type} ${steel.material} Φ${diameter}mm×${thickness}mm×${length2}m`,
            subTitle: `国标材质 ${weight2}kg/根 短尺寸规格`,
            price: price2,
            originalPrice: Math.round(price2 * 1.25),
            pic: `https://images.unsplash.com/photo-1513828583688-c52646db42da?w=400&h=400&fit=crop`,
            sale: Math.floor(Math.random() * 3000) + 300,
            stock: Math.floor(Math.random() * 8000) + 800,
            commentCount: Math.floor(Math.random() * 800) + 80,
            brandId: brand.id,
            brandName: brand.name,
            productCategoryId: 7,
            categoryName: '钢材管材',
            keywords: `${brand.keywords.join(' ')} ${steel.type} ${steel.material} 钢管 管材 pipe tube Φ${diameter} ${diameter}mm ${thickness}mm ${length2}米`,
            specs: {
              material: steel.material,
              diameter: diameter,
              diameterUnit: 'mm',
              thickness: thickness,
              thicknessUnit: 'mm',
              length: length2,
              lengthUnit: 'm',
              weight: weight2,
              weightUnit: 'kg'
            },
            newStatus: Math.random() > 0.9 ? 1 : 0,
            recommendStatus: Math.random() > 0.7 ? 1 : 0,
            createTime: new Date(Date.now() - Math.random() * 150 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }
    })
  })

  // 6. 劳保用品 (60个)
  const safetyItems = [
    { name: '安全帽', price: 15 },
    { name: '防护手套', price: 8 },
    { name: '防护眼镜', price: 12 },
    { name: '口罩', price: 2 },
    { name: '防护服', price: 45 },
    { name: '安全鞋', price: 88 },
    { name: '耳塞', price: 1.5 },
    { name: '反光背心', price: 18 }
  ]

  safetyItems.forEach((item, ii) => {
    for (let i = 0; i < 8; i++) {
      const id = 80000 + ii * 100 + i * 10
      products.push({
        id,
        name: `${item.name} 工业级防护用品 企业批量采购`,
        subTitle: '符合国家标准 质量保证 批发优惠',
        price: Math.round(item.price * (1 + i * 0.08) * 10) / 10,
        originalPrice: Math.round(item.price * (1 + i * 0.08) * 1.4),
        pic: `https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop`,
        sale: Math.floor(Math.random() * 8000) + 1000,
        stock: Math.floor(Math.random() * 5000) + 1000,
        commentCount: Math.floor(Math.random() * 2000) + 300,
        brandId: 14,
        brandName: '3M',
        productCategoryId: 8,
        categoryName: '劳保用品',
        keywords: `${item.name} 劳保 防护 安全 用品`,
        specs: {},
        newStatus: Math.random() > 0.85 ? 1 : 0,
        recommendStatus: Math.random() > 0.6 ? 1 : 0,
        createTime: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
      })
    }
  })

  console.log(`✅ 生成了 ${products.length} 个丰富的B2B商品数据`)

  return products
}

// 导出生成函数
export default generateRichMockProducts
