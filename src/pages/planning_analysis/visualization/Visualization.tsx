import { Row, Col, Typography } from 'antd'
import { GanttChartSquare, BarChart3 } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const Visualization: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['visualization'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Multi-dimensional View
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureCard
              id='gantt_chart'
              label={COMPONENT_MAP['gantt_chart'].label}
              to={COMPONENT_MAP['gantt_chart'].url}
              icon={GanttChartSquare}
              description='動態追蹤工單與資源的對應關係，支援多維度切換與衝突檢索。'
              tag='Resource Timeline'
              tagColor='blue'
            />
          </Col>
          <Col xs={24} md={12}>
            <FeatureCard
              id='load_chart'
              label={COMPONENT_MAP['load_chart'].label}
              to={COMPONENT_MAP['load_chart'].url}
              icon={BarChart3}
              description='即時掌握機台稼動趨勢，識別產能過載與閒置熱區。'
              tag='Capacity Load'
              tagColor='cyan'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default Visualization
