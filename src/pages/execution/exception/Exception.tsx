import { Row, Col, Typography } from 'antd'
import { ClockAlert, Hammer, TriangleAlert } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const Exception: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-6 bg-rose-600 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.3)]' />
          <div>
            <Title
              level={4}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['exception'].label}
            </Title>
            <Text className='text-slate-300 text-[9px] font-black uppercase tracking-[0.4em]'>
              Action Center
            </Text>
          </div>
        </div>
        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <FeatureCard
              id='delayed'
              label={COMPONENT_MAP['delayed'].label}
              to={COMPONENT_MAP['delayed'].url}
              icon={ClockAlert}
              description='智慧預測訂單延誤風險，自動標識受影響的下游客戶需求。'
              tag='Risk Control'
              tagColor='rose'
              isNew
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='breakdown'
              label={COMPONENT_MAP['breakdown'].label}
              to={COMPONENT_MAP['breakdown'].url}
              icon={Hammer}
              description='一鍵啟動設備報修，自動凍結產能並重新計算受影響排程。'
              tag='Maintenance'
              tagColor='rose'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='material_shortage'
              label={COMPONENT_MAP['material_shortage'].label}
              to={COMPONENT_MAP['material_shortage'].url}
              icon={TriangleAlert}
              description='檢測到斷料風險時，系統自動發出警告並建議調整備案。'
              tag='Alert'
              tagColor='amber'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default Exception
