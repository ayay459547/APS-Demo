<script setup lang="ts">

</script>

<template>
  <!-- Dashboard View -->
  <div
    class="space-y-8 animate-in fade-in duration-500"
  >
    <!-- Hero Banner -->
    <div class="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl shadow-blue-200/50">
      <div class="relative z-10 max-w-2xl">
        <div class="flex items-center gap-2 mb-4">
          <span class="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider tracking-widest">System Ready</span>
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
        <p class="text-blue-100 text-sm leading-relaxed mb-6">
          整合生產資訊、優化排程邏輯。透過數據驅動的決策，協助您達成最佳化機台稼動率與準時交貨目標。
        </p>
        <UButton
          label="立即排程運算"
          trailing-icon="i-lucide-chevron-right"
          color="info"
          size="lg"
          class="rounded-xl font-bold"
        />
      </div>
      <UIcon
        name="i-lucide-database"
        class="absolute top-0 right-0 w-96 h-96 -mr-20 -mt-20 opacity-10 pointer-events-none"
      />
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="kpi in [
          { title: '平均稼動率 (OEE)', value: '87.5%', trend: '+2.1%', icon: 'i-lucide-activity', color: 'emerald' },
          { title: '準時交貨率 (OTD)', value: '94.2%', trend: '+0.8%', icon: 'i-lucide-truck', color: 'blue' },
          { title: '執行中工單', value: '1,284', suffix: '張', icon: 'i-lucide-file-text', color: 'indigo' },
          { title: '設備異常警報', value: '3', suffix: '需立即處理', icon: 'i-lucide-alert-triangle', color: 'red' }
        ]"
        :key="kpi.title"
        class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="p-3 rounded-2xl transition-transform group-hover:scale-110"
            :class="`bg-${kpi.color}-50 text-${kpi.color}-600`"
          >
            <UIcon
              :name="kpi.icon"
              class="w-6 h-6"
            />
          </div>
          <span
            v-if="kpi.trend"
            class="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"
          >
            {{ kpi.trend }}
          </span>
        </div>
        <p class="text-slate-400 text-xs font-medium mb-1">
          {{ kpi.title }}
        </p>
        <div class="flex items-baseline gap-1">
          <h3 class="text-2xl font-black text-slate-800">
            {{ kpi.value }}
          </h3>
          <span
            v-if="kpi.suffix"
            class="text-[10px] text-slate-400 font-bold"
          >{{ kpi.suffix }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <UCard
        v-for="feat in [
          { title: '系統功能維護', desc: '管理產品、製程、區域與機台的基本與進階參數，建立精準的排程基礎模型。', icon: 'i-lucide-settings', color: 'blue' },
          { title: '排程圖表分析', desc: '即時視覺化機台負荷、甘特圖排程結果與 KPI 指標，掌握廠區即時動態。', icon: 'i-lucide-bar-chart-3', color: 'emerald' },
          { title: '排程邏輯測試', desc: '沙盒環境下的排程運算模擬。調整派工規則與權重，預覽並優化排程結果。', icon: 'i-lucide-cpu', color: 'purple' }
        ]"
        :key="feat.title"
        class="rounded-3xl border-slate-200 group cursor-pointer hover:-translate-y-1 transition-all"
      >
        <template #header>
          <div
            class="w-12 h-12 rounded-2xl flex items-center justify-center"
            :class="`bg-${feat.color}-50 text-${feat.color}-600`"
          >
            <UIcon
              :name="feat.icon"
              class="w-6 h-6"
            />
          </div>
        </template>
        <h4 class="text-lg font-bold mb-3 group-hover:text-blue-600">
          {{ feat.title }}
        </h4>
        <p class="text-slate-500 text-xs leading-relaxed">
          {{ feat.desc }}
        </p>
        <template #footer>
          <div class="flex items-center gap-2 text-blue-600 text-xs font-bold">
            進入模組 <UIcon
              name="i-lucide-chevron-right"
              class="w-3 h-3"
            />
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<style scoped>

</style>
