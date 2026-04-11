import { Typography, Row, Col } from 'antd'
import { LineChart, Activity } from 'lucide-react'

import { COMPONENT_MAP } from '@/router/constants.tsx'
import FeatureCard from '@/components/featureCard/FeatureCard.tsx'

const { Title, Text } = Typography

const ProgressTracking: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-indigo-600 rounded-full' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['progress_tracking'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Real-time Visibility
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureCard
              id='wo_status'
              label={COMPONENT_MAP['wo_status'].label}
              to={COMPONENT_MAP['wo_status'].url}
              icon={Activity}
              description='PLC 感測器數據即時回傳，動態呈現各站點之當前加工狀態。'
              tag='Live Data'
              tagColor='processing'
            />
          </Col>
          <Col xs={24} md={12}>
            <FeatureCard
              id='wo_progress'
              label={COMPONENT_MAP['wo_progress'].label}
              to={COMPONENT_MAP['wo_progress'].url}
              icon={LineChart}
              description='產出達成率 vs. 計畫目標，視覺化分析當前生產速率與瓶頸。'
              tag='Metrics'
              tagColor='gold'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default ProgressTracking
