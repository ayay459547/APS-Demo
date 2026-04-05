<script setup lang="ts">
const isAutoScheduling = ref(false)

const schedule = ref<any[]>([])

const resources = ref([
  { id: 'R1', name: 'CNC 加工機 01' },
  { id: 'R2', name: '自動組裝線 02' },
  { id: 'R3', name: '雷射切割機 03' }
])

// --- 核心排程數據 ---
const tasks = ref([
  { id: 'T1', name: '訂單 A - 零件加工', duration: 4, deadline: 10, color: '#3b82f6' },
  { id: 'T2', name: '訂單 B - 組裝作業', duration: 6, deadline: 15, color: '#10b981' },
  { id: 'T3', name: '訂單 C - 表面處理', duration: 3, deadline: 8, color: '#f59e0b' }
])

const runAutoSchedule = () => {
  isAutoScheduling.value = true
  setTimeout(() => {
    const sortedTasks = [...tasks.value].sort((a, b) => a.deadline - b.deadline)
    const newSchedule: any[] = []
    const resourceAvailableTime: Record<string, number> = {}
    resources.value.forEach(r => resourceAvailableTime[r.id] = 0)

    sortedTasks.forEach(task => {
      let bestResourceId = resources.value[0].id
      let minTime = Infinity
      resources.value.forEach((r) => {
        if (resourceAvailableTime[r.id] < minTime) {
          minTime = resourceAvailableTime[r.id]
          bestResourceId = r.id
        }
      })

      const startTime = resourceAvailableTime[bestResourceId] ?? 0
      const endTime = startTime + task.duration

      newSchedule.push({
        ...task,
        resourceId: bestResourceId,
        startTime,
        endTime,
        isDelayed: endTime > task.deadline
      })
      resourceAvailableTime[bestResourceId] = endTime
    })

    schedule.value = newSchedule
    isAutoScheduling.value = false
  }, 1000)
}
</script>

<template>
  <!-- Scheduling View -->
  <div
    class="max-w-4xl mx-auto space-y-6"
  >
    <UCard class="rounded-3xl border-slate-200 overflow-hidden shadow-sm">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon
            name="i-lucide-cpu"
            class="w-6 h-6 text-blue-600"
          />
          <h2 class="text-2xl font-bold">
            排程運算中心
          </h2>
        </div>
      </template>

      <div class="p-6 bg-blue-50 rounded-2xl mb-8">
        <h4 class="font-bold text-blue-800 mb-2">
          當前運算規則：EDD (Earliest Due Date) 最早交期優先
        </h4>
        <p class="text-sm text-blue-600">
          系統將根據訂單交期自動平衡機台負載，並產出最佳化工序建議。
        </p>
      </div>

      <div class="grid grid-cols-2 gap-8 mb-8">
        <div class="border border-slate-100 p-6 rounded-2xl bg-white shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase mb-2">
            待排訂單總數
          </p>
          <p class="text-3xl font-black">
            {{ tasks.length }}
          </p>
        </div>
        <div class="border border-slate-100 p-6 rounded-2xl bg-white shadow-sm">
          <p class="text-xs text-slate-400 font-bold uppercase mb-2">
            可用機台總數
          </p>
          <p class="text-3xl font-black">
            {{ resources.length }}
          </p>
        </div>
      </div>

      <UButton
        block
        size="xl"
        color="primary"
        class="py-5 rounded-2xl font-black text-xl shadow-lg shadow-blue-200"
        :loading="isAutoScheduling"
        @click="runAutoSchedule"
      >
        <template v-if="!isAutoScheduling">
          <UIcon
            name="i-lucide-play"
            class="mr-2"
          /> 執行全自動排程
        </template>
        <template v-else>
          正在運算生產矩陣...
        </template>
      </UButton>
    </UCard>
  </div>
</template>

<style scoped>

</style>
