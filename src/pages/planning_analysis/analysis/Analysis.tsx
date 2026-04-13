import { Row, Col, Typography } from 'antd'
import { Box, Microscope } from 'lucide-react'

import FeatureCard from '@/components/featureCard/FeatureCard.tsx'
import { COMPONENT_MAP } from '@/router/constants.tsx'

const { Title, Text } = Typography

const Analysis: React.FC = () => {
  return (
    <div className='p-8 lg:px-12'>
      <section>
        <div className='flex items-center gap-4 mb-8'>
          <div className='w-1.5 h-8 bg-indigo-500 rounded-full' />
          <div>
            <Title
              level={3}
              className='m-0 font-black text-slate-800 tracking-tight'
            >
              深度瓶頸診斷
            </Title>
            <Text className='text-slate-400 text-xs font-bold uppercase tracking-widest'>
              Bottleneck Diagnostics
            </Text>
          </div>
        </div>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureCard
              id='machine_bottleneck'
              label={COMPONENT_MAP['machine_bottleneck'].label}
              to={COMPONENT_MAP['machine_bottleneck'].url}
              icon={Microscope}
              description='自動偵測產線中的約束資源，量化各機台對交期達成率的影響力。'
              tag='Constraint Mining'
              tagColor='indigo'
              isNew
            />
          </Col>
          <Col xs={24} md={12}>
            <FeatureCard
              id='material_bottleneck'
              label={COMPONENT_MAP['material_bottleneck'].label}
              to={COMPONENT_MAP['material_bottleneck'].url}
              icon={Box}
              description='整合庫存與欠料預估，找出因缺料而受阻的生產路徑。'
              tag='Supply Risk'
              tagColor='purple'
            />
          </Col>
        </Row>
      </section>
    </div>
  )
}

export default Analysis
