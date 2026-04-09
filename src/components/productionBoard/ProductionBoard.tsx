import { useState } from 'react'
import { Badge } from 'antd'
import { MonitorPlay } from 'lucide-react'
import ProductionModal from './ProductionModal.tsx'
import ProductionMain from './ProductionMain.tsx'
import ProductionHeader from './ProductionHeader.tsx'
import ProductionFooter from './ProductionFooter.tsx'

const ProductionBoard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div
        className='relative cursor-pointer'
        onClick={() => setIsModalOpen(true)}
      >
        <Badge dot status='processing'>
          <MonitorPlay
            size={20}
            className='text-slate-500 hover:text-blue-600 transition-colors'
          />
        </Badge>
      </div>

      <ProductionModal
        open={isModalOpen}
        closable
        style={{
          width: '100%',
          top: 0,
          left: 0,
          margin: 0
        }}
        styles={{
          wrapper: {
            width: '100dvw',
            height: '100dvh'
          },
          container: {
            width: '100dvw',
            height: '100dvh',
            overflow: 'hidden',
            borderRadius: 0
          },
          body: {
            width: '100%',
            height: 'calc(100% - 100px)'
          }
        }}
        title={<ProductionHeader />}
        footer={<ProductionFooter />}
        onCancel={() => setIsModalOpen(false)}
      >
        <ProductionMain />
      </ProductionModal>
    </>
  )
}

export default ProductionBoard
