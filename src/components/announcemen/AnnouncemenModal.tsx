import type { ReactNode } from 'react'
import type { ModalProps } from 'antd'
import { Modal } from 'antd'

interface Props extends ModalProps {
  children: ReactNode
}

const AnnouncemenModal: React.FC<Props> = ({ children, ...props }) => {
  return (
    <Modal
      {...props}
      closable
      styles={{
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

export default AnnouncemenModal
