import { useNavigate } from 'react-router-dom'
import { ShieldCheck, BarChart3, FlaskConical } from 'lucide-react'
import { clsx } from 'clsx'

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    hover: 'group-hover:bg-blue-600 group-hover:text-white'
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    hover: 'group-hover:bg-emerald-600 group-hover:text-white'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    hover: 'group-hover:bg-purple-600 group-hover:text-white'
  }
}

const cards = [
  {
    title: '系統功能維護',
    desc: '管理產品、製程、區域與機台的基本與進階參數，建立精準的排程基礎模型。',
    action: '進入模組',
    color: 'blue',
    path: '/o_list',
    icon: <ShieldCheck size={20} />
  },
  {
    title: '排程圖表分析',
    desc: '即時視覺化機台負荷、甘特圖排程結果與 KPI 指標，掌握廠區即時動態。',
    action: '查看報表',
    color: 'emerald',
    path: '/gantt_chart',
    icon: <BarChart3 size={20} />
  },
  {
    title: '排程邏輯測試',
    desc: '沙盒環境下的排程運算模擬。調整派工規則與權重，預覽並優化排程結果。',
    action: '開始模擬',
    color: 'purple',
    path: '/machine_bottleneck',
    icon: <FlaskConical size={20} />
  }
]

export default function FeatureCards() {
  const navigate = useNavigate()

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      {cards.map((card, index) => {
        const c = colorMap[card.color as keyof typeof colorMap]

        return (
          <div key={index} className='animate-fade-in'>
            <div
              onClick={() => navigate(card.path)}
              className='bg-white rounded-2xl p-6 border border-slate-100 h-full cursor-pointer group flex flex-col justify-between transition-all hover:shadow-md'
            >
              {/* 上 */}
              <div>
                <div
                  className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300',
                    c.bg,
                    c.text,
                    c.hover
                  )}
                >
                  {card.icon}
                </div>

                <h2 className='text-xl font-bold text-slate-800 mb-2'>
                  {card.title}
                </h2>

                <p className='text-slate-500 text-sm leading-relaxed'>
                  {card.desc}
                </p>
              </div>

              {/* 下 */}
              <div
                className={clsx(
                  'mt-6 flex items-center text-sm font-medium',
                  c.text
                )}
              >
                {card.action}
                <span className='ml-2 transform group-hover:translate-x-1 transition-transform'>
                  →
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
