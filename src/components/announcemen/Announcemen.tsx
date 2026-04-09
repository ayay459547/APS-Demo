import { Badge } from 'antd'
import { Megaphone } from 'lucide-react'
import { useState } from 'react'

import AnnouncemenModal from './AnnouncemenModal.tsx'
import AnnouncemenMain from './AnnouncemenMain.tsx'
import AnnouncemenHeader from './AnnouncemenHeader.tsx'
import AnnouncemenFooter from './AnnouncemenFooter.tsx'

const Announcemen: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div
        className='relative cursor-pointer'
        onClick={() => setIsModalOpen(true)}
      >
        <Badge dot>
          <Megaphone
            size={20}
            className='text-slate-500 hover:text-blue-600 transition-colors'
          />
        </Badge>
      </div>

      <AnnouncemenModal
        open={isModalOpen}
        centered
        title={<AnnouncemenHeader />}
        footer={<AnnouncemenFooter onClose={() => setIsModalOpen(false)} />}
        onCancel={() => setIsModalOpen(false)}
      >
        <AnnouncemenMain />
      </AnnouncemenModal>
    </>
  )
}

export default Announcemen
