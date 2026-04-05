<script setup lang="ts">
// --- 路由與視圖狀態 ---
const currentRoute = ref('dashboard')
const activeSub = ref<string | null>(null)

// --- 配置數據：選單結構 ---
// 這裡採用您提供的完整結構，並映射至 UNavigationMenu 所需的格式
const MENU_STRUCTURE = [
  { id: 'dashboard', label: '儀表板 Dashboard', icon: 'i-lucide-home' },
  {
    id: 'orders', label: '訂單管理 Orders', icon: 'i-lucide-package',
    sub: [
      { id: 'sales-orders', label: '客戶訂單 Sales Orders' },
      { id: 'forecast', label: '預測訂單 Forecast' },
      { id: 'priority', label: '訂單優先級 Priority' },
      { id: 'rush-orders', label: '插單 / 急單 Rush Orders' }
    ]
  },
  {
    id: 'work-orders', label: '工單管理 Work Orders', icon: 'i-lucide-factory',
    sub: [
      { id: 'wo-create', label: '工單建立 Create' },
      { id: 'wo-split', label: '工單拆分 Split' },
      { id: 'wo-merge', label: '工單合併 Merge' },
      { id: 'wo-status', label: '工單狀態 Status' }
    ]
  },
  {
    id: 'master-data', label: '主資料管理 Master Data', icon: 'i-lucide-database',
    sub: [
      { id: 'product', label: '商品 Product' },
      { id: 'bom', label: '物料表 BOM' },
      { id: 'routing', label: '製程 Routing' },
      { id: 'machine', label: '機台 Machine' },
      { id: 'calendar', label: '行事曆 Calendar' },
      { id: 'skill', label: '技能 Skill' }
    ]
  },
  {
    id: 'scheduling', label: '排程中心 Scheduling', icon: 'i-lucide-cpu',
    sub: [
      { id: 'run-schedule', label: '排程運算 Run' },
      { id: 'rules', label: '排程規則 Rules' },
      { id: 'results', label: '排程結果 Results' },
      { id: 'reschedule', label: '重排 Reschedule' }
    ]
  },
  {
    id: 'gantt-board', label: '排程看板 Gantt Board', icon: 'i-lucide-bar-chart-3',
    sub: [
      { id: 'gantt-chart', label: '甘特圖 Gantt Chart' },
      { id: 'load-chart', label: '負載圖 Load Chart' },
      { id: 'bottleneck', label: '瓶頸分析 Bottleneck' }
    ]
  },
  { id: 'execution', label: '現場執行 Execution (MES)', icon: 'i-lucide-smartphone' },
  { id: 'exception', label: '異常管理 Exception', icon: 'i-lucide-alert-triangle' },
  { id: 'settings', label: '系統設定 Settings', icon: 'i-lucide-settings' }
]

// 將原始結構轉換為 UNavigationMenu 格式
const navItems = computed(() => {
  return [
    // 第一組：首頁
    MENU_STRUCTURE.slice(0, 1).map(item => ({
      label: item.label,
      icon: item.icon,
      active: currentRoute.value === item.id,
      onSelect: () => {
        currentRoute.value = item.id
        activeSub.value = null
      }
    })),
    // 第二組：核心業務
    MENU_STRUCTURE.slice(1, 6).map(item => ({
      label: item.label,
      icon: item.icon,
      active: currentRoute.value === item.id,
      children: item.sub?.map(sub => ({
        label: sub.label,
        active: activeSub.value === sub.id,
        onSelect: () => {
          currentRoute.value = item.id
          activeSub.value = sub.id
        }
      })),
      onSelect: () => {
        if (!item.sub) {
          currentRoute.value = item.id
          activeSub.value = null
        }
      }
    })),
    // 第三組：運作與設定
    MENU_STRUCTURE.slice(6).map(item => ({
      label: item.label,
      icon: item.icon,
      active: currentRoute.value === item.id,
      onSelect: () => {
        currentRoute.value = item.id
        activeSub.value = null
      }
    }))
  ]
})
</script>

<template>
  <div class="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
    <!-- --- Sidebar --- -->
    <aside class="w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20">
      <div class="p-6 border-b border-slate-100 flex items-center gap-3">
        <div class="bg-blue-600 w-10 h-10 p-2 text-center rounded-lg text-white flex items-center justify-center">
          <UIcon
            name="i-lucide-cpu"
            class="w-6 h-6"
          />
        </div>
        <span class="text-xl font-black tracking-tight text-slate-800 uppercase">APS-DEMO</span>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        <!-- 使用 Nuxt UI 官方導航組件實作層級選單 -->
        <UNavigationMenu
          :items="navItems"
          orientation="vertical"
          class="w-full"
        />
      </nav>

      <div class="p-4 border-t border-slate-100">
        <UButton
          icon="i-lucide-log-out"
          label="登出系統"
          variant="ghost"
          color="neutral"
          block
          size="sm"
          class="text-slate-400"
        />
        <div class="mt-4 text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">
          © Copyright 2026 APS Advanced
        </div>
      </div>
    </aside>

    <!-- --- Main Content --- -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
        <div class="flex items-center gap-2 text-sm text-slate-400">
          <UIcon
            name="i-lucide-home"
            class="w-4 h-4"
          />
          <UIcon
            name="i-lucide-chevron-right"
            class="w-4 h-4"
          />
          <span class="text-slate-500 uppercase tracking-wider font-medium">{{ currentRoute.replace('-', ' ') }}</span>
          <template v-if="activeSub">
            <UIcon
              name="i-lucide-chevron-right"
              class="w-4 h-4"
            />
            <span class="text-slate-900 uppercase tracking-wider font-bold">{{ activeSub.replace('-', ' ') }}</span>
          </template>
        </div>

        <div class="flex items-center gap-6">
          <div class="relative hidden lg:block">
            <UIcon
              name="i-lucide-search"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
            />
            <input
              type="text"
              placeholder="搜尋..."
              class="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-xs outline-none focus:ring-2 focus:ring-blue-500/20 w-64 border-none"
            >
          </div>
          <button class="relative text-slate-400 hover:text-blue-600">
            <UIcon
              name="i-lucide-bell"
              class="w-5 h-5"
            />
            <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div class="text-right">
              <p class="text-xs font-bold text-slate-800 tracking-tight">
                admin
              </p>
              <p class="text-[10px] text-slate-400 uppercase font-medium">
                Administrator
              </p>
            </div>
            <UAvatar
              src=""
              alt="A"
              size="sm"
              class="bg-blue-100 text-blue-600 font-bold"
            />
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-8 bg-slate-50">
        <!-- 當前視圖切換邏輯 (僅展示儀表板內容作為範例) -->
        <div
          v-if="currentRoute === 'dashboard'"
          class="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <!-- 智慧製造中心橫幅 -->
          <div class="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
            <div class="relative z-10 max-w-2xl">
              <div class="flex items-center gap-2 mb-4">
                <span class="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">System Online</span>
                <span class="flex items-center gap-1 text-[10px] text-white/80">
                  <UIcon
                    name="i-lucide-trending-up"
                    class="w-3 h-3"
                  /> 智慧製造中心
                </span>
              </div>
              <h1 class="text-4xl font-black mb-4">
                歡迎使用 APS 先進排程系統
              </h1>
              <p class="text-blue-100 text-sm leading-relaxed mb-8 opacity-90">
                整合生產資訊、優化排程邏輯。透過數據驅動的決策，協助您達成最佳化機台稼動率與準時交貨目標。
              </p>
              <div class="flex gap-4">
                <UButton
                  label="進入資源管理"
                  color="primary"
                  variant="solid"
                  class="rounded-xl font-bold px-6"
                />
                <UButton
                  label="查看即時報表"
                  color="info"
                  variant="ghost"
                  class="rounded-xl font-bold px-6 border border-white/20"
                />
              </div>
            </div>
            <UIcon
              name="i-lucide-factory"
              class="absolute -right-16 -bottom-16 w-96 h-96 opacity-10 rotate-12 pointer-events-none"
            />
          </div>

          <!-- KPI 數據卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <UCard
              v-for="stat in [
                { label: '平均稼動率 (OEE)', val: '87.5%', trend: '+2.1%', icon: 'i-lucide-activity', color: 'emerald' },
                { label: '準時交貨率 (OTD)', val: '94.2%', trend: '+0.8%', icon: 'i-lucide-truck', color: 'blue' },
                { label: '執行中工單', val: '1,284', suffix: '張', icon: 'i-lucide-file-text', color: 'indigo' },
                { label: '設備異常警報', val: '3', suffix: '需處理', icon: 'i-lucide-alert-triangle', color: 'red' }
              ]"
              :key="stat.label"
              class="rounded-3xl border-none shadow-sm hover:shadow-md transition-all group"
            >
              <div class="flex justify-between items-start mb-4">
                <div :class="`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`">
                  <UIcon
                    :name="stat.icon"
                    class="w-6 h-6"
                  />
                </div>
                <span
                  v-if="stat.trend"
                  class="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"
                >
                  {{ stat.trend }}
                </span>
              </div>
              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                {{ stat.label }}
              </p>
              <div class="flex items-baseline gap-1">
                <h3 class="text-2xl font-black text-slate-800">
                  {{ stat.val }}
                </h3>
                <span
                  v-if="stat.suffix"
                  class="text-[10px] text-slate-400 font-bold"
                >{{ stat.suffix }}</span>
              </div>
            </UCard>
          </div>

          <!-- 核心功能進入點 -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <UCard
              v-for="feat in [
                { title: '系統功能維護', desc: '管理產品、製程、區域與機台的基本與進階參數，建立精準的排程基礎模型。', icon: 'i-lucide-settings', color: 'blue' },
                { title: '排程圖表分析', desc: '即時視覺化機台負荷、甘特圖排程結果與 KPI 指標，掌握廠區即時動態。', icon: 'i-lucide-bar-chart-3', color: 'emerald' },
                { title: '排程邏輯測試', desc: '沙盒環境下的排程運算模擬。調整派工規則與權重，預覽並優化排程結果。', icon: 'i-lucide-cpu', color: 'purple' }
              ]"
              :key="feat.title"
              class="rounded-[2rem] border-none shadow-sm group cursor-pointer hover:-translate-y-1 transition-all"
            >
              <template #header>
                <div :class="`w-12 h-12 rounded-2xl flex items-center justify-center bg-${feat.color}-50 text-${feat.color}-600`">
                  <UIcon
                    :name="feat.icon"
                    class="w-6 h-6"
                  />
                </div>
              </template>
              <h4 class="text-lg font-bold mb-3 group-hover:text-blue-600 transition-colors">
                {{ feat.title }}
              </h4>
              <p class="text-slate-500 text-xs leading-relaxed mb-4">
                {{ feat.desc }}
              </p>
              <div class="flex items-center gap-2 text-blue-600 text-xs font-bold mt-auto">
                進入模組 <UIcon
                  name="i-lucide-chevron-right"
                  class="w-3 h-3"
                />
              </div>
            </UCard>
          </div>
        </div>

        <!-- 非儀表板頁面的佔位顯示 -->
        <div
          v-else
          class="flex flex-col items-center justify-center h-full text-slate-400 space-y-4"
        >
          <UIcon
            name="i-lucide-construction"
            class="w-16 h-16 opacity-20"
          />
          <div class="text-center">
            <h3 class="text-xl font-bold text-slate-600 tracking-tight capitalize">
              {{ currentRoute.replace('-', ' ') }}
            </h3>
            <p
              v-if="activeSub"
              class="text-sm font-medium mt-1"
            >
              子模組：{{ activeSub.replace('-', ' ') }}
            </p>
            <p class="text-xs mt-4">
              此模組正在開發中，目前僅儀表板為完整展示頁面
            </p>
          </div>
          <UButton
            label="返回儀表板"
            variant="link"
            @click="currentRoute = 'dashboard'; activeSub = null"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* 滾動條美化 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.font-black {
  letter-spacing: -0.02em;
}
</style>
