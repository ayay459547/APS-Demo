import { Settings } from 'lucide-react'

const NotFound = () => {
  const activeMenu = 'dashboard-overview-kpi'

  return (
    <div className='h-full flex flex-col items-center justify-center text-slate-400 animate-fade-in'>
      <div className='w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4'>
        <Settings size={40} className='text-slate-300' />
      </div>
      <h2 className='text-xl font-bold text-slate-600 mb-2'>模組開發中</h2>
      <p className='text-sm'>
        您目前點擊的是 {activeMenu.replace(/-/g, ' > ')}
      </p>
    </div>
  )
}

export default NotFound
