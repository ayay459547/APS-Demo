import { Typography, Row, Col } from 'antd'
import { Factory, Scissors, Merge } from 'lucide-react'

import { COMPONENT_MAP } from '@/router/constants.tsx'
import FeatureCard from '@/components/featureCard/FeatureCard.tsx'

const { Title, Text } = Typography

const WorkOrderManage: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-emerald-500 rounded-full' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              {COMPONENT_MAP['wo_manage'].label}
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Work Order Execution
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <FeatureCard
              id='wo_list'
              label={COMPONENT_MAP['wo_list'].label}
              to={COMPONENT_MAP['wo_list'].url}
              icon={Factory}
              description='與 ERP 深度對接，監控每一筆工單的生產生命週期。'
              tag='ERP Sync'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='wo_split'
              label={COMPONENT_MAP['wo_split'].label}
              to={COMPONENT_MAP['wo_split'].url}
              icon={Scissors}
              description='針對長週期大工單進行彈性拆解，實現併行生產加速交付。'
              tag='Optimization'
              tagColor='emerald'
            />
          </Col>
          <Col xs={24} md={8}>
            <FeatureCard
              id='wo_merge'
              label={COMPONENT_MAP['wo_merge'].label}
              to={COMPONENT_MAP['wo_merge'].url}
              icon={Merge}
              description='自動識別同料號、同模具需求，合併工序以降低換模成本。'
              tag='Cost Saving'
              tagColor='cyan'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default WorkOrderManage
