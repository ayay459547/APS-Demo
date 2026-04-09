import type { ReactNode } from 'react'
import type { ModalProps } from 'antd'
import { Modal } from 'antd'

interface Props extends ModalProps {
  children: ReactNode
}

const ProductionModal: React.FC<Props> = ({ children, ...props }) => {
  return (
    <Modal
      {...props}
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
    >
      {children}
    </Modal>
  )
}

export default ProductionModal
