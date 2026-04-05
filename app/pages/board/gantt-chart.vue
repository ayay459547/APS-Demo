<script setup lang="ts">
const schedule = ref<any[]>([])

const resources = ref([
  { id: 'R1', name: 'CNC 加工機 01' },
  { id: 'R2', name: '自動組裝線 02' },
  { id: 'R3', name: '雷射切割機 03' }
])
</script>

<template>
  <!-- Gantt Chart View -->
  <div
    class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]"
  >
    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
      <h2 class="text-xl font-bold">
        生產甘特圖看板 (Gantt Chart)
      </h2>
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-search"
          color="neutral"
          variant="ghost"
        />
        <UButton
          icon="i-lucide-calendar"
          color="neutral"
          variant="ghost"
        />
        <UButton
          label="輸出報表"
          icon="i-lucide-download"
          color="primary"
          variant="subtle"
        />
      </div>
    </div>

    <div class="flex-1 overflow-auto p-6">
      <div
        v-if="schedule.length === 0"
        class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20"
      >
        <UIcon
          name="i-lucide-bar-chart-3"
          class="w-16 h-16 opacity-20"
        />
        <p class="font-medium">
          尚未生成排程數據，請先至「排程中心」進行運算
        </p>
        <UButton
          label="前往排程中心"
          color="primary"
          variant="link"
        />
      </div>

      <div
        v-else
        class="min-w-[1000px]"
      >
        <!-- Time Header -->
        <div class="flex mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
          <div class="w-56 px-4">
            機台編號 / 資源名稱
          </div>
          <div class="flex-1 flex">
            <div
              v-for="i in 25"
              :key="i"
              class="flex-1 text-center border-l border-slate-50 italic"
            >
              {{ i-1 }}h
            </div>
          </div>
        </div>

        <!-- Gantt Rows -->
        <div
          v-for="res in resources"
          :key="res.id"
          class="flex items-center min-h-[72px] border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
        >
          <div class="w-56 px-4 font-bold flex items-center gap-3 text-sm">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            {{ res.name }}
          </div>
          <div class="flex-1 relative h-12 bg-slate-100/30 rounded-xl m-2 border border-dashed border-slate-200">
            <div
              v-for="(item, idx) in schedule.filter(s => s.resourceId === res.id)"
              :key="idx"
              class="absolute h-full rounded-lg flex flex-col justify-center px-3 text-[10px] text-white font-bold shadow-md transition-all hover:scale-[1.02] cursor-pointer overflow-hidden group"
              :style="{
                left: `${item.startTime * 4}%`,
                width: `${(item.endTime - item.startTime) * 4}%`,
                backgroundColor: item.color,
                border: item.isDelayed ? '3px solid #ef4444' : 'none'
              }"
            >
              <span class="truncate">{{ item.name }}</span>
              <span class="text-[8px] opacity-70">T+{{ item.startTime }} - T+{{ item.endTime }}</span>
              <div
                v-if="item.isDelayed"
                class="absolute top-1 right-1 bg-red-600 p-0.5 rounded-full"
              >
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="w-2 h-2"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
