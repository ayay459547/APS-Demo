import { Button } from 'antd'
import { CheckCircle } from 'lucide-react'

interface Props {
  onClose: () => void
}

const AnnouncemenFooter: React.FC<Props> = ({ onClose }) => {
  return (
    <div className='flex justify-between items-center pt-2 border-t border-slate-100'>
      <Button
        type='text'
        size='small'
        className='text-slate-400 font-bold hover:text-indigo-600 transition-colors'
      >
        <CheckCircle size={14} className='mr-1 inline-block pb-0.5' />{' '}
        全部標記為已讀
      </Button>
      <Button
        type='primary'
        onClick={() => onClose()}
        className='rounded-lg px-8 font-bold bg-indigo-600 border-none shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform'
      >
        確認關閉
      </Button>
    </div>
  )
}

export default AnnouncemenFooter
