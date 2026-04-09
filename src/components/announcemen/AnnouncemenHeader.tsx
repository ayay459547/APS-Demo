import { Bell } from 'lucide-react'

const AnnouncemenHeader: React.FC = () => {
  return (
    <div className='flex items-center gap-3 border-b pb-4 border-slate-100'>
      <div className='bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20'>
        <Bell size={18} />
      </div>
      <div>
        <div className='text-lg font-black text-slate-800'>現場公告中心</div>
        <div className='text-[10px] text-slate-400 uppercase tracking-widest font-bold'>
          Announcement Center
        </div>
      </div>
    </div>
  )
}

export default AnnouncemenHeader
